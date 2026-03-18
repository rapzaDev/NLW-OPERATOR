import { createTRPCRouter } from "../init";
import { homeRouter } from "./home";

export const appRouter = createTRPCRouter({
  home: homeRouter,
});

export type AppRouter = typeof appRouter;
