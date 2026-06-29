# Relatorio de isolamento da funcao Vercel

Data da verificacao: 2026-06-29 16:00 BRT

## O que foi testado

### Produção atual

- `/`
- `/api/health`
- `/api/catalog/health`
- `/api/search?q=xiaomi&mode=total&totalBudget=1500`
- `/api/ping`

### Resultado observado

Todos os endpoints continuam respondendo:

- `500`
- `FUNCTION_INVOCATION_FAILED`

## O que foi feito para isolamento

Foi criado um endpoint minimo:

```js
export default function handler(req, res) {
  res.status(200).json({ ok: true, route: "ping", runtime: "vercel" });
}
```

Tambem foi adicionada uma rewrite explicita para `/api/ping` antes da rewrite geral de `/api/(.*)` no `vercel.json`.

## Evidencia obtida

Mesmo com o endpoint minimo, a producao continuou retornando:

- `500 Internal Server Error`
- `X-Vercel-Error: FUNCTION_INVOCATION_FAILED`

Isso mostra que, no momento desta verificacao, a producao ainda nao estava executando o deployment novo de forma saudavel.

## Stack trace

Nao foi possivel copiar o stack trace real do painel da Vercel com os recursos disponiveis nesta sessao.

## Conclusao operacional

Com base nos testes feitos, o problema ainda nao esta isolado a um unico modulo do codigo da aplicacao.
O endpoint minimo tambem falhou em producao, entao o bloqueio permanece no lado do deployment/execucao serverless da Vercel ou na propagacao do deploy ativo.

## Proximo passo recomendado

- abrir os runtime logs do deployment ativo na Vercel;
- confirmar se o dominio esta apontando para o deployment mais recente;
- validar se o deployment passou a `Ready` e se o alias foi atualizado;
- somente depois disso retomar qualquer novo ajuste de codigo.

