# Relatorio - Fix do import do InfoStoreFeedProvider

## Causa raiz

O commit `bd831bb` estava tentando importar:

`../src/providers/InfoStoreFeedProvider.js`

Mas esse arquivo nao fazia parte do commit publicado no GitHub/Vercel.  
Resultado: o build da Vercel falhava com `UNRESOLVED_IMPORT`.

## O que foi corrigido

- O arquivo `src/providers/InfoStoreFeedProvider.js` foi incluido no repositorio.
- O arquivo `src/catalog/installments.js` tambem precisou ser incluido, porque o `SearchOrchestrator` importava esse modulo e a Vercel estava quebrando com `UNRESOLVED_IMPORT`.
- Nenhuma regra de layout, catalogo, seed ou motor foi alterada.

## Validacao local

- `node --check api/web.js`
- `node --check server.mjs`
- `node --test`

Resultado: todos passaram.

## Impacto esperado

Com o provider presente no commit, a Vercel deve conseguir resolver o import e concluir o deploy do `bd831bb`.
