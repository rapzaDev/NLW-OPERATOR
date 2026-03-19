import { asc, eq } from "drizzle-orm";
import { type Database, db } from "@/db/client";
import {
  type AnalysisSeverity,
  analysisItems,
  type RoastVerdict,
  roasts,
} from "@/db/schema";

export type CreateRoastAnalysisItemInput = {
  description: string;
  severity: AnalysisSeverity;
  title: string;
};

export type CreateRoastInput = {
  analysisItems: CreateRoastAnalysisItemInput[];
  code: string;
  language: string;
  lineCount: number;
  roastMode: boolean;
  roastQuote: string;
  score: number;
  suggestedFix: string;
  verdict: RoastVerdict;
};

export type RoastDetails = typeof roasts.$inferSelect & {
  analysisItems: Array<typeof analysisItems.$inferSelect>;
};

function normalizeLanguage(language: string) {
  return language.trim().toLowerCase();
}

export async function createRoast(
  input: CreateRoastInput,
  database: Database = db,
) {
  const now = new Date();

  return database.transaction(async (tx) => {
    const [roast] = await tx
      .insert(roasts)
      .values({
        code: input.code,
        createdAt: now,
        language: normalizeLanguage(input.language),
        lineCount: input.lineCount,
        roastMode: input.roastMode,
        roastQuote: input.roastQuote,
        score: input.score,
        suggestedFix: input.suggestedFix,
        verdict: input.verdict,
      })
      .returning();

    if (input.analysisItems.length > 0) {
      await tx.insert(analysisItems).values(
        input.analysisItems.map((item, index) => ({
          createdAt: now,
          description: item.description,
          order: index,
          roastId: roast.id,
          severity: item.severity,
          title: item.title,
        })),
      );
    }

    return roast;
  });
}

export async function getRoastById(
  id: string,
  database: Database = db,
): Promise<RoastDetails | null> {
  const [roast] = await database.select().from(roasts).where(eq(roasts.id, id));

  if (!roast) {
    return null;
  }

  const orderedAnalysisItems = await database
    .select()
    .from(analysisItems)
    .where(eq(analysisItems.roastId, roast.id))
    .orderBy(asc(analysisItems.order), asc(analysisItems.createdAt));

  return {
    ...roast,
    analysisItems: orderedAnalysisItems,
  };
}

export async function getRoastStats(database: Database = db) {
  const rows = await database.select().from(roasts);
  const count = rows.length;
  const averageScore =
    count === 0 ? 0 : rows.reduce((sum, roast) => sum + roast.score, 0) / count;

  return {
    averageScore,
    codesRoasted: count,
  };
}
