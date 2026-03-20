import { asc, desc, sql } from "drizzle-orm";
import { type Database, db } from "@/db/client";
import { roasts } from "@/db/schema";

export type LeaderboardEntry = {
  code: string;
  createdAt: Date;
  id: string;
  language: string;
  lineCount: number;
  rank: number;
  score: number;
};

export type LeaderboardStats = {
  averageScore: number;
  codesRoasted: number;
};

export async function getLeaderboardEntries(
  limit = 50,
  database: Database = db,
): Promise<LeaderboardEntry[]> {
  const rows = await database
    .select({
      code: roasts.code,
      createdAt: roasts.createdAt,
      id: roasts.id,
      language: roasts.language,
      lineCount: roasts.lineCount,
      score: roasts.score,
    })
    .from(roasts)
    .orderBy(asc(roasts.score), desc(roasts.createdAt))
    .limit(limit);

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

export async function getLeaderboardStats(
  database: Database = db,
): Promise<LeaderboardStats> {
  const [row] = await database
    .select({
      averageScore: sql<number>`coalesce(avg(${roasts.score}), 0)`,
      codesRoasted: sql<number>`count(*)::int`,
    })
    .from(roasts);

  return {
    averageScore: Number(row?.averageScore ?? 0),
    codesRoasted: Number(row?.codesRoasted ?? 0),
  };
}

export const getHomepageStats = getLeaderboardStats;
