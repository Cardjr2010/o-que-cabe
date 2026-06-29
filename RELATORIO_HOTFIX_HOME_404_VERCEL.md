# Relatorio Hotfix Home 404 Vercel

## Problema
A home da producao seguia retornando 404 enquanto a API e o catalogo permaneciam funcionando.

## Correcao aplicada
- Reescrevi o `vercel.json` com rewrites explicitos para a home e para os assets:
  - `/` -> `/public/index.html`
  - `/app.js` -> `/public/app.js`
  - `/styles.css` -> `/public/styles.css`
  - `/favicon.svg` -> `/public/favicon.svg`
  - `/favicon.png` -> `/public/favicon.png`
  - `/logo-oqc.png` -> `/public/logo-oqc.png`
  - `/logo-oqc.svg` -> `/public/logo-oqc.svg`
- Mantive `/api/(.*)` indo para `api/web.js`.
- Mantive `includeFiles` como string, no formato aceito pela Vercel.

## O que nao foi alterado
- CatalogManager
- FeedProvider
- BudgetEngine
- ScoreEngine
- RankingEngine
- API de busca
- Catálogo real

## Como evitar regressao
- Manter a home e os assets com rewrites explicitos quando a Vercel nao servir os arquivos automaticamente.
- Validar `/`, `/app.js` e `/styles.css` apos qualquer alteracao em `vercel.json`.
- Nao mexer no catálogo/motor para tentar corrigir 404 de frontend.
