# Especificação de Drizzle ORM + Postgres

## Status

- Pesquisa e especificação apenas.
- Nenhuma implementação foi feita nesta tarefa.

## Contexto

Esta especificação foi derivada de três fontes do projeto atual:

- a UI já implementada em `src/app` e `src/components`
- o layout do Pencil em `/Users/rapzadev/Downloads/devroast.pen`
- o fato de que o `README.md` atual ainda está no template padrão do Next.js e não documenta o domínio do produto

Hoje o produto expõe três superfícies claras:

1. Home com editor e envio de código para roast.
2. Tela de resultado com score, veredito, cards de análise e diff sugerido.
3. Leaderboard com os piores códigos ranqueados por score.

Pelas telas e pelo código, o domínio persistível atual é pequeno e bem definido:

- uma submissão de código
- um resultado de análise para essa submissão
- uma lista ordenada de itens de feedback
- um diff sugerido com linhas ordenadas
- consultas derivadas para leaderboard e estatísticas agregadas

## Objetivo

Definir a base de dados inicial para implantar Drizzle ORM neste projeto com Postgres rodando em Docker Compose, cobrindo:

- tabelas
- enums
- relações
- índices
- organização dos arquivos
- fluxo de migrations
- to-dos de implantação

## Não objetivos

Ficam fora do primeiro corte:

- autenticação e tabela de usuários
- billing
- moderação
- múltiplos arquivos por submissão
- versionamento completo de várias reanálises por submissão
- filas dedicadas com Redis, BullMQ ou equivalente
- persistência de preferências de UI não exibidas hoje

## Leitura do domínio atual

### 1. A entidade raiz é a submissão

A home mostra um editor com código, uma indicação de linguagem esperada e um toggle de modo de roast. Isso indica que a escrita inicial no banco deve nascer de uma submissão contendo:

- código fonte
- linguagem
- contagem de linhas
- modo de análise
- status de processamento

### 2. Resultado de roast é um filho da submissão

A tela de resultado mostra dados que não existem antes do processamento:

- score
- veredito
- headline do roast
- cards de feedback
- diff sugerido

Isso deve ser persistido separado da submissão para evitar colunas nulas e para manter clara a diferença entre input e output.

### 3. Leaderboard é projeção, não tabela própria

O leaderboard atual é só uma ordenação dos resultados concluídos pelo pior score, usando também:

- trecho do código submetido
- linguagem
- quantidade de linhas

Não vale criar `leaderboard_entries` no primeiro corte. Isso deve ser uma query ou, no máximo, uma view depois.

### 4. Linguagem não deve virar enum do Postgres agora

Mesmo que hoje as telas mostrem principalmente `javascript`, `typescript` e `sql`, a própria direção do produto aponta para ampliação do suporte. Linguagem tende a mudar mais rápido que o esquema. Portanto:

- `language` deve ser `text`
- a origem da linguagem pode virar enum

## Decisões principais

- Usar Postgres local via Docker Compose.
- Expor a porta local `54329` para evitar conflito com instalações locais em `5432`.
- Usar `drizzle-orm`, `drizzle-kit` e o driver `postgres`.
- Guardar score como inteiro em décimos, por exemplo `35` para `3.5/10`, evitando float e drift em agregações.
- Ter um identificador público estável para URLs de resultado e compartilhamento.
- Manter relação 1:1 entre submissão e análise no MVP.
- Não criar tabela de leaderboard no MVP.

## Esquema recomendado

### Enums

### `submission_status`

Valores:

- `pending`
- `processing`
- `completed`
- `failed`

Uso:

- lifecycle da submissão
- filas futuras
- retries e tratamento de erro

### `analysis_mode`

Valores:

- `honest`
- `roast`

Uso:

- representa o estado do toggle da home
- deixa o domínio legível sem depender de boolean genérico

### `language_source`

Valores:

- `manual`
- `detected`
- `unknown`

Uso:

- separa a linguagem escolhida pelo usuário da linguagem inferida automaticamente

### `feedback_tone`

Valores:

- `critical`
- `warning`
- `good`

Uso:

- badge de veredito
- cards de análise

Observação:

O texto do veredito, por exemplo `needs_serious_help`, deve continuar em coluna textual. A copy do produto tende a iterar mais rápido do que o esquema.

### `diff_line_kind`

Valores:

- `context`
- `removed`
- `added`

Uso:

- renderização do bloco de diff
- semântica visual das linhas

### Tabelas

### `submissions`

Tabela raiz. Representa o input recebido pela aplicação.

Colunas recomendadas:

- `id uuid primary key default gen_random_uuid()`
- `public_id text not null unique`
- `source_code text not null`
- `language text not null`
- `language_source language_source not null default 'unknown'`
- `line_count integer not null`
- `analysis_mode analysis_mode not null`
- `status submission_status not null default 'pending'`
- `error_message text null`
- `processed_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Restrições recomendadas:

- `char_length(btrim(source_code)) > 0`
- `line_count > 0`

Índices recomendados:

- `unique(public_id)`
- `index(status, created_at desc)`
- `index(created_at desc)`
- `index(language)`

Notas:

- `public_id` será usado para rotas públicas e compartilhamento.
- Pode ser gerado inicialmente com `crypto.randomUUID()` no servidor para evitar dependência extra.
- Não incluir `user_id` neste primeiro corte.
- `line_count` deve ser calculado no servidor no momento da gravação, não enviado como fonte da verdade pelo cliente.
- `updated_at` deve ser atualizado pela aplicação a cada transição de status ou ajuste da submissão.

### `submission_analyses`

Output principal da análise de uma submissão.

Colunas recomendadas:

- `id uuid primary key default gen_random_uuid()`
- `submission_id uuid not null unique references submissions(id) on delete cascade`
- `analysis_version text not null`
- `score_tenths smallint not null`
- `verdict_label text not null`
- `verdict_tone feedback_tone not null`
- `headline text not null`
- `created_at timestamptz not null default now()`

Restrições recomendadas:

- `score_tenths >= 0 and score_tenths <= 100`

Índices recomendados:

- `unique(submission_id)`
- `index(score_tenths, created_at desc)`
- `index(verdict_tone)`

Notas:

- `analysis_version` deve identificar a versão do pipeline de análise, prompt ou regra usada.
- `headline` corresponde à frase principal do roast exibida na tela de resultado.
- Se no futuro houver reanálise por submissão, o `unique(submission_id)` pode ser removido e substituído por estratégia com `is_current` ou `version`.

### `submission_analysis_items`

Lista ordenada dos cards de feedback da análise.

Colunas recomendadas:

- `id uuid primary key default gen_random_uuid()`
- `analysis_id uuid not null references submission_analyses(id) on delete cascade`
- `position integer not null`
- `tone feedback_tone not null`
- `title text not null`
- `description text not null`
- `created_at timestamptz not null default now()`

Restrições recomendadas:

- `position >= 0`

Índices recomendados:

- `unique(analysis_id, position)`
- `index(analysis_id, tone)`

Notas:

- `position` define a ordem de exibição.
- Os valores observados hoje no layout são compatíveis com `critical`, `warning` e `good`.

### `submission_diff_blocks`

Container para um ou mais blocos de diff por análise.

Colunas recomendadas:

- `id uuid primary key default gen_random_uuid()`
- `analysis_id uuid not null references submission_analyses(id) on delete cascade`
- `position integer not null`
- `source_label text not null`
- `target_label text not null`
- `created_at timestamptz not null default now()`

Restrições recomendadas:

- `position >= 0`

Índices recomendados:

- `unique(analysis_id, position)`

Notas:

- Mesmo que hoje a UI mostre um único diff, vale separar o bloco da linha para não travar uma futura expansão para mais de um arquivo.

### `submission_diff_lines`

Linhas ordenadas de cada bloco de diff.

Colunas recomendadas:

- `id uuid primary key default gen_random_uuid()`
- `diff_block_id uuid not null references submission_diff_blocks(id) on delete cascade`
- `position integer not null`
- `kind diff_line_kind not null`
- `content text not null`

Restrições recomendadas:

- `position >= 0`
- `char_length(content) > 0`

Índices recomendados:

- `unique(diff_block_id, position)`
- `index(diff_block_id, kind)`

## Relações

Relações do MVP:

- `submissions` 1:1 `submission_analyses`
- `submission_analyses` 1:N `submission_analysis_items`
- `submission_analyses` 1:N `submission_diff_blocks`
- `submission_diff_blocks` 1:N `submission_diff_lines`

## O que não precisa de tabela agora

### Leaderboard

Não criar `leaderboard_entries`.

Consulta recomendada:

- filtrar apenas `submissions.status = 'completed'`
- fazer join com `submission_analyses`
- ordenar por `score_tenths asc, submissions.created_at desc`
- limitar conforme página

### Stats da home

Os textos:

- `codes roasted`
- `avg score`

devem vir de agregações sobre submissões concluídas, não de tabela própria neste primeiro corte.

### Usuários

Não criar tabela de usuário antes de existir autenticação ou ownership explícita no produto.

## Estrutura de arquivos recomendada

```text
docker-compose.yml
.env.example
drizzle.config.ts
drizzle/
scripts/seed.ts
src/db/client.ts
src/db/schema/enums.ts
src/db/schema/submissions.ts
src/db/schema/submission-analyses.ts
src/db/schema/submission-analysis-items.ts
src/db/schema/submission-diff-blocks.ts
src/db/schema/submission-diff-lines.ts
src/db/schema/relations.ts
src/db/queries/leaderboard.ts
src/db/queries/submissions.ts
```

## Infra local com Docker Compose

Arquivo recomendado: `docker-compose.yml`

Decisões:

- imagem `postgres:16-alpine`
- volume nomeado para persistência local
- healthcheck com `pg_isready`
- porta local `54329`

Configuração esperada:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: devroast
      POSTGRES_USER: devroast
      POSTGRES_PASSWORD: devroast
    ports:
      - "54329:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devroast -d devroast"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres_data:
```

## Variáveis de ambiente

Arquivo `.env.example`:

```bash
DATABASE_URL=postgresql://devroast:devroast@localhost:54329/devroast
```

## Dependências recomendadas

Adicionar:

- `drizzle-orm`
- `postgres`

Adicionar em desenvolvimento:

- `drizzle-kit`
- `tsx`
- `dotenv`

## Scripts recomendados no `package.json`

```json
{
  "db:up": "docker compose up -d postgres",
  "db:down": "docker compose down",
  "db:logs": "docker compose logs -f postgres",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio",
  "db:seed": "tsx scripts/seed.ts"
}
```

Observação:

- Preferir `generate` + `migrate`.
- Evitar `drizzle-kit push` como fluxo padrão do time.

## Seed inicial recomendado

O seed deve reproduzir os mocks já visíveis no produto para acelerar desenvolvimento visual e integração.

Submissões mínimas:

- 3 entradas do leaderboard atual
- 1 submissão completa com resultado detalhado, cards de análise e diff

Isso permite:

- montar a home com estatísticas reais
- montar a página de leaderboard sem mocks locais
- montar a página de resultado sem dados hardcoded

## Regras de validação no backend

- rejeitar submissões com código vazio após `trim`
- limitar tamanho máximo do código, por exemplo 20k caracteres, para evitar abuso no MVP
- normalizar `language` para slug minúsculo
- recalcular `line_count` no servidor
- só considerar leaderboard para submissões `completed`
- persistir itens de análise e diff sempre com ordenação determinística

## Estratégia de queries

### Criar submissão

Fluxo recomendado:

1. Inserir em `submissions` com `status = 'pending'`.
2. Mover para `processing` ao iniciar o pipeline.
3. Em uma transação, criar `submission_analyses`.
4. Na mesma transação, inserir `submission_analysis_items`.
5. Na mesma transação, inserir `submission_diff_blocks` e `submission_diff_lines`.
6. Ainda na transação, atualizar `submissions.status = 'completed'` e `processed_at`.

### Falha de processamento

Em caso de erro:

- manter a linha em `submissions`
- gravar `status = 'failed'`
- gravar `error_message`
- não criar análise parcial inconsistente

### Buscar resultado por id público

Consulta deve carregar:

- submissão
- análise
- itens ordenados por `position`
- blocos de diff ordenados por `position`
- linhas do diff ordenadas por `position`

### Buscar leaderboard

Campos mínimos retornados:

- `public_id`
- `score_tenths`
- `language`
- `line_count`
- `source_code`
- `created_at`

O preview do código pode ser truncado na aplicação, não no banco.

## Mapeamento do layout atual para o esquema

### Home

Mapeia para:

- `submissions.source_code`
- `submissions.language`
- `submissions.analysis_mode`

### Resultado

Mapeia para:

- score ring: `submission_analyses.score_tenths`
- badge de veredito: `submission_analyses.verdict_label` + `submission_analyses.verdict_tone`
- frase principal: `submission_analyses.headline`
- meta de linguagem: `submissions.language`
- meta de linhas: `submissions.line_count`
- cards: `submission_analysis_items`
- diff: `submission_diff_blocks` + `submission_diff_lines`

### Leaderboard

Mapeia para:

- ranking derivado de `submission_analyses.score_tenths`
- snippet de código de `submissions.source_code`
- linguagem de `submissions.language`
- linhas de `submissions.line_count`

## To-dos de implantação

### Infra

- criar `docker-compose.yml`
- criar `.env.example`
- subir Postgres local e validar healthcheck

### Drizzle

- instalar dependências
- criar `drizzle.config.ts`
- criar cliente em `src/db/client.ts`
- modelar enums em `src/db/schema/enums.ts`
- modelar tabelas e relações

### Migration inicial

- habilitar `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
- gerar migration inicial com enums
- criar tabelas em ordem de dependência
- criar índices e constraints
- aplicar migration com banco vazio

### Seed

- portar os mocks atuais da UI para o script de seed
- incluir 3 entradas de leaderboard
- incluir 1 resultado completo com cards e diff

### Integração com app

- remover mocks hardcoded da home e leaderboard
- criar query server-side para estatísticas
- criar query server-side para leaderboard
- criar endpoint, server action ou route handler para criar submissão
- criar endpoint, server action ou route handler para buscar resultado por `public_id`

### Qualidade

- testar migration do zero
- testar seed em banco vazio
- testar cascade delete entre tabelas filhas
- testar ordenação estável de cards e diff
- testar serialização do score de `score_tenths` para `x.y/10`

## Riscos e pontos de atenção

### Privacidade do leaderboard

Hoje o produto sugere exposição pública do código submetido. Antes de colocar em produção, o time precisa decidir se:

- toda submissão entra no ranking automaticamente
- haverá opt-in
- haverá moderação ou bloqueio de snippets sensíveis

Se esse ponto virar requisito antes da implementação, adicionar coluna explícita em `submissions`, por exemplo:

- `is_public boolean`
- ou `leaderboard_opt_in boolean`

### Reanálise futura

O modelo 1:1 entre submissão e análise é o melhor corte para agora. Se depois houver:

- troca frequente de prompt
- reprocessamento em lote
- comparação de versões

então a primeira mudança deve ser remover o `unique(submission_id)` de `submission_analyses` e introduzir versão atual.

### Runtime do Next.js

Qualquer acesso ao banco deve rodar em ambiente Node.js, não Edge.

## Decisão final recomendada

Implementar o primeiro banco com 5 tabelas:

- `submissions`
- `submission_analyses`
- `submission_analysis_items`
- `submission_diff_blocks`
- `submission_diff_lines`

Implementar 5 enums:

- `submission_status`
- `analysis_mode`
- `language_source`
- `feedback_tone`
- `diff_line_kind`

Não implementar neste primeiro corte:

- tabela de leaderboard
- tabela de usuários
- tabela de configurações
- tabela de reanálises

Esse recorte cobre integralmente o que a UI atual e o layout do Pencil já pedem, sem criar complexidade prematura.
