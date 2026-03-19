# Reverse-Engineered Roast Feature

## Status
- Pesquisa e especificação apenas.
- Nenhuma implementação foi feita nesta tarefa.

## Contexto
- Source of truth: GitHub commit history at [rocketseat-education/nlw-operator-fullstack-devroast](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commits/985f772dfba2bf09d6c6d9273d10b653611581d5/).
- Commit access was validated successfully on 2026-03-18 by reading the public commit history and fetching commit contents directly from GitHub.
- Reconstruction is based only on commit messages and file contents from the relevant commits.
- Core evidence came from these commits:
  - [1cfd240](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/1cfd2404b07a6b090556056364b670f9dc5335cc)
  - [5cdaf36](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/5cdaf36394f5dc70df7bdb8a4e5180407d3ec074)
  - [b29b396](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/b29b396cfda4ba7fbb48abb577c883bc46ab8ff0)
  - [3b71b68](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/3b71b683370fea0d7e5b6eed203eb2918eafbf4d)
  - [529ef24](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/529ef240475f2bd8392ff105bac6951eb1975844)
  - [2b3fbfb](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/2b3fbfbea3b5a25d8937f201e9474e85d634c7d3)
  - [ddc6912](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/ddc6912c00b24b9301606526660165cf3005e1bf)
- Optional/adjacent evidence came from:
  - [629b682](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/629b682)
  - [7bf0500](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/7bf0500ac6350255d1979bb7e6b716868217cffb)
  - [b998b9e](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/b998b9eba4b71b6f9d0429e070622c18005c94b4)
  - [e7126ba](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/e7126ba)
  - [8a8dac1](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/8a8dac1)
  - [03112bd](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/03112bd)
  - [a298710](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/a298710)
  - [f011c39](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/f011c39)
  - [6b4dcaa](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/6b4dcaa)
  - [c1fd6eb](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/c1fd6eb)
  - [985f772](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/985f772dfba2bf09d6c6d9273d10b653611581d5)
- Important correction from the evidence: the shipped feature does not persist four separate collections named `issues`, `improvements`, `strengths`, and `suggestions`. It persists one `roasts` record, many ordered `analysis_items`, and one `suggested_fix` string.

## Objetivo
- Produzir um guia técnico confiável para reconstruir a feature de criação de roast/análise por IA sem depender do código atual do projeto original.

## Não objetivos
- Inventar contratos ou entidades que não aparecem nos commits.
- Tratar leaderboard, OG image, metadata dinâmica, ou sharing como parte do núcleo sem evidência de dependência.
- Presumir melhorias de produção como comportamento já existente sem marcar isso como inferência/recomendação.

## Abordagem proposta

### Evidence Discipline
- Confirmed from commits:
  - Next.js App Router application.
  - Input UI on homepage.
  - Drizzle ORM + PostgreSQL persistence.
  - tRPC v11 transport.
  - OpenAI call via Vercel AI SDK using `gpt-4o-mini`.
  - Dynamic result route at `/roast/[id]`.
- Inference:
  - Core vs optional split.
  - Recommended implementation order from scratch.
  - Production hardening items where shipped code is weaker than the plan embedded in commit docs.

## 1. Feature Reconstruction

### Core feature
- A user submits source code from the homepage editor.
- The backend sends the code to an OpenAI model through the Vercel AI SDK.
- The model returns structured review data.
- The backend persists the review and its itemized findings.
- The client redirects to a dynamic result page.
- The result page renders the persisted roast, analysis items, and an inline diff against the suggested fix.

### Exact data shape proven by the commits
- AI output:
  - `score: number`
  - `verdict: "needs_serious_help" | "rough_around_edges" | "decent_code" | "solid_work" | "exceptional"`
  - `roastQuote: string`
  - `analysisItems: { severity: "critical" | "warning" | "good"; title: string; description: string }[]`
  - `suggestedFix: string`
- Persisted roast:
  - `id`
  - `code`
  - `language`
  - `lineCount`
  - `roastMode`
  - `score`
  - `verdict`
  - `roastQuote`
  - `suggestedFix`
  - `createdAt`
- Persisted analysis item:
  - `id`
  - `roastId`
  - `severity`
  - `title`
  - `description`
  - `order`

### Full user flow
1. User pastes code into `HomeEditor`.
2. Client resolves language from manual selection or auto-detection.
3. User optionally keeps `roast mode` enabled.
4. User clicks `$ roast_my_code`.
5. Client mutation submits `{ code, language, roastMode }` to `trpc.roast.create`.
6. Backend validates the input and calls the AI model.
7. Backend persists roast data and analysis items.
8. Backend returns `{ id }`.
9. Client redirects to `/roast/[id]`.
10. Result page fetches the persisted roast by id and renders the review.

### Full system flow
`HomeEditor (client)` -> `useMutation(trpc.roast.create)` -> `/api/trpc` -> `roastRouter.create` -> `generateText({ model: openai("gpt-4o-mini") })` -> `insert roasts` -> `insert analysis_items` -> `return { id }` -> `router.push("/roast/[id]")` -> `RoastResultPage (server component)` -> `caller.roast.getById({ id })` -> `render score, verdict, quote, submitted code, analysis items, suggested fix diff`

### Exact AI responsibilities
- Score the submitted code from `0` to `10`.
- Choose one verdict enum value compatible with the DB enum.
- Produce one `roastQuote`.
- Produce an ordered array of `analysisItems`.
- Produce one full `suggestedFix`.
- The AI does not compute the UI diff.
- The AI does not persist anything.

### Layer responsibilities
| Layer | Modules | Responsibility | Evidence |
| --- | --- | --- | --- |
| Input/UI | `src/app/home-editor.tsx`, `src/components/code-editor.tsx` | Capture code, roast mode, language, loading/disabled state | `1cfd240`, `5cdaf36`, `3b71b68`, `ddc6912` |
| Validation | `HomeEditor`, `roastRouter.create`, `src/lib/ai.ts` | Client-side length guard, tRPC input schema, AI output schema | `3b71b68`, `ddc6912` |
| API transport | `src/app/api/trpc/[trpc]/route.ts`, `src/trpc/*` | HTTP adapter, query client, provider, server caller | `2b3fbfb` |
| Domain orchestration | `src/trpc/routers/roast.ts` | Mutation/query orchestration, AI call, DB reads/writes | `ddc6912` |
| AI module | `src/lib/ai.ts` | Model selection, output schema, prompt factory | `ddc6912` |
| Persistence | `src/db/index.ts`, `src/db/schema.ts`, Drizzle migration | DB connection, enums, tables, relations | `b29b396` |
| Result rendering | `src/app/roast/[id]/page.tsx`, `CodeBlock`, `DiffLine`, `ScoreRing` | Server-side display of persisted output | `529ef24`, `ddc6912` |

## 2. Commit-Level Reverse Engineering

### [1cfd240](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/1cfd2404b07a6b090556056364b670f9dc5335cc) — feat: add UI component library, homepage, and project docs
- Purpose: establish the UI shell and reusable primitives that the roast feature later reuses.
- Technical changes:
  - Added homepage and `HomeEditor`.
  - Added reusable components: `Button`, `Badge`, `Toggle`, `DiffLine`, `CodeBlock`, `AnalysisCard`, `ScoreRing`.
  - Added navbar and visual system.
- Role in system: foundation for the editor and result page.
- Dependencies: initial Next.js scaffold only.
- Classification: foundation, UI integration.
- Required: REQUIRED.
- Evidence note: leaderboard preview was bundled here but is not core to roast creation.

### [5cdaf36](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/5cdaf36394f5dc70df7bdb8a4e5180407d3ec074) — feat: add syntax highlighting to code editor with auto language detection
- Purpose: upgrade the editor from plain text input to a code-oriented input surface.
- Technical changes:
  - Reworked `CodeEditor` into an overlay editor with Shiki highlighting.
  - Added `use-language-detection.ts` using `highlight.js`.
  - Added `src/lib/languages.ts` with supported languages and mappings.
  - Added DB-related dependencies and scripts to `package.json`.
- Role in system: supplies language context that is later sent to AI and stored in the DB.
- Dependencies: `1cfd240`.
- Classification: foundation, UX enhancement, infrastructure precursor.
- Required: OPTIONAL for the exact backend feature, but REQUIRED if reproducing the original language auto-detection UX and the exact dependency evolution.
- Evidence note: later backend commits rely on `language` being available, but not on this specific editor implementation.

### [b29b396](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/b29b396cfda4ba7fbb48abb577c883bc46ab8ff0) — feat: add database layer with Drizzle ORM, PostgreSQL schema, and seed script
- Purpose: create the persistence boundary for roast results.
- Technical changes:
  - Added Docker Compose PostgreSQL.
  - Added Drizzle config and first migration.
  - Added `roasts` and `analysis_items` schema.
  - Added DB client and seed script.
- Role in system: stores the AI output and enables retrieval by id.
- Dependencies: package dependencies/scripts introduced earlier.
- Classification: infrastructure, persistence.
- Required: REQUIRED.

### [3b71b68](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/3b71b683370fea0d7e5b6eed203eb2918eafbf4d) — feat: add character limit (2000) to code editor with counter and submit guard
- Purpose: add client-side guardrails before the backend exists.
- Technical changes:
  - Exported `MAX_CHARACTERS = 2000`.
  - Added character counter and red warning state.
  - Disabled submit when empty or above limit.
- Role in system: mirrors the later server-side `z.string().max(2000)` input rule.
- Dependencies: `1cfd240`, `5cdaf36`.
- Classification: UI integration, validation.
- Required: OPTIONAL because server validation in `ddc6912` is the real enforcement.

### [629b682](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/629b682) — feat: add leaderboard page and refactor CodeBlock into composable parts
- Purpose: expand auxiliary leaderboard UI and refactor a display component.
- Technical changes: leaderboard page plus `CodeBlock` composition refactor.
- Role in system: unrelated to the core roast create/getById path.
- Dependencies: UI foundation from `1cfd240`.
- Classification: non-essential, UI enhancement.
- Required: OPTIONAL.

### [529ef24](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/529ef240475f2bd8392ff105bac6951eb1975844) — feat: add roast result page with dynamic [id] route and static data
- Purpose: define the destination route and final page structure before real data wiring.
- Technical changes:
  - Added `src/app/roast/[id]/page.tsx`.
  - Rendered score hero, verdict badge, quote, submitted code, analysis cards, and suggested fix diff.
  - Used static placeholder data.
- Role in system: final read-model UI shell.
- Dependencies: UI primitives from `1cfd240`.
- Classification: UI integration.
- Required: REQUIRED.

### [2b3fbfb](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/2b3fbfbea3b5a25d8937f201e9474e85d634c7d3) — feat: add tRPC layer with React Query integration and animated homepage stats
- Purpose: introduce the API transport layer that later carries create/getById.
- Technical changes:
  - Added tRPC init, routers, query client, provider, server helpers, and fetch adapter route.
  - Added `roast.getStats`.
  - Wired homepage stats through prefetch + hydration.
- Role in system: transport and caller infrastructure for the roast domain.
- Dependencies: `b29b396`.
- Classification: infrastructure, API layer.
- Required: REQUIRED.
- Evidence note: animated stats are auxiliary, but the tRPC substrate is core.

### [7bf0500](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/7bf0500ac6350255d1979bb7e6b716868217cffb) — feat: add leaderboard with real DB data, collapsible code preview, and updated docs
- Purpose: move leaderboard preview from mock data to live data.
- Technical changes:
  - Added `roast.getLeaderboard`.
  - Replaced hardcoded leaderboard rows with DB-backed content.
  - Added leaderboard-specific UI components.
- Role in system: proves the same tRPC + Drizzle pattern on the roast domain, but outside the core create/retrieve flow.
- Dependencies: `b29b396`, `2b3fbfb`.
- Classification: API layer, UI integration.
- Required: OPTIONAL.

### [b998b9e](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/b998b9eba4b71b6f9d0429e070622c18005c94b4) — feat: leaderboard page with real data, loading skeleton, and use cache revalidation
- Purpose: optimize and expand the leaderboard experience.
- Technical changes:
  - Parametrized `getLeaderboard(limit)`.
  - Added `/leaderboard` loading skeleton.
  - Enabled `cacheComponents` and `use cache` on leaderboard/homepage-related paths.
- Role in system: optional caching/revalidation example.
- Dependencies: `7bf0500`.
- Classification: optimization.
- Required: OPTIONAL.

### [ddc6912](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/ddc6912c00b24b9301606526660165cf3005e1bf) — feat: implement AI-powered roast creation with GPT-4o-mini
- Purpose: complete the end-to-end feature.
- Technical changes:
  - Added `src/lib/ai.ts` with model, output schema, and prompt factory.
  - Added `roast.create` mutation.
  - Added `roast.getById` query.
  - Wired `HomeEditor` to the mutation with loading state and redirect.
  - Replaced static roast page data with a real server-side query.
  - Added `Suspense` around the tRPC provider in layout.
- Role in system: AI integration, write path, read path, UI-backend wiring.
- Dependencies:
  - UI shell from `1cfd240`
  - Result page shell from `529ef24`
  - DB layer from `b29b396`
  - tRPC layer from `2b3fbfb`
  - Optional editor/language enhancements from `5cdaf36` and `3b71b68`
- Classification: AI integration, domain logic, persistence, API layer, UI integration.
- Required: REQUIRED.
- Evidence note: commit docs mention a DB transaction, but the shipped code performs two separate inserts without an explicit transaction.

### [e7126ba](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/e7126ba) — merge pull request #1
- Purpose: merge the roast-creation branch.
- Technical changes: no new feature logic beyond integration.
- Role in system: repository history only.
- Dependencies: `ddc6912` and related branch commits.
- Classification: non-essential.
- Required: OPTIONAL.

### [8a8dac1](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/8a8dac1), [03112bd](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/03112bd), [a298710](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/a298710), [f011c39](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/f011c39), [6b4dcaa](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/6b4dcaa), [c1fd6eb](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/c1fd6eb), [985f772](https://github.com/rocketseat-education/nlw-operator-fullstack-devroast/commit/985f772dfba2bf09d6c6d9273d10b653611581d5) — OG image / metadata chain
- Purpose: enrich roast pages for sharing.
- Technical changes: OG image component, route handler, fixes, dynamic metadata and Twitter cards.
- Role in system: optional sharing and SEO enhancement.
- Dependencies: existing roast result route and roast retrieval.
- Classification: optimization, non-essential.
- Required: OPTIONAL.

## 3. Architecture Mapping

### Input layer
- `HomeEditor` is a client component.
- Inputs captured:
  - `code`
  - `roastMode`
  - `manualLanguage`
  - `detectedLanguage`
- Final language resolution is `manualLanguage ?? detectedLanguage`.
- Submit fallback language is `"javascript"` if resolution is null.

### Validation
- Client:
  - Empty code blocks submission.
  - Character limit is `2000`.
  - Loading state disables repeated submits.
- Server:
  - `code: z.string().min(1).max(2000)`
  - `language: z.string()`
  - `roastMode: z.boolean()`
  - `id: z.string().uuid()` for retrieval
- AI output:
  - Zod schema through `Output.object({ schema: roastOutputSchema })`
- Evidence gap:
  - The prompt asks for `3-6` analysis items, but the Zod schema does not enforce array length.

### API layer
- Transport:
  - `/api/trpc/[trpc]/route.ts`
  - `fetchRequestHandler`
- Client stack:
  - `TRPCReactProvider`
  - `useTRPC`
  - `useMutation` / `useQuery`
- Server stack:
  - `caller`
  - `prefetch`
  - `HydrateClient`
- Domain router:
  - `appRouter -> roastRouter`

### AI integration
- Model: `openai("gpt-4o-mini")`.
- Library: `ai` + `@ai-sdk/openai`.
- Prompt construction:
  - Shared base rules in `getSystemPrompt`.
  - Two modes:
    - professional/constructive
    - sarcastic roast mode
- Request prompt sent to the model:
  - `Language: ${input.language}\n\nCode:\n${input.code}`
- Response parsing:
  - Structured output through `Output.object`.
  - Fatal error if `output` is absent.

### Domain layer
- There is no separate service class/module.
- The tRPC router owns orchestration:
  - AI call
  - line count calculation
  - persistence
  - retrieval
- Inference: for a clean production rebuild, extracting a service layer would improve separation of concerns, but that is not how the shipped feature was structured.

### Persistence
- DB client:
  - `db = drizzle(databaseUrl, { casing: "snake_case" })`
- Enums:
  - `verdict`
  - `severity`
- Tables:
  - `roasts`
  - `analysis_items`
- Retrieval:
  - `getById` loads roast first.
  - `getById` then loads analysis items ordered by `order`.
- Evidence note:
  - The shipped `create` mutation does not wrap the roast insert and analysis item insert in one transaction.

### UI rendering
- Homepage:
  - server page
  - client editor inside it
- Result page:
  - async server component at `/roast/[id]`
  - direct server-side `caller.roast.getById`
- Display pieces:
  - `ScoreRing`
  - `Badge`
  - `AnalysisCard`
  - `CodeBlock`
  - `DiffLine`

### Routing
- Input page: `/`
- Dynamic result page: `/roast/[id]`
- API transport: `/api/trpc`

### Cache / revalidation
- Core roast creation flow:
  - no explicit caching or revalidation in the core commits
- Optional later behavior:
  - `cacheComponents: true`
  - `hourly` cache profile
  - `"use cache"` in homepage/leaderboard-related modules and `CodeBlock`
- Evidence-based conclusion:
  - cache/revalidation is not required for the roast creation feature itself.

### Boundaries between layers
- UI knows only tRPC procedures and route ids.
- tRPC knows DB schema and AI module.
- AI module knows prompt/schema/model, but not the DB or UI.
- DB schema knows storage shape only.
- Result page knows read model plus naive diff generation.

### Coupling risks
- DB enums and AI output enums must stay aligned.
- `language` is stored as a free-form string but cast back to `BundledLanguage` in the result page.
- `MAX_CHARACTERS` in the UI and `.max(2000)` in the server must stay synchronized.
- `verdictToBadgeVariant` exists only in the UI; changes in verdict semantics require UI maintenance.

## 4. Dependency Graph & Build Order

### Commit-derived dependency graph
- `1cfd240` -> `5cdaf36`
- `5cdaf36` -> `b29b396`
- `1cfd240` -> `529ef24`
- `b29b396` -> `2b3fbfb`
- `1cfd240` + `529ef24` + `b29b396` + `2b3fbfb` -> `ddc6912`
- `2b3fbfb` + `b29b396` -> `7bf0500` -> `b998b9e`
- `ddc6912` -> OG/metadata chain

### Strict build order from scratch
1. Create the Next.js application shell.
2. Add the reusable UI primitives and homepage editor shell.
3. Add code-editor language support and client-side UX guards.
4. Install and configure persistence dependencies.
5. Define the Drizzle schema and database connection.
6. Add tRPC infrastructure and the `/api/trpc` route.
7. Create the dynamic `/roast/[id]` page shell.
8. Add the AI module with model, prompt, and output schema.
9. Implement `roast.create`.
10. Implement `roast.getById`.
11. Wire the homepage button to the create mutation and redirect.
12. Replace the static result-page data with server-side retrieval.
13. Add optional stats, leaderboard, cache, and OG features.

### Explicit dependency notes
- Do not implement `roast.create` before the DB schema exists.
- Do not wire `HomeEditor` before the tRPC client/provider exists.
- Do not switch `/roast/[id]` to real data before `getById` exists.
- Do not treat leaderboard or OG metadata as blockers for the core path.

## 5. Implementation Roadmap

### Step 1 — UI Foundation
- Objective: recreate the shared UI primitives and homepage shell used by the feature.
- Files/modules impacted:
  - `src/app/page.tsx`
  - `src/app/home-editor.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/ui/badge.tsx`
  - `src/components/ui/toggle.tsx`
  - `src/components/ui/analysis-card.tsx`
  - `src/components/ui/code-block.tsx`
  - `src/components/ui/diff-line.tsx`
  - `src/components/ui/score-ring.tsx`
- Implementation details:
  - Build the homepage with a client editor island.
  - Keep the result-page primitives reusable from day one.
- Expected outcome: the app can render an editor shell and a result-page shell before any backend exists.
- Validation method: `pnpm build` and manual navigation to `/`.
- Common pitfalls:
  - Coupling the editor too early to backend state.
  - Recreating result-page widgets ad hoc instead of as reusable primitives.

### Step 2 — Input Surface and Language Context
- Objective: capture code, language, and roast mode the same way the commits evolved toward.
- Files/modules impacted:
  - `src/components/code-editor.tsx`
  - `src/hooks/use-language-detection.ts`
  - `src/lib/languages.ts`
  - `src/app/home-editor.tsx`
- Implementation details:
  - Support code input.
  - Resolve language from manual choice or auto-detection.
  - Keep `roastMode` as a boolean toggle.
  - Add `MAX_CHARACTERS = 2000`.
- Expected outcome: the client produces `{ code, language, roastMode }` with stable UX.
- Validation method: manual test with empty input, valid input, and oversized input.
- Common pitfalls:
  - Letting `language` drift into values unsupported by the syntax highlighter.
  - Enforcing the limit only in the UI and forgetting the server.

### Step 3 — Infrastructure Dependencies and Environment Contracts
- Objective: install the runtime stack proven by the commits.
- Files/modules impacted:
  - `package.json`
  - `.env.local`
  - `docker-compose.yml`
  - `drizzle.config.ts`
- Implementation details:
  - Add Drizzle/PostgreSQL dependencies.
  - Add tRPC/React Query dependencies.
  - Add `ai` and `@ai-sdk/openai`.
  - Provide `DATABASE_URL`.
  - Provide `OPENAI_API_KEY`.
- Expected outcome: local environment can connect to Postgres and the AI provider.
- Validation method: dependency install, DB boot, and build pass.
- Common pitfalls:
  - Missing `DATABASE_URL`.
  - Missing `OPENAI_API_KEY`.
  - Installing only the UI dependencies and forgetting the backend/runtime stack.

### Step 4 — Database Schema
- Objective: define storage exactly as the commits expect.
- Files/modules impacted:
  - `src/db/index.ts`
  - `src/db/schema.ts`
  - `drizzle/*`
  - `src/db/seed.ts`
- Implementation details:
  - Create `verdict` enum.
  - Create `severity` enum.
  - Create `roasts` table.
  - Create `analysis_items` table with `roast_id -> roasts.id` and cascade delete.
  - Add score index.
- Expected outcome: the DB can persist one roast and its ordered analysis items.
- Validation method: migration generation, DB apply, and a manual insert/select smoke test.
- Common pitfalls:
  - Mismatching enum values against the AI output schema.
  - Omitting `order`, which the result page relies on for stable display.

### Step 5 — tRPC Transport Layer
- Objective: recreate the type-safe API substrate.
- Files/modules impacted:
  - `src/trpc/init.ts`
  - `src/trpc/routers/_app.ts`
  - `src/trpc/query-client.ts`
  - `src/trpc/client.tsx`
  - `src/trpc/server.tsx`
  - `src/app/api/trpc/[trpc]/route.ts`
  - `src/app/layout.tsx`
- Implementation details:
  - Expose DB through tRPC context.
  - Add client/provider setup.
  - Add server caller and hydration helpers.
  - Mount fetch adapter on `/api/trpc`.
- Expected outcome: client and server can call roast procedures through the same router.
- Validation method: add and call a trivial query such as `getStats`.
- Common pitfalls:
  - Building the router but forgetting the HTTP adapter route.
  - Forgetting to mount the provider around the App Router tree.

### Step 6 — Result Page Shell
- Objective: create the destination route before wiring real data.
- Files/modules impacted:
  - `src/app/roast/[id]/page.tsx`
- Implementation details:
  - Build the page structure with score hero, submitted code, detailed analysis, and suggested fix diff.
  - Keep it renderable with static placeholder data first if necessary.
- Expected outcome: `/roast/[id]` exists and its layout is stable before backend integration.
- Validation method: manual route rendering with static data.
- Common pitfalls:
  - Waiting for backend data before designing the read model.
  - Hard-coding UI assumptions that diverge from the DB schema.

### Step 7 — AI Module
- Objective: isolate model selection, prompt rules, and output schema.
- Files/modules impacted:
  - `src/lib/ai.ts`
- Implementation details:
  - Export `model = openai("gpt-4o-mini")`.
  - Export `roastOutputSchema`.
  - Export `getSystemPrompt(roastMode)`.
- Expected outcome: the domain layer can ask for a typed AI response without embedding prompt details inline.
- Validation method: mocked AI call or isolated schema parse test.
- Common pitfalls:
  - Letting prompt enum values drift from DB enum values.
  - Keeping prompt logic inside the router and making it untestable.

### Step 8 — Roast Domain Procedures
- Objective: implement the write and read paths.
- Files/modules impacted:
  - `src/trpc/routers/roast.ts`
- Implementation details:
  - Add `create` mutation with:
    - input schema
    - AI call
    - line count calculation
    - roast insert
    - analysis item insert
    - `{ id }` response
  - Add `getById` query with:
    - UUID input validation
    - roast lookup
    - ordered analysis-item lookup
    - `NOT_FOUND` behavior
- Expected outcome: the backend owns the full orchestration of roast creation and retrieval.
- Validation method: integration tests with mocked AI output and a real test DB.
- Common pitfalls:
  - Missing explicit ordering on `analysis_items`.
  - Returning AI output directly without persisting it first.
  - Production hardening gap: the shipped code performs separate inserts; a robust rebuild should wrap them in one transaction.

### Step 9 — Homepage Mutation Wiring
- Objective: connect the existing input UI to the backend.
- Files/modules impacted:
  - `src/app/home-editor.tsx`
- Implementation details:
  - Use `useMutation(trpc.roast.create.mutationOptions())`.
  - Disable the button while pending.
  - Redirect on success to `/roast/${data.id}`.
- Expected outcome: a valid submit from the homepage produces a new persisted roast and navigates to it.
- Validation method: end-to-end happy-path test from homepage submit to result page.
- Common pitfalls:
  - Forgetting to guard duplicate submits while pending.
  - Not passing `language` when auto-detection returns null.

### Step 10 — Result Page Data Wiring
- Objective: replace mock data with real persisted data.
- Files/modules impacted:
  - `src/app/roast/[id]/page.tsx`
- Implementation details:
  - Read `params.id`.
  - Call `caller.roast.getById({ id })` on the server.
  - Map verdict to badge variant.
  - Render the original code with `CodeBlock`.
  - Compute diff lines between `code` and `suggestedFix`.
- Expected outcome: result page reflects the stored roast, not a local mock.
- Validation method: create a roast, reload the result URL directly, and confirm persistence-backed rendering.
- Common pitfalls:
  - Relying on client state instead of server retrieval.
  - Using a complex diff library when the shipped implementation only used a simple line-by-line comparison.
  - Casting `language` to `BundledLanguage` without validating supported values.

### Step 11 — Optional Product Enhancements
- Objective: add non-core features only after the create/retrieve path is stable.
- Files/modules impacted:
  - `src/app/home-stats.tsx`
  - `src/app/home-leaderboard.tsx`
  - `src/app/leaderboard/*`
  - `next.config.ts`
  - OG image modules
- Implementation details:
  - `getStats`
  - `getLeaderboard`
  - cache components and revalidation
  - OG image generation and dynamic metadata
- Expected outcome: richer homepage, leaderboard, and shareability without blocking the core roast flow.
- Validation method: separate manual verification and targeted tests.
- Common pitfalls:
  - Treating leaderboard or OG as blockers.
  - Coupling cache rules to the core write flow.

## 6. Operational Checklist
- [ ] Validate GitHub commit access.
- [ ] Recreate UI primitives and homepage editor shell.
- [ ] Recreate language capture and 2000-char input contract.
- [ ] Install DB, tRPC, React Query, and AI SDK dependencies.
- [ ] Configure `DATABASE_URL` and `OPENAI_API_KEY`.
- [ ] Recreate Drizzle schema and migrations.
- [ ] Recreate tRPC context, router, client, server helpers, and route handler.
- [ ] Create `/roast/[id]` page shell.
- [ ] Add `src/lib/ai.ts` with model, prompt, and output schema.
- [ ] Implement `roast.create`.
- [ ] Implement `roast.getById`.
- [ ] Wire homepage mutation and redirect.
- [ ] Replace result-page mocks with persisted data.
- [ ] Verify end-to-end create -> persist -> retrieve -> render flow.
- [ ] Add optional leaderboard/cache/OG only after the core path is green.

## 7. Quality & Review Criteria

### Architecture
- Good:
  - clear module split between UI, tRPC, DB, and AI prompt/schema
- Weak point:
  - domain orchestration lives directly inside the tRPC router

### Separation of concerns
- Good:
  - prompt/schema isolated in `src/lib/ai.ts`
  - schema isolated in `src/db/schema.ts`
- Weak point:
  - `roastRouter.create` mixes transport, AI orchestration, and persistence

### Scalability
- Good:
  - typed transport and persistence layer are ready for moderate growth
- Weak point:
  - synchronous AI call on request path
  - no queue, no rate limiting, no auth

### Error handling
- Present:
  - `NOT_FOUND` for missing roast
  - internal error if AI output is absent
- Missing:
  - no client-side error UX in `HomeEditor`
  - no retry or timeout strategy shown in commits

### Type safety
- Strong:
  - Zod on tRPC input
  - Zod on AI output
  - Drizzle schema typing
  - tRPC end-to-end typing
- Weak:
  - `language` is a plain string
  - result page casts it back to `BundledLanguage`

### Security
- Gaps:
  - no auth
  - no rate limiting
  - no abuse protection for AI calls
  - no content moderation layer for arbitrary pasted code

### Performance
- Acceptable for MVP:
  - simple read/write queries
  - server-side code highlighting
- Bottlenecks:
  - AI latency dominates the submit path
  - naive diff algorithm can become noisy for heavily edited code

### UX
- Good:
  - loading state on submit
  - direct redirect to result page
  - rich result page layout
- Weak:
  - no visible mutation error state
  - diff quality is simplistic

### Critical review points
- Ensure AI output enum values exactly match DB enums.
- Ensure ordered analysis item persistence.
- Ensure result page fetches persisted data server-side, not client cache only.
- Ensure input max length is enforced server-side, not only client-side.
- Ensure unsupported languages do not break syntax highlighting.
- Ensure roast row and analysis items are persisted atomically in the production rebuild.

### What breaks most often
- Missing env vars.
- Enum drift between prompt/schema/DB.
- Partial writes when one insert succeeds and the second fails.
- Unsupported `language` values breaking result-page highlighting.
- AI latency or malformed responses blocking the mutation.

### Manual vs automated tests
- Manual:
  - submit valid code with roast mode on
  - submit valid code with roast mode off
  - reload `/roast/[id]` directly
  - hit not-found path with unknown UUID
  - verify oversized input is blocked/rejected
- Automated:
  - unit test `roastOutputSchema`
  - unit test `getSystemPrompt(roastMode)`
  - integration test `roast.create` with mocked AI
  - integration test `roast.getById`
  - end-to-end test for submit -> redirect -> render

## 8. Critical Risks

### AI integration risks
- Prompt/schema drift causes model outputs that no longer fit DB enums.
- AI latency makes the synchronous mutation feel stalled.
- Output schema validates shape, but not semantic correctness.

### Data consistency risks
- Shipped code does not use an explicit transaction for roast + analysis item inserts.
- `lineCount` is derived on write; bad preprocessing would persist wrong metadata.

### API contract risks
- `language` is not constrained to a supported enum.
- The UI and server both assume `2000` as the maximum input size; drift breaks parity.

### UI sync risks
- Auto-detected language can differ from user intent.
- Result page assumes stored `language` is valid for the syntax highlighter.
- Naive diff output can misrepresent real edits when lines are inserted or moved.

### Performance bottlenecks
- OpenAI call is on the critical request path.
- Server-side syntax highlighting adds render cost.
- Optional cache/revalidation work later does not help the create mutation latency.

## 9. Essential vs Optional

### CORE (must implement)
- Homepage code submission UI.
- `roastMode` input.
- Stable `language` capture and persistence.
- Drizzle schema for `roasts` and `analysis_items`.
- tRPC infrastructure and `/api/trpc` route.
- `src/lib/ai.ts` with `gpt-4o-mini`, prompt factory, and output schema.
- `roast.create` mutation.
- `roast.getById` query.
- Dynamic `/roast/[id]` page.
- Redirect from create success to result page.
- Result-page rendering of score, verdict, quote, submitted code, analysis items, and suggested fix diff.

### OPTIONAL (enhancements)
- Shiki-powered interactive editor overlay.
- Automatic language detection with `highlight.js`.
- Character counter and client-side submit guard.
- Homepage stats.
- Leaderboard preview and full leaderboard page.
- Cache components and revalidation profile.
- OG image generation.
- Dynamic metadata and Twitter cards.
- Seed data.

## 10. Definition of Done
- A user can submit code from the homepage and the backend accepts `{ code, language, roastMode }`.
- The backend validates input, calls `gpt-4o-mini`, and receives structured output matching the proven schema.
- A roast row and its ordered analysis items are persisted successfully.
- The mutation returns a roast id.
- The client redirects to `/roast/[id]`.
- `/roast/[id]` can be opened directly and renders persisted data from the database.
- The page shows:
  - score
  - verdict
  - roast quote
  - submitted code
  - detailed analysis items
  - suggested fix diff
- Invalid ids and missing records are handled predictably.
- End-to-end tests and manual happy-path/error-path checks pass.
- Optional leaderboard/OG features are not required for completion.
