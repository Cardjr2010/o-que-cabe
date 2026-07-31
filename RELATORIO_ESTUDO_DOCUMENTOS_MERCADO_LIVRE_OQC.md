# Relatorio - Estudo dos documentos Mercado Livre para o OQC

Data: 31/07/2026

## Objetivo

Entender, com base na documentacao oficial do Mercado Livre e no estado real do OQC em producao, por que a conta foi autorizada, mas a busca de produtos ainda nao retorna anuncios reais pela API.

## Fontes estudadas

- Documentacao oficial: Criar uma aplicacao no Mercado Livre
- Documentacao oficial: Autenticacao e Autorizacao
- Documentacao oficial: Permissoes funcionais
- Documentacao oficial: Erro 403
- Documentacao oficial: Busca de itens
- Documentacao oficial: Buscador de produtos
- CSV exportado pelo usuario: `archivo.csv`
- Relatorios locais anteriores do OQC sobre Mercado Livre
- Endpoints de producao do OQC

## Estado confirmado no OQC

Producao atual:

- commit: `ad91d0ac29c3ce1c88d970a23456588337ef83e5`
- token store: Redis
- `MELI_CLIENT_ID`: presente
- `MELI_CLIENT_SECRET`: presente
- refresh token persistido: sim
- Mercado Livre autorizado: sim
- Mercado Livre operacional: nao

Resposta atual de `/api/ml/status`:

- `configured: true`
- `authenticated: true`
- `operational: false`
- `hasRefreshToken: true`
- `tokenStore.mode: redis`

Teste atual de busca direta:

- endpoint OQC: `/api/ml-connector-test?q=xiaomi be6500`
- estrategia: `mercado_livre_direct_item_search`
- token: disponivel
- HTTP: `403`
- erro: `forbidden`

## O que o CSV prova

O arquivo `archivo.csv` prova que houve autorizacao real da aplicacao:

- `user_id`: presente
- `nickname`: presente
- `site_id`: `MLB`
- `app_id`: presente
- `auth_created`: `2026-07-31`
- `offline_access`: presente
- escopos `read` e `write`: presentes

Ele nao prova que a API de busca ampla de anuncios esta liberada para esse app. Ele prova autorizacao, nao operacionalidade comercial.

## O que a documentacao confirma

### OAuth

O fluxo OAuth usado pelo OQC esta alinhado com a documentacao:

- authorization code
- troca de code por token
- access token com validade de 6 horas
- refresh token de uso unico
- refresh token novo a cada renovacao
- uso do token no header `Authorization: Bearer`

Conclusao: o lado de autorizacao esta no caminho correto.

### Erro 403

A documentacao trata 403 como problema de acesso/permissao/restricao, incluindo:

- token de outro usuario;
- usuario inativo;
- IP bloqueado;
- scopes inabilitados;
- aplicacao bloqueada ou desabilitada;
- validacoes pendentes do usuario.

No OQC, o erro atual nao e "sem resultado". E uma negativa de acesso.

### Busca de itens

A documentacao de busca de itens mostra, com clareza, que os endpoints de listagem principais estao orientados a:

- itens por vendedor;
- itens por nickname;
- itens de uma conta de vendedor;
- multiget por IDs de itens.

O caminho documentado mais seguro para anuncios diretos e:

- receber ou descobrir `seller_id`/`nickname`; ou
- ter `itemId` direto; ou
- trabalhar com itens da conta autorizada.

A documentacao nao confirma que `/sites/MLB/search?q=produto` seja um buscador livre de marketplace para qualquer app. O OQC esta chamando exatamente esse tipo de busca ampla e recebe 403.

### Buscador de produtos

O endpoint `products/search` aceita `q`, `site_id` e `status`, mas ele busca produtos de catalogo, nao necessariamente anuncios compraveis.

Ele serve para encontrar ficha de produto, atributos e produtos relacionados ao catalogo do Mercado Livre. Isso ajuda o OQC a entender "qual produto e esse", mas nao substitui uma oferta final com:

- vendedor;
- preco final;
- parcelamento;
- frete;
- permalink direto de anuncio;
- estoque.

## Diagnostico objetivo

O problema atual nao e mais "faltou token".

O problema atual e:

> O app esta autorizado, mas o endpoint de busca ampla de anuncios que o OQC usa continua proibido pelo Mercado Livre.

Com os dados atuais, a causa mais provavel esta entre:

1. endpoint inadequado para busca ampla de marketplace;
2. permissao funcional insuficiente para esse recurso especifico;
3. aplicacao/conta ainda sem validacao ou elegibilidade completa;
4. politica do Mercado Livre bloqueando chamadas desse ambiente/IP;
5. necessidade de usar fluxo por seller, itemId, catalog product ou fonte de afiliado, nao busca aberta por palavra-chave.

## O que nao devemos fazer

- Nao declarar Mercado Livre operacional.
- Nao tratar 403 como zero produto.
- Nao preencher a busca com demo fingindo ser Mercado Livre.
- Nao usar URL generica de busca como oferta.
- Nao considerar `products/search` como oferta compravel sem validacao extra.

## Caminhos viaveis para o OQC

### Caminho A - API oficial para itens diretos

Usar quando tivermos:

- `itemId` vindo de link `meli.la` ou URL de produto;
- `seller_id`/nickname de loja oficial ou vendedor confiavel;
- endpoints permitidos para detalhe/multiget.

Uso no OQC:

- enriquecer oferta ja conhecida;
- confirmar preco, imagem, disponibilidade e permalink quando a API permitir.

### Caminho B - Intake de ofertas verificadas

Este e o melhor caminho pratico agora.

Entrada:

- links de Telegram;
- links `meli.la`;
- links Amazon;
- links Magalu;
- campanhas oficiais;
- CSV ou export do WooCommerce.

O OQC resolve, valida e salva:

- produto;
- preco;
- parcela;
- frete;
- cupom;
- validade;
- origem;
- link direto.

Depois o motor do OQC compara e recomenda.

### Caminho C - WooCommerce como ponte

Se o outro projeto WordPress/WooCommerce ja encontra produtos reais, precisamos descobrir se ele:

- usa plugin com proxy;
- usa cache local;
- salva produtos externos no WooCommerce;
- usa feed de afiliado;
- usa endpoint privado do plugin.

Se os produtos ficam no WooCommerce como "external product", o caminho mais rapido e importar do WooCommerce via REST API, em vez de tentar reproduzir a busca aberta do Mercado Livre.

### Caminho D - Produtos de catalogo para inteligencia

Usar `products/search` para melhorar:

- marca;
- modelo;
- familia;
- atributos;
- ficha tecnica;
- compatibilidade.

Mas nao usar isso sozinho como oferta de compra.

## Recomendacao final

A solucao mais forte para o OQC agora nao e insistir somente na busca aberta da API.

Recomendacao:

1. Manter OAuth/Redis do Mercado Livre como base tecnica.
2. Mudar a busca direta para um modo honesto:
   - testar `products/search` como inteligencia de catalogo;
   - testar busca por `seller_id`/nickname quando houver loja oficial;
   - usar `itemId` quando vier de link real.
3. Construir a camada principal de entrada de ofertas:
   - Telegram/link;
   - WooCommerce;
   - CSV;
   - screener controlado;
   - validade de campanha;
   - revalidacao diaria.
4. O frontend so deve mostrar Mercado Livre quando houver oferta real confirmada.

## Decisao operacional

Mercado Livre API geral por palavra-chave:

- autorizado: parcialmente
- token persistido: sim
- busca ampla operacional: nao
- motivo atual: HTTP 403 `forbidden`

Mercado Livre por oferta/link direto:

- viavel: sim
- melhor caminho imediato: sim
- exige revalidacao: sim

Produtos de catalogo ML:

- viavel para inteligencia: sim
- suficiente para venda: nao

## Proximo passo recomendado

Implementar no OQC uma camada de `OfferIntake` com prioridade:

1. aceitar links `meli.la`, Amazon, Magalu e Shopee;
2. resolver o destino;
3. extrair produto/preco/parcela/cupom quando possivel;
4. salvar com `verifiedAt` e `validUntil`;
5. revalidar antes de mostrar;
6. alimentar SearchOrchestrator como fonte real curada.

Esse caminho transforma o que os grupos fazem manualmente em uma maquina propria do OQC, sem depender de uma busca aberta que o Mercado Livre esta bloqueando.

