# RELATORIO_WOOCOMMERCE_STYLE_IMPORTER

## O que foi criado

Foi adicionada uma camada de importação no estilo WooCommerce para organizar produtos dentro do catálogo interno do OQC antes da busca, do orçamento e do ranking.

Arquivos:

- `src/importers/ProductImporter.js`
- `src/importers/WooCommerceStyleImporter.js`
- `data/products.seed.json`

## Como o modelo imita WooCommerce

O fluxo segue a mesma ideia usada por lojas de afiliados:

1. uma fonte externa ou manual alimenta o catálogo;
2. os produtos são normalizados e salvos localmente;
3. o usuário pesquisa dentro da base interna;
4. o OQC calcula orçamento, nota e ranking;
5. o botão leva ao anúncio ou link específico.

## Onde ficam os produtos

Os produtos ficam em `data/products.seed.json`.

Cada item segue o contrato:

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
- `importedAt`
- `dataMode: "seed"`

## Como o OQC pesquisa

O endpoint de busca consulta primeiro a seed local.
Depois aplica:

- `BudgetEngine`
- `ScoreEngine`
- `ValueEngine` quando disponível
- `RankingEngine`

Se não houver produto seed compatível, o sistema mantém o fallback honesto.

## Como links afiliados entram depois

O campo `affiliateUrl` já é aceito pelo importador.

Prioridade:

1. `affiliateUrl`
2. `productUrl`

## Como adicionar novos marketplaces depois

O padrão é criar outro importador ou provider seguindo o mesmo contrato do OQC.

Assim, Amazon, Mercado Livre, Magalu ou qualquer outro marketplace entram como fonte, sem mudar o motor de decisão.

## Observação

A seed inicial é deliberadamente pequena e controlada. O objetivo agora é estabilidade, honestidade e previsibilidade no MVP.
