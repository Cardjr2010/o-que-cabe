# RELATORIO_SPRINT26_5_HOME_CONVERSAO

## O que mudou
- A home passou a ler o catálogo oficial `src/data/products.seed.json` no `home-data`.
- A faixa de confiança da home agora reflete os números reais do catálogo oficial.
- A navegação principal e os blocos da home foram enxugados para parecer uma landing page de conversão.
- A renderização de produtos foi limitada para evitar uma lista longa demais na primeira dobra.
- Os resultados agrupados agora aparecem em blocos curtos com opção de expandir.
- Os departamentos públicos principais ficaram limitados aos itens mais relevantes.

## Antes / depois
- Antes: a home ainda mostrava sinais da base menor e podia exibir números como 708 / 1.531 / 823.
- Depois: a home-data local passou a mostrar:
  - `totalCatalogProducts = 16740`
  - `totalPublishedProducts = 15999`
  - `hiddenProducts = 741`
- A home deixa de depender da seed menor para a faixa de confiança e para os atalhos principais.

## Como a home comunica os 15.999 produtos
- Hero com a mensagem principal da decisão de compra.
- Destaque explícito para `15.999 produtos reais analisados`.
- Bloco de confiança com `15.999`, `16.740`, `741` e catálogo atualizado.
- Decisões inteligentes, departamentos principais, buscas em alta, blog e como funciona aparecem em sequência curta.

## Como os produtos foram limitados
- O painel inicial mostra apenas os 6 departamentos principais.
- Os resultados exibem até 9 itens visíveis e mantêm o restante recolhido em “Ver mais resultados”.
- Os agrupamentos de busca exibem até 3 itens por bloco, com expansão opcional.

## Como os cards de decisão ficaram
- Os atalhos principais passaram a ser pequenos, clicáveis e com foco em conversão.
- O botão de oferta ficou mais forte e claro.
- Quando não há link real, a ação não tenta parecer disponível.

## Validações feitas
- `node --test`
- `node --check src/runtime/home-data.js`
- `node --check public/app.js`
- `node --check api/web.js`
- `node --check server.mjs`
- Validação local de `buildHomeCatalogData()` mostrando os totais oficiais do catálogo.
- Sincronização dos arquivos estáticos da home para a camada servida pela API.
- Captura visual local da home em `home-visual-check-final.png`.

## Resultado local observado
- `homeButtons` e `departments` ficaram limitados aos 6 principais blocos reais.
- A home-data local passou a ler o seed oficial maior.
- O catálogo oficial e os números de confiança agora estão alinhados.
- A captura visual local mostra hero, busca, confiança, departamentos e decisões inteligentes com aparência de landing page de conversão.
