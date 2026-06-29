# Relatorio Restauracao Frontend Vercel

## Causa raiz
A configuracao da Vercel estava sem uma etapa de filesystem antes das rotas da API. Isso fazia as requisicoes de `public/` e dos assets dependerem da funcao, em vez de serem servidas como arquivos estaticos da propria plataforma.

## Correcao aplicada
- Ajustei o `vercel.json` para voltar a priorizar o filesystem da Vercel antes das rotas da API.
- Publiquei os ativos do frontend tambem na raiz do deploy, para que `/`, `/app.js`, `/styles.css` e os icones possam ser servidos como arquivos estaticos.
- Mantive uma copia dos ativos dentro de `api/static/` para preservar a compatibilidade do handler caso a funcao precise ler os arquivos diretamente.
- Adicionei `GET /api/frontend-health` para validar a presenca dos arquivos do frontend.

## Diferenca entre local e producao
- Localmente, o projeto ja carregava a home porque os arquivos existiam no disco e o servidor local resolvia tudo.
- Em producao, a ausencia de filesystem precedence fazia os assets estaticos nao serem servidos como esperado.

## Como evitar regressao
- Nao depender apenas de `public/` quando a plataforma nao estiver servindo esses arquivos.
- Garantir que os assets publicados existam na raiz do deploy ou no bundle da funcao, conforme a estrategia usada.
- Validar sempre `GET /api/frontend-health`, `/app.js`, `/styles.css` e `/favicon.*` apos novos deploys.

## Validacao pendente apos deploy
- `/` deve abrir a home completa.
- `/app.js` deve responder 200.
- `/styles.css` deve responder 200.
- `/api/frontend-health` deve responder com `mainLoaded: true`.
