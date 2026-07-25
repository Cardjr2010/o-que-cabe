# Relatorio - Ofertas verificadas Amazon e Mercado Livre

Data da validacao: 2026-07-24

## Resultado

O banco curado de ofertas verificadas passou a ter:

- 17 ofertas cadastradas no total;
- 15 ofertas frescas e publicaveis;
- 8 ofertas Amazon frescas;
- 7 ofertas Mercado Livre frescas;
- 0 ofertas Magalu no fluxo automatico, porque Magalu segue bloqueada para publicacao automatica ate resolver captcha/403/revalidacao.

## Novas ofertas Amazon adicionadas

Foram adicionadas 6 ofertas Amazon a partir de links reais revalidados:

1. Roteador Tenda AX3000 WiFi 6 RX12L Pro - R$ 199,99
2. GoPro Max 360 Camera de Acao 5.6K - R$ 1.992,75
3. Apple Magic Mouse Branco - R$ 849,00
4. Samsung Galaxy S26 5G 256GB 12GB RAM Branco - R$ 4.776,67
5. Apple iPhone 17 256GB Preto - R$ 6.099,00
6. Apple iPhone 17 Pro 256GB Prateado - R$ 9.777,77

Todas entraram com:

- link direto do produto;
- identificador ASIN;
- preco extraido da pagina final;
- imagem extraida da pagina final;
- origem Amazon;
- `dataMode = real`;
- `sourceType = verified_affiliate_offer`.

## Ajustes feitos

- O intake da Amazon agora extrai preco e imagem mesmo quando a pagina usa campos internos como `displayPrice`, `priceToPay`, `apexPriceToPay`, `a-offscreen`, `data-old-hires` e `landingImage`.
- A classificacao de links ficou mais rigorosa:
  - Amazon so aceita ASIN vindo de URL direta ou parametro confiavel;
  - Mercado Livre nao aceita mais pagina social, perfil, lista ou busca como produto direto;
  - links `meli.la` que redirecionam para `/social/` ficam como `needs_review`.
- A busca agora consulta ofertas verificadas quando existe cobertura curada para a consulta.
- O parser passou a reconhecer:
  - `Magic Mouse` como Apple;
  - `Tenda` como marca;
  - `GoPro` como marca;
  - `mouse` e `teclado` como intencao de acessorio explicita.
- O servidor local foi alinhado ao `SearchOrchestrator` usado pela API publica.

## Validacao local

Buscas testadas:

| Busca | Resultado principal | Origem | Preco | Link direto |
|---|---|---|---:|---|
| tenda ax3000 | Roteador Tenda AX3000 WiFi 6 RX12L Pro | Amazon | R$ 199,99 | Sim |
| gopro max 360 | GoPro Max 360 Camera de Acao 5.6K | Amazon | R$ 1.992,75 | Sim |
| magic mouse | Apple Magic Mouse Branco | Amazon | R$ 849,00 | Sim |
| iphone 17 256gb | Apple iPhone 17 256GB Preto | Amazon | R$ 6.099,00 | Sim |
| galaxy s26 | Samsung Galaxy S26 / S26 Ultra verificados | Amazon / Mercado Livre | a partir de R$ 4.776,67 | Sim |

## Mercado Livre

O Mercado Livre ja possui 7 ofertas frescas e publicaveis no banco curado.

Os links `meli.la` testados neste ciclo nao foram publicados automaticamente quando redirecionaram para paginas sociais/listas do Mercado Livre, porque isso nao e anuncio direto. Essa regra evita o erro anterior de publicar URL generica como se fosse produto.

Para escalar Mercado Livre com seguranca, o proximo caminho correto e um destes:

1. receber URL direta do produto/anuncio;
2. usar o caminho WooCommerce/plugin ja funcional como fonte auxiliar;
3. concluir OAuth/API oficial com retorno real de itemId e permalink.

## Testes

Executado:

- `node --test`
- `node --check src/search/SearchOrchestrator.js`
- `node --check src/providers/VerifiedAffiliateOfferProvider.js`
- `node --check src/data/verified-affiliate-offers.js`
- `node --check src/offers/OfferLinkIntake.js`
- `node --check scripts/intake-offer-links.mjs`
- `node --check public/app.js`
- `node --check api/web.js`
- `node --check server.mjs`

Resultado:

- 158 testes aprovados;
- 0 falhas.

