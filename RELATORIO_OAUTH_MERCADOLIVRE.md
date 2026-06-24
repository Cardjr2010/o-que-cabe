# RELATÓRIO OAUTH MERCADO LIVRE

Data: 2026-06-23

## Objetivo

Implementar o fluxo OAuth do Mercado Livre no projeto para habilitar consultas reais de produto com `Authorization: Bearer ACCESS_TOKEN`, sem alterar a home nem o layout principal.

## Fluxo implementado

1. Leitura de credenciais via `.env`
   - `CLIENT_ID` / `CLIENT_SECRET`
   - também aceito:
     - `MERCADOLIVRE_CLIENT_ID`
     - `MERCADOLIVRE_CLIENT_SECRET`
     - `MERCADO_LIVRE_CLIENT_ID`
     - `MERCADO_LIVRE_CLIENT_SECRET`

2. Rota de início de autenticação
   - `GET /auth/mercadolivre`
   - Redireciona para o domínio oficial de autorização do Mercado Livre.

3. Callback OAuth
   - `GET /auth/mercadolivre/callback`
   - Recebe `code`
   - Troca o código por `access_token` e `refresh_token`
   - Salva os dados em arquivo local de teste:
     - `data/mercadolivre-oauth.json`

4. Adapter de Mercado Livre
   - `src/adapters/products.mercadolivre.js`
   - Agora envia:
     - `Authorization: Bearer ACCESS_TOKEN`
   - para consultar:
     - `https://api.mercadolibre.com/items/ITEM_ID`

## Comportamento quando não há token

Se ainda não existir token salvo, a interface de Mercado Livre mostra:

> Conecte sua conta Mercado Livre para consultar produtos reais.

## Arquivos alterados

- `server.mjs`
- `src/adapters/products.mercadolivre.js`

## Arquivo local de teste

- `data/mercadolivre-oauth.json`

Esse arquivo guarda, para ambiente local:

- `access_token`
- `refresh_token`
- `token_type`
- `expires_in`
- `scope`
- `user_id`
- `created_at`

## Observações importantes

- A home continua intacta.
- A rota `/mercadolivre-manual` foi mantida.
- O fluxo é apropriado para teste local e desenvolvimento.
- Em ambiente real, o `refresh_token` deve ser renovado quando expirar.
- O `redirect_uri` usado pelo projeto é:
  - `http://localhost:4173/auth/mercadolivre/callback`

## Teste esperado

Depois de autorizar a conta:

1. Acesso em `/auth/mercadolivre`
2. Login e consentimento no Mercado Livre
3. Retorno para `/auth/mercadolivre/callback`
4. Token salvo localmente
5. `/mercadolivre-manual` passa a consultar produtos reais
