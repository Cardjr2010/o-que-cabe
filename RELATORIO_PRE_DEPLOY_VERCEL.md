# RELATORIO PRE DEPLOY VERCEL

## Validação local

- Home: OK em `https://localhost:4173/`
- `/teste-produtos`: mantida
- `/teste-viagens`: mantida
- `/mercadolivre-manual`: mantida
- `/api/ml-auth-status`: OK, retornando status de configuração

## Observação

O projeto foi preparado para deploy na Vercel com HTTPS público, mantendo as rotas existentes e sem expor `Client Secret` no código.

## Rotas importantes

- `https://localhost:4173/`
- `https://localhost:4173/auth/mercadolivre`
- `https://localhost:4173/api/ml-auth-status`
- `https://localhost:4173/api/ml-test-item?itemId=MLB1234567890`
