# Prova — Busca iPhone 17 no Mercado Livre

Data: 19/07/2026

## Consulta

- `iphone 17`

## Resultado isolado

- Provider:
  - `mercado_livre`
- Status HTTP:
  - `403`
- Erro:
  - `forbidden`
- dataMode:
  - `demo`
- Produtos aceitos:
  - `0`

## Diagnóstico

O provider tentou a busca, mas não havia autenticação real utilizável.

No ambiente local auditado:

- não existe `MELI_ACCESS_TOKEN` real no `.env`;
- não existe `MELI_REFRESH_TOKEN` real no `.env`;
- o arquivo local de OAuth encontrado é placeholder.

## Veredito

- iPhone 17 encontrado no Mercado Livre: **NÃO**
- Mercado Livre operacional no ambiente auditado: **NÃO**

## O que precisa existir para virar SIM

- token OAuth real;
- refresh token real;
- persistência compatível com produção;
- nova prova isolada com:
  - `itemId`
  - `permalink`
  - `price`
  - `image`
