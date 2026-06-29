# Relatorio de reset da configuracao serverless da Vercel

Data da verificacao: 2026-06-29 17:08 BRT

## O que foi alterado

Foi reduzido o `vercel.json` ao minimo possivel:

```json
{
  "version": 2
}
```

O endpoint minimo `api/ping.js` tambem foi mantido com resposta simples:

```js
export default function handler(req, res) {
  res.status(200).json({ ok: true, route: "ping", runtime: "vercel" });
}
```

## Validacao realizada

### Produção

Teste em:

- `/api/ping`

Resultado:

- `500 Internal Server Error`
- `FUNCTION_INVOCATION_FAILED`

## Conclusao atual

Mesmo com a configuracao serverless reduzida ao minimo e com uma funcao `ping` bem simples, a producao continua falhando.

Isso indica que o problema ainda nao foi eliminado apenas pela simplificacao do `vercel.json`.

## O que ainda falta para fechar a causa raiz

1. Abrir os logs reais do deployment ativo na Vercel.
2. Confirmar se o deployment mais recente esta realmente em `Ready`.
3. Confirmar se o dominio principal esta apontando para esse deployment.
4. Obter o stack trace completo da funcao serverless.

