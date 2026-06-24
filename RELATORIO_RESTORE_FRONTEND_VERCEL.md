# RELATORIO RESTORE FRONTEND VERCEL

## Objetivo

Restaurar a interface real do O Que Cabe sem quebrar a função serverless da Vercel.

## Correção aplicada

- `api/web.js` passou a ser o único handler da Vercel
- a rota `/` voltou a renderizar a home real via HTML
- as rotas:
  - `/teste-produtos`
  - `/teste-viagens`
  - `/mercadolivre-manual`
  continuam sendo servidas pela função
- `server.mjs` permaneceu intacto para uso local

## Testes realizados

- `/` retorna HTML
- `/teste-produtos` retorna HTML
- `/teste-viagens` retorna HTML
- `/mercadolivre-manual` retorna HTML
- `/api/ml-auth-status` responde JSON

## Observação

A função da Vercel não importa mais `server.mjs`, evitando o erro de entrypoint anterior.

