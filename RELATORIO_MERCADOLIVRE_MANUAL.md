# Relatorio Mercado Livre Manual

## Objetivo

Permitir teste real com URLs manuais do Mercado Livre e consulta do item pela API oficial de item.

## Fluxo

1. Cadastrar a URL do produto em `data/mercadolivre-links.json`.
2. Extrair o ID `MLB...` da URL.
3. Consultar `https://api.mercadolibre.com/items/ITEM_ID`.
4. Normalizar o retorno para o formato interno.
5. Exibir o produto com classificação `CABE`, `APERTADO` ou `NÃO CABE`.

## Formato correto da URL

Exemplo:

`https://produto.mercadolivre.com.br/MLB-1234567890-nome-do-produto-_JM`

O extrator aceita variações com ou sem hífen entre `MLB` e o número e ignora parâmetros de URL.

## Extração do ID

- entrada: URL do produto
- saída: `MLB1234567890`

## URL consultada na API

`https://api.mercadolibre.com/items/ITEM_ID`

## Diferença entre URL comum e affiliateUrl

- `url`: link comum do produto, usado para extrair o item e abrir o produto quando não há afiliado
- `affiliateUrl`: link afiliado manual, usado no botão quando estiver preenchido

## Limitações

- a busca aberta por termo pode retornar `403`
- por isso, a estratégia principal é URL manual + API de item
- o afiliado ainda é manual nesta etapa
- falhas de um item não derrubam a lista inteira

## Validação observada

- a extração de `MLB` a partir da URL manual funcionou
- o endpoint `/api/mercadolivre-extract` retornou `MLB1234567890`
- a API de item respondeu `403` com política de autorização negada neste ambiente de teste

## Observação

O sistema mantém o layout existente e apenas troca a fonte de dados na camada de adapter.
