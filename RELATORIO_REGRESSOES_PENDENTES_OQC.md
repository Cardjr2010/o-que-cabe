# Relatório — Regressões Pendentes OQC

Data: 22/07/2026
Branch base: `origin/main`
Branch de trabalho: `release/visual-polish-0722`

## Resumo

- O preview `preview/redesign-oqc-clear-decisions` existe na Vercel.
- A validação visual automática do preview ficou bloqueada por autenticação da própria Vercel.
- Foi criado um worktree limpo em cima de `origin/main` para evitar arrastar resíduos do worktree antigo.
- A suíte reproduziu 15 falhas reais nesse branch limpo.
- As 15 falhas foram resolvidas sem reabrir regressões visuais aprovadas.
- Resultado final:
  - `node --test`: 147/147
  - `node --check public/app.js`: OK
  - `node --check api/web.js`: OK
  - `node --check server.mjs`: OK
  - `node --check src/engines/RankingEngine.js`: OK

## Causa das 15 falhas

### 1. Testes desatualizados após endurecimento do catálogo

Impacto:
- `test/catalog-manager.test.js`
- `test/csv-product-importer.test.js`
- `test/feed-provider.test.js`
- `test/marketplace-provider.test.js`
- `test/product-importer.test.js`

Problema:
- os testes ainda assumiam `Mercado Livre` e `Mi Shop` como fontes públicas válidas no catálogo principal;
- o runtime atual filtra essas fontes da superfície pública;
- algumas expectativas ainda apontavam para links genéricos ou marketplaces hoje ocultos.

Correção:
- alinhei fixtures e expectativas para fontes públicas realmente visíveis;
- mantive o comportamento do runtime, só corrigi a suíte.

### 2. Divergência entre integração atual do Mercado Livre e o branch limpo

Impacto:
- `src/connectors/MercadoLivreConnector.js`
- `src/providers/MercadoLivreProvider.js`
- `src/catalog/CategoryBuilder.js`

Problema:
- o branch limpo em cima de `origin/main` ainda não tinha parte dos ajustes já presentes no outro worktree;
- isso afetava normalização, rótulo da origem, suporte a `itemId`, `freeShipping`, `sellerReputation` e cobertura de `Info Store`.

Correção:
- trouxe apenas os arquivos necessários para o branch limpo;
- mantive o desenho visual já aprovado.

### 3. Testes presos em datas vencidas de campanha

Impacto:
- `test/coupon-provider.test.js`
- `test/search-orchestrator.test.js`
- `test/verified-affiliate-offer-provider.test.js`

Problema:
- havia testes esperando cupom `VIPMELI` ativo mesmo após a janela real já ter expirado;
- havia fixture de oferta “ativa” com `visibleUntil` já no passado em relação a 22/07/2026.

Correção:
- onde a intenção era testar cálculo de cupom, passei a fixture explícita do cupom verificado;
- onde a intenção era testar comportamento atual da busca, atualizei a expectativa para campanha expirada;
- onde a intenção era testar janela de visibilidade, corrigi a data do item ainda ativo.

### 4. Expectativa antiga de navegação após redesign da home

Impacto:
- `test/production-coherence.test.js`

Problema:
- o teste ainda exigia link público de `Blog` na home;
- a versão redesenhada usa `Guias` e remove navegação falsa do topo.

Correção:
- ajustei a expectativa para a navegação atual e mantive a regra importante:
  - sem link falso;
  - sem promessa exagerada;
  - sem orçamento presumido.

## Arquivos alterados

- `src/catalog/CategoryBuilder.js`
- `src/connectors/MercadoLivreConnector.js`
- `src/providers/MercadoLivreProvider.js`
- `test/catalog-manager.test.js`
- `test/coupon-provider.test.js`
- `test/csv-product-importer.test.js`
- `test/feed-provider.test.js`
- `test/google-merchant-adapter.test.js`
- `test/marketplace-provider.test.js`
- `test/product-importer.test.js`
- `test/production-coherence.test.js`
- `test/search-orchestrator.test.js`
- `test/verified-affiliate-offer-provider.test.js`

## Prova técnica

Última validação executada no branch limpo:

- `node --test` → 147 pass / 0 fail
- `node --check public/app.js` → OK
- `node --check api/web.js` → OK
- `node --check server.mjs` → OK
- `node --check src/engines/RankingEngine.js` → OK

## Observação sobre preview

O preview da Vercel foi localizado, mas a inspeção visual externa retornou a tela de login da própria Vercel, então a validação visual automatizada ficou bloqueada por proteção do deployment preview.
