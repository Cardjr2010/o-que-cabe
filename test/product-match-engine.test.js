import test from "node:test";
import assert from "node:assert/strict";
import ProductMatchEngine from "../src/intelligence/ProductMatchEngine.js";

test("ProductMatchEngine rejeita acessório quando a busca é por aparelho principal", () => {
  const engine = new ProductMatchEngine();
  const result = engine.classify(
    { title: "Capa para iPhone 17 Pro Max", category: "capa", price: 99 },
    { model: "iPhone 17 Pro Max", brand: "Apple", includeAccessories: false, productType: "smartphone" },
  );

  assert.equal(result.className, "ACCESSORY");
});

test("ProductMatchEngine marca modelo exato corretamente", () => {
  const engine = new ProductMatchEngine();
  const result = engine.classify(
    { title: "Apple iPhone 17 Pro Max 256GB", category: "smartphone", brand: "Apple", price: 8999 },
    { model: "iPhone 17 Pro Max", storage: "256GB", brand: "Apple", includeAccessories: false, productType: "smartphone", category: "celulares" },
  );

  assert.equal(result.className, "EXACT_MATCH");
  assert.ok(result.matchScore > 50);
});
