# Prova — Busca iPhone 17 na Amazon

Data: 19/07/2026

## Consulta

- `iphone 17`

## Ambiente auditado

- Ambiente local com credenciais reais de Amazon Creators API carregadas do `.env`
- Provider identificado:
  - `amazon_creators_api`
- Marketplace:
  - `www.amazon.com.br`

## Resultado bruto sanitizado

- Token:
  - `HTTP 200`
  - token emitido com sucesso
- Busca:
  - `HTTP 403`
  - `error = AssociateNotEligible`
  - `dataMode = demo`
  - `rawCount = 0`
  - `returnedCount = 0`

Resposta sanitizada da Amazon:

```json
{
  "message": "Your account does not currently meet the eligibility requirements.",
  "reason": "AssociateNotEligible",
  "type": "AccessDeniedException"
}
```

## Veredito

- iPhone 17 encontrado na Amazon: **NÃO**
- Motivo: **a conta autenticou, mas a busca foi negada por elegibilidade da conta**

## Observação importante

Este resultado prova que:

1. a API real foi encontrada;
2. o fluxo de token funciona;
3. o bloqueio atual não está no parser nem no frontend;
4. o bloqueio está na permissão/eligibilidade da conta da Amazon.
