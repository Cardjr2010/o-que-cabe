# RELATORIO_CSV_PRODUCT_IMPORTER

## O que foi criado

Foi adicionada uma importação simples por CSV para popular o catálogo seed do OQC.

Arquivos principais:

- `src/importers/CsvProductImporter.js`
- `scripts/import-products-csv.js`
- `data/products.sample.csv`

## Formato do CSV

Colunas aceitas:

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

## Campos obrigatórios

- `title`
- `category`
- `price`
- `productUrl` ou `affiliateUrl`
- `marketplace`

## Como importar

Use:

`node scripts/import-products-csv.js data/products.sample.csv`

O script:

- lê o CSV
- valida os itens
- rejeita os inválidos
- faz merge com a seed atual
- atualiza `data/products.seed.json`
- mostra um resumo no terminal

## Prioridade de link

Ordem usada:

1. `affiliateUrl`
2. `productUrl`

## Como evitar duplicados

O merge evita duplicação por:

- `id`
- `externalId`
- `productUrl`
- `affiliateUrl`

Se já existir, o produto é atualizado e o `lastCheckedAt` é renovado.

## Como o OQC usa isso

Os produtos importados entram na seed local e depois seguem o fluxo normal:

- `BudgetEngine`
- `ScoreEngine`
- `ValueEngine` quando disponível
- `RankingEngine`

## Observação

O CSV é uma forma simples de manter a base real do MVP organizada sem depender de busca ao vivo.
