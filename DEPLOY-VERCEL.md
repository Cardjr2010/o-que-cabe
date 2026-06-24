# Deploy Vercel

Marca oficial: O Que Cabe

Sigla visual: OQC

## 1. Subir para GitHub

- Crie um repositório no GitHub.
- Envie este projeto para o repositório.
- Não commit a `.env`.

## 2. Conectar na Vercel

- Importe o repositório pela Vercel.
- Deixe o framework como detectado automaticamente.

## 3. Variáveis de ambiente

Cadastre na Vercel:

- `MELI_CLIENT_ID`
- `MELI_CLIENT_SECRET`
- `MELI_REDIRECT_URI`

Exemplo de `MELI_REDIRECT_URI`:

- `https://SEU-PROJETO.vercel.app/auth/mercadolivre/callback`

## 4. Callback no Mercado Livre

Cadastre exatamente a mesma URL de `MELI_REDIRECT_URI`.

## 5. Como testar

- `/api/ml-auth-status`
- `/auth/mercadolivre`
- `/api/ml-test-item?itemId=MLB1234567890`

## 6. Erros comuns

- `401`: token ausente, expirado ou credencial inválida
- `403`: bloqueio de política ou permissão insuficiente
- `PA_UNAUTHORIZED_RESULT_FROM_POLICIES`: bloqueio do provedor
- `redirect_uri inválida`: a URL cadastrada não bate com a do app
