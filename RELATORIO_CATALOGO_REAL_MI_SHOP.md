# Relatorio Catalogo Real Mi Shop

Data da validacao: 2026-06-29

## Resumo executivo

- A API principal de busca continua respondendo `200`.
- O catalogo local do OQC esta com `829` produtos no total.
- Distribuicao atual do catalogo:
  - `709` produtos `mi_shop`
  - `120` produtos `Mercado Livre`
- As buscas testadas para o catalogo real da Mi Shop retornaram resultados reais, com imagem e link, sem cair para demo.
- O ranking foi ajustado para nao promover item fora do orcamento como melhor escolha.

## Evidencias do catalogo

### Total de produtos

```json
{
  "total": 829,
  "byMarketplace": {
    "mercado livre": 120,
    "mi_shop": 709
  }
}
```

## Testes de busca

### xiaomi

- Status HTTP: `200`
- Resultados: `20`
- `dataMode=real`: `20`
- `marketplace=mi_shop`: `20`
- Menor preco: `9`
- Maior preco: `90`
- Ha imagem: `sim`
- Ha `affiliateUrl`/`productUrl`: `sim`
- Topo do ranking: `Mi Shop`

### redmi

- Status HTTP: `200`
- Resultados: `20`
- `dataMode=real`: `20`
- `marketplace=mi_shop`: `20`
- Menor preco: `9`
- Maior preco: `90`
- Ha imagem: `sim`
- Ha `affiliateUrl`/`productUrl`: `sim`
- Topo do ranking: `Mi Shop`

### poco

- Status HTTP: `200`
- Resultados: `20`
- `dataMode=real`: `20`
- `marketplace=mi_shop`: `20`
- Menor preco: `9`
- Maior preco: `90`
- Ha imagem: `sim`
- Ha `affiliateUrl`/`productUrl`: `sim`
- Topo do ranking: `Mi Shop`

### celular

- Status HTTP: `200`
- Resultados: `20`
- `dataMode=real`: `20`
- `marketplace=mi_shop`: `20`
- Menor preco: `9`
- Maior preco: `90`
- Ha imagem: `sim`
- Ha `affiliateUrl`/`productUrl`: `sim`
- Topo do ranking: `Mi Shop`

### smartphone

- Status HTTP: `200`
- Resultados: `20`
- `dataMode=real`: `20`
- `marketplace=mi_shop`: `20`
- Menor preco: `9`
- Maior preco: `90`
- Ha imagem: `sim`
- Ha `affiliateUrl`/`productUrl`: `sim`
- Topo do ranking: `Mi Shop`

### fone

- Status HTTP: `200`
- Resultados: `20`
- `dataMode=real`: `20`
- `marketplace=mi_shop`: `20`
- Menor preco: `343`
- Maior preco: `3990`
- Ha imagem: `sim`
- Ha `affiliateUrl`/`productUrl`: `sim`
- Topo do ranking: `Mi Shop`

### carregador

- Status HTTP: `200`
- Resultados: `13`
- `dataMode=real`: `13`
- `marketplace=mi_shop`: `13`
- Menor preco: `90`
- Maior preco: `5990`
- Ha imagem: `sim`
- Ha `affiliateUrl`/`productUrl`: `sim`
- Topo do ranking: `Mi Shop`

### relogio

- Status HTTP: `200`
- Resultados: `20`
- `dataMode=real`: `20`
- `marketplace=mi_shop`: `20`
- Menor preco: `10`
- Maior preco: `24990`
- Ha imagem: `sim`
- Ha `affiliateUrl`/`productUrl`: `sim`
- Topo do ranking: `Mi Shop`

### tablet

- Status HTTP: `200`
- Resultados: `9`
- `dataMode=real`: `9`
- `marketplace=mi_shop`: `9`
- Menor preco: `249`
- Maior preco: `10490`
- Ha imagem: `sim`
- Ha `affiliateUrl`/`productUrl`: `sim`
- Topo do ranking: `Mi Shop`

## Validacao de ranking e confianca

### Comportamento de orcamento

- `q=tv&mode=total&totalBudget=500`
  - O primeiro item real retornado nao ficou com selo de melhor escolha quando estava fora do limite.
  - O topo passou a aparecer como `Melhor alternativa dentro do possível`.
  - O item topo continua real e com imagem/link, mas nao finge ser a melhor escolha do orcamento.

- `q=notebook&mode=monthly&monthly=250&months=10`
  - A busca continua respondendo `200`.
  - O ranking segue ordenado e explicavel.

### Regras confirmadas

- Produto fora do orcamento nao deve subir como `Melhor escolha`.
- Produto sem preco continua rejeitado pelo catalogo.
- Produto sem link continua rejeitado pelo catalogo.
- Produtos reais expostos na resposta continuam com imagem e link.
- A origem real aparece como `Mi Shop` nos resultados validados acima.
- Nenhum resultado validado voltou com Mercado Livre fixo como origem principal.

## Observacoes de qualidade

- As buscas reais validas estao vindo de `mi_shop` e mantendo `dataMode=real`.
- As imagens estao presentes nas respostas validadas.
- Os links estao presentes nas respostas validadas.
- O fluxo de demo continua separado do fluxo real.

## Verificacoes automatizadas

Executado com sucesso:

- `node --test`
- `node --check api/web.js`
- `node --check server.mjs`
- `node --check public/app.js`

