# Relatorio Hotfix Visual App OQC

Data: 2026-08-02

## Objetivo

Corrigir a experiencia visual mobile do OQC apos auditoria da producao no commit `6053164bd9845eeba986fe65705a587bd3475179`.

O foco foi remover a sensacao de pagina baguncada/relatorio e aproximar a navegacao de uma experiencia de app: hero menor, cards limpos, menos metricas no topo e resultado mais honesto.

## Problemas confirmados

- A home parecia um poster grande, com hero alto demais para mobile.
- O bloco publico de catalogo ocupava a primeira dobra e reforcava numeros que nao ajudam a decisao do usuario.
- Os cards de intencao apareciam como trilho cortado em mobile.
- A pagina de categoria usava header grande por regra especifica de `category-active`.
- A tela sem resultado estava correta na logica, mas pesada visualmente.
- A pagina de Guias/Blog ainda tinha cards altos demais no mobile.
- O link publico de Guias apontava para `/blog/`, que podia cair em `Arquivo nao encontrado` em ambiente sem fallback.
- Havia divergencia entre arquivos espelhados de estilo: `styles.css`, `public/styles.css` e `api/static/styles.css`.

## Correcoes feitas

- Compactado o header mobile.
- Reduzido o hero mobile para aproximadamente 230px.
- Removida a faixa de metricas do catalogo da primeira dobra mobile.
- Transformados atalhos de compra em grid 2 colunas sem corte lateral.
- Corrigido seletor real dos atalhos: `intent-grid`.
- Corrigidas regras especificas de categoria/busca que forcavam logo e titulo grandes.
- Compactados filtros, resumo de categoria e cards de produto.
- Mantida a decisao honesta para buscas sem cobertura: nao inventar produto e sugerir refinamento.
- Compactada a pagina de Guias/Blog no mobile, com hero menor, cards em coluna e botoes claros.
- Corrigido o link publico de Guias para `/blog/index.html`.
- Sincronizados os tres arquivos CSS usados pelo runtime/deploy.

## Estado do catalogo

A producao auditada retornou:

- 3.215 produtos analisados.
- 2.280 produtos publicados.
- 935 ocultos por filtros de qualidade/fonte.
- Atualizacao do catalogo: `2026-08-02T09:36:26.928Z`.

Esses numeros sao operacionais e nao devem dominar a home publica.

## Evidencias visuais

Pasta:

`evidencias/auditoria-visual-pos-6053164-2026-08-02/`

Principais arquivos:

- `home-mobile.png` - producao antes do ajuste.
- `categoria-celulares-mobile.png` - categoria antes do ajuste.
- `busca-banheiro-mobile.png` - busca antes do ajuste.
- `home-local-fix9.png` - home mobile apos ajuste.
- `categoria-celulares-local-fix8.png` - categoria mobile apos ajuste.
- `busca-banheiro-local-fix9.png` - busca sem oferta apos ajuste.
- `blog-local-fix-final2.png` - guias/blog mobile apos ajuste.
- `home-producao-521ca68-mobile.png` - home em producao no commit `521ca68`.
- `categoria-celulares-producao-521ca68-mobile.png` - categoria em producao no commit `521ca68`.
- `busca-banheiro-producao-521ca68-mobile.png` - busca em producao no commit `521ca68`.
- `blog-producao-521ca68-mobile.png` - blog em producao antes do refinamento final.

## Validacoes

- `node --check public/app.js`: OK.
- `node --check api/web.js`: OK.
- `node --check server.mjs`: OK.
- `node --check src/engines/RankingEngine.js`: OK.
- `node --test`: 177/177 testes aprovados.
- Hash dos CSS espelhados: OK, `styles.css`, `public/styles.css` e `api/static/styles.css` identicos.

## Observacoes

Este hotfix nao altera seed, motores financeiros, importadores, ranking ou logica de fontes. A mudanca e visual, de link de blog e de espelhamento de arquivos estaticos.
