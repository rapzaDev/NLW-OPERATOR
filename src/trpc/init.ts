import "server-only";

import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { db } from "@/db/client";

export async function createTRPCContext(opts: { headers: Headers }) {
  return {
    db,
    headers: opts.headers,
  };
}

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
