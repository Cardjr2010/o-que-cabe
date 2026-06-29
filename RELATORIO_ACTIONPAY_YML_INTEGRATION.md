# RELATORIO_ACTIONPAY_YML_INTEGRATION

## O que foi implementado

Foi criada uma integração real com a Actionpay para importar produtos da campanha:

- `Saldão da Informática - Notebooks, iPhones e TVs`
- `offer_id: 13241`

A integração lê o YML da Actionpay, normaliza os produtos e envia tudo para o `CatalogManager`, mantendo o motor do OQC intacto.

## Arquivos criados

- `src/providers/ActionpayProvider.js`
- `src/importers/ActionpayYmlImporter.js`
- `test/actionpay-provider.test.js`
- `test/actionpay-yml-importer.test.js`
- `RELATORIO_ACTIONPAY_YML_INTEGRATION.md`

## Variáveis de ambiente

- `ACTIONPAY_API_KEY`
- `ACTIONPAY_SOURCE_ID`
- `ACTIONPAY_SALDAO_OFFER_ID=13241`
- `ACTIONPAY_DEFAULT_SUBID=oqc`
- `ACTIONPAY_CATALOG_SEED_PATH` opcional para testes e importação isolada

## Fluxo implementado

1. O provider monta URLs oficiais da Actionpay com `key` e `format`.
2. `apiWmYmls` é usado para localizar os feeds da oferta 13241.
3. O primeiro YML disponível é escolhido.
4. `apiWmYmls act=deeplinks` gera/baixa o YML com deeplinks.
5. O importer parseia o XML/YML bruto.
6. Os produtos são normalizados no contrato OQC.
7. O `CatalogManager.importProducts()` recebe os itens.

## Endpoints internos

- `GET /api/actionpay/status`
- `GET /api/actionpay/ymls`
- `POST /api/actionpay/import-saldao`

## Normalização

Cada produto real da Actionpay vira um item OQC com:

- `marketplace: "actionpay"`
- `sourceType: "actionpay_yml"`
- `dataMode: "real"`
- `seller: "Saldão da Informática"`
- `affiliateUrl` e `productUrl` apontando para o deeplink
- categoria OQC derivada de termos como:
  - iPhone / celular / smartphone -> `tecnologia/celulares`
  - notebook / laptop -> `tecnologia/notebooks`
  - TV / televisão / smart tv -> `tecnologia/tvs`
  - monitor -> `tecnologia/monitores`
  - tablet / iPad -> `tecnologia/tablets`
  - impressora -> `tecnologia/impressoras`
  - outros -> `tecnologia/outros`

## Regras de rejeição

Produtos sem:

- título
- preço válido
- URL/deeplink válido

são rejeitados.

## Validação

Os testes cobrem:

- `isConfigured` sem env
- URL gerada sem vazar segredo
- tratamento de erro HTTP
- parse do YML
- normalização dos produtos
- rejeição de registros inválidos
- importação no catálogo
- respostas das rotas sem expor a API key

## Limitações

- A qualidade dos dados depende do YML disponível na conta Actionpay.
- Se a campanha não retornar YML, o importador devolve erro claro.
- O demo honesto continua como fallback.
- O motor de decisão não foi alterado.

## Próximos passos

1. adicionar mais campanhas Actionpay
2. automatizar sincronização agendada
3. criar painel admin de importação
4. integrar outras redes reais sem mexer no motor
