# RELATORIO_PRODUCTS_SEED_REAL

## Resumo

Criamos a primeira base inicial real do OQC em `data/products.seed.json` para manter o MVP útil mesmo sem depender da busca ao vivo do Mercado Livre.

## Quantidade cadastrada

- Total de produtos: 30
- Celulares: 10
- TVs: 10
- Notebooks: 10

## Qualidade da base

- Produtos com imagem: 30
- Produtos com anúncio/link específico: 30
- Produtos com busca específica no Mercado Livre: 30
- Produtos com marketplace definido: 30

## Estrutura usada

Cada item foi salvo com:

- `id`
- `title`
- `category`
- `price`
- `currency`
- `image`
- `productUrl`
- `marketplace`
- `condition`
- `lastCheckedAt`
- `dataMode: "seed"`
- `priceHistory`

## Integração

- A busca agora consulta a seed local primeiro.
- O motor OQC segue funcionando normalmente com:
  - `BudgetEngine`
  - `ScoreEngine`
  - `RankingEngine`
- Quando a seed cobre a categoria, o card aparece como base real do OQC e o botão abre o anúncio específico.

## Categorias concluídas

- Celulares
- TVs
- Notebooks

## Observação

Esta base é temporária e pode ser ampliada depois com uma atualização automática ou com dados oficiais quando a integração autenticada estiver estável.
