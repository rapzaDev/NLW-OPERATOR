import { asc, desc, eq, sql } from "drizzle-orm";
import { type Database, db } from "@/db/client";
import { submissionAnalyses, submissions } from "@/db/schema";

export type LeaderboardEntry = {
  createdAt: Date;
  language: string;
  lineCount: number;
  publicId: string;
  rank: number;
  scoreTenths: number;
  sourceCode: string;
};

export type HomepageStats = {
  averageScoreTenths: number;
  codesRoasted: number;
};

export async function getLeaderboardEntries(
  limit = 50,
  database: Database = db,
): Promise<LeaderboardEntry[]> {
  const rows = await database
    .select({
      createdAt: submissions.createdAt,
      language: submissions.language,
      lineCount: submissions.lineCount,
      publicId: submissions.publicId,
      scoreTenths: submissionAnalyses.scoreTenths,
      sourceCode: submissions.sourceCode,
    })
    .from(submissionAnalyses)
    .innerJoin(submissions, eq(submissionAnalyses.submissionId, submissions.id))
    .where(eq(submissions.status, "completed"))
    .orderBy(asc(submissionAnalyses.scoreTenths), desc(submissions.createdAt))
    .limit(limit);

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

export async function getHomepageStats(
  database: Database = db,
): Promise<HomepageStats> {
  const [row] = await database
    .select({
      averageScoreTenths: sql<number>`coalesce(round(avg(${submissionAnalyses.scoreTenths})), 0)::int`,
      codesRoasted: sql<number>`count(*)::int`,
    })
    .from(submissionAnalyses)
    .innerJoin(submissions, eq(submissionAnalyses.submissionId, submissions.id))
    .where(eq(submissions.status, "completed"));

  return {
    averageScoreTenths: Number(row?.averageScoreTenths ?? 0),
    codesRoasted: Number(row?.codesRoasted ?? 0),
  };
}
