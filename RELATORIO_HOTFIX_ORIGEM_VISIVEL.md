# Relatório - Hotfix de origem visível na interface

## O que foi ajustado

- A interface agora tenta exibir uma origem legível usando mais campos além de `marketplace`:
  - `sourceName`
  - `source`
  - `marketplace`
  - `provider`
  - `seller`
  - `store`
  - `sourceLabel`
  - `sourceDisplayName`
- Adicionei normalização visual para nomes conhecidos:
  - `flores_online` → `Flores Online`
  - `isabela_flores` → `Isabela Flores`
  - `saldao_informatica` → `Saldão da Informática`
  - `info_store` / `infostore` → `Info Store`
  - `ccp` → `CCP`
  - `authentical` → `Authentical`
  - `mi_shop` / `mishop` → `Mi Shop`
  - `awin` → `Awin`
  - `actionpay_saldao` → `Saldão da Informática`

## O que não mudou

- Busca
- Ranking
- Seed
- Motores
- Preço
- API

## Validação executada

- `node --check public/app.js`
- `node --check api/web.js`
- `node --check server.mjs`

## Resultado esperado

- Flores passa a mostrar `Flores Online`
- iPhone continua mostrando `Saldão da Informática`
- Samsung mostra a origem real disponível
- Se não existir nenhum identificador conhecido, a interface continua exibindo `Origem não informada`

## Observação

Esse hotfix corrige a camada visual da origem. A API não precisou ser alterada.
