# RELATORIO_CATALOG_MANAGER

## Arquitetura

O OQC agora passa a tratar o catálogo de produtos como uma camada gerenciada, não mais como um JSON editado manualmente.

Componentes criados:

- `CatalogManager`
- `CatalogRepository`
- `CatalogValidator`
- `CatalogUpdater`
- `CatalogExporter`

## Responsabilidades

- `CatalogManager`: coordena importação, atualização, remoção, busca e exportação
- `CatalogRepository`: lê e grava a base do catálogo
- `CatalogValidator`: rejeita produtos inválidos e explica o motivo
- `CatalogUpdater`: faz merge, evita duplicados, desativa e remove itens
- `CatalogExporter`: exporta em JSON ou CSV

## Fluxo dos produtos

1. a fonte chega por CSV, JSON ou futura integração
2. o catálogo valida os dados
3. o catálogo normaliza e deduplica
4. o catálogo grava a base oficial
5. os providers e o motor OQC leem o catálogo já organizado

## Como novos marketplaces entram

Novos marketplaces não falam com o motor diretamente.
Eles alimentam o catálogo através do mesmo contrato de produto.

Assim, Amazon, Mercado Livre, Shopee, Magalu ou Google Merchant podem entrar como novas fontes sem alterar a lógica do OQC.

## Como affiliate links funcionam

O catálogo já suporta:

1. `affiliateUrl`
2. `productUrl`

Se houver link de afiliado, ele tem prioridade.

## Observação

O objetivo desta etapa é criar a base oficial de produtos do OQC com controle, rastreabilidade e menos edição manual de arquivos soltos.
