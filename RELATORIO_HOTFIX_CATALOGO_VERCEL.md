# Relatório Hotfix Catálogo Vercel

## Objetivo
Fazer o catálogo real do OQC entrar corretamente no deploy da Vercel sem quebrar a função de produção.

## O que foi verificado
- `data/products.seed.json` existe localmente e está commitado.
- A produção respondia 200, mas `seedFileExists` ainda vinha `false` e `catalogCount` vinha `0`.
- O arquivo físico do seed estava fora do caminho mais confiável para o bundle serverless.

## Correção aplicada
1. Criei uma cópia empacotável do seed em `src/data/products.seed.js`.
2. Adicionei `src/runtime/catalog-path.js` para resolver o seed com prioridade para a fonte empacotável.
3. Atualizei `CatalogManager`, `ProductImporter`, `FeedProvider`, `MercadoLivreProvider`, `ActionpayFeedProvider`, `ActionpayYmlImporter`, `CsvProductImporter`, `server.mjs` e `api/web.js` para usar o resolvedor estável.
4. A saúde do catálogo agora expõe:
   - `seedFileExists`
   - `seedFileSize`
   - `catalogCount`
   - `resolvedSeedPath`
   - `sourceUsed`

## Validação local
- `node --test` passou
- `node --check api/web.js` passou
- `node --check server.mjs` passou
- `node --check public/app.js` passou
- `JSON.parse` em `data/products.seed.json` passou
- O catálogo local continua com `829` produtos

## Validação esperada em produção
- `/api/catalog/health` deve responder com `catalogCount > 0`
- `/api/search?q=xiaomi&mode=total&totalBudget=1500` deve responder com `dataMode=real`

## Observação
O fallback demo continua preservado. Se o módulo `src/data/products.seed.js` falhar em algum cenário de empacotamento, o resolvedor ainda tenta os caminhos locais restantes antes de cair no fallback seguro.
