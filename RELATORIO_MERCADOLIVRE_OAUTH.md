# RELATÓRIO MERCADO LIVRE OAUTH

Data: 2026-06-23

## Objetivo

Habilitar OAuth do Mercado Livre no projeto para consultas reais de produtos sem alterar a home, sem mexer em `/teste-produtos`, `/teste-viagens` e sem remover a tela `/mercadolivre-manual`.

## Credenciais

O projeto passa a ler:

- `MELI_CLIENT_ID`
- `MELI_CLIENT_SECRET`

Essas credenciais ficam no `.env` apenas para teste local.

## Fluxo implementado

1. `GET /auth/mercadolivre`
   - Inicia o fluxo OAuth oficial do Mercado Livre.

2. `GET /auth/mercadolivre/callback`
   - Recebe o `code` de autorização.
   - Troca o `code` por tokens em `https://api.mercadolibre.com/oauth/token`.
   - Salva localmente:
     - `access_token`
     - `refresh_token`
     - `expires_in`
     - `expires_at`

3. `GET /api/ml-auth-status`
   - Retorna:
     ```json
     {
       "authenticated": true,
       "token_expired": false
     }
     ```

4. `GET /api/ml-test-item?itemId=MLB1234567890`
   - Faz uma consulta isolada ao item.
   - Retorna:
     - status HTTP
     - título
     - preço
     - imagem
     - permalink

## Arquivo local de token

Arquivo criado para ambiente de teste:

- `data/mercadolivre-oauth.json`

## Atualização do adapter

`src/adapters/products.mercadolivre.js` agora:

- lê o token salvo localmente
- renova o token quando possível usando `refresh_token`
- envia `Authorization: Bearer ACCESS_TOKEN` nas chamadas de produto
- mantém a mensagem amigável quando não houver autenticação:
  - `Conecte sua conta Mercado Livre para consultar produtos reais.`

## Renovação de token

O fluxo considera:

- `expires_at` para saber se o token expirou
- `refresh_token` para renovar quando necessário

Se a renovação falhar, o projeto continua estável e retorna a mensagem de conexão.

## Possíveis erros

### 401

Normalmente indica:

- token ausente
- token expirado
- refresh token inválido
- credenciais OAuth incorretas

### 403

Normalmente indica:

- política de acesso do Mercado Livre bloqueando a chamada
- escopo insuficiente
- conta/app sem permissão para o recurso

## Validação esperada

1. Acessar `/auth/mercadolivre`
2. Logar e autorizar a aplicação
3. Voltar pelo callback
4. Confirmar status em `/api/ml-auth-status`
5. Testar um item em `/api/ml-test-item?itemId=MLB1234567890`

## Observação

A home permanece intacta e a tela `/mercadolivre-manual` continua disponível.

