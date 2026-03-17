# Especificação de tRPC + Next.js App Router

## Status

- Pesquisa e especificação apenas.
- Nenhuma implementação foi feita nesta tarefa.

## Contexto

- O projeto usa Next.js 16 + React 19 + TypeScript com App Router.
- Hoje não existe uma camada formal de API: o acesso a dados vive em `src/db/queries` e as telas ainda misturam componentes estáticos com leitura direta do banco no servidor.
- Queremos adotar tRPC como camada typed de API/back-end sem perder o fluxo natural de Server Components do Next.
- A integração deve seguir a documentação oficial do tRPC 11 para:
  - setup com Next.js App Router: `https://trpc.io/docs/client/nextjs/app-router-setup`
  - setup com Server Components: `https://trpc.io/docs/client/tanstack-react-query/server-components`
  - setup da integração com TanStack React Query: `https://trpc.io/docs/client/tanstack-react-query/setup`
- No estado atual do app, os dados que entram naturalmente nesse primeiro corte são:
  - submissão de código
  - detalhes de roast por `publicId`
  - leaderboard
  - stats da home

## Objetivo

- Introduzir uma camada tRPC tipada para leitura e escrita do domínio atual.
- Integrar tRPC com Server Components, SSR/prefetch e Client Components de forma compatível com o App Router.
- Manter `src/db/queries` como camada interna de acesso a dados, evitando SQL dentro dos routers.

## Não objetivos

- autenticação e `protectedProcedure`
- filas, workers ou streaming para processamento assíncrono de roast
- integração com LLM
- migrar toda a UI para React Query sem necessidade real
- remover Drizzle ou reestruturar o schema do banco

## Abordagem proposta

### Arquitetura base

- Criar a estrutura:
  - `src/trpc/init.ts`
  - `src/trpc/query-client.ts`
  - `src/trpc/client.tsx`
  - `src/trpc/server.tsx`
  - `src/trpc/routers/_app.ts`
  - `src/trpc/routers/submission.ts`
  - `src/trpc/routers/leaderboard.ts`
  - `src/app/api/trpc/[trpc]/route.ts`
- `createTRPCContext({ headers })` deve ser reutilizável no route handler e no caller de RSC, como recomendado pela doc oficial.
- O contexto inicial deve expor pelo menos:
  - `db`
  - `headers`
- Inicialmente usar apenas `publicProcedure`.

### Dependências

- Adicionar:
  - `@trpc/server`
  - `@trpc/client`
  - `@trpc/tanstack-react-query`
  - `@tanstack/react-query`
  - `zod`
  - `client-only`
  - `server-only`
  - `superjson`

### Transformação de dados

- Usar `superjson` como transformer do tRPC.
- Motivo: as queries atuais retornam `Date` do Drizzle; sem transformer, o runtime tende a serializar esses valores enquanto a tipagem continua inferindo objetos ricos demais para o cliente.
- Aplicar o mesmo transformer no init do tRPC, no `httpBatchLink` e na configuração de `dehydrate/hydrate` do `QueryClient`.

### Handler HTTP

- Criar `src/app/api/trpc/[trpc]/route.ts` com `fetchRequestHandler`.
- Exportar `GET` e `POST`.
- O endpoint deve ser `/api/trpc`, seguindo o guia oficial do App Router.

### Query Client e provider

- Em `src/trpc/query-client.ts`, criar `makeQueryClient()`.
- Configurar `staleTime` curto para SSR/RSC e `shouldDehydrateQuery` incluindo queries pendentes, conforme o padrão da documentação.
- Em `src/trpc/client.tsx`, criar `TRPCReactProvider` com:
  - `QueryClientProvider`
  - `TRPCProvider`
  - `httpBatchLink`
  - helper `getUrl()` compatível com browser, localhost e deploy
- Montar `TRPCReactProvider` em `src/app/layout.tsx`.

### Server Components e SSR

- Em `src/trpc/server.tsx`, criar:
  - `getQueryClient = cache(makeQueryClient)`
  - `trpc = createTRPCOptionsProxy(...)`
  - `caller = appRouter.createCaller(async () => createTRPCContext({ headers: await headers() }))`
  - helpers `HydrateClient` e `prefetch`
- Regra de uso no projeto:
  - se o dado é usado só no Server Component, usar `caller`
  - se o dado precisa ser reutilizado por um Client Component logo após o SSR, usar `prefetch` + `HydrateClient`
  - não buscar um dado no server via `caller` e esperar que ele exista no cache do client

### Routers iniciais

- `submissionRouter`
  - `create`
    - input validado com `zod`
    - reaproveita `createSubmission`
    - retorna `publicId`, `status` e metadados mínimos para redirect
  - `byPublicId`
    - recebe `publicId` como `uuid`
    - reaproveita `getSubmissionDetailsByPublicId`
    - converte a resposta para um DTO de UI em vez de expor linhas cruas do banco
- `leaderboardRouter`
  - `list`
    - recebe `limit` opcional
    - reaproveita `getLeaderboardEntries`
  - `homepageStats`
    - reaproveita `getHomepageStats`

### Migração da UI atual

- `src/components/home/code-input-panel.tsx`
  - migrar o CTA para `useMutation(trpc.submission.create.mutationOptions())`
  - fazer redirect com o `publicId` retornado
- `src/components/home/leaderboard-preview.tsx`
  - parar de usar dados hardcoded
  - como é render server-first e sem interação, preferir `caller.leaderboard.list()` e `caller.leaderboard.homepageStats()`
- `src/components/leaderboard/leaderboard-page.tsx`
  - trocar dados estáticos por `caller.leaderboard.list()`
- `src/components/roast-results/roast-results-page.tsx`
  - trocar mock fixo por `caller.submission.byPublicId()`

### Regras da camada

- Routers não devem conter SQL nem regras de persistência detalhadas.
- `src/db/queries` continua sendo a camada de acesso a dados.
- Routers ficam responsáveis por:
  - validação de input
  - composição de casos de uso
  - tradução de erro para `TRPCError`
  - mapeamento para DTOs estáveis para a UI
- A UI não deve importar `src/db/queries` diretamente depois da migração.

### Sequência recomendada

1. Instalar dependências e criar a infraestrutura base do tRPC.
2. Subir `leaderboardRouter` e `submissionRouter` reaproveitando as queries já existentes.
3. Montar provider no `layout` e expor `caller`/`prefetch`.
4. Migrar primeiro as leituras server-side.
5. Migrar por último a mutação da home.

## Decisões e trade-offs

- Vamos usar tRPC, mas sem transformar toda leitura de Server Component em React Query por padrão.
- Para este projeto, `caller` em RSC é a escolha principal para telas puramente server-rendered.
- React Query + hydration fica reservado para fronteiras realmente client-side, como o formulário da home e interações futuras.
- Páginas que usarem `headers()` no caller ou no prefetch passam a depender do request atual; isso é aceitável para este caso, mas deve ser tratado como render dinâmico quando necessário.
