# Relatorio Mi Shop Feed Provider

## O que foi implementado

Foi criada uma camada genérica de feed para o OQC com uma base comum em `src/feed/FeedProvider.js` e uma especialização CSV em `src/feed/providers/CsvFeedProvider.js`.

O primeiro provider concreto desta camada é o `MiShopFeedProvider`, que reaproveita a lógica CSV e apenas ajusta os aliases de colunas para o layout esperado do feed da Mi Shop.

## Arquitetura

```
CSV / feed bruto
  -> CsvFeedProvider
  -> MiShopFeedProvider
  -> CatalogManager
  -> BudgetEngine
  -> ScoreEngine
  -> RankingEngine
```

## Contrato normalizado

Os produtos importados saem no contrato OQC com:

```js
{
  id,
  externalId,
  title,
  description,
  brand,
  category,
  model,
  price,
  currency,
  image,
  productUrl,
  affiliateUrl,
  marketplace: "mi_shop",
  seller: "Mi Shop",
  availability,
  condition,
  sourceType: "csv_feed",
  dataMode: "real",
  importedAt,
  updatedAt
}
```

## Validação

Linhas sem `title`, `price` ou `url` válido são rejeitadas com motivo claro.

## Resultado da validação feita nesta sprint

Com o fixture de teste usado no repositório:

- 3 linhas lidas
- 2 produtos importados
- 1 linha rejeitada
- 0 duplicados no primeiro passe

No segundo passe do mesmo arquivo, os itens já existentes foram reconhecidos como duplicados pelo catálogo.

## Endpoints adicionados

- `GET /api/feed/providers`
- `POST /api/feed/import?provider=mi_shop`

## Próximos feeds suportados

A estrutura agora aceita novos providers no mesmo padrão:

- `ActionpayFeedProvider`
- `AwinFeedProvider`
- `GoogleMerchantFeedProvider`
- CSV manual

## Observação

O feed da Mi Shop entra como primeira implementação real da camada genérica de feeds. O catálogo continua sendo a fonte oficial do OQC, sem mudar o Motor OQC.
