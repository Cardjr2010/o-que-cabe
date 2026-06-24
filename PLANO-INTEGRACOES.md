# Plano de Integracoes

Marca oficial: O Que Cabe
Sigla visual: OQC

## Objetivo

Separar a origem dos dados do frontend. O layout continua igual; apenas o adapter muda.

## Estrutura

- `src/adapters/products.dummyjson.js`: produtos de teste.
- `src/adapters/travel.mock.js`: cards mockados de viagem.
- `src/adapters/products.amazon.js`: placeholder para Amazon.
- `src/adapters/products.mercadolivre.js`: placeholder para Mercado Livre.
- `src/adapters/products.magalu.js`: placeholder para Magalu.
- `src/adapters/travel.amadeus.js`: placeholder para Amadeus.
- `data/mercadolivre-links.json`: base manual de URLs do Mercado Livre.

## Como funciona

1. O frontend chama uma rota do servidor.
2. O servidor escolhe um adapter.
3. O adapter retorna dados no formato interno.
4. O frontend renderiza com os componentes atuais.

## Regras de teste em `teste-produtos`

- `preco_maximo = orcamento_mensal × parcelas`
- os produtos não são escondidos só por estarem acima do teto
- `valor_parcela = preco_total / parcelas`
- status:
  - `CABE` se `valor_parcela <= orcamento_mensal`
  - `APERTADO` se `valor_parcela > orcamento_mensal` e `<= orcamento_mensal × 1.2`
  - `NÃO CABE` se `valor_parcela > orcamento_mensal × 1.2`
- `Score O Que Cabe` vai de `0` a `100`
- `DummyJSON` é apenas fonte de teste e usa conversão simulada para BRL
- ordem:
  - primeiro `CABE`
  - depois `APERTADO`
  - por fim `NÃO CABE`
- limite visual:
  - até 8 itens `CABE`
  - até 4 itens `APERTADO`
  - até 3 itens `NÃO CABE`

## Regras de teste em `mercadolivre-manual`

- o cadastro é feito por URL manual do produto
- a URL comum é usada para extrair o `MLB...`
- a API consultada é `https://api.mercadolibre.com/items/ITEM_ID`
- `affiliateUrl` é opcional
- quando `affiliateUrl` existir, o botão usa esse link
- quando `affiliateUrl` for `null`, o botão usa o `productUrl`/URL original
- `active=false` remove o item da vitrine
- o produto não é removido se a API responder erro; ele volta com mensagem amigável
- a classificação usa `CABE`, `APERTADO` e `NÃO CABE`
- a ordenação usa primeiro a faixa e depois o maior score

## Formato interno de produtos

```js
{
  id,
  title,
  category,
  store,
  price,
  image,
  rating,
  description
}
```

## Formato interno de viagens

```js
{
  destination,
  price,
  image,
  duration,
  provider
}
```

## Como adicionar uma nova API

1. Criar um adapter em `src/adapters/`.
2. Normalizar os campos para o formato interno.
3. Apontar a rota nova para esse adapter.
4. Manter o frontend intacto.

## Como trocar a fonte de dados

Troque apenas a função chamada pela rota do servidor. O frontend não precisa mudar enquanto o formato interno permanecer estável.

## Limitações do Mercado Livre

- a busca aberta por termo pode retornar `403` em alguns cenários
- o caminho mais estável para teste é URL manual + `/items/ITEM_ID`
- o link de afiliado continua manual nesta etapa

## Deploy e HTTPS

- usamos a Vercel para ganhar uma URL pública HTTPS sem comprar domínio agora
- o domínio oficial entra depois, quando a base estiver validada
- `MELI_REDIRECT_URI` deve apontar para a URL pública da Vercel no callback do OAuth
