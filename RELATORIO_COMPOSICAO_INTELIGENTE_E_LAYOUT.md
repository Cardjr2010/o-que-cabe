# Relatorio - Composicao Inteligente e Layout

Data: 05/08/2026

## Objetivo

Corrigir dois problemas visiveis do OQC:

- busca especifica como "banheiro organizado ate 250" ficando sem resposta util mesmo com produtos relacionados no catalogo;
- cards da home e dos resultados com excesso visual, setas duplicadas e altura maior do que o necessario.

## Catalogo Atual

- Total publicado no CatalogManager: 2.285 produtos
- Ofertas de afiliado publicadas via Telegram/export: 77

## Ofertas de Afiliado por Fonte

| Fonte | Produtos publicados |
|---|---:|
| Mercado Livre | 42 |
| Amazon | 25 |
| Magalu | 8 |
| Shopee | 2 |

## Produtos Incluidos Nesta Rodada

Foram adicionados 5 produtos para sustentar busca/composicao de banheiro e organizacao:

| Produto | Fonte | Preco |
|---|---|---:|
| Kit 3 cestos organizadores de bambu | Mercado Livre | R$ 40,09 |
| Torneira de banheiro bica alta cromada | Mercado Livre | R$ 26,91 |
| Kit de tapetes para banheiro 3 pecas | Amazon | R$ 53,60 |
| Prateleira de banheiro sem furo 4 andares | Shopee | R$ 69,90 |
| Espelho redondo com LED para banheiro | Shopee | R$ 84,05 |

Observacao: os precos vieram dos exports/posts de oferta. Os cards mantem aviso para confirmar na loja antes de comprar quando a oferta veio desse canal.

## Motor de Composicao

Foi adicionada uma camada deterministica em `api/web.js` para montar composicoes quando a busca indica ambiente/uso, em vez de tratar tudo como produto unico.

Primeiro caso implementado:

- busca: `banheiro organizado ate 250`
- contexto: banheiro/organizacao
- comportamento esperado: combinar itens relacionados dentro do orcamento total, sem inventar produto e sem puxar tecnologia ou item fora de contexto.

Slots usados:

- Organizacao: cesto, organizador, prateleira, porta shampoo, saboneteira
- Base: torneira, lavatorio, lavabo
- Conforto: tapete, lixeira, saco de lixo
- Visual: espelho, LED

## Layout

Mudancas aplicadas:

- cards de intencao e departamento ficaram mais secos;
- setas duplicadas foram ocultadas;
- cards de resultado ficaram mais slim;
- imagem de produto foi reduzida no mobile;
- composicao aparece em bloco compacto;
- analise detalhada fica fora do card principal.

## Resultado para o Usuario

Antes:

- uma busca como `banheiro organizado ate 250` podia virar zero resultado ou resultado pouco util;
- a home parecia mais pesada que o necessario;
- card com muita informacao prejudicava a decisao rapida.

Depois:

- a busca pode montar uma composicao real dentro do orcamento;
- o usuario ve uma sugestao pratica de compra combinada;
- a home fica mais minimalista;
- resultado prioriza decisao, preco e link de oferta.

## Validacao Executada

Comandos executados:

```bash
node --test
node --check api/web.js
node --check public/app.js
node --check server.mjs
```

Resultado:

- Testes: 178/178 aprovados
- `api/web.js`: OK
- `public/app.js`: OK
- `server.mjs`: OK

## Limitacoes

- Nao foi feita revalidacao ao vivo de cada shortlink nesta rodada.
- Mercado Livre/Amazon continuam como produtos de oferta importada/manual quando vierem de Telegram/export, nao como API externa plenamente operacional.
- A proxima etapa correta e ampliar a composicao para outros cenarios: celular, notebook, cozinha, sala, setup gamer e casa ate X.
