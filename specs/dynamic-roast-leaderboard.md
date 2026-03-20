# Dynamic Roast Leaderboard

## Status
- Spec criada antes da implementação.
- Implementação concluída neste branch.

## Contexto
- A leaderboard da home e a página completa ainda usam dados estáticos.
- O domínio persistido atual de verdade já é `roasts`, com score, linguagem, código e data de criação.
- O fluxo principal de roast já persiste novos registros, mas essas submissões não aparecem nas listagens.

## Objetivo
- Conectar a leaderboard aos `roasts` persistidos.
- Fazer a home e `/leaderboard` refletirem dados reais.
- Preservar a semântica de shame ranking com ordenação coerente.

## Não objetivos
- Criar uma tabela separada para leaderboard.
- Alterar o fluxo de criação do roast.
- Redesenhar a UI da leaderboard fora do necessário para estados reais.

## Abordagem proposta
- Trocar a query de leaderboard para ler `roasts` como fonte de verdade.
- Ordenar por pior score primeiro e desempatar por roast mais recente.
- Expor listagem via router tRPC e reutilizar stats reais na home e na página de leaderboard.
- Preservar o visual atual com estados vazios consistentes quando não houver dados.
