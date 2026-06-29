# Relatorio Hotfix Vercel JSON

## Erro encontrado
A Vercel rejeitava o deploy antes do build com o erro:

`vercel.json schema validation failed`

Detalhe oficial:

`functions.api/web.js.includeFiles should be string`

## O que foi alterado
No `vercel.json`, o campo `functions.api/web.js.includeFiles` foi ajustado de array para string:

- antes: `"includeFiles": ["api/static/**"]`
- depois: `"includeFiles": "api/static/**"`

## Por que a Vercel recusava o deploy
O schema atual da Vercel para essa configuracao espera `includeFiles` como string. O arquivo estava usando um array, o que invalidava o JSON perante o schema do deploy.

## Como evitar regressao
- Validar o schema do `vercel.json` antes de enviar para producao.
- Manter a configuracao da funcao no formato aceito pela versao atual da Vercel.
- Conferir mensagens de schema validation antes de investigar codigo da aplicacao.
