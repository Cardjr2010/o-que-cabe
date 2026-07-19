# Prova Refresh Rotativo Mercado Livre

Data da auditoria: 19/07/2026

## O que foi implementado

No provider do Mercado Livre:

- refresh com `grant_type=refresh_token`;
- envio em `application/x-www-form-urlencoded`;
- trava unica por processo (`refreshPromise`);
- persistencia do novo token via `OAuthTokenStore`;
- fallback local apenas quando nao houver store configurado.

## Regras implementadas

1. Se varias buscas pedirem refresh ao mesmo tempo, apenas uma renova.
2. As demais aguardam a mesma promessa.
3. A resposta bem-sucedida salva:
   - novo `access_token`
   - novo `refresh_token`
   - nova expiracao
4. Placeholders locais nao contam como autenticacao real.

## O que ainda falta provar em producao

Para transformar essa implementacao em prova operacional, ainda faltam:

1. token real salvo no store persistente;
2. refresh real executado com sucesso;
3. nova busca funcionando depois da renovacao.

## Status honesto

Refresh rotativo implementado no codigo: `SIM`

Refresh rotativo testado com token real persistido: `NAO`
