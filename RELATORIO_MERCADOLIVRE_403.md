# RELATÓRIO DE DIAGNÓSTICO MERCADO LIVRE

Data do teste: 2026-06-23T21:21:24.241Z

Item consultado: MLB1234567890
URL base consultada: https://produto.mercadolivre.com.br/MLB-1234567890-produto-exemplo-_JM

## Resultado geral

O endpoint atual do adapter falhou com PA_UNAUTHORIZED_RESULT_FROM_POLICIES.

## Endpoint atual do adapter /items

- URL chamada: https://api.mercadolibre.com/items/MLB1234567890
- Status HTTP: 403
- Ok: não

### Headers

```json
{
  "access-control-allow-headers": "Content-Type",
  "access-control-allow-methods": "PUT, GET, POST, DELETE, OPTIONS",
  "access-control-allow-origin": "*",
  "access-control-max-age": "86400",
  "connection": "keep-alive",
  "content-length": "143",
  "content-type": "application/json",
  "date": "Tue, 23 Jun 2026 21:21:23 GMT",
  "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  "via": "1.1 f957d2d0965c772adf1bd0678251be6a.cloudfront.net (CloudFront)",
  "x-amz-cf-id": "WTmrSdyGwsA-KV0Apt6KnIFxJcp3HU08xhpaaAmo-TZ98yQRHmcNgA==",
  "x-amz-cf-pop": "GIG52-P2",
  "x-api-server-segment": "legacy",
  "x-cache": "Error from cloudfront",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "x-policy-agent-block-code": "PA_UNAUTHORIZED_RESULT_FROM_POLICIES",
  "x-policy-agent-block-reason": "At least one policy returned UNAUTHORIZED.",
  "x-request-id": "25fc862d-c517-41ba-807d-0a3f1bab1ecd",
  "x-xss-protection": "1; mode=block"
}
```

### Body

```json
{
  "status": 403,
  "blocked_by": "PolicyAgent",
  "code": "PA_UNAUTHORIZED_RESULT_FROM_POLICIES",
  "message": "At least one policy returned UNAUTHORIZED."
}
```

## Endpoint de busca /sites/MLB/search

- URL chamada: https://api.mercadolibre.com/sites/MLB/search?q=celular
- Status HTTP: 403
- Ok: não

### Headers

```json
{
  "access-control-allow-headers": "Content-Type",
  "access-control-allow-methods": "PUT, GET, POST, DELETE, OPTIONS",
  "access-control-allow-origin": "*",
  "access-control-max-age": "86400",
  "connection": "keep-alive",
  "content-encoding": "gzip",
  "content-length": "78",
  "content-type": "application/json; charset=utf-8",
  "date": "Tue, 23 Jun 2026 21:21:23 GMT",
  "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  "vary": "Accept-Encoding",
  "via": "1.1 90153628fae6382bd1cc7ccc4cba6654.cloudfront.net (CloudFront)",
  "x-amz-cf-id": "8xRkEEJaOye_HEU6lQttGQaVGCjWhKW5WCq04uZGonh-4ujo0ePG5w==",
  "x-amz-cf-pop": "GIG52-P2",
  "x-api-server-segment": "legacy",
  "x-cache": "Error from cloudfront",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "x-request-id": "b09f6ec4-bc78-4613-a6b5-f48960cb7812",
  "x-xss-protection": "1; mode=block"
}
```

### Body

```json
{
  "message": "forbidden",
  "error": "forbidden",
  "status": 403,
  "cause": []
}
```

## Endpoint alternativo documentado /currencies/BRL

- URL chamada: https://api.mercadolibre.com/currencies/BRL
- Status HTTP: 403
- Ok: não

### Headers

```json
{
  "access-control-allow-headers": "Content-Type",
  "access-control-allow-methods": "PUT, GET, POST, DELETE, OPTIONS",
  "access-control-allow-origin": "*",
  "access-control-max-age": "86400",
  "connection": "keep-alive",
  "content-length": "143",
  "content-type": "application/json",
  "date": "Tue, 23 Jun 2026 21:21:23 GMT",
  "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  "via": "1.1 f957d2d0965c772adf1bd0678251be6a.cloudfront.net (CloudFront)",
  "x-amz-cf-id": "3g7nBhBRDw84jSFHAepWj2MfdqBHm2yxIK4_0vLE-5eT1Nqa6voEzg==",
  "x-amz-cf-pop": "GIG52-P2",
  "x-api-server-segment": "legacy",
  "x-cache": "Error from cloudfront",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "x-policy-agent-block-code": "PA_UNAUTHORIZED_RESULT_FROM_POLICIES",
  "x-policy-agent-block-reason": "At least one policy returned UNAUTHORIZED.",
  "x-request-id": "dfb7915f-9dff-42f4-8882-98488320d591",
  "x-xss-protection": "1; mode=block"
}
```

### Body

```json
{
  "code": "PA_UNAUTHORIZED_RESULT_FROM_POLICIES",
  "blocked_by": "PolicyAgent",
  "status": 403,
  "message": "At least one policy returned UNAUTHORIZED."
}
```

## Endpoint consultado pela URL do produto

- URL chamada: https://api.mercadolibre.com/items/MLB1234567890
- Status HTTP: 403
- Ok: não

### Headers

```json
{
  "access-control-allow-headers": "Content-Type",
  "access-control-allow-methods": "PUT, GET, POST, DELETE, OPTIONS",
  "access-control-allow-origin": "*",
  "access-control-max-age": "86400",
  "connection": "keep-alive",
  "content-length": "143",
  "content-type": "application/json",
  "date": "Tue, 23 Jun 2026 21:21:24 GMT",
  "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  "via": "1.1 90153628fae6382bd1cc7ccc4cba6654.cloudfront.net (CloudFront)",
  "x-amz-cf-id": "SDPYH9DlwvNqsaxFiBqm-9UDow43iaiASpp4H-qkU4zVZQK9qAslrA==",
  "x-amz-cf-pop": "GIG52-P2",
  "x-api-server-segment": "legacy",
  "x-cache": "Error from cloudfront",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "x-policy-agent-block-code": "PA_UNAUTHORIZED_RESULT_FROM_POLICIES",
  "x-policy-agent-block-reason": "At least one policy returned UNAUTHORIZED.",
  "x-request-id": "1fc9f973-ee18-47b0-93d1-cf2457fd0089",
  "x-xss-protection": "1; mode=block"
}
```

### Body

```json
{
  "blocked_by": "PolicyAgent",
  "code": "PA_UNAUTHORIZED_RESULT_FROM_POLICIES",
  "status": 403,
  "message": "At least one policy returned UNAUTHORIZED."
}
```

## Observações

- O endpoint de item do Mercado Livre respondeu com bloqueio de política (`PA_UNAUTHORIZED_RESULT_FROM_POLICIES`) neste ambiente.
- O teste confirma que o item MLB consultado é extraído corretamente da URL.
- A documentação oficial do Mercado Livre mostra APIs com autenticação via `Authorization: Bearer $ACCESS_TOKEN`, o que indica exigência de OAuth em vários recursos.
- A criação/gestão de aplicativos e credenciais é parte do fluxo oficial, então App ID e segredo podem ser necessários para cenários autenticados.
