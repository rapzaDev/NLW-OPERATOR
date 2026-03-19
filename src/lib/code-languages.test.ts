import assert from "node:assert/strict";
import test from "node:test";
import {
  detectCodeLanguage,
  resolveRoastSubmitLanguage,
} from "./code-languages";
import { DEFAULT_ROAST_LANGUAGE } from "./roast";

test("detectCodeLanguage normalizes html documents detected as xml", async () => {
  const language = await detectCodeLanguage(
    "<!doctype html><html><body>Hello</body></html>",
    async () => ({
      highlightAuto: () => ({ language: "xml" }),
    }),
  );

  assert.equal(language, "html");
});

test("detectCodeLanguage recognizes python snippets with the bundled detector", async () => {
  const language = await detectCodeLanguage(`def calculate_total(items):
    total = sum(item["price"] for item in items)

    if total > 100:
        print("discount applied")
        total *= 0.9

    return total`);

  assert.equal(language, "python");
});

test("detectCodeLanguage normalizes sql dialects returned by highlight.js", async () => {
  const language = await detectCodeLanguage(`select id, email
from users
where created_at >= current_date - interval '7 days'
order by created_at desc;`);

  assert.equal(language, "sql");
});

test("resolveRoastSubmitLanguage prefers the latest detected language in auto mode", async () => {
  const language = await resolveRoastSubmitLanguage(
    {
      code: 'print("hello")',
      languageMode: "auto",
      resolvedLanguage: "javascript",
    },
    async () => ({
      highlightAuto: () => ({ language: "python" }),
    }),
  );

  assert.equal(language, "python");
});

test("resolveRoastSubmitLanguage preserves manual selection over auto-detect", async () => {
  const language = await resolveRoastSubmitLanguage(
    {
      code: 'print("hello")',
      languageMode: "typescript",
      resolvedLanguage: "python",
    },
    async () => ({
      highlightAuto: () => ({ language: "python" }),
    }),
  );

  assert.equal(language, "typescript");
});

test("resolveRoastSubmitLanguage falls back to the default roast language", async () => {
  const language = await resolveRoastSubmitLanguage(
    {
      code: "x",
      languageMode: "auto",
      resolvedLanguage: null,
    },
    async () => ({
      highlightAuto: () => ({ language: undefined }),
    }),
  );

  assert.equal(language, DEFAULT_ROAST_LANGUAGE);
});
