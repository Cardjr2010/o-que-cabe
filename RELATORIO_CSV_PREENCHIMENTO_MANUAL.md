# RELATORIO_CSV_PREENCHIMENTO_MANUAL

## O que foi criado

Foi criado um CSV-base para preenchimento manual do catálogo do OQC:

- `data/products.to-fill.csv`

## Estrutura

Colunas:

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
- `marketplace`
- `sourceType`
- `condition`
- `lastCheckedAt`

## Como preencher `price`

Preencha com o valor aproximado e realista do produto.

Se ainda não tiver certeza do preço, deixe em branco e complete depois antes de importar.

## Como preencher `productUrl`

Preencha com o link específico do anúncio ou da busca específica do produto.

Evite link genérico da loja.

## Como colocar `affiliateUrl` depois

Se você tiver um link de afiliado, cole no campo `affiliateUrl`.

Prioridade de uso:

1. `affiliateUrl`
2. `productUrl`

## Como importar

Use:

`node scripts/import-products-csv.js data/products.to-fill.csv`

## Observações

- `sourceType` foi deixado como `manual`
- `currency` foi mantido como `BRL`
- `condition` foi mantido como `new`
- `lastCheckedAt` usa a data atual para servir como referência inicial

## Como atualizar a seed

Depois da importação, o script atualiza `data/products.seed.json` com os produtos válidos e evita duplicados por:

- `id`
- `externalId`
- `productUrl`
- `affiliateUrl`

