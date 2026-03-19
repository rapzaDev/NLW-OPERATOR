import { createTRPCRouter } from "../init";
import { homeRouter } from "./home";
import { roastRouter } from "./roast";

export const appRouter = createTRPCRouter({
  home: homeRouter,
  roast: roastRouter,
});

export type AppRouter = typeof appRouter;
