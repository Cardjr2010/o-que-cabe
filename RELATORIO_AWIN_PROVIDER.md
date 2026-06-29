# RELATORIO_AWIN_PROVIDER

## O que foi feito

Foi criado o `src/providers/AwinFeedProvider.js` para importar produtos reais da Awin para o `CatalogManager`, sem alterar o Motor OQC.

## Como o feed da Awin funciona

O OQC suporta dois caminhos honestos:

1. **Feed oficial da Awin via API**
   - Usa `AWIN_PUBLISHER_ID`
   - Usa `AWIN_ADVERTISER_ID`
   - Usa `AWIN_ACCESS_TOKEN`
   - Baixa o feed no formato oficial de produto da conta configurada

2. **Feed baixado manualmente do portal Awin**
   - Usa `AWIN_FEED_PATH`
   - Também aceita `AWIN_FEED_URL`
   - Isso permite começar com produtos reais mesmo antes da automação completa

Quando o feed oficial está disponível via API, o provider prepara a leitura do download no formato:

`https://api.awin.com/publishers/{PUBLISHER_ID}/awinfeeds/download/{ADVERTISER_ID}-{VERTICAL}-{LOCALE}.jsonl`

A autenticação preparada é via **Bearer token OAuth2**.

## Formato suportado

O provider foi preparado para:

- **JSONL** como formato principal do feed Awin
- **CSV** como fallback manual
- **JSON** simples como apoio local
- **XML** em modo best-effort para exportações manuais

A documentação da Awin também permite hospedagem de feeds por HTTP(S), SFTP e FTP, então o provider aceita tanto a leitura automatizada quanto o arquivo exportado manualmente do portal.

## Normalização para OQC

Cada item importado vira um produto no contrato do OQC com:

- `id`
- `externalId`
- `title`
- `category`
- `brand`
- `price`
- `currency`
- `image`
- `productUrl`
- `affiliateUrl`
- `marketplace: "awin"`
- `sourceType: "awin_feed"`
- `seller`
- `availability`
- `condition`
- `importedAt`
- `updatedAt`
- `lastCheckedAt`
- `dataMode: "real"`

Produtos sem título, preço ou link são rejeitados.

## Importação

Fluxo:

1. baixar ou ler o feed
2. parsear o conteúdo
3. normalizar os produtos
4. enviar ao `CatalogManager.import()`
5. deixar a deduplicação e o histórico com o catálogo oficial

## Endpoints adicionados

- `GET /api/awin/status`
- `POST /api/awin/import`

Os endpoints informam configuração e executam a importação sem expor segredo.

## Limitações

- O provider não inventa produtos.
- Se o feed estiver ausente ou inválido, a importação falha de forma controlada.
- O catálogo segue sendo a base oficial do OQC.
- O Motor OQC continua intacto.

## Próximos passos

- Conectar o feed oficial usado pela conta Awin no ambiente de produção.
- Automatizar a sincronização agendada.
- Manter o catálogo como única fonte para o ranking e a decisão de compra.
