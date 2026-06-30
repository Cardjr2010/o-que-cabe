# Relatorio de verificacao - app.mjs na Vercel

Data: 2026-06-30

## Confirmacoes locais

- Nao existe `app.mjs` na raiz do repositorio.
- O frontend esta em `public/app.js`.
- Existe `.vercelignore` contendo `app.mjs`.
- `package.json` nao aponta `main`, `module` ou `exports` para `app.mjs`.
- `vercel.json` esta minimo: `{ "version": 2 }`.

## Validacao publica atual

As chamadas publicas ainda retornam:

- `/api/ping` -> `500 FUNCTION_INVOCATION_FAILED`
- `/api/health` -> `500 FUNCTION_INVOCATION_FAILED`
- `/` -> `500 FUNCTION_INVOCATION_FAILED`

## Acesso ao painel da Vercel

Nesta verificacao, a sessao autenticada do painel da Vercel estava disponivel no Chrome local e permitiu abrir o deployment ativo.

## Deployment ativo observado

- Deployment: `FNDmukuTR7UUt2dqqiKAELhFBmPm`
- Commit: `34a8600`
- Status: `Preparar`
- Ambiente: `ProduÃ§Ã£o`
- Dominio principal exibido: `o-que-cabe.vercel.app`
- Host de runtime nos logs: `o-que-cabe-f96gwscl3-o-que-cabe.vercel.app`

## Runtime log atual

O log de runtime atual da funcao mostrou:

```text
30 de junho, 07:56: 50.17
PEGAR
500
o-que-cabe-f96gwscl3-o-que-cabe.vercel.app
/
ExportaÃ§Ã£o invÃ¡lida encontrada no mÃ³dulo "/var/task/server.mjs". A exportaÃ§Ã£o padrÃ£o deve ser uma funÃ§Ã£o ou um servidor. O processo do Node.js foi encerrado com o cÃ³digo de saÃ­da: 1. Os logs acima podem ajudar na depuraÃ§Ã£o do problema.
```

O mesmo erro aparece repetido para `/` e `/favicon.ico`.

## Estado da evidÃªncia

O erro publico atual nao e mais sobre `app.mjs`; o runtime agora falha em `server.mjs` com exportacao invalida.
Isso indica que a funcao serverless ainda esta carregando o entrypoint errado ou uma exportacao incompatÃ­vel no build/roteamento atual.


## Correcao aplicada

Foi adicionado `export default requestHandler;` ao final de `server.mjs`, preservando o comportamento local do servidor e tornando o mesmo handler compativel com o runtime serverless da Vercel.

## Observacao

Nesta rodada, nao foi possivel executar `node --check` localmente porque o `node` nao estava disponivel no PATH desta sessao do Windows.
