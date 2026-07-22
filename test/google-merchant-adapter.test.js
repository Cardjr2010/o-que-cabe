import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/web.js";
import { GoogleMerchantProductsAdapter } from "../src/adapters/GoogleMerchantProductsAdapter.js";

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

function withEnv(overrides, fn) {
  const keys = Object.keys(overrides);
  const previous = {};
  for (const key of keys) {
    previous[key] = process.env[key];
    if (overrides[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = overrides[key];
    }
  }

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const key of keys) {
        if (previous[key] === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = previous[key];
        }
      }
    });
}

test("sem configuracao retorna configured false", async () => {
  const adapter = new GoogleMerchantProductsAdapter({
    accountId: "",
    accessToken: "",
    fetchImpl: async () => {
      throw new Error("fetch nao deveria ser chamado");
    },
    catalogManager: {
      list: () => [],
      import: () => ({ imported: 0, rejected: 0, rejectedItems: [], products: [] }),
    },
  });

  const diagnostics = adapter.getDiagnostics();
  assert.equal(diagnostics.configured, false);
  assert.equal(diagnostics.hasAccountId, false);
  assert.equal(diagnostics.hasAccessToken, false);
});

test("token nao aparece na resposta de diagnostico", () => {
  const adapter = new GoogleMerchantProductsAdapter({
    accountId: "123456",
    accessToken: "token-super-secreto",
    fetchImpl: async () => {
      throw new Error("fetch nao deveria ser chamado");
    },
    catalogManager: {
      list: () => [],
      import: () => ({ imported: 0, rejected: 0, rejectedItems: [], products: [] }),
    },
  });

  const diagnostics = adapter.getDiagnostics();
  const text = JSON.stringify(diagnostics);
  assert.ok(!text.includes("token-super-secreto"));
  assert.equal(diagnostics.configured, true);
});

test("produto Google Merchant normaliza para contrato OQC", () => {
  const adapter = new GoogleMerchantProductsAdapter({
    accountId: "123456",
    accessToken: "token",
    fetchImpl: async () => {
      throw new Error("fetch nao deveria ser chamado");
    },
    catalogManager: {
      list: () => [],
      import: () => ({ imported: 0, rejected: 0, rejectedItems: [], products: [] }),
    },
  });

  const normalized = adapter.normalizeProduct({
    name: "accounts/123456/products/offer-1",
    offerId: "offer-1",
    title: "Samsung Galaxy A15",
    googleProductCategory: "Electronics > Communications > Telephony > Mobile Phones",
    brand: "Samsung",
    model: "A15",
    price: { value: "999.90", currencyCode: "BRL" },
    imageLink: "https://img.example/a15.jpg",
    link: "https://loja.example/produto/a15",
    availability: "in stock",
    condition: "new",
  });

  assert.equal(normalized.ok, true);
  assert.equal(normalized.product.marketplace, "google_merchant");
  assert.equal(normalized.product.sourceType, "google_merchant_api");
  assert.equal(normalized.product.dataMode, "real");
  assert.equal(normalized.product.title, "Samsung Galaxy A15");
  assert.equal(normalized.product.price, 999.9);
  assert.equal(normalized.product.productUrl, "https://loja.example/produto/a15");
  assert.equal(normalized.product.image, "https://img.example/a15.jpg");
});

test("produto sem link ou sem preco e rejeitado", () => {
  const adapter = new GoogleMerchantProductsAdapter({
    accountId: "123456",
    accessToken: "token",
    fetchImpl: async () => {
      throw new Error("fetch nao deveria ser chamado");
    },
    catalogManager: {
      list: () => [],
      import: () => ({ imported: 0, rejected: 0, rejectedItems: [], products: [] }),
    },
  });

  const withoutLink = adapter.normalizeProduct({
    name: "accounts/123456/products/offer-2",
    offerId: "offer-2",
    title: "Produto sem link",
    price: { value: "199.90", currencyCode: "BRL" },
    googleProductCategory: "Test",
  });
  assert.equal(withoutLink.ok, false);
  assert.match(withoutLink.reason, /link/i);

  const withoutPrice = adapter.normalizeProduct({
    name: "accounts/123456/products/offer-3",
    offerId: "offer-3",
    title: "Produto sem preco",
    link: "https://loja.example/produto/3",
    googleProductCategory: "Test",
  });
  assert.equal(withoutPrice.ok, false);
  assert.match(withoutPrice.reason, /preço|preco/i);
});

test("importToCatalog chama CatalogManager", async () => {
  let importCalled = 0;
  const catalogManager = {
    list: () => [],
    import: (products, mode) => {
      importCalled += 1;
      assert.equal(mode, "merge");
      assert.equal(products.length, 1);
      return { imported: 1, rejected: 0, rejectedItems: [], products };
    },
  };

  const adapter = new GoogleMerchantProductsAdapter({
    accountId: "123456",
    accessToken: "token",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      text: async () => JSON.stringify({
        products: [
          {
            name: "accounts/123456/products/offer-1",
            offerId: "offer-1",
            title: "Notebook teste",
            category: "notebook",
            brand: "Lenovo",
            model: "IdeaPad",
            price: { value: "2999.90", currencyCode: "BRL" },
            link: "https://loja.example/notebook",
            imageLink: "https://img.example/notebook.jpg",
            availability: "in stock",
            condition: "new",
          },
        ],
      }),
    }),
    catalogManager,
  });

  const result = await adapter.importToCatalog();

  assert.equal(importCalled, 1);
  assert.equal(result.configured, true);
  assert.equal(result.fetched, 1);
  assert.equal(result.imported, 1);
  assert.equal(result.rejected, 0);
  assert.ok(Array.isArray(result.products));
});

test("endpoint de status nao expÃµe segredo", async () => {
  const res = createResponse();
  await handler({ url: "/api/google-merchant/status", method: "GET" }, res);
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(Object.keys(body).sort(), ["configured", "hasAccessToken", "hasAccountId"]);
  assert.ok(!JSON.stringify(body).includes("token"));
});

test("endpoint de import retorna erro claro quando nao configurado", async () => {
  const res = createResponse();
  await withEnv({
    GOOGLE_MERCHANT_ACCOUNT_ID: "",
    GOOGLE_MERCHANT_ACCESS_TOKEN: "",
  }, async () => handler({ url: "/api/google-merchant/import", method: "POST" }, res));

  const body = JSON.parse(res.body);
  assert.equal(res.statusCode, 400);
  assert.equal(body.ok, false);
  assert.match(body.message, /Google Merchant/i);
  assert.ok(/configurado/i.test(body.message));
});

