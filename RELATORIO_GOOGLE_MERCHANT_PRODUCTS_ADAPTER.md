# RELATORIO_GOOGLE_MERCHANT_PRODUCTS_ADAPTER

## O que foi criado

Foi adicionado o adapter `src/adapters/GoogleMerchantProductsAdapter.js` para ler produtos da conta Google Merchant autorizada e normalizar os itens para o contrato do OQC antes de importar para o `CatalogManager`.

## O que a API faz

A Merchant API não faz busca global do Google Shopping. Ela opera sobre a conta Merchant Center configurada e seus recursos de produtos e data sources.

Os métodos preparados no adapter foram:

- `listProducts()`
- `getProduct(productId)`
- `listDataSources()`
- `fetchDataSource(dataSourceId)`
- `importToCatalog()`

## Variáveis de ambiente

O adapter passa a suportar:

- `GOOGLE_MERCHANT_ACCOUNT_ID`
- `GOOGLE_MERCHANT_ACCESS_TOKEN`

Nenhum token é exposto em logs, resposta pública ou tela.

## Normalização para o OQC

Cada produto válido é convertido para um objeto com campos como:

- `id`
- `externalId`
- `title`
- `category`
- `brand`
- `model`
- `price`
- `currency`
- `image`
- `productUrl`
- `affiliateUrl`
- `marketplace: "google_merchant"`
- `sourceType: "google_merchant_api"`
- `condition`
- `availability`
- `seller`
- `shipping`
- `installments`
- `lastCheckedAt`
- `importedAt`
- `updatedAt`
- `status`
- `dataMode: "real"`

Itens sem título, preço, categoria ou link são rejeitados com motivo claro.

## Importação para o catálogo

O fluxo agora é:

1. Buscar os produtos da conta Merchant Center.
2. Normalizar cada item para o contrato OQC.
3. Importar os válidos com `CatalogManager.import()`.
4. Retornar um resumo com:
   - `configured`
   - `fetched`
   - `imported`
   - `rejected`
   - `updated`
   - `errors`

## Endpoints internos

Foram preparados dois endpoints internos:

- `GET /api/google-merchant/status`
- `POST /api/google-merchant/import`

O endpoint de status só informa se a conta e o token existem. O endpoint de import executa a sincronização com o catálogo.

## Limitações

- Não há busca global do Google Shopping.
- O adapter depende de uma conta Merchant Center autorizada.
- O fluxo usa os produtos já publicados na conta, não o catálogo aberto da web inteira.

## Próximos passos

- Conectar refresh token/OAuth do Merchant Center se o token expirar.
- Agendar importações periódicas do catálogo.
- Reaproveitar o mesmo contrato normalizado para futuros provedores.
