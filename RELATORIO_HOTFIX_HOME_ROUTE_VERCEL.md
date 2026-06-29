# Relatorio Hotfix Home Route Vercel

## Problema
A home estava retornando 404 porque a rota raiz nao estava sendo entregue ao handler da aplicacao. A API continuava funcionando, mas `/` e os assets do frontend nao chegavam em `api/web.js`.

## Correcao aplicada
- Ajustei o `vercel.json` para que `/(.*)` seja roteado diretamente para `api/web.js`.
- O handler `api/web.js` continua servindo `/`, `/app.js`, `/styles.css` e os icones a partir do bundle local em `api/static/` quando necessario.

## O que nao foi alterado
- CatalogManager
- FeedProvider
- BudgetEngine
- ScoreEngine
- RankingEngine
- API de catalogo
- Feeders/importadores

## Como evitar regressao
- Garantir que `/(.*)` continue apontando para o handler da home.
- Validar sempre `/`, `/app.js`, `/styles.css` e `/api/*` apos deploy.
- Nao usar a ausencia da home como sinal de problema no motor ou no catalogo.
