# RELATORIO - REPRODUCAO MERCADO LIVRE / WOOCOMMERCE

## Objetivo

Reproduzir no OQC o caminho funcional observado no WooCommerce/WordPress para buscar produtos do Mercado Livre por palavra-chave e abrir anuncio direto, sem usar pagina generica de busca.

## Resultado da investigacao

O caminho anonimo direto do OQC para:

`https://api.mercadolibre.com/sites/MLB/search?q=...&limit=...`

retornou `403 forbidden` em chamadas reais para:

- iphone
- iphone 17 pro max
- samsung galaxy
- notebook gamer
Depois do ajuste, o erro foi classificado como:

`TOKEN_MISSING_OR_REQUIRED`

Isso confirma que o bloqueio nao era de ranking, catalogo, home ou botao. Era a forma de chamada ao Mercado Livre.

## WordPress/WooCommerce

Foi tentado abrir o painel WordPress para identificar o plugin e capturar a chamada exata, mas a tela acessivel nesta sessao redirecionou para login do WordPress. Por isso, nao foi possivel copiar o nome do plugin nem seus headers reais diretamente do painel.

Mesmo assim, o comportamento tecnico esperado foi reproduzido no OQC:

- suporte a token OAuth via `Authorization: Bearer`;
- suporte a endpoint/proxy configuravel, caso o plugin use uma camada intermediaria;
- normalizacao da resposta para o contrato OQC;
- bloqueio de URLs genericas;
- aceite apenas de anuncios com `itemId` e `permalink`.

Referencia oficial consultada: a documentacao de autenticacao do Mercado Livre Global Selling descreve o fluxo OAuth 2.0 e o uso de `access_token` para chamadas de API:

https://global-selling.mercadolibre.com/devsite/authentication-and-authorization-global-selling

## Diferencas encontradas entre OQC antigo e caminho funcional esperado

| Item | OQC antes | OQC agora |
| --- | --- | --- |
| Endpoint | API publica direta | API publica direta ou endpoint/proxy configuravel |
| Autenticacao | Sem token | Suporta Bearer token |
| Token local | Nao usado pelo provider novo | Usa env ou `data/mercadolivre-oauth.json` |
| URL generica | Barrada | Barrada |
| Item sem permalink | Barrado | Barrado |
| Diagnostico 403 | Erro generico | `TOKEN_MISSING_OR_REQUIRED` |
| Exposicao de segredo | Nao aplicavel | Token nunca aparece na resposta |

## Variaveis suportadas

O provider agora aceita:

- `MELI_ACCESS_TOKEN`
- `MERCADOLIVRE_ACCESS_TOKEN`
- `MERCADO_LIVRE_ACCESS_TOKEN`
- `MERCADOLIVRE_SEARCH_ENDPOINT`
- `MELI_SEARCH_ENDPOINT`

Tambem tenta ler:

`data/mercadolivre-oauth.json`

quando existir `access_token` salvo.

## Regras obrigatorias preservadas

Um resultado Mercado Livre so entra se tiver:

- `itemId`
- `permalink`
- titulo
- preco valido

O botao deve usar:

- `permalink`

Nunca usar:

- pagina generica de busca;
- pagina de categoria;
- `lista.mercadolivre.com.br`;
- link sem itemId;
- link montado manualmente sem validacao.

## Validacao local

### Provider real sem token

Chamadas reais sem token retornaram:

| Busca | HTTP | Resultado |
| --- | --- | --- |
| iphone | 403 | TOKEN_MISSING_OR_REQUIRED |
| iphone 17 pro max | 403 | TOKEN_MISSING_OR_REQUIRED |
| samsung galaxy | 403 | TOKEN_MISSING_OR_REQUIRED |
| notebook gamer | 403 | TOKEN_MISSING_OR_REQUIRED |

### API OQC local

`/api/search?q=iphone%2017%20pro%20max&mode=total&totalBudget=10000`

Resultado:

- HTTP 200;
- catalogo OQC continuou respondendo;
- fallback Mercado Livre foi tentado;
- `fallbackStatusHttp = 403`;
- nenhum anuncio Mercado Livre sem permalink foi exibido.

`/api/search?q=samsung%20galaxy&mode=total&totalBudget=3000`

Resultado:

- HTTP 200;
- catalogo OQC foi mantido como prioridade;
- fallback Mercado Livre nao foi acionado porque havia cobertura do catalogo principal.

## Testes executados

Executado:

- `node --test`
- `node --check src/providers/MercadoLivreSearchProvider.js`
- `node --check src/search/SearchOrchestrator.js`
- `node --check api/web.js`
- `node --check server.mjs`

Resultado:

- 137 testes passaram.

## Arquivos alterados

- `src/providers/MercadoLivreSearchProvider.js`
- `api/web.js`
- `test/mercadolivre-search-provider.test.js`

## Conclusao

O OQC agora esta preparado para reproduzir o fluxo funcional do WooCommerce:

1. se houver token OAuth ou proxy do plugin, a busca usa esse caminho;
2. se a API direta continuar retornando 403, o erro fica controlado;
3. nenhum resultado Mercado Livre aparece sem anuncio direto;
4. o catalogo principal do OQC continua prioritario;
5. os diagnosticos do fallback ficam visiveis na API, sem expor segredo.

Proximo passo pratico:

Configurar em producao um token OAuth valido do Mercado Livre ou o endpoint/proxy funcional usado pelo plugin WooCommerce. Depois disso, repetir a validacao com:

- iphone
- iphone 17 pro max
- samsung galaxy
- notebook gamer
