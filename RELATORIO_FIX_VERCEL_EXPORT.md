# RELATORIO FIX VERCEL EXPORT

## Problema

O deploy na Vercel retornava 500 com mensagem de exportação inválida no módulo.

## Ajuste aplicado

- `api/web.js` foi mantido com `export default function handler(req, res)`.
- A importação do `requestHandler` continua centralizada em `server.mjs`.
- Validação local confirmou que o módulo `api/web.js` exporta uma função default válida.

## Validação local

- `api/web.js` passa em `node --check`
- `import('./api/web.js')` retorna `default` como `function`

## Arquivos envolvidos

- `api/web.js`
- `server.mjs`
- `vercel.json`

## Observação

A correção foi preparada localmente. O próximo passo depende do push no repositório para a Vercel disparar o redeploy automático.

