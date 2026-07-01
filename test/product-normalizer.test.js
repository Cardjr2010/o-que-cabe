import test from "node:test";
import assert from "node:assert/strict";
import { normalizeImportedProduct } from "../src/importers/ProductImporter.js";

function makeProduct(overrides = {}) {
  return normalizeImportedProduct({
    id: overrides.id || "test-1",
    title: overrides.title || "Teste",
    category: overrides.category || "outros",
    brand: overrides.brand || "",
    model: overrides.model || "",
    price: overrides.price || 999,
    image: overrides.image || "https://example.com/img.png",
    productUrl: overrides.productUrl || "https://lista.mercadolivre.com.br/teste-produto",
    marketplace: overrides.marketplace || "Mercado Livre",
    sourceType: overrides.sourceType || "seed",
    ...overrides,
  });
}

test("titulo em cirilico vira displayTitle em portugues", () => {
  const product = makeProduct({
    title: "Телевизор Xiaomi TV S Pro 65 2026 4K UHD Smart TV",
    category: "tv",
  });

  assert.ok(product);
  assert.match(product.language, /cyrillic|mixed/);
  assert.match(product.displayTitle, /Televizor|Televisor/i);
  assert.doesNotMatch(product.displayTitle, /[\u0400-\u04FF]/);
});

test("pelicula é classificada como acessório", () => {
  const product = makeProduct({
    title: "Película Protetora Xiaomi 14",
    category: "celular",
  });

  assert.ok(product);
  assert.equal(product.normalizedCategory, "pelicula");
  assert.equal(product.productType, "accessory");
  assert.equal(product.isAccessory, true);
});

test("Redmi Pad é classificado como tablet", () => {
  const product = makeProduct({
    title: "Xiaomi Redmi Pad SE 11 8GB 128GB",
    category: "celular",
  });

  assert.ok(product);
  assert.equal(product.normalizedCategory, "tablet");
  assert.equal(product.productType, "product");
});

test("Xiaomi, Redmi e POCO são reconhecidos", () => {
  const xiaomi = makeProduct({
    title: "Xiaomi Redmi Note 13",
    category: "celular",
  });
  const poco = makeProduct({
    title: "POCO X6 Pro",
    category: "celular",
  });

  assert.ok(xiaomi);
  assert.ok(poco);
  assert.match(`${xiaomi.brand} ${xiaomi.displayTitle}`, /Xiaomi|Redmi/i);
  assert.match(`${poco.brand} ${poco.displayTitle}`, /POCO/i);
});
