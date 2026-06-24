# RELATORIO_DIAGNOSTICO_ML_403

## Resumo
- A busca pública do Mercado Livre em `https://api.mercadolibre.com/sites/MLB/search?q=...` está retornando `403 forbidden`.
- O bloqueio ocorre no backend, antes de qualquer tela do navegador.
- Não há token salvo localmente para testar a variante autenticada.

## Endpoint testado
- `https://api.mercadolibre.com/sites/MLB/search?q=celular&limit=5`
- `https://api.mercadolibre.com/sites/MLB/search?q=motorola%20smartwatch&limit=5`

## Resultado da busca pública sem token
- `status HTTP: 403`
- `body: {"message":"forbidden","error":"forbidden","status":403,"cause":[]}`
- `headers relevantes:`
  - `access-control-allow-origin: *`
  - `content-type: application/json; charset=utf-8`
  - `x-cache: Error from cloudfront`
  - `x-api-server-segment: legacy`

## Busca com token
- Não foi possível testar com token porque não existe arquivo local de OAuth salvo em `data/mercadolivre-oauth.json`.
- Portanto, o estado local é:
  - `authenticated: false`
  - `tokenState: absent`

## Endpoint de diagnóstico criado
- `GET /api/ml-public-search-test?q=celular`

### O que ele retorna
- `statusHttp`
- `rawCount`
- `returnedCount`
- `firstFive`
- `error`
- `headers`
- `calledFrom`
- `cors`
- `userAgent`
- `tokenState`

## Conclusão técnica
- O problema não é CORS.
- O problema não é parâmetro de encoding.
- O problema também não é o frontend.
- A chamada está sendo feita do backend corretamente, mas a API responde `403 forbidden`.
- Sem token válido, a busca real pública não está liberada neste ambiente.

## Caminho atual para o MVP
- Quando a busca real falhar com `403`, o sistema continua caindo para demo.
- Em demo, o botão usa busca específica do Mercado Livre em vez de abrir a home.

## Próximo passo necessário
- Validar um fluxo autenticado com token válido, ou
- confirmar com a conta/API do Mercado Livre qual condição está liberando o endpoint de busca para este app.
