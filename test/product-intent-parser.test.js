import test from "node:test";
import assert from "node:assert/strict";
import ProductIntentParser from "../src/search/ProductIntentParser.js";

test("ProductIntentParser extrai iPhone 17 Pro Max com storage e orçamento", () => {
  const parser = new ProductIntentParser();
  const intent = parser.parse({ query: "iphone 17 pro max 256gb até 10000" });

  assert.equal(intent.productType, "smartphone");
  assert.equal(intent.brand, "Apple");
  assert.equal(intent.family, "iPhone");
  assert.equal(intent.model, "iPhone 17 Pro Max");
  assert.equal(intent.storage, "256GB");
  assert.equal(intent.maxTotalBudget, 10000);
  assert.equal(intent.includeAccessories, false);
});

test("ProductIntentParser pede refinamento para busca ampla de casa", () => {
  const parser = new ProductIntentParser();
  const intent = parser.parse({ query: "casa até 50" });

  assert.equal(intent.refinementRequired, true);
  assert.equal(intent.intentType, "broad_category");
  assert.ok(intent.refinementSuggestions.length >= 3);
});
