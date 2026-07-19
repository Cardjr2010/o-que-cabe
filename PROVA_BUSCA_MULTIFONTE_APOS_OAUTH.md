# Prova Busca Multifuonte apos OAuth

Data da auditoria: 19/07/2026

## Estado atual das fontes externas

Amazon:

- token valido: `SIM`
- elegivel: `NAO`
- operacional: `NAO`
- motivo: `ASSOCIATE_NOT_ELIGIBLE`

Mercado Livre:

- client id/secret: `SIM`
- access token real: `NAO`
- refresh token real: `NAO`
- operacional: `NAO`
- motivo: `authorizationRequired`

## Comportamento esperado apos autorizacao real do Mercado Livre

1. Catalogo interno continua prioritario.
2. Mercado Livre entra como enriquecimento/fallback externo.
3. Amazon continua apenas como diagnostico enquanto inelegivel.
4. O usuario nao ve erro tecnico.

## Prova atual

Enquanto Amazon permanece inelegivel e o Mercado Livre nao tem token real persistido:

- busca publica multifonte operacional: `NAO`
- iPhone 17 encontrado via fonte externa em producao: `NAO`

## O que precisa acontecer para virar SIM

1. `/api/ml/oauth/start` iniciado por administrador.
2. Callback concluido com conta real.
3. Tokens gravados no store persistente.
4. `node scripts/probe-mercado-livre-api.mjs "iphone 17"` retornando itens reais.
5. `/api/ml/status` com:

```json
{
  "configured": true,
  "authenticated": true,
  "operational": true,
  "authorizationRequired": false
}
```

6. Busca publica do OQC exibindo:
   - itemId real
   - permalink direto
   - preco real
   - origem Mercado Livre

## Conclusao

Busca multifonte pronta para ativacao: `SIM`

Busca multifonte operacional em producao hoje: `NAO`
