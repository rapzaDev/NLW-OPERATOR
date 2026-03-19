import assert from "node:assert/strict";
import test from "node:test";
import { getSystemPrompt, roastOutputSchema } from "./ai";

test("getSystemPrompt switches between sarcastic and constructive modes", () => {
  const roastPrompt = getSystemPrompt(true);
  const honestPrompt = getSystemPrompt(false);

  assert.match(roastPrompt, /sarcastic/i);
  assert.doesNotMatch(honestPrompt, /sarcastic/i);
  assert.match(honestPrompt, /constructive/i);
});

test("roastOutputSchema parses the proven roast payload shape", () => {
  const parsed = roastOutputSchema.parse({
    analysisItems: [
      {
        description: "Prefer const instead of var for predictable scope.",
        severity: "critical",
        title: "function-scoped variable",
      },
    ],
    roastQuote: "this callback has trust issues.",
    score: 3.6,
    suggestedFix:
      "const total = items.reduce((sum, item) => sum + item.price, 0);",
    verdict: "needs_serious_help",
  });

  assert.equal(parsed.analysisItems[0]?.severity, "critical");
  assert.equal(parsed.verdict, "needs_serious_help");
});

test("roastOutputSchema rejects verdicts outside the database contract", () => {
  assert.throws(() =>
    roastOutputSchema.parse({
      analysisItems: [],
      roastQuote: "looks fine",
      score: 8.2,
      suggestedFix: "return total;",
      verdict: "great_job",
    }),
  );
});
