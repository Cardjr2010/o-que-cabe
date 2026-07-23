# Revalidação manual de ofertas — 23/07/2026

## Escopo

- Revalidar manualmente apenas links que ainda importam para a home.
- Atualizar `verifiedAt` só nas ofertas confirmadas hoje.
- Tirar Magalu do fluxo automático até resolver captcha/403.

## Resultado por oferta

### Confirmadas hoje

1. `verified-amazon-galaxy-s26-ultra-256gb`
   - Fonte: Amazon
   - Status: confirmada
   - Evidência: página de produto abriu com título, preço e parcelamento.
   - `verifiedAt` atualizado para `2026-07-23T00:30:00.000Z`

2. `verified-amazon-iphone-17-pro-256gb`
   - Fonte: Amazon
   - Status: confirmada
   - Evidência: página de produto abriu com título e preço.
   - `verifiedAt` atualizado para `2026-07-23T00:30:00.000Z`

### Não confirmadas hoje

1. `verified-ml-iphone-17-pro-max-256gb`
   - Fonte: Mercado Livre
   - Status: não confirmada hoje
   - Evidência: requisição anônima caiu em `suspicious traffic / account verification`.
   - Ação: `verifiedAt` mantido antigo, oferta fica oculta até nova confirmação real.

2. `verified-ml-galaxy-s26-ultra-256gb`
   - Fonte: Mercado Livre
   - Status: não confirmada hoje
   - Evidência: mesma barreira de `account verification`.
   - Ação: `verifiedAt` mantido antigo, oferta fica oculta até nova confirmação real.

3. `verified-magalu-galaxy-s26-ultra-512gb`
4. `verified-magalu-iphone-17-pro-max-256gb`
   - Fonte: Magalu / Magazine Você
   - Status: removidas do fluxo automático
   - Evidência: shortlinks e fluxo automatizado seguem inconsistentes por captcha/403.
   - Ação: bloqueadas na automação, permanecem fora da home e da busca automática.

## Mudanças aplicadas

- `src/data/verified-affiliate-offers.js`
  - bloqueio explícito de `magalu` / `magazinevoce` na automação;
  - atualização de `verifiedAt` apenas nas duas ofertas Amazon confirmadas hoje.

- `test/verified-affiliate-offer-provider.test.js`
  - teste cobrindo exclusão automática de Magalu.

- `test/home-data.test.js`
  - ajuste para refletir o novo estado da home com duas ofertas realmente revalidadas.

## Efeito esperado na home

- cupons antigos continuam fora;
- campanhas antigas continuam fora;
- Magalu deixa de contaminar o radar automático;
- só ofertas revalidadas hoje entram no radar.

## Pendência real

- Mercado Livre ainda precisa de validação autenticada ou browser humano sem bloqueio de `suspicious traffic` para voltar a ganhar `verifiedAt` novo.
