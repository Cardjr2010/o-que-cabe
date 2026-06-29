# Relatório Hotfix Vercel 500

## Problema observado
Produção retornando `500 FUNCTION_INVOCATION_FAILED` em:

- `/`
- `/api/search?q=xiaomi&mode=total&totalBudget=1500`
- `/api/search?q=iphone&mode=total&totalBudget=3000`
- `/api/search?q=tv&mode=total&totalBudget=500`

## Causa raiz identificada
O runtime da Vercel estava resolvendo `process.cwd()` em um diretório diferente do diretório esperado do projeto.

Isso fazia a home procurar:

`api/public/index.html`

em vez de:

`public/index.html`

No teste local simulando o cwd da função, a falha foi reproduzida com erro `ENOENT` ao abrir o arquivo da home.

## Correção aplicada

1. Criei uma raiz de projeto estável baseada em `import.meta.url`.
2. Troquei os caminhos críticos da função para usar essa raiz estável.
3. Protegi a leitura da home com fallback seguro quando o arquivo principal não estiver disponível.
4. Adicionei:
   - `GET /api/health`
   - `GET /api/catalog/health`
5. Envolvi o handler principal em `try/catch` global para impedir que erros de bootstrap virem `FUNCTION_INVOCATION_FAILED`.

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

## Observação
O hotfix é focado em impedir que a função quebre por caminho de arquivo incorreto e em manter respostas controladas para produção.

