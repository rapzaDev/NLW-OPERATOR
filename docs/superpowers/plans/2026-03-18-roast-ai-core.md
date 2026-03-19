# Roast AI Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the CORE roast flow so the homepage submits code to `trpc.roast.create`, persists an AI-generated roast, redirects to `/roast/[id]`, and renders persisted roast data on reload.

**Architecture:** Keep the current workspace isolation and add the spec-backed roast domain alongside the existing demo/submission scaffolding. Use small pure helpers for validation, prompt/diff logic, and router dependency injection so TDD stays practical, while keeping the main orchestration inside the roast tRPC router.

**Tech Stack:** Next.js 16 App Router, React 19, tRPC v11, Drizzle ORM + PostgreSQL, Vercel AI SDK (`ai`, `@ai-sdk/openai`), Node test runner with `tsx`.

---

### Task 1: Lock The Spec And Test Harness

**Files:**
- Create: `specs/roast-feature-reconstruction.md`
- Create: `docs/superpowers/plans/2026-03-18-roast-ai-core.md`
- Modify: `package.json`

- [ ] **Step 1: Ensure the approved spec exists at the expected repo path**

Copy the attached source-of-truth spec into:

```text
specs/roast-feature-reconstruction.md
```

- [ ] **Step 2: Add a failing smoke test run for the planned Node test harness**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 20 >/dev/null && node --import tsx --test src/lib/ai.test.ts
```

Expected: FAIL because `src/lib/ai.test.ts` does not exist yet.

- [ ] **Step 3: Add a reusable `test` script**

Update `package.json` with:

```json
"test": "node --import tsx --test $(find src -name '*.test.ts' -o -name '*.test.tsx' | tr '\n' ' ')"
```

- [ ] **Step 4: Verify the script resolves**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 20 >/dev/null && pnpm test
```

Expected: FAIL because the roast tests are not written yet.

### Task 2: Add The Roast Domain Backend

**Files:**
- Create: `src/lib/roast.ts`
- Create: `src/lib/roast-diff.ts`
- Create: `src/lib/ai.ts`
- Create: `src/lib/ai.test.ts`
- Create: `src/lib/roast-diff.test.ts`
- Create: `src/trpc/routers/roast.ts`
- Create: `src/trpc/routers/roast.test.ts`
- Create: `src/db/queries/roasts.ts`
- Create: `src/db/schema/roasts.ts`
- Create: `src/db/schema/analysis-items.ts`
- Modify: `src/db/schema/enums.ts`
- Modify: `src/db/schema/index.ts`
- Modify: `src/trpc/routers/_app.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `drizzle/*`

- [ ] **Step 1: Write the AI-schema and diff-helper tests first**

Add tests that prove:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { getSystemPrompt, roastOutputSchema } from "@/lib/ai";
import { buildRoastDiffLines } from "@/lib/roast-diff";

test("getSystemPrompt switches tone by roast mode", () => {
  assert.match(getSystemPrompt(true), /sarcastic/i);
  assert.doesNotMatch(getSystemPrompt(false), /sarcastic/i);
});

test("buildRoastDiffLines marks changed lines as removed and added", () => {
  assert.deepEqual(
    buildRoastDiffLines("const a = 1;", "const total = 1;"),
    [
      { content: "const a = 1;", kind: "removed" },
      { content: "const total = 1;", kind: "added" },
    ],
  );
});
```

- [ ] **Step 2: Run the helper tests and confirm RED**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 20 >/dev/null && node --import tsx --test src/lib/ai.test.ts src/lib/roast-diff.test.ts
```

Expected: FAIL because the modules do not exist yet.

- [ ] **Step 3: Implement the minimal roast helpers and AI module**

Create:

```ts
// src/lib/roast.ts
export const MAX_ROAST_CHARACTERS = 2000;
export const DEFAULT_ROAST_LANGUAGE = "javascript";
export function countRoastLines(code: string) {
  return code.split(/\r\n|\r|\n/).length;
}
```

```ts
// src/lib/ai.ts
import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

export const roastOutputSchema = z.object({
  score: z.number().min(0).max(10),
  verdict: z.enum([
    "needs_serious_help",
    "rough_around_edges",
    "decent_code",
    "solid_work",
    "exceptional",
  ]),
  roastQuote: z.string().min(1),
  analysisItems: z.array(
    z.object({
      severity: z.enum(["critical", "warning", "good"]),
      title: z.string().min(1),
      description: z.string().min(1),
    }),
  ),
  suggestedFix: z.string().min(1),
});
```

- [ ] **Step 4: Re-run the helper tests and confirm GREEN**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 20 >/dev/null && node --import tsx --test src/lib/ai.test.ts src/lib/roast-diff.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write the roast router test before the router**

Add a router test that injects fake AI + fake persistence and proves:

```ts
test("roast.create returns the persisted roast id", async () => {
  // caller.roast.create({ code, language, roastMode }) -> { id }
});

test("roast.getById throws NOT_FOUND when the roast is missing", async () => {
  // caller.roast.getById({ id }) -> TRPCError NOT_FOUND
});
```

- [ ] **Step 6: Run the router test and confirm RED**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 20 >/dev/null && node --import tsx --test src/trpc/routers/roast.test.ts
```

Expected: FAIL because the router and roast schema/query modules are not complete yet.

- [ ] **Step 7: Implement the roast schema, queries, and router**

Add the spec-backed domain:

```ts
// enums
export const roastVerdictEnum = pgEnum("roast_verdict", [
  "needs_serious_help",
  "rough_around_edges",
  "decent_code",
  "solid_work",
  "exceptional",
]);

export const analysisSeverityEnum = pgEnum("analysis_severity", [
  "critical",
  "warning",
  "good",
]);
```

```ts
// router
export const roastRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      code: z.string().trim().min(1).max(MAX_ROAST_CHARACTERS),
      language: z.string().trim().min(1),
      roastMode: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      // AI call -> transaction -> { id }
    }),
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // load roast + ordered analysis items or throw NOT_FOUND
    }),
});
```

- [ ] **Step 8: Re-run the router/backend tests and confirm GREEN**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 20 >/dev/null && node --import tsx --test src/lib/ai.test.ts src/lib/roast-diff.test.ts src/trpc/routers/roast.test.ts
```

Expected: PASS.

- [ ] **Step 9: Generate the Drizzle migration**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 20 >/dev/null && pnpm db:generate
```

Expected: a new migration for `roasts` and `analysis_items`.

### Task 3: Wire The Homepage And Result Route

**Files:**
- Create: `src/app/roast/[id]/page.tsx`
- Modify: `src/components/home/code-input-panel.tsx`
- Modify: `src/components/roast-results/roast-results-page.tsx`
- Modify: `src/app/roasts/[roastId]/page.tsx`
- Modify: `src/lib/demo-roasts.ts` (remove if obsolete)

- [ ] **Step 1: Write the result view-model test first**

Add a test that proves the result mapper turns a roast record into:

```ts
{
  scoreLabel: "7.4",
  verdictTone: "warning",
  lineCountLabel: "12 lines",
  diffLines: [...]
}
```

- [ ] **Step 2: Run the result test and confirm RED**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 20 >/dev/null && node --import tsx --test src/components/roast-results/roast-results-page.test.ts
```

Expected: FAIL because the mapper or exports do not exist yet.

- [ ] **Step 3: Implement the homepage mutation wiring**

Replace demo navigation with:

```ts
const createRoastMutation = useMutation(
  trpc.roast.create.mutationOptions({
    onSuccess: ({ id }) => router.push(`/roast/${id}`),
  }),
);
```

Button guard:

```ts
disabled={isCodeLimitExceeded || !codeValue.trim() || createRoastMutation.isPending}
```

- [ ] **Step 4: Implement the singular roast page and data-driven result screen**

Server page shape:

```ts
const roast = await caller.roast.getById({ id });
return <RoastResultsPageScreen roast={roast} />;
```

UI requirements:
- render score, verdict, roast quote
- render submitted code
- render ordered analysis items
- compute diff lines from `code` and `suggestedFix`

- [ ] **Step 5: Preserve compatibility for the old plural route**

Update `src/app/roasts/[roastId]/page.tsx` to redirect to `/roast/[roastId]` so existing demo links do not break while the canonical path changes.

- [ ] **Step 6: Re-run targeted tests**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 20 >/dev/null && pnpm test
```

Expected: PASS.

### Task 4: Verify The Core Flow

**Files:**
- Modify as needed based on verification only

- [ ] **Step 1: Run static validation**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 20 >/dev/null && pnpm check
```

Expected: PASS.

- [ ] **Step 2: Run the production build**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 20 >/dev/null && pnpm build
```

Expected: PASS.

- [ ] **Step 3: Run the full automated test suite**

Run:

```bash
source ~/.nvm/nvm.sh && nvm use 20 >/dev/null && pnpm test
```

Expected: PASS.

- [ ] **Step 4: Validate the implementation against the spec checklist**

Confirm manually:
- `/` submits `{ code, language, roastMode }`
- `trpc.roast.create` persists one roast plus ordered analysis items atomically
- success redirects to `/roast/[id]`
- `/roast/[id]` reloads from persisted data
- invalid/missing ids are handled predictably
- optional leaderboard/cache/OG work is still out of scope
