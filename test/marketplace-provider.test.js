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
