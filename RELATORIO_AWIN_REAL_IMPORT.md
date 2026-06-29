# RELATORIO_AWIN_REAL_IMPORT

## Resumo

Foi implementada a primeira integração real da Awin no OQC com foco em feeds de produto de anunciantes aprovados. O fluxo agora aceita feed manual ou feed oficial da conta e importa os produtos para o `CatalogManager`, que continua sendo a base oficial do catálogo.

## Advertisers configurados

- Stanley BR
- Shark-Ninja BR
- Via Inox Tramontina BR
- Clóvis Calçados BR
- Posthaus BR
- Tjama BR

## Fluxo implementado

1. Awin Feed
2. Download do feed oficial ou leitura de feed manual
3. Parse do conteúdo
4. Normalização para o contrato OQC
5. Importação no `CatalogManager`
6. Aplicação posterior de `BudgetEngine`, `ScoreEngine` e `RankingEngine`

## Formatos aceitos

- JSONL
- CSV
- JSON
- XML

## Regras de normalização

Cada produto real da Awin é transformado em um produto OQC com:

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
- `marketplace: "awin"`
- `seller`
- `availability`
- `condition`
- `importedAt`
- `updatedAt`
- `sourceType: "awin_feed"`
- `dataMode: "real"`

Produtos sem `title`, `price` ou `affiliateUrl`/`productUrl` são rejeitados.

## Endpoints adicionados

- `GET /api/awin/status`
- `POST /api/awin/import`

## Validação realizada

Os testes automatizados confirmaram:

- parsing de JSONL e CSV
- normalização de produtos
- rejeição de itens inválidos
- deduplicação via `CatalogManager`
- status da API sem exposição de segredos
- importação local escrevendo no catálogo de teste

## Limitações

- O provider depende do feed realmente disponível na conta Awin ou de um arquivo exportado manualmente.
- Não há produto fake.
- O catálogo segue como banco oficial do OQC.
- O motor de decisão não foi alterado.

## Próximos passos

- Ligar a URL oficial do feed no ambiente final.
- Automatizar a sincronização.
- Expandir as fontes reais sem mexer no motor do OQC.
