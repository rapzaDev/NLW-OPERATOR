import assert from "node:assert/strict";
import test from "node:test";
import { createCallerFactory, createTRPCRouter } from "../init";
import { createLeaderboardRouter } from "./leaderboard";

const leaderboardEntries = [
  {
    code: 'eval(prompt("enter code"))',
    createdAt: new Date("2026-03-19T11:00:00.000Z"),
    id: "11111111-1111-4111-8111-111111111111",
    language: "javascript",
    lineCount: 3,
    rank: 1,
    score: 1.2,
  },
  {
    code: 'print("hello world")',
    createdAt: new Date("2026-03-19T10:00:00.000Z"),
    id: "22222222-2222-4222-8222-222222222222",
    language: "python",
    lineCount: 1,
    rank: 2,
    score: 1.8,
  },
] as const;

function createLeaderboardCaller() {
  let receivedLimit = -1;
  const leaderboardRouter = createLeaderboardRouter({
    getLeaderboardEntries: async (limit) => {
      receivedLimit = limit;

      return leaderboardEntries.slice(0, limit);
    },
    getLeaderboardStats: async () => ({
      averageScore: 2.6,
      codesRoasted: 12,
    }),
  });
  const appRouter = createTRPCRouter({
    leaderboard: leaderboardRouter,
  });
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({
    db: null as never,
    headers: new Headers(),
  });

  return {
    caller,
    getReceivedLimit: () => receivedLimit,
  };
}

test("leaderboard.list uses the provided limit and returns persisted roast entries", async () => {
  const { caller, getReceivedLimit } = createLeaderboardCaller();

  const result = await caller.leaderboard.list({
    limit: 1,
  });

  assert.equal(getReceivedLimit(), 1);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, leaderboardEntries[0].id);
  assert.equal(result[0].score, leaderboardEntries[0].score);
});

test("leaderboard.list defaults to the top 50 entries", async () => {
  const { caller, getReceivedLimit } = createLeaderboardCaller();

  await caller.leaderboard.list();

  assert.equal(getReceivedLimit(), 50);
});

test("leaderboard.stats returns roast-backed aggregate values", async () => {
  const { caller } = createLeaderboardCaller();

  const result = await caller.leaderboard.stats();

  assert.deepEqual(result, {
    averageScore: 2.6,
    codesRoasted: 12,
  });
});
