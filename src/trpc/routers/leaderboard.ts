import { z } from "zod";
import {
  getLeaderboardEntries as getPersistedLeaderboardEntries,
  getLeaderboardStats as getPersistedLeaderboardStats,
  type LeaderboardEntry,
  type LeaderboardStats,
} from "@/db/queries/leaderboard";
import { createTRPCRouter, publicProcedure } from "../init";

type LeaderboardRouterDependencies = {
  getLeaderboardEntries?: (
    limit: number,
    database: Parameters<typeof getPersistedLeaderboardEntries>[1],
  ) => Promise<LeaderboardEntry[]>;
  getLeaderboardStats?: (
    database: Parameters<typeof getPersistedLeaderboardStats>[0],
  ) => Promise<LeaderboardStats>;
};

export function createLeaderboardRouter(
  dependencies: LeaderboardRouterDependencies = {},
) {
  const getLeaderboardEntries =
    dependencies.getLeaderboardEntries ??
    ((limit, database) => getPersistedLeaderboardEntries(limit, database));
  const getLeaderboardStats =
    dependencies.getLeaderboardStats ??
    ((database) => getPersistedLeaderboardStats(database));

  return createTRPCRouter({
    list: publicProcedure
      .input(
        z
          .object({
            limit: z.number().int().positive().max(100).optional(),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        return getLeaderboardEntries(input?.limit ?? 50, ctx.db);
      }),
    stats: publicProcedure.query(async ({ ctx }) => {
      return getLeaderboardStats(ctx.db);
    }),
  });
}

export const leaderboardRouter = createLeaderboardRouter();
