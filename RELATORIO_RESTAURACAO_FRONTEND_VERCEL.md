# Relatorio Restauracao Frontend Vercel

## Causa raiz
A configuracao da Vercel estava sem uma etapa de filesystem antes das rotas da API. Isso fazia as requisicoes de `public/` e dos assets dependerem da funcao, em vez de serem servidas como arquivos estaticos da propria plataforma.

## Correcao aplicada
- Adicionei `handle: "filesystem"` no `vercel.json` para que a Vercel entregue primeiro os arquivos estaticos do `public/`.
- Mantive `api/web.js` apenas para as rotas de API e paginas dinamicas do projeto.
- Preservei a entrega de `public/index.html`, `public/app.js`, `public/styles.css` e icones como arquivos estaticos.
- Adicionei `GET /api/frontend-health` para validar a presenca dos arquivos do frontend.

## Diferenca entre local e producao
- Localmente, o projeto ja carregava a home porque os arquivos existiam no disco e o servidor local resolvia tudo.
- Em producao, a ausencia de filesystem precedence fazia os assets estaticos nao serem servidos como esperado.

## Como evitar regressao
- Nao voltar a usar rota coringa para toda a aplicacao.
- Manter caminhos estaticos separados de rotas de API.
- Validar sempre `GET /api/frontend-health`, `/app.js`, `/styles.css` e `/favicon.*` apos novos deploys.

## Validacao pendente apos deploy
- `/` deve abrir a home completa.
- `/app.js` deve responder 200.
- `/styles.css` deve responder 200.
- `/api/frontend-health` deve responder com `mainLoaded: true`.
