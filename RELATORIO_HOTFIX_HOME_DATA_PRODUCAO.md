# Relatório do hotfix `api/home-data`

## O que foi feito
- A rota `GET /api/home-data` foi publicada como função própria em `api/home-data.js`.
- A mesma lógica de catálogo da home foi centralizada em `src/runtime/home-data.js`.
- O handler central `api/web.js` continua com a rota equivalente, mas agora a produção também tem a função dedicada.

## Validação local
- `node --check api/home-data.js` ✅
- `node --check api/web.js` ✅
- `node --check src/runtime/home-data.js` ✅
- `GET /api/home-data` local ✅ retornou `200`
- Resposta local contém:
  - `ok: true`
  - `totalProducts: 830`
  - `categories` reais
  - `pechinchas` dinâmicas
  - `marketplaceSummary`
  - `sellerSummary`
  - `brandSummary`

## Motivo do hotfix
- Em produção, `/api/home-data` estava retornando `404 {"status":"not_found"}`.
- A rota agora está exposta como endpoint dedicado para evitar dependência apenas do roteamento central.

