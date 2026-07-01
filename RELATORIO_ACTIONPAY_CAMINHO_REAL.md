# Relatorio: Actionpay caminho real

Data: 2026-07-01

## O que a documentacao confirma
A Actionpay trabalha com afiliacao e feeds, nao como um marketplace global.
Os metodos mais uteis para produto real sao:
- apiWmOffers
- apiWmMyOffers
- apiWmYmls
- apiWmSources
- apiWmLinks

## Formato de chamada
Base:
https://actionpay.com.br/pt/<metodo>/?key=<apiKey>&format=<format>

Erros documentados:
- 400 consulta incorreta
- 401 direitos insuficientes
- 403 acao proibida
- 404 objeto nao encontrado
- 500 erro interno

## Caminho tecnico util para o OQC
- `apiWmYmls` e o caminho principal para obter feed de produtos.
- `act=deeplinks` pode devolver o feed com links rastreados.
- `sourceId` e `subId1` permitem rastreamento de afiliado.

## O que foi observado nos arquivos enviados
Os arquivos `yml3043.xml` e `yml3043-regional.xml` sao feeds RSS 2.0 no estilo Google Merchant, nao um YML puro de ofertas.
Mesmo assim, eles sao uteis para normalizacao porque trazem titulo, preco, imagem e link.

## Variaveis que o projeto precisa
- ACTIONPAY_API_KEY
- ACTIONPAY_SOURCE_ID
- ACTIONPAY_SALDAO_OFFER_ID=13241
- ACTIONPAY_DEFAULT_SUBID=oqc

## Limites atuais
- Sem chave valida nao existe importacao automatica real.
- O feed real precisa ser baixado e normalizado antes de entrar no CatalogManager.
- A documentacao consultada nao mostra um catalogo global; mostra apenas os feeds e ofertas ligadas a conta configurada.

## Proximo passo tecnico
- Usar `apiWmYmls` com a oferta 13241.
- Extrair o feed com deeplinks.
- Normalizar os itens para o contrato OQC.
- Importar no CatalogManager.
