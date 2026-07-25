# Relatorio de expansao Amazon e Mercado Livre por screener

Gerado em: 2026-07-25.

## O que foi feito

- Rodei nova coleta controlada de produtos Amazon e Mercado Livre.
- O teto padrao do screener passou para 400 produtos Amazon e 300 produtos Mercado Livre.
- A coleta atual retornou 674 produtos brutos:
  - Amazon: 400
  - Mercado Livre: 274
- A camada publica mantem apenas ofertas frescas, com link direto, preco, imagem e fonte permitida.
- Depois dos filtros de confianca, ficaram 612 ofertas externas elegiveis:
  - Amazon: 408
  - Mercado Livre: 204

## Inventario operacional por fonte

| Fonte | Total operacional |
|---|---:|
| Info Store | 1.462 |
| Saldão da Informática | 202 |
| Amazon | 408 |
| Mercado Livre | 204 |
| **Total** | **2.276** |

## Categorias operacionais no total

| Categoria | Total |
|---|---:|
| capa | 452 |
| acessorio | 254 |
| cabo | 239 |
| notebook | 186 |
| monitor | 133 |
| outros | 134 |
| peca | 130 |
| casa | 105 |
| celular | 102 |
| tv | 97 |
| carregador | 85 |
| audio | 75 |
| construcao | 63 |
| tablet | 56 |
| rede | 47 |
| ferramenta | 46 |
| relogio | 42 |
| pelicula | 15 |
| fone | 10 |
| ferragem | 3 |
| camera | 1 |
| acessorios | 1 |

## Categorias por fonte

### Saldão da Informática

| Categoria | Total |
|---|---:|
| notebook | 67 |
| monitor | 82 |
| outros | 45 |
| fone | 3 |
| celular | 2 |
| tv | 2 |
| relogio | 1 |

### Info Store

| Categoria | Total |
|---|---:|
| capa | 452 |
| acessorio | 254 |
| cabo | 239 |
| peca | 130 |
| outros | 89 |
| carregador | 85 |
| casa | 73 |
| construcao | 63 |
| relogio | 18 |
| pelicula | 15 |
| tablet | 10 |
| ferramenta | 9 |
| fone | 7 |
| monitor | 5 |
| tv | 5 |
| notebook | 4 |
| ferragem | 3 |
| celular | 1 |

### Amazon

| Categoria | Total |
|---|---:|
| celular | 74 |
| notebook | 69 |
| rede | 47 |
| monitor | 46 |
| tv | 46 |
| audio | 46 |
| tablet | 46 |
| casa | 32 |
| camera | 1 |
| acessorios | 1 |

### Mercado Livre

| Categoria | Total |
|---|---:|
| notebook | 46 |
| tv | 44 |
| ferramenta | 37 |
| audio | 29 |
| celular | 25 |
| relogio | 23 |

## Regras aplicadas

- Amazon entra apenas quando a oferta tem vendedor Amazon.com.br.
- Mercado Livre entra apenas quando a oferta rastreada possui indicativo de loja oficial.
- Produtos sem link direto, sem preco, sem imagem ou vencidos ficam fora da camada publica.
- Acessorios continuam rebaixados/bloqueados em buscas de produto principal.

## Validacao de busca local

| Busca | Resultado |
|---|---|
| iphone 17 pro max ate R$ 12.000 | real; primeira oferta Amazon; preco R$ 9.899,10 |
| galaxy s26 ultra ate R$ 12.000 | real; primeira oferta Amazon; preco R$ 7.997,67 |
| notebook i5 16gb ate R$ 4.000 | real; primeira oferta Mercado Livre; preco R$ 3.699,00 |
| monitor gamer 144hz ate R$ 1.500 | real; primeira oferta Amazon; preco R$ 476,99 |
| tv 55 ate R$ 3.000 | real; primeira oferta Amazon; preco R$ 2.499,00 |
| furadeira ate R$ 500 | real; primeira oferta Mercado Livre; preco R$ 140,60 |
| fone bluetooth ate R$ 300 | real; primeira oferta Mercado Livre; preco R$ 209,00 |
| xiaomi be6500 ate R$ 1.000 | sem oferta confiavel dentro da regra atual; nao foi inventado resultado |

## Validacao tecnica

- `node --test`: 160/160 testes aprovados.
- `node --check public/app.js`: aprovado.
- `node --check api/web.js`: aprovado.
- `node --check server.mjs`: aprovado.
- `node --check src/engines/RankingEngine.js`: aprovado.
- `node --check src/providers/VerifiedAffiliateOfferProvider.js`: aprovado.

## Validacao em producao

Commit publicado: `f8fc132c6746b1a7c67fc87a76217343d366da32`.

| Busca publica | Resultado |
|---|---|
| iphone 17 pro max ate R$ 12.000 | dataMode real; 3 recomendacoes; primeira oferta Mercado Livre; R$ 10.999,00 |
| galaxy s26 ultra ate R$ 12.000 | dataMode real; 2 recomendacoes; primeira oferta Amazon; R$ 7.997,67 |
| notebook i5 16gb ate R$ 4.000 | dataMode real; 3 recomendacoes; primeira oferta Mercado Livre; R$ 3.699,00 |
| monitor gamer 144hz ate R$ 1.500 | dataMode real; 3 recomendacoes; primeira oferta Amazon; R$ 607,05 |
| tv 55 ate R$ 3.000 | dataMode real; 3 recomendacoes; primeira oferta Amazon; R$ 2.711,80 |
| furadeira ate R$ 500 | dataMode real; 3 recomendacoes; primeira oferta Mercado Livre; R$ 140,60 |

## Proximo passo recomendado

O proximo passo e criar uma pagina de categoria/listagem para abrir todos os produtos de uma categoria, com ordenacao por:

1. melhor recomendado;
2. menor preco;
3. melhor parcelamento;
4. fonte;
5. produto principal primeiro.

Isso resolve o ponto de UX: se existem 80 TVs ou 186 notebooks, o usuario precisa conseguir abrir a lista completa e ordenar, sem lotar a home.
