# RELATORIO_CSV_CATALOG_INTEGRATION

## Novo fluxo

O CSV agora entra no OQC por esta sequência:

1. `CsvProductImporter` lê e normaliza os dados
2. `CatalogManager` recebe os produtos válidos
3. `CatalogManager` faz merge, deduplicação, validação e persistência
4. `api/search` continua lendo a base oficial do catálogo

## Por que o catálogo é a fonte oficial

Porque ele centraliza:

- validação
- deduplicação
- importação
- atualização
- exportação
- status dos produtos

## Como importar

Use:

`node scripts/import-products-csv.js data/products.to-fill.csv`

## Como validar

- confira o resumo no terminal
- confira `/api/catalog`
- confira `/catalog`
- confira a busca `/api/search`

## Como atualizar produtos

Atualize o CSV e rode o importador de novo.

Se o produto já existir, o `CatalogManager` evita duplicação e atualiza os campos novos.

## Affiliate links

O campo `affiliateUrl` continua com prioridade sobre `productUrl`.

