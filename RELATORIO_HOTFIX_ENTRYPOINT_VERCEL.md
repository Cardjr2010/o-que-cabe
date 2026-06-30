# RELATORIO_HOTFIX_ENTRYPOINT_VERCEL

## Problema
- A Vercel estava tentando usar `server.mjs` como entrypoint.
- Depois que `server.mjs` foi ignorado, o build passou a falhar com `No entrypoint found in "/vercel/path0"`.

## Correção aplicada
- Removi `server.mjs` do `.vercelignore`.
- Adicionei `main: "api/web.js"` ao `package.json` para apontar a Vercel diretamente para o handler válido.

## Resultado esperado
- A Vercel não deve mais tentar usar `server.mjs` como root entrypoint.
- O deploy deve passar a usar `api/web.js` como ponto de entrada.

## Observação
- O `server.mjs` continua no repositório para uso local, sem ser o entrypoint de produção.
