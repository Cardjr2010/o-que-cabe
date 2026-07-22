import test from "node:test";
import assert from "node:assert/strict";
import SourceIntelligenceLayer from "../src/sources/SourceIntelligenceLayer.js";

function createCatalogManager(products = []) {
  return {
    search() {
      return products;
    },
  };
}

test("SourceIntelligenceLayer retorna refinamento para busca ampla", async () => {
  const layer = new SourceIntelligenceLayer({
    catalogManager: createCatalogManager([]),
  });

  const result = await layer.search({ query: "casa até 50" });
  assert.equal(result.intent.refinementRequired, true);
  assert.equal(result.products.length, 0);
});

test("SourceIntelligenceLayer combina catálogo e provider externo sem acessório no topo", async () => {
  const layer = new SourceIntelligenceLayer({
    catalogManager: createCatalogManager([
      { id: "cat-1", title: "Capa para iPhone 17", category: "capa", brand: "Apple", price: 59, affiliateUrl: "https://example.com/capa" },
      { id: "cat-2", title: "Apple iPhone 17 Pro Max 256GB", category: "smartphone", brand: "Apple", price: 8999, affiliateUrl: "https://example.com/iphone" },
    ]),
    mercadoLivreProvider: {
      async searchProducts() {
        return {
          statusHttp: 200,
          rawCount: 1,
          products: [{
            itemId: "MLB1",
            title: "Apple iPhone 17 Pro Max 256GB",
            category: "smartphone",
            brand: "Apple",
            price: 8799,
            permalink: "https://mercadolivre.com.br/MLB1",
            image: "https://img.example/1.jpg",
            seller: { name: "Loja A" },
          }],
        };
      },
    },
  });

  const result = await layer.search({ query: "iphone 17 pro max 256gb até 10000" });
  assert.ok(result.products.length >= 1);
  assert.match(result.products[0].title, /iPhone 17 Pro Max/i);
  assert.ok(!/Capa/i.test(result.products[0].title));
});
