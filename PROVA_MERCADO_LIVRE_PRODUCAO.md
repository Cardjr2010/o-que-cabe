# Prova Mercado Livre Producao

Data: 2026-07-19

## Producao atual

URL: `https://o-que-cabe.vercel.app`

### Health

- Endpoint: `/api/health`
- Status: 200
- Build ativo: `78f6b6f0de6f03acfa728ab73964fe0b2128afb8`

### Status do Mercado Livre

- Endpoint: `/api/ml/status`
- Status: 200
- Resposta observada:

```json
{
  "configured": true,
  "provider": "mercado_livre",
  "authenticated": false,
  "operational": false,
  "tokenState": "not_authenticated",
  "lastStatus": null,
  "lastErrorType": null
}
```

## Interpretacao

O Mercado Livre nao esta operacional em producao neste momento.

Mesmo com a camada de integracao preparada no codigo, a prova exigida para marcar `SIM` nao existe ainda porque:

- nao ha autenticacao valida ativa no deployment publicado;
- o endpoint de status nao confirma nenhuma busca externa bem-sucedida;
- o frontend publicado nao recebe anuncio direto do Mercado Livre em fallback.

## Prova local complementar

No ambiente local, depois de uma tentativa real de busca com token salvo em arquivo, o provider retornou:

- `statusHttp: 403`
- `error: forbidden`

E o diagnostico local ficou:

```json
{
  "configured": true,
  "provider": "mercado_livre",
  "authenticated": true,
  "operational": false,
  "tokenState": "available",
  "lastStatus": 403,
  "lastErrorType": "auth_failed"
}
```

Isso prova que o novo comportamento conservador esta correto: token presente nao basta.

## Veredito

Mercado Livre operacional em producao: **NAO**

## Condicoes para virar SIM

- `/api/ml/status` com `authenticated: true` e `operational: true`
- busca publicada retornando item real com:
  - `itemId`
  - `permalink`
  - `price`
  - `source = mercado_livre`
- resultado aparecendo no frontend
