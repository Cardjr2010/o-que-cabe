# Relatório Hotfix Vercel 500

## Problema observado
Produção retornando `500 FUNCTION_INVOCATION_FAILED` em:

- `/`
- `/api/search?q=xiaomi&mode=total&totalBudget=1500`
- `/api/search?q=iphone&mode=total&totalBudget=3000`
- `/api/search?q=tv&mode=total&totalBudget=500`

## Causa raiz identificada
O log real da Vercel mostrou:

`Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/src/engines/ValueEngine.js' imported from /var/task/src/engines/RankingEngine.js`

Ou seja, o deploy estava falhando porque `src/engines/ValueEngine.js` existia na máquina local, mas não tinha sido incluído no commit/push anterior para a branch de produção.

Além disso, a função também dependia de caminhos resolvidos por `process.cwd()`, o que podia quebrar a home em runtimes serverless com cwd diferente. Isso foi endurecido no mesmo hotfix para evitar um segundo ponto de falha.

## Correção aplicada

1. Entreguei `src/engines/ValueEngine.js` na base do projeto para satisfazer o import exigido por `RankingEngine.js`.
2. Criei uma raiz de projeto estável baseada em `import.meta.url`.
3. Troquei os caminhos críticos da função para usar essa raiz estável.
4. Protegi a leitura da home com fallback seguro quando o arquivo principal não estiver disponível.
5. Adicionei:
   - `GET /api/health`
   - `GET /api/catalog/health`
6. Envolvi o handler principal em `try/catch` global para impedir que erros de bootstrap virem `FUNCTION_INVOCATION_FAILED`.

## Arquivos alterados

- `api/web.js`
- `server.mjs`
- `src/runtime/project-root.js`
- `src/catalog/CatalogManager.js`
- `src/importers/ProductImporter.js`
- `src/feed/FeedProvider.js`
- `src/providers/MercadoLivreProvider.js`
- `src/providers/AwinFeedProvider.js`
- `src/providers/ActionpayFeedProvider.js`
- `src/providers/ActionpayProvider.js`
- `src/connectors/MercadoLivreConnector.js`
- `src/adapters/products.mercadolivre.js`
- `src/adapters/GoogleMerchantProductsAdapter.js`
- `src/importers/CsvProductImporter.js`
- `src/importers/ActionpayYmlImporter.js`

## Validação local

- `node --check api/web.js` ok
- `node --check server.mjs` ok
- `node --check public/app.js` ok
- `node --test` ok
- `GET /` em modo simulado com cwd diferente respondeu 200
- `GET /api/health` respondeu 200
- `GET /api/catalog/health` respondeu 200
- `GET /api/search?q=xiaomi&mode=total&totalBudget=1500` respondeu 200
- `GET /api/search?q=iphone&mode=total&totalBudget=3000` respondeu 200
- `GET /api/search?q=tv&mode=total&totalBudget=500` respondeu 200

## Validação em produção

- `/` respondeu 200
- `/api/health` respondeu 200
- `/api/catalog/health` respondeu 200
- `/api/search?q=xiaomi&mode=total&totalBudget=1500` respondeu 200
- `X-Vercel-Error` veio vazio nas respostas validadas

## Observação de produção

O health report da produção indica `seedFileExists: false` e `catalogCount: 0` neste deploy. O hotfix resolveu a queda de runtime e manteve a aplicação viva com fallback seguro, mas o catálogo seed real ainda não está presente no bundle publicado deste deploy.

## Observação
O hotfix é focado em impedir que a função quebre por caminho de arquivo incorreto e em manter respostas controladas para produção.
