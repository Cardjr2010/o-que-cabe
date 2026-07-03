import test from "node:test";
import assert from "node:assert/strict";
import { normalizeImportedProduct } from "../src/importers/ProductImporter.js";
import WooCommerceStyleImporter from "../src/importers/WooCommerceStyleImporter.js";
import handler from "../api/web.js";

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    writeHead(status, headers = {}) {
      this.statusCode = status;
      this.headers = { ...this.headers, ...headers };
    },
    end(body = "") {
      this.body = body;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
}

test("produto importado normaliza corretamente", () => {
  const normalized = normalizeImportedProduct({
    id: "wc-1",
    externalId: "123",
    title: "Samsung Galaxy A15",
    category: "celular",
    brand: "Samsung",
    model: "A15",
    price: "899",
    image: "https://example.com/a15.png",
    productUrl: "https://lista.mercadolivre.com.br/samsung-galaxy-a15-256gb",
    marketplace: "Mercado Livre",
    sourceType: "feed",
  });

  assert.ok(normalized);
  assert.equal(normalized.dataMode, "seed");
  assert.equal(normalized.price, 899);
  assert.equal(normalized.category, "celular");
  assert.equal(normalized.marketplace, "Mercado Livre");
  assert.equal(normalized.sourceType, "feed");
  assert.equal(normalized.productUrl, "https://lista.mercadolivre.com.br/samsung-galaxy-a15-256gb");
  assert.equal(normalized.affiliateUrl, "");
});

test("pre?o de flores em centavos vira valor real", () => {
  const normalized = normalizeImportedProduct({
    id: "flowers-1",
    title: "Buqu? de Flores do Campo Amarelas e Laranjas",
    category: "flores e presentes",
    price: 16100,
    image: "https://example.com/flores.png",
    productUrl: "https://www.floresonline.com.br/buque-de-flores-do-campo-amarelas-e-laranjas",
    marketplace: "Flores Online",
    source: "flores_online",
    seller: "Flores Online",
  });

  assert.ok(normalized);
  assert.equal(normalized.price, 161);
});

test("eletr?nicos n?o s?o divididos por 100", () => {
  const normalized = normalizeImportedProduct({
    id: "elec-1",
    title: "Notebook Gamer",
    category: "notebook",
    price: 16100,
    image: "https://example.com/notebook.png",
    productUrl: "https://example.com/notebook-gamer",
    marketplace: "Sald?o da Inform?tica",
    source: "saldao_informatica",
  });

  assert.ok(normalized);
  assert.equal(normalized.price, 16100);
});

test("produto sem link real é rejeitado", () => {
  const normalized = normalizeImportedProduct({
    id: "wc-2",
    title: "Produto sem link",
    category: "celular",
    price: 100,
    marketplace: "Mercado Livre",
  });

  assert.equal(normalized, null);
});

test("affiliateUrl tem prioridade sobre productUrl", () => {
  const normalized = normalizeImportedProduct({
    id: "wc-3",
    title: "Produto com afiliado",
    category: "notebook",
    price: 1999,
    affiliateUrl: "https://affiliate.example/item",
    productUrl: "https://lista.mercadolivre.com.br/produto-com-afiliado",
    marketplace: "Mercado Livre",
  });

  assert.ok(normalized);
  assert.equal(normalized.productUrl, "https://affiliate.example/item");
  assert.equal(normalized.permalink, "https://affiliate.example/item");
});

test("/api/search usa catálogo real antes de demo", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("offline");
  };

  try {
    const res = createResponse();
    await handler({ url: "/api/search?q=celular&mode=total&totalBudget=1500" }, res);
    const body = JSON.parse(res.body);

    assert.equal(res.statusCode, 200);
    assert.equal(body.dataMode, "real");
    assert.ok(Array.isArray(body.products));
    assert.ok(body.products.length > 0);
    assert.equal(body.recommendations[0].product.marketplace, "saldao_informatica");
  } finally {
    global.fetch = originalFetch;
  }
});

test("demo continua sem link externo quando nao ha produto real", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("offline");
  };

  try {
    const res = createResponse();
    await handler({ url: "/api/search?q=produto-inexistente-zzzz-12345&mode=total&totalBudget=100" }, res);
    const body = JSON.parse(res.body);

    assert.equal(res.statusCode, 200);
    assert.equal(body.dataMode, "demo");
    assert.ok(body.products.every((product) => product.dataMode === "demo"));
    assert.ok(body.products.every((product) => !product.productUrl || !product.productUrl.includes("mercadolivre.com.br/")));
  } finally {
    global.fetch = originalFetch;
  }
});
