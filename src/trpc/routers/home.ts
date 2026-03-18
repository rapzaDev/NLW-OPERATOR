import { getHomepageStats } from "@/db/queries/leaderboard";
import { createTRPCRouter, publicProcedure } from "../init";

export const homeRouter = createTRPCRouter({
  stats: publicProcedure.query(async ({ ctx }) => {
    const stats = await getHomepageStats(ctx.db);

    return {
      averageScore: stats.averageScoreTenths / 10,
      codesRoasted: stats.codesRoasted,
    };
  }),
});
