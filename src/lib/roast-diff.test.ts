import assert from "node:assert/strict";
import test from "node:test";
import { buildRoastDiffLines } from "./roast-diff";

test("buildRoastDiffLines keeps unchanged lines as context", () => {
  assert.deepEqual(
    buildRoastDiffLines("const total = 1;", "const total = 1;"),
    [
      {
        content: "const total = 1;",
        kind: "context",
      },
    ],
  );
});

test("buildRoastDiffLines emits removed and added entries for changed lines", () => {
  assert.deepEqual(buildRoastDiffLines("var total = 0;", "const total = 0;"), [
    {
      content: "var total = 0;",
      kind: "removed",
    },
    {
      content: "const total = 0;",
      kind: "added",
    },
  ]);
});

test("buildRoastDiffLines handles inserted and removed trailing lines", () => {
  assert.deepEqual(
    buildRoastDiffLines(
      "const total = 0;\nreturn total;",
      "const total = 0;\nconsole.log(total);\nreturn total;",
    ),
    [
      {
        content: "const total = 0;",
        kind: "context",
      },
      {
        content: "return total;",
        kind: "removed",
      },
      {
        content: "console.log(total);",
        kind: "added",
      },
      {
        content: "return total;",
        kind: "added",
      },
    ],
  );
});
