# Relatorio de investigacao da Vercel

Data da verificacao: 2026-06-29 17:05 BRT

## Deployment ativo

- Projeto: `o-que-cabe`
- Deployment ativo: `AF3KR5yUA1RxLtr8T8PGbsbq9UQg`
- Commit: `1a04751 — Add serverless reset report`
- Status: `Ready`
- Dominio principal apontando para este deployment: `o-que-cabe.vercel.app`

## O que foi confirmado

O deployment ativo no painel da Vercel esta `Ready`.
O dominio principal aponta para o deployment `Ready` mais recente.

## Runtime logs reais

Os logs de runtime do deployment ativo mostram o seguinte erro repetido nas requisições para `/` e `favicon.ico`:

```text
ReferenceError: document is not defined at file:///var/task/app.mjs:2:14
at ModuleJob.run (node:internal/modules/esm/module_job:430:25)
at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:661:26)
at async d (/opt/rust/nodejs.js:18:1001)
Node.js process exited with exit status: 1.
```

## Causa raiz observada

O runtime esta tentando executar `file:///var/task/app.mjs` e falha imediatamente com:

- `ReferenceError: document is not defined`

Isso indica que a funcao serverless esta importando ou executando codigo de frontend no ambiente Node da Vercel.

## Build logs

A pagina de deployment mostra o deployment como `Ready`, mas o trecho visivel do painel consultado nesta sessao nao expôs o texto completo do build log em formato copiado.
O erro decisivo obtido foi o runtime log acima, que ja aponta a causa do crash.

## Node runtime

No log visivel, o runtime aparece executando em Node na Vercel com stack interna em:

- `/opt/rust/nodejs.js`

O numero exato da versao do Node nao apareceu no trecho capturado do log visivel.

## Validação

Mesmo com o deployment `Ready`, as requisicoes para:

- `/`
- `/api/health`
- `/api/catalog/health`
- `/api/search?q=xiaomi&mode=total&totalBudget=1500`
- `/api/ping`

continuaram retornando `500 FUNCTION_INVOCATION_FAILED` durante a janela anterior de teste.

## Conclusao

A Vercel esta executando um deployment `Ready`, mas a funcao serverless esta quebrando porque `app.mjs` foi parar no runtime do servidor e tenta acessar `document`, que nao existe no Node.

## Proximo passo recomendado

Corrigir o ponto exato que faz `app.mjs` entrar no bundle/routing da funcao serverless e manter a home estatica separada da camada de API.

## Acao aplicada nesta rodada

Foi removido o arquivo raiz `app.js` do repositorio para evitar que o runtime da Vercel confunda o bundle do frontend com uma entrada executavel do servidor.
O frontend continua definido em `public/app.js`, que e o arquivo que o navegador deve carregar.

## Ajuste adicional

O `app.mjs` da raiz foi removido do repositorio para impedir que a Vercel tente tratá-lo como ponto de entrada serverless.
O frontend continua exclusivamente em `public/app.js`, carregado pelo navegador via `index.html`.

## Trava de deploy

Foi adicionada uma `.vercelignore` contendo `app.mjs` para garantir que esse arquivo não volte a entrar no bundle da Vercel caso seja recriado por engano no futuro.

## Validacao final desta rodada

- `/api/ping` -> `200 OK`
- `/api/health` -> `200 OK` com `apiVersion: "health-minimal-001"`
- `/` -> `200 OK`
- `/api/catalog/health` -> `200 OK` (catalogo ainda vazio na producão, separado da correção deste hotfix)
- `/api/search?q=xiaomi&mode=total&totalBudget=1500` -> `200 OK`
