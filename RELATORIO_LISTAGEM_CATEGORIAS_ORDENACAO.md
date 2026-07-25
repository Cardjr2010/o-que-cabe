# Relatorio de listagem por categoria e ordenacao

Gerado em: 2026-07-25.

## Objetivo

Permitir que o usuario abra uma categoria, veja todos os produtos operacionais daquela area e ordene por criterio util, sem transformar a home em uma lista gigante.

## Mudancas feitas

- A listagem de categoria agora usa catalogo interno + ofertas verificadas Amazon/Mercado Livre.
- O limite de exibicao de categoria subiu para ate 300 itens.
- A busca normal continua enxuta.
- A ordenacao ganhou o modo `installment_asc`, exibido como "Melhor parcelamento".
- A categoria TV agora bloqueia falsos positivos como TV Stick, Media Player, TV Box, suporte e controle remoto.
- O texto da interface diferencia categoria de busca comum:
  - contador: "X de Y itens nesta categoria";
  - titulo: "Categoria: todos os produtos encontrados".

## Validacao local

| Categoria | Ordenacao | Total encontrado | Primeiro resultado |
|---|---|---:|---|
| TV | Recomendados | 98 | Samsung Smart TV 43 QLED |
| TV | Menor preco | 98 | Smart TV Philco 24 Roku |
| TV | Melhor parcelamento | 98 | Smart TV Philco 24 Roku |
| Notebook | Recomendados | 145 | Notebook Lenovo Ideapad |

## Regressao corrigida

Antes, abrir categoria usava basicamente o catalogo interno e podia deixar ofertas Amazon/Mercado Livre fora da navegacao por categoria.

Agora a listagem por categoria considera tambem as ofertas verificadas externas, mantendo filtros de confianca e bloqueio de acessorios evidentes.

## Testes

- `node --test`: 160/160 aprovado.
- `node --check public/app.js`: aprovado.
- `node --check api/static/app.js`: aprovado.
- `node --check api/web.js`: aprovado.
- `node --check server.mjs`: aprovado.
- `node --check src/engines/RankingEngine.js`: aprovado.
- `node --check src/providers/VerifiedAffiliateOfferProvider.js`: aprovado.

## Proximo passo

Criar uma rota dedicada visualmente para categoria, por exemplo:

- `/categoria/tv`
- `/categoria/notebook`
- `/categoria/celular`

Hoje a categoria ja funciona no fluxo atual da home. A rota dedicada e o proximo refinamento para SEO, compartilhamento e navegacao direta.
