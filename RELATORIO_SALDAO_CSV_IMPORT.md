# Relatorio: CSV Saldao da Informatica

Data: 2026-07-01

## O que foi preparado
- O importador CSV do OQC ja aceita os campos principais do catalogo.
- O fluxo normaliza `id`, `sku`, `title`, `description`, `price`, `image`, `productUrl`, `affiliateUrl`, `category`, `brand`, `model`, `availability` e `seller`.
- O catalogo real continua entrando no `CatalogManager` sem depender de marca como categoria.

## O que foi encontrado no workspace
- Existe um template manual em `data/products.to-fill.csv`.
- Nao havia um CSV exportado do Saldao da Informatica pronto para importacao no workspace.

## Como o CSV deve ser importado
1. Colocar o CSV real do Saldao em um caminho acessivel.
2. Rodar o importador CSV existente.
3. Validar titulo, preco e link.
4. Importar no CatalogManager para virar dado real do OQC.

## Regras do contrato
- Rejeitar produto sem titulo.
- Rejeitar produto sem preco.
- Rejeitar produto sem link valido.
- Registrar imagem quando existir.
- Preservar affiliateUrl quando vier junto com o feed.

## Como isso entra no OQC
CSV -> CsvFeedProvider -> normalizacao -> CatalogManager -> BudgetEngine -> RiskEngine -> ScoreEngine -> RankingEngine -> ExplanationEngine

## Observacao pratica
Assim que o CSV real do Saldao for disponibilizado, ele pode alimentar o mesmo pipeline sem mudar o motor.
