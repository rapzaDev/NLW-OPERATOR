# Editor Auto-Detect And Submit Loading

## Status
- Spec criada antes da implementação.
- Implementação concluída neste branch.

## Contexto
- O fluxo principal de roast depende do editor para inferir a linguagem correta antes do submit.
- A interface já possui modo `auto detect`, mas esse comportamento precisa ficar confiável e explicitamente integrado ao payload enviado.
- O detector atual baseado em `highlight.js` pode escolher linguagens obscuras fora do domínio principal do produto, o que faz snippets Python caírem em resultados não suportados e o editor permanecer em `Auto detect`.
- O botão de submit hoje troca o texto inteiro por um loading simples, o que reduz a qualidade percebida da interação.
- A solução precisa preservar a arquitetura atual, a seleção manual de linguagem e o visual existente da home.

## Objetivo
- Detectar automaticamente a linguagem do código quando o editor estiver em modo `auto`.
- Garantir que o submit use a linguagem resolvida corretamente, mantendo prioridade para a seleção manual.
- Melhorar o estado de loading do submit com três pontinhos animados, discretos e coerentes com a UI atual.

## Não objetivos
- Reestruturar o fluxo de roast, tRPC, persistência ou páginas de resultado.
- Introduzir novas dependências para animação sem necessidade.
- Alterar a lista de linguagens suportadas fora do necessário para a detecção já existente.

## Abordagem proposta
- Cobrir com testes a resolução de linguagem entre `auto detect`, fallback e seleção manual.
- Extrair ou consolidar a lógica de resolução de linguagem em utilitários compartilhados para evitar divergência entre editor e submit.
- Restringir o autodetect a um subconjunto curado de linguagens relevantes para o fluxo principal e normalizar aliases/dialetos detectados pelo `highlight.js`.
- Manter o loading no botão com o texto base e adicionar uma animação leve de três pontos usando padrões já existentes do projeto.
- Integrar as mudanças na home sem alterar o fluxo de navegação, mutation ou tratamento de erro já implementados.
