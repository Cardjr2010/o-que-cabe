# Prova Cupons e Preco Final

Data: 2026-07-19

## O que existe no codigo

Foi criada uma camada unica de preco final em:

- `C:\Users\cardj\Documents\Codex\2026-06-10\files-mentioned-by-the-user-plano\work\cabe-no-bolso-site\src\pricing\CouponProvider.js`

Ela normaliza:

- cupom
- shipping
- cashback
- `finalPrice`

## Regra conservadora aplicada

O OQC so derruba o preco principal quando o cupom estiver verificado.

Regra implementada:

- cupom `verified` entra no calculo;
- cupom `unverified` nao derruba o preco principal;
- cashback nao verificado nao entra como desconto definitivo.

## Formula aplicada

`finalPrice = price + shipping - couponDiscount - verifiedCashback`

## Estado atual em producao

Cupons operacionais em producao: **NAO**

Motivo:

- nao ha fonte publica verificada de cupons ativos integrada ao frontend publicado;
- nao existe prova de codigo de cupom validado em tempo real chegando ao usuario;
- portanto o OQC nao deve prometer preco final com cupom externo ainda.

## O que ja esta resolvido

- estrutura de calculo pronta
- frontend pode consumir um formato unico
- comportamento conservador evita propaganda enganosa

## O que falta para virar SIM

- fonte de cupom verificavel
- data de verificacao
- status do cupom
- desconto aplicavel de forma auditavel
- resultado chegando ao frontend
