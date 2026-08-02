# Relatorio - Referencia Cine Livre / Android TV no OQC

Data: 02/08/2026

## Objetivo

Usar a referencia visual `https://cine-livre-atualizado.pages.dev/` como direcao para deixar o OQC com mais sensacao de aplicativo, menos cara de pagina solta e menos poluicao na primeira tela.

## Por que essa referencia faz sentido para o OQC

O modelo tipo Android TV funciona porque reduz carga mental:

- tem uma moldura forte de produto;
- usa foco claro por cards e trilhos;
- evita listas longas no primeiro contato;
- deixa a acao principal evidente;
- cria sensacao de navegacao por escolha, nao por relatorio.

Para o OQC isso combina com a proposta: a home apresenta a promessa e a busca; a pagina de resultado entrega a analise.

## O que nao foi copiado literalmente

A referencia tinha uma falha importante no mobile: titulo grande demais e corte horizontal. Esse comportamento nao foi replicado. A adaptacao do OQC manteve:

- largura responsiva;
- sem overflow horizontal;
- busca visivel no mobile;
- cards compactos;
- detalhamento apenas sob demanda.

## Mudancas aplicadas

- Fundo com topo azul profundo e area principal clara.
- Header com aparencia de app shell.
- Hero escuro, mais proximo de uma tela inicial de produto.
- Busca no centro, com campos compactados no mobile.
- Cards de transparencia em trilho compacto.
- Intencoes, departamentos e guias preparados como trilhos horizontais no mobile.
- Cards de categoria e resultado mantidos mais secos.
- Pagina de categoria preservada como area de decisao: ordenar por recomendacao, menor preco, maior preco e melhor parcelamento.

## Evidencias visuais

Referencia capturada:

- `evidencias/auditoria-cine-livre-ref-2026-08-02/01-referencia-cine-livre-desktop.png`
- `evidencias/auditoria-cine-livre-ref-2026-08-02/02-referencia-cine-livre-mobile.png`

OQC antes/depois local:

- `evidencias/auditoria-cine-livre-ref-2026-08-02/03-oqc-home-mobile-atual.png`
- `evidencias/auditoria-cine-livre-ref-2026-08-02/05-oqc-categoria-celulares-mobile-carregada.png`
- `evidencias/auditoria-cine-livre-ref-2026-08-02/14-oqc-home-cine-livre-shell-final-local.png`
- `evidencias/auditoria-cine-livre-ref-2026-08-02/15-oqc-categoria-cine-livre-shell-final-local.png`

## Validacao tecnica

Executado:

- `node --check public/app.js`
- `node --check api/web.js`
- `node --check server.mjs`
- `node --test`

Resultado:

- 177 testes aprovados
- 0 falhas

Observacao: a suite completa demora mais de 4 minutos porque `test/oqc-flow.test.js` sozinho levou cerca de 223 segundos. O teste passou quando executado isoladamente e a suite completa passou com timeout maior.

## Limite desta entrega

Esta entrega e uma camada visual e de navegacao. Ela nao muda RankingEngine, BudgetEngine, RiskEngine, seed ou fontes. A proxima melhoria de produto deve atacar qualidade de dados, entrada de novas ofertas e logica de composicao inteligente por ambiente/produto.
