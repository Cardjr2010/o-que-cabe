# Prova Gecko API Real

Data: 22/07/2026

## Probe executado

Comando:

```powershell
node scripts/probe-gecko-api.mjs "iphone 17"
```

## Resultado sanitizado

- `GECKO_API_BASE_URL`: ausente
- `GECKO_API_KEY`: ausente
- status Amazon: `503`
- status Mercado Livre: `503`
- status Magalu: `503`
- status Casas Bahia: `503`
- `errorType`: `GECKO_NOT_CONFIGURED`

## Conclusão

Gecko API ainda não está autenticada neste ambiente. A camada foi preparada, mas a prova real ainda depende de configuração.

