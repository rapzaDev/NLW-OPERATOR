import { asc, desc, eq } from "drizzle-orm";
import { type Database, db } from "@/db/client";
import { CURRENT_ANALYSIS_VERSION } from "@/db/constants";
import {
  type AnalysisMode,
  type DiffLineKind,
  type FeedbackTone,
  type LanguageSource,
  submissionAnalyses,
  submissionAnalysisItems,
  submissionDiffBlocks,
  submissionDiffLines,
  submissions,
} from "@/db/schema";

export type CreateSubmissionInput = {
  analysisMode: AnalysisMode;
  language: string;
  languageSource?: LanguageSource;
  sourceCode: string;
};

export type SubmissionAnalysisItemInput = {
  description: string;
  title: string;
  tone: FeedbackTone;
};

export type SubmissionDiffLineInput = {
  content: string;
  kind: DiffLineKind;
};

export type SubmissionDiffBlockInput = {
  lines: SubmissionDiffLineInput[];
  sourceLabel: string;
  targetLabel: string;
};

export type CreateSubmissionAnalysisInput = {
  analysisVersion?: string;
  diffBlocks: SubmissionDiffBlockInput[];
  headline: string;
  items: SubmissionAnalysisItemInput[];
  scoreTenths: number;
  submissionId: string;
  verdictLabel: string;
  verdictTone: FeedbackTone;
};

export type SubmissionDetails = {
  analysis: null | {
    createdAt: Date;
    diffBlocks: Array<{
      createdAt: Date;
      id: string;
      lines: Array<{
        content: string;
        id: string;
        kind: DiffLineKind;
        position: number;
      }>;
      position: number;
      sourceLabel: string;
      targetLabel: string;
    }>;
    headline: string;
    id: string;
    items: Array<{
      createdAt: Date;
      description: string;
      id: string;
      position: number;
      title: string;
      tone: FeedbackTone;
    }>;
    scoreTenths: number;
    verdictLabel: string;
    verdictTone: FeedbackTone;
  };
  submission: typeof submissions.$inferSelect;
};

type SubmissionDiffBlockDetails = NonNullable<
  SubmissionDetails["analysis"]
>["diffBlocks"][number];

function assertSourceCode(sourceCode: string) {
  if (!sourceCode.trim()) {
    throw new Error("Source code cannot be empty.");
  }
}

function countLines(sourceCode: string) {
  return sourceCode.split(/\r\n|\r|\n/).length;
}

function normalizeLanguage(language: string) {
  return language.trim().toLowerCase();
}

function createPublicId() {
  return crypto.randomUUID();
}

export async function createSubmission(
  input: CreateSubmissionInput,
  database: Database = db,
) {
  assertSourceCode(input.sourceCode);

  const now = new Date();
  const [submission] = await database
    .insert(submissions)
    .values({
      analysisMode: input.analysisMode,
      createdAt: now,
      language: normalizeLanguage(input.language),
      languageSource: input.languageSource ?? "unknown",
      lineCount: countLines(input.sourceCode),
      publicId: createPublicId(),
      sourceCode: input.sourceCode,
      updatedAt: now,
    })
    .returning();

  return submission;
}

export async function markSubmissionProcessing(
  submissionId: string,
  database: Database = db,
) {
  const now = new Date();
  const [submission] = await database
    .update(submissions)
    .set({
      status: "processing",
      updatedAt: now,
    })
    .where(eq(submissions.id, submissionId))
    .returning();

  return submission ?? null;
}

export async function markSubmissionFailed(
  submissionId: string,
  errorMessage: string,
  database: Database = db,
) {
  const now = new Date();
  const [submission] = await database
    .update(submissions)
    .set({
      errorMessage,
      processedAt: now,
      status: "failed",
      updatedAt: now,
    })
    .where(eq(submissions.id, submissionId))
    .returning();

  return submission ?? null;
}

export async function createSubmissionAnalysis(
  input: CreateSubmissionAnalysisInput,
  database: Database = db,
) {
  const now = new Date();

  return database.transaction(async (tx) => {
    const [analysis] = await tx
      .insert(submissionAnalyses)
      .values({
        analysisVersion: input.analysisVersion ?? CURRENT_ANALYSIS_VERSION,
        createdAt: now,
        headline: input.headline,
        scoreTenths: input.scoreTenths,
        submissionId: input.submissionId,
        verdictLabel: input.verdictLabel,
        verdictTone: input.verdictTone,
      })
      .returning();

    if (input.items.length > 0) {
      await tx.insert(submissionAnalysisItems).values(
        input.items.map((item, index) => ({
          analysisId: analysis.id,
          createdAt: now,
          description: item.description,
          position: index,
          title: item.title,
          tone: item.tone,
        })),
      );
    }

    for (const [blockPosition, block] of input.diffBlocks.entries()) {
      const [insertedBlock] = await tx
        .insert(submissionDiffBlocks)
        .values({
          analysisId: analysis.id,
          createdAt: now,
          position: blockPosition,
          sourceLabel: block.sourceLabel,
          targetLabel: block.targetLabel,
        })
        .returning();

      if (block.lines.length > 0) {
        await tx.insert(submissionDiffLines).values(
          block.lines.map((line, linePosition) => ({
            content: line.content,
            diffBlockId: insertedBlock.id,
            kind: line.kind,
            position: linePosition,
          })),
        );
      }
    }

    const [submission] = await tx
      .update(submissions)
      .set({
        processedAt: now,
        status: "completed",
        updatedAt: now,
      })
      .where(eq(submissions.id, input.submissionId))
      .returning();

    return {
      analysis,
      submission,
    };
  });
}

export async function getSubmissionDetailsByPublicId(
  publicId: string,
  database: Database = db,
): Promise<SubmissionDetails | null> {
  const [baseRow] = await database
    .select({
      analysis: submissionAnalyses,
      submission: submissions,
    })
    .from(submissions)
    .leftJoin(
      submissionAnalyses,
      eq(submissionAnalyses.submissionId, submissions.id),
    )
    .where(eq(submissions.publicId, publicId))
    .limit(1);

  if (!baseRow) {
    return null;
  }

  if (!baseRow.analysis) {
    return {
      analysis: null,
      submission: baseRow.submission,
    };
  }

  const [items, diffRows] = await Promise.all([
    database
      .select()
      .from(submissionAnalysisItems)
      .where(eq(submissionAnalysisItems.analysisId, baseRow.analysis.id))
      .orderBy(
        asc(submissionAnalysisItems.position),
        desc(submissionAnalysisItems.createdAt),
      ),
    database
      .select({
        blockCreatedAt: submissionDiffBlocks.createdAt,
        blockId: submissionDiffBlocks.id,
        blockPosition: submissionDiffBlocks.position,
        lineContent: submissionDiffLines.content,
        lineId: submissionDiffLines.id,
        lineKind: submissionDiffLines.kind,
        linePosition: submissionDiffLines.position,
        sourceLabel: submissionDiffBlocks.sourceLabel,
        targetLabel: submissionDiffBlocks.targetLabel,
      })
      .from(submissionDiffBlocks)
      .leftJoin(
        submissionDiffLines,
        eq(submissionDiffLines.diffBlockId, submissionDiffBlocks.id),
      )
      .where(eq(submissionDiffBlocks.analysisId, baseRow.analysis.id))
      .orderBy(
        asc(submissionDiffBlocks.position),
        asc(submissionDiffLines.position),
      ),
  ]);

  const diffBlocksMap = new Map<string, SubmissionDiffBlockDetails>();

  for (const row of diffRows) {
    const currentBlock = diffBlocksMap.get(row.blockId);
    const nextLine =
      row.lineId === null ||
      row.lineContent === null ||
      row.lineKind === null ||
      row.linePosition === null
        ? null
        : {
            content: row.lineContent,
            id: row.lineId,
            kind: row.lineKind,
            position: row.linePosition,
          };

    if (!currentBlock) {
      diffBlocksMap.set(row.blockId, {
        createdAt: row.blockCreatedAt,
        id: row.blockId,
        lines: nextLine === null ? [] : [nextLine],
        position: row.blockPosition,
        sourceLabel: row.sourceLabel,
        targetLabel: row.targetLabel,
      });

      continue;
    }

    if (nextLine !== null) {
      currentBlock.lines.push(nextLine);
    }
  }

  return {
    analysis: {
      createdAt: baseRow.analysis.createdAt,
      diffBlocks: Array.from(diffBlocksMap.values()),
      headline: baseRow.analysis.headline,
      id: baseRow.analysis.id,
      items,
      scoreTenths: baseRow.analysis.scoreTenths,
      verdictLabel: baseRow.analysis.verdictLabel,
      verdictTone: baseRow.analysis.verdictTone,
    },
    submission: baseRow.submission,
  };
}
