import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

const handler = (request: Request) =>
  fetchRequestHandler({
    createContext: () =>
      createTRPCContext({
        headers: request.headers,
      }),
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
  });

export { handler as GET, handler as POST };
