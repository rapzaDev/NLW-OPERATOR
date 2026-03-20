import { createTRPCRouter } from "../init";
import { homeRouter } from "./home";
import { leaderboardRouter } from "./leaderboard";
import { roastRouter } from "./roast";

export const appRouter = createTRPCRouter({
  home: homeRouter,
  leaderboard: leaderboardRouter,
  roast: roastRouter,
});

export type AppRouter = typeof appRouter;
