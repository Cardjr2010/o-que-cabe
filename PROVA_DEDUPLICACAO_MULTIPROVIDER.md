# Prova de Deduplicação Multiprovider

Data: 22/07/2026

## Regra implementada

A deduplicação agora usa:

- `canonicalUrl`
- `sourceProductId`
- `title`

Quando dois providers confirmarem a mesma oferta, o produto final mantém:

- uma única entrada pública;
- `providerConfirmations` com histórico de confirmação.

## Estado atual

Nesta rodada não houve prova real com duas fontes vivas ao mesmo tempo porque:

- Gecko está desconfigurada;
- Mercado Livre direto está sem OAuth válido;
- Amazon direta está inelegível.

## Resultado

A mecânica está implementada e coberta pelo fluxo da camada nova. A prova ao vivo depende de pelo menos duas fontes operacionais para a mesma consulta.

