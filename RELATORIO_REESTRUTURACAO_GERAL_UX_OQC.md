# Relatório — Reestruturação Geral UX OQC

## Escopo

Reestruturação feita em branch de preview, sem alterar a produção.

Objetivo:

- reduzir excesso de blocos na home;
- tirar seções contraditórias ou sem base;
- concentrar a proposta do produto em busca e decisão;
- deixar a página de resultados mais curta e mais clara.

## O que mudou

### Home

- menu principal reduzido para `Início`, `Departamentos` e `Guias`;
- remoção da navegação principal para `Minha Conta`;
- hero reescrito com foco em busca e orçamento;
- sugestões rápidas reduzidas para 5 atalhos concretos;
- métricas consolidadas em uma única faixa de transparência;
- remoção prática de blocos genéricos da home:
  - decisões em destaque;
  - radar/campanhas;
  - prova social com zeros;
  - vídeos genéricos;
  - buscas em alta.

### Resultados

- adição de resumo da busca com:
  - itens aceitos;
  - itens avaliados;
  - itens descartados;
  - refinamentos, quando existirem;
- cards de decisão resumidos;
- comparativo `Loja oficial x melhor oferta geral` mais honesto;
- cards de produto compactados:
  - origem curta;
  - microfatos;
  - preço mais forte;
  - CTA principal mais visível;
  - detalhes longos recolhidos em `Por que recomendamos?`.

### Contrato de dados

- `home-data` com menu enxuto;
- estáticos espelhados de novo:
  - `index.html`
  - `public/index.html`
  - `api/static/index.html`

## Seções removidas ou ocultadas

- prova social quando faltar dado real suficiente;
- radar de campanhas na home;
- seção de vídeos na home;
- seção de buscas em alta na home;
- decisões duplicadas na home.

## Ganho direto

Antes:

- home longa demais;
- blocos demais competindo com a busca;
- prova social podia contradizer o catálogo;
- resultado ainda parecia técnico demais.

Depois:

- home menor;
- busca mais central;
- transparência em uma única faixa;
- resultado mais legível e mais próximo de um consultor de compra.

## Arquivos alterados

- `public/index.html`
- `public/app.js`
- `public/styles.css`
- `index.html`
- `api/static/index.html`
- `api/static/app.js`
- `api/static/styles.css`
- `src/runtime/home-data.js`
- `test/production-coherence.test.js`

## Validação

- `node --test`: 156/156 verde
- `node --check public/app.js`: OK
- `node --check api/web.js`: OK
- `node --check server.mjs`: OK

## Produção

Não alterada neste passo.

Trabalho preparado em branch de preview para revisão visual antes de deploy.
