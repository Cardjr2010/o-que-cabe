# Relatorio Hotfix Home Route Vercel

## Problema
A home estava retornando 404 porque a rota raiz nao estava sendo entregue ao handler da aplicacao. A API continuava funcionando, mas `/` e os assets do frontend nao chegavam em `api/web.js`.

## Correcao aplicada
- Ajustei o `vercel.json` para que `/`, `/app.js`, `/styles.css`, `/favicon.svg` e `/favicon.png` sejam roteados diretamente para `api/web.js`.
- Mantive `/api/(.*)` indo para `api/web.js`.
- Mantive o fallback do handler para ler os assets do bundle local em `api/static/` quando necessario.

## O que nao foi alterado
- CatalogManager
- FeedProvider
- BudgetEngine
- ScoreEngine
- RankingEngine
- API de catalogo
- Feeders/importadores

## Como evitar regressao
- Garantir que `/` sempre tenha uma rota clara para o handler da home.
- Validar sempre `/`, `/app.js`, `/styles.css` e `/api/*` apos deploy.
- Nao usar a ausencia da home como sinal de problema no motor ou no catalogo.
