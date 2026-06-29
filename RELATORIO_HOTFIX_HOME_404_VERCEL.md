# Relatorio Hotfix Home 404 Vercel

## Problema
A home da producao seguia retornando 404 enquanto a API e o catalogo permaneciam funcionando. Depois de varias tentativas, a configuracao mostrou que mexer no roteamento da home podia afetar a API.

## Correcao aplicada
- Mantive `/api/(.*)` indo para `api/web.js` usando `routes`.
- Adicionei uma rewrite separada apenas para `/`, apontando para `api/web.js`.
- Mantive `includeFiles` como string, no formato aceito pela Vercel.
- Mantive os assets do frontend dentro do bundle `api/static/`, que o handler continua lendo diretamente.

## O que nao foi alterado
- CatalogManager
- FeedProvider
- BudgetEngine
- ScoreEngine
- RankingEngine
- API de busca
- Catálogo real

## Como evitar regressao
- Manter a API separada das regras da home.
- Validar `/` e `/api/*` apos qualquer alteracao em `vercel.json`.
- Nao tentar corrigir o 404 da home alterando o catalogo ou o motor.
