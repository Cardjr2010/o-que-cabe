import test from "node:test";
import assert from "node:assert/strict";
import MercadoLivreProvider from "../src/providers/MercadoLivreProvider.js";

test("Marketplace provider expõe a superfície padrão", () => {
  assert.equal(typeof MercadoLivreProvider.searchProducts, "function");
  assert.equal(typeof MercadoLivreProvider.getProduct, "function");
  assert.equal(typeof MercadoLivreProvider.getPermalink, "function");
  assert.equal(typeof MercadoLivreProvider.getImage, "function");
  assert.equal(typeof MercadoLivreProvider.normalizeProduct, "function");
});

test("MercadoLivreProvider normaliza produto no formato OQC", () => {
  const normalized = MercadoLivreProvider.normalizeProduct({
    id: "MLB100",
    title: "Celular teste",
    price: 599,
    thumbnail: "https://img.example/c.jpg",
    permalink: "https://produto.mercadolivre.com.br/MLB100",
  });

  assert.equal(normalized.marketplace, "mercadolivre");
  assert.equal(normalized.source, "mercadolivre");
  assert.equal(normalized.permalink, "https://produto.mercadolivre.com.br/MLB100");
  assert.equal(normalized.image, "https://img.example/c.jpg");
  assert.equal(normalized.dataMode, "real-authenticated");
});

test("MercadoLivreProvider usa seed real para categorias cobertas", async () => {
  const result = await MercadoLivreProvider.searchProducts("celular", { limit: 5 });

  assert.equal(result.dataMode, "seed");
  assert.equal(result.strategyUsed, "seed");
  assert.ok(Array.isArray(result.products));
  assert.ok(result.products.length > 0);
  assert.equal(result.products[0].source, "mercadolivre");
  assert.equal(result.products[0].dataMode, "seed");
  assert.match(result.products[0].title, /celular|galaxy|moto|redmi|iphone/i);
  assert.ok(result.products.every((product) => typeof product.productUrl === "string" && product.productUrl.includes("lista.mercadolivre.com.br/")));
  assert.ok(result.products.every((product) => !/mercadolivre\.com\.br\/?$/.test(product.productUrl)));
});
