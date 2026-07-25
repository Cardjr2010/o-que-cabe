import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyOfferLink,
  detectOfferSource,
  extractAmazonAsin,
  extractMercadoLivreItemId,
  parseMoney,
  probeOfferLink,
} from "../src/offers/OfferLinkIntake.js";

test("detecta fontes dos links de afiliado mais usados", () => {
  assert.equal(detectOfferSource("https://meli.la/2cHdjsF"), "mercado_livre");
  assert.equal(detectOfferSource("https://link.amazon/B03IbYuOt"), "amazon");
  assert.equal(detectOfferSource("https://www.magazinevoce.com.br/produto/p/123/"), "magalu");
});

test("extrai identificadores de produto direto", () => {
  assert.equal(
    extractMercadoLivreItemId("https://www.mercadolivre.com.br/produto/p/MLB1055308620?pdp_filters=item_id%3AMLB4200316101&wid=MLB4200316101"),
    "MLB4200316101",
  );
  assert.equal(extractAmazonAsin("https://www.amazon.com.br/dp/B0FQHFY4RH/ref=x"), "B0FQHFY4RH");
});

test("parseMoney entende formato brasileiro", () => {
  assert.equal(parseMoney("R$ 10.999,90"), 10999.9);
  assert.equal(parseMoney("1099.90"), 1099.9);
});

test("classifica produto direto e rejeita listagem generica", () => {
  assert.equal(
    classifyOfferLink({
      finalUrl: "https://www.mercadolivre.com.br/iphone/p/MLB1055308620",
      status: 200,
      html: "<title>iPhone</title>",
    }).status,
    "direct_product",
  );

  assert.notEqual(
    classifyOfferLink({
      finalUrl: "https://www.mercadolivre.com.br/social/duca3564347",
      status: 200,
      html: "<title>Produto</title><a href='/produto/p/MLB1055308620'>iPhone</a>",
    }).status,
    "direct_product",
  );

  assert.equal(
    classifyOfferLink({
      finalUrl: "https://lista.mercadolivre.com.br/iphone-17",
      status: 200,
      html: "<title>Busca</title>",
    }).status,
    "generic_listing",
  );
});

test("probeOfferLink gera diagnostico sanitizado com dados extraidos", async () => {
  const fetchImpl = async () => ({
    status: 200,
    ok: true,
    url: "https://www.amazon.com.br/dp/B0FQHFY4RH",
    text: async () => `
      <html>
        <head>
          <meta property="og:title" content="Apple iPhone 17 Pro 256GB">
          <meta property="og:image" content="https://example.com/image.jpg">
          <meta property="product:price:amount" content="8792.10">
        </head>
      </html>
    `,
  });

  const result = await probeOfferLink("https://link.amazon/B03IbYuOt", {
    fetchImpl,
    now: new Date("2026-07-24T12:00:00.000Z"),
  });

  assert.equal(result.ok, true);
  assert.equal(result.source, "amazon");
  assert.equal(result.asin, "B0FQHFY4RH");
  assert.equal(result.price, 8792.1);
  assert.equal(result.linkValidation.status, "direct_product");
});
