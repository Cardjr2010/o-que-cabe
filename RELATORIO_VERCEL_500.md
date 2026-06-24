# RELATORIO VERCEL 500

## Causa raiz

A Vercel estava tratando `server.mjs` como entrypoint da função, em vez de usar `api/web.js`.

## Arquivo responsável

- `vercel.json`

## Correção aplicada

- a configuração passou a apontar explicitamente para `api/web.js`
- `api/web.js` é agora o único ponto de entrada serverless
- `server.mjs` continua existindo apenas para uso local, mas não deve mais ser o alvo da função da Vercel

## Configuração final

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/web.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/web.js"
    }
  ]
}
```

## Testes realizados

- `node --check api/web.js`
- importação do módulo `api/web.js`
- chamada local a `/` retornando:
  - status `200`
  - `{"status":"ok","project":"O Que Cabe"}`

## Observação

O erro de exportação inválida estava relacionado à resolução de entrypoint da Vercel. O ajuste força a plataforma a usar apenas `api/web.js`.

