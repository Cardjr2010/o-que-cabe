# Relatorio Hotfix Home 404 Vercel

## Problema
A home da producao seguia retornando 404 enquanto a API e o catalogo permaneciam funcionando.

## Correcao aplicada
- Reescrevi o `vercel.json` para mandar `/` e `/api/(.*)` diretamente para `api/web.js`.
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
- Manter `/` roteado para `api/web.js` quando a home depender do handler da aplicacao.
- Validar `/`, `/app.js` e `/styles.css` apos qualquer alteracao em `vercel.json`.
- Nao mexer no catálogo/motor para tentar corrigir 404 de frontend.
