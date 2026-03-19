# App DB Integration Audit

## Status
- Spec criada antes da implementação.
- Implementação concluída neste branch.

## Contexto
- O fluxo principal já persiste `roasts` e, neste branch, home stats, shame leaderboard, página completa da leaderboard e roast result já usam queries reais.
- A auditoria do app mostrou que as superfícies principais restantes com integração parcial estão concentradas na tela de resultado do roast.
- A página `/components` continua estática, mas é showcase interno e não entra no escopo do produto real.

## Objetivo
- Eliminar as integrações parciais restantes nas superfícies reais do produto.
- Deixar o roast result coerente com os dados persistidos também nos detalhes visuais e metadata.

## Não objetivos
- Persistir ou dinamizar páginas de showcase/demo.
- Trocar a arquitetura atual baseada em `roasts` + tRPC.
- Inventar novas fontes de verdade fora do domínio já persistido.

## Abordagem proposta
- Registrar o inventário auditado e tratar apenas os gaps reais do produto:
  - `ScoreRing` ainda usa um gradiente fixo em vez de refletir o score persistido.
  - `generateMetadata` em `/roast/[id]` ainda usa texto genérico e não lê o roast persistido.
- Cobrir o comportamento dinâmico do score ring com teste.
- Integrar a metadata da página de roast ao dado persistido sem alterar o fluxo principal.
