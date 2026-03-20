import assert from "node:assert/strict";
import test from "node:test";
import { createRoastPageMetadata } from "./roast-metadata";

test("createRoastPageMetadata uses persisted roast data in title and description", () => {
  const metadata = createRoastPageMetadata({
    id: "7e5b9a7d-430e-4e47-8f6e-9ba42a17b570",
    language: "python",
    roastQuote: "this helper is one import away from a cry for help.",
    score: 3.6,
    verdict: "needs_serious_help",
  });

  assert.equal(metadata.title, "python roast · 3.6/10 | devroast");
  assert.equal(
    metadata.description,
    "this helper is one import away from a cry for help. Verdict: needs serious help.",
  );
});
