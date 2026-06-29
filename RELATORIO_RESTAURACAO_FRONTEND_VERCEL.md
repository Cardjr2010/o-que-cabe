# Relatorio Restauracao Frontend Vercel

## Causa raiz
A configuracao da Vercel estava com uma rota coringa apontando tudo para `api/web.js`. Isso fazia a funcao interceptar tambem `/app.js`, `/styles.css`, `favicon` e demais arquivos do `public/`, impedindo o carregamento da interface completa.

## Correcao aplicada
- Removi o catch-all que enviava todas as rotas para `api/web.js`.
- Mantive `api/web.js` apenas para as rotas de API e paginas dinamicas do projeto.
- Permiti que a Vercel sirva `public/index.html`, `public/app.js`, `public/styles.css` e icones como arquivos estaticos.
- Adicionei `GET /api/frontend-health` para validar a presenca dos arquivos do frontend.

## Diferenca entre local e producao
- Localmente, o projeto ja carregava a home porque os arquivos existiam no disco e o servidor local resolvia tudo.
- Em producao, o catch-all da Vercel estava desviando os assets para a funcao, causando 404 nos arquivos estaticos.

## Como evitar regressao
- Nao voltar a usar rota coringa para toda a aplicacao.
- Manter caminhos estaticos separados de rotas de API.
- Validar sempre `GET /api/frontend-health`, `/app.js`, `/styles.css` e `/favicon.*` apos novos deploys.

## Validacao pendente apos deploy
- `/` deve abrir a home completa.
- `/app.js` deve responder 200.
- `/styles.css` deve responder 200.
- `/api/frontend-health` deve responder com `mainLoaded: true`.
