# RELATORIO_SEO_INTELLIGENCE_OQC

## O que foi adicionado

- Criamos `src/seo/SEOIntelligenceEngine.js`.
- Criamos `data/seo-keywords.seed.json` com intenções manuais inspiradas em dados de busca.
- A home agora usa SEO para gerar atalhos e buscas em alta.
- A busca entende melhor sinônimos e intenções como:
  - `monitor gamer 144hz`
  - `monitor gamer curvo`
  - `notebook bom até 2500`
  - `celular até 1000 reais 128gb`

## Top buscas carregadas

| Busca | Categoria | Volume |
|---|---|---:|
| Monitor gamer curvo | Monitores | 8100 |
| Monitor gamer 144Hz | Monitores | 5400 |
| Monitor gamer 240Hz | Monitores | 5400 |
| Monitor gamer 27 polegadas | Monitores | 3600 |
| Monitor gamer 4K | Monitores | 3600 |
| Monitor gamer AOC | Monitores | 3600 |

## Impacto na home

- O menu superior ficou com navegação clara.
- Os 6 botões principais passam a ser escolhidos por sinal de catálogo + SEO.
- A área “Buscas em alta” ajuda a transformar volume de busca em atalhos reais.

## Impacto na busca

- O `SearchOrchestrator` passou a consultar a camada de SEO antes de montar a intenção final.
- Isso melhora o match de categoria e atributos, especialmente em monitores e celulares.

## O que ainda não faz

- Não substitui o catálogo real.
- Não adiciona IA obrigatória.
- Não cria novas fontes de produtos.

