import assert from "node:assert/strict";
import test from "node:test";
import { TRPCError } from "@trpc/server";
import { createCallerFactory, createTRPCRouter } from "../init";
import { createRoastRouter } from "./roast";

const roastOutput = {
  analysisItems: [
    {
      description: "Use const for values that do not change.",
      severity: "critical" as const,
      title: "mutable declaration",
    },
    {
      description: "The function name already communicates intent well.",
      severity: "good" as const,
      title: "clear naming",
    },
  ],
  roastQuote: "this helper looks one refactor away from self-respect.",
  score: 3.6,
  suggestedFix:
    "const total = items.reduce((sum, item) => sum + item.price, 0);",
  verdict: "needs_serious_help" as const,
};

function createRoastCaller() {
  let createInput: null | {
    code: string;
    language: string;
    lineCount: number;
    roastMode: boolean;
    roastQuote: string;
    score: number;
    suggestedFix: string;
    verdict: string;
  } = null;

  const roastRouter = createRoastRouter({
    createRoast: async (input) => {
      createInput = input;

      return {
        createdAt: new Date("2026-03-18T21:00:00.000Z"),
        id: "7e5b9a7d-430e-4e47-8f6e-9ba42a17b570",
      };
    },
    generateRoastOutput: async () => roastOutput,
    getRoastById: async (id) => {
      if (id === "7e5b9a7d-430e-4e47-8f6e-9ba42a17b570") {
        return {
          analysisItems: roastOutput.analysisItems.map((item, index) => ({
            ...item,
            createdAt: new Date("2026-03-18T21:00:00.000Z"),
            id: `analysis-${index + 1}`,
            order: index,
            roastId: id,
          })),
          code: "var total = 0;\nreturn total;",
          createdAt: new Date("2026-03-18T21:00:00.000Z"),
          id,
          language: "javascript",
          lineCount: 2,
          roastMode: true,
          roastQuote: roastOutput.roastQuote,
          score: roastOutput.score,
          suggestedFix: roastOutput.suggestedFix,
          verdict: roastOutput.verdict,
        };
      }

      return null;
    },
  });

  const appRouter = createTRPCRouter({
    roast: roastRouter,
  });
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({
    db: null as never,
    headers: new Headers(),
  });

  return {
    caller,
    getCreateInput: () => createInput,
  };
}

test("roast.create returns the persisted roast id and forwards the AI payload", async () => {
  const { caller, getCreateInput } = createRoastCaller();

  const result = await caller.roast.create({
    code: "var total = 0;\nreturn total;",
    language: "javascript",
    roastMode: true,
  });

  assert.deepEqual(result, {
    id: "7e5b9a7d-430e-4e47-8f6e-9ba42a17b570",
  });
  assert.deepEqual(getCreateInput(), {
    analysisItems: roastOutput.analysisItems,
    code: "var total = 0;\nreturn total;",
    language: "javascript",
    lineCount: 2,
    roastMode: true,
    roastQuote: roastOutput.roastQuote,
    score: roastOutput.score,
    suggestedFix: roastOutput.suggestedFix,
    verdict: roastOutput.verdict,
  });
});

test("roast.create rejects code above the 2000 character contract", async () => {
  const { caller } = createRoastCaller();

  await assert.rejects(
    () =>
      caller.roast.create({
        code: "a".repeat(2001),
        language: "javascript",
        roastMode: false,
      }),
    /2000/,
  );
});

test("roast.getById returns the persisted roast view model", async () => {
  const { caller } = createRoastCaller();

  const result = await caller.roast.getById({
    id: "7e5b9a7d-430e-4e47-8f6e-9ba42a17b570",
  });

  assert.equal(result.analysisItems.length, 2);
  assert.equal(result.roastQuote, roastOutput.roastQuote);
  assert.equal(result.verdict, roastOutput.verdict);
});

test("roast.getById throws NOT_FOUND when the roast is missing", async () => {
  const { caller } = createRoastCaller();

  await assert.rejects(
    () =>
      caller.roast.getById({
        id: "11111111-1111-4111-8111-111111111111",
      }),
    (error) => error instanceof TRPCError && error.code === "NOT_FOUND",
  );
});

test("roast.create hides provider failures behind a stable server error", async () => {
  const roastRouter = createRoastRouter({
    createRoast: async () => {
      throw new Error("createRoast should not run when generation fails");
    },
    generateRoastOutput: async () => {
      throw new Error("insufficient_quota");
    },
    getRoastById: async () => null,
  });
  const appRouter = createTRPCRouter({
    roast: roastRouter,
  });
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({
    db: null as never,
    headers: new Headers(),
  });

  await assert.rejects(
    () =>
      caller.roast.create({
        code: "const total = 0;",
        language: "javascript",
        roastMode: true,
      }),
    (error) =>
      error instanceof TRPCError &&
      error.code === "INTERNAL_SERVER_ERROR" &&
      error.message === "Unable to generate roast right now.",
  );
});

test("roast.create hides persistence failures behind a stable server error", async () => {
  const roastRouter = createRoastRouter({
    createRoast: async () => {
      throw new Error("database_unavailable");
    },
    generateRoastOutput: async () => roastOutput,
    getRoastById: async () => null,
  });
  const appRouter = createTRPCRouter({
    roast: roastRouter,
  });
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({
    db: null as never,
    headers: new Headers(),
  });

  await assert.rejects(
    () =>
      caller.roast.create({
        code: "const total = 0;",
        language: "javascript",
        roastMode: true,
      }),
    (error) =>
      error instanceof TRPCError &&
      error.code === "INTERNAL_SERVER_ERROR" &&
      error.message === "Unable to save roast right now.",
  );
});
