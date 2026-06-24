# O Que Cabe

Marca visual: `OQC`

Slogan principal: `Você diz quanto pode pagar. A gente mostra o que cabe.`

Slogan secundário: `Seu orçamento. Sua escolha. Sem complicação.`

Projeto de teste para curadoria de produtos com foco em orçamento, parcelas e integração com Mercado Livre.

## Rodar localmente

1. Instale as dependências do Node.
2. Rode:

```bash
npm run dev
```

3. Abra:

- `http://localhost:4173/`
- `http://localhost:4173/teste-produtos`
- `http://localhost:4173/teste-viagens`
- `http://localhost:4173/mercadolivre-manual`

## Variáveis de ambiente

Crie um `.env` com:

```env
MELI_CLIENT_ID=
MELI_CLIENT_SECRET=
MELI_REDIRECT_URI=https://SUA-URL-VERCEL/auth/mercadolivre/callback
```

## Deploy na Vercel

1. Envie o repositório para o GitHub.
2. Conecte o GitHub na Vercel.
3. Configure as variáveis em Environment Variables.
4. Faça deploy.
5. Cadastre a Redirect URI no Mercado Livre com a URL pública da Vercel.
