import assert from "node:assert/strict";
import test from "node:test";
import { createRoastResultsViewModel } from "./roast-results-view-model";

test("createRoastResultsViewModel formats roast data for the result screen", () => {
  const viewModel = createRoastResultsViewModel({
    analysisItems: [
      {
        createdAt: new Date("2026-03-18T21:00:00.000Z"),
        description: "Use const instead of var.",
        id: "analysis-1",
        order: 0,
        roastId: "roast-1",
        severity: "critical",
        title: "mutable declaration",
      },
    ],
    code: "var total = 0;\nreturn total;",
    createdAt: new Date("2026-03-18T21:00:00.000Z"),
    id: "roast-1",
    language: "javascript",
    lineCount: 2,
    roastMode: true,
    roastQuote: "this function is fighting the language.",
    score: 3.6,
    suggestedFix: "const total = 0;\nreturn total;",
    verdict: "needs_serious_help",
  });

  assert.equal(viewModel.scoreLabel, "3.6");
  assert.equal(viewModel.scoreRingDegrees, 129.6);
  assert.equal(viewModel.verdictTone, "critical");
  assert.equal(viewModel.lineCountLabel, "2 lines");
  assert.equal(viewModel.highlightLanguage, "javascript");
  assert.deepEqual(viewModel.diffLines, [
    {
      content: "var total = 0;",
      kind: "removed",
    },
    {
      content: "const total = 0;",
      kind: "added",
    },
    {
      content: "return total;",
      kind: "context",
    },
  ]);
});

test("createRoastResultsViewModel falls back to javascript for unsupported languages", () => {
  const viewModel = createRoastResultsViewModel({
    analysisItems: [],
    code: "print('hello')",
    createdAt: new Date("2026-03-18T21:00:00.000Z"),
    id: "roast-2",
    language: "unknown-language",
    lineCount: 1,
    roastMode: false,
    roastQuote: "all vibes, no parser support.",
    score: 6.4,
    suggestedFix: "print('hello')",
    verdict: "decent_code",
  });

  assert.equal(viewModel.highlightLanguage, "javascript");
  assert.equal(viewModel.lineCountLabel, "1 line");
  assert.equal(viewModel.scoreRingDegrees, 230.4);
  assert.equal(viewModel.verdictTone, "warning");
});
