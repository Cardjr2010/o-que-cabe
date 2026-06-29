# Relatorio Restauracao Frontend Vercel

## Causa raiz
A configuracao da Vercel estava sem uma etapa de filesystem antes das rotas da API. Isso fazia as requisicoes de `public/` e dos assets dependerem da funcao, em vez de serem servidas como arquivos estaticos da propria plataforma.

## Correcao aplicada
- Ajustei o `vercel.json` para fazer todo o trafego cair em `api/web.js`, que agora serve a home e os assets sem depender da entrega estatica da plataforma.
- Mudei a entrega para o bundle da funcao, copiando os ativos do frontend para `api/static/` e fazendo a aplicacao responder tudo a partir de `api/web.js`.
- Simplifiquei o roteamento da Vercel para um `/(.*)` que sempre cai no mesmo handler, evitando divergencias entre a raiz e os assets.
- Adicionei `GET /api/frontend-health` para validar a presenca dos arquivos do frontend.

## Diferenca entre local e producao
- Localmente, o projeto ja carregava a home porque os arquivos existiam no disco e o servidor local resolvia tudo.
- Em producao, a ausencia de filesystem precedence fazia os assets estaticos nao serem servidos como esperado.

## Como evitar regressao
- Nao depender apenas de `public/` quando a plataforma nao estiver servindo esses arquivos.
- Manter os assets do frontend dentro do bundle da funcao quando necessario.
- Garantir que os assets publicados existam dentro do bundle da funcao quando a Vercel nao servir `public/` diretamente.
- Validar sempre `GET /api/frontend-health`, `/app.js`, `/styles.css` e `/favicon.*` apos novos deploys.

## Validacao pendente apos deploy
- `/` deve abrir a home completa.
- `/app.js` deve responder 200.
- `/styles.css` deve responder 200.
- `/api/frontend-health` deve responder com `mainLoaded: true`.
