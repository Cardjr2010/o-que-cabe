# Prova Amazon Producao

Data: 2026-07-19

## Producao atual

URL: `https://o-que-cabe.vercel.app`

### Health

- Endpoint: `/api/health`
- Status: 200
- Build ativo: `78f6b6f0de6f03acfa728ab73964fe0b2128afb8`

### Status da Amazon

- Endpoint: `/api/amazon/status`
- Status: 200
- Resposta observada:

```json
{
  "configured": false,
  "provider": "rapidapi_amazon",
  "hasKey": false,
  "lastStatus": null,
  "lastErrorType": null
}
```

## Interpretacao

A Amazon nao esta operacional em producao neste momento.

O projeto agora tem um provider unico e auditavel (`AmazonRapidApiSearchProvider`), mas a producao ainda nao possui chave valida configurada.

## Veredito

Amazon operacional em producao: **NAO**

Provider Amazon utilizado no codigo: **RapidAPI Amazon**

## Condicoes para virar SIM

- `RAPIDAPI_AMAZON_KEY` valida no ambiente publicado
- `/api/amazon/status` com `configured: true`
- busca real retornando:
  - `asin`
  - `price` em BRL
  - `image`
  - `permalink` direto
  - `source = amazon`
- resultado chegando ao frontend
