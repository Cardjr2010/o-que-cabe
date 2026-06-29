# Relatorio Hotfix Home 404 Vercel

## Problema
A home da producao estava respondendo 404 enquanto a API e o catalogo continuavam funcionando.

## Correcao aplicada
- Reestruturei o `vercel.json` para manter apenas as rotas dinamicas e de API apontando para `api/web.js`.
- Removi a rota coringa que estava prendendo a home num fluxo errado.
- Mantive `includeFiles` no formato de string aceito pela Vercel.

## O que o novo arquivo faz
- `/api/(.*)` continua indo para `api/web.js`.
- `/teste-produtos`, `/teste-viagens`, `/mercadolivre-manual` e `/catalog` continuam indo para `api/web.js`.
- `/` volta a ser servido como home estatica do projeto.
- `/app.js`, `/styles.css` e os icones seguem como arquivos estaticos do deploy.

## Como evitar regressao
- Nao usar rota coringa para tudo quando a home for estatica.
- Manter a API separada das rotas do frontend.
- Conferir sempre se `/` responde 200 depois de qualquer alteracao em `vercel.json`.
