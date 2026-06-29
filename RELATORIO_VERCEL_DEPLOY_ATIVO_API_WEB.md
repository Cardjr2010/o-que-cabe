# RELATORIO_VERCEL_DEPLOY_ATIVO_API_WEB.md

## Estado observado em produção antes do hotfix

- `/` -> 500 `FUNCTION_INVOCATION_FAILED`
- `/api/health` -> 500 `FUNCTION_INVOCATION_FAILED`
- `/api/catalog/health` -> 500 `FUNCTION_INVOCATION_FAILED`
- `/api/search` -> 500 `FUNCTION_INVOCATION_FAILED`
- `/api/ml-connector-test` -> 500 `FUNCTION_INVOCATION_FAILED`

Os assets estáticos estavam OK:

- `/index.html` -> 200
- `/app.js` -> 200
- `/styles.css` -> 200

## Deploy ativo na Vercel

Não foi possível ler o painel de deployments da Vercel diretamente com as ferramentas disponíveis nesta sessão.
Por isso, o commit ativo no domínio não pôde ser confirmado pela interface.

## Hipótese validada localmente

O código local do `api/web.js` já estava saudável após o hotfix anterior, mas a produção continuava devolvendo 500.
Isso indicava que o domínio ainda não estava refletindo o runtime novo ou que faltava um marcador simples para confirmar a versão em execução.

## Hotfix aplicado

Foi adicionado um health check mínimo no topo do handler:

```json
{
  "ok": true,
  "buildCommit": "unknown",
  "buildTime": "...",
  "apiVersion": "health-minimal-001"
}
```

## Validação local

O endpoint mínimo respondeu corretamente localmente:

- `/api/health` -> 200
- payload mínimo com `apiVersion: "health-minimal-001"`

## Próximo passo

Publicar o hotfix e verificar se a Vercel passa a responder com o marcador mínimo. Se continuar 500, o problema já não será o catálogo, e sim o runtime/deploy ativo da função.

