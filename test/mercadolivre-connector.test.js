import test from "node:test";
import assert from "node:assert/strict";
import MercadoLivreConnector from "../src/connectors/MercadoLivreConnector.js";

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

test("token ausente retorna erro controlado sem expor segredo", async () => {
  const result = await withEnv({
    MELI_ACCESS_TOKEN: "",
    MELI_REFRESH_TOKEN: "",
    MELI_CLIENT_ID: "",
    MELI_CLIENT_SECRET: "",
    MELI_REDIRECT_URI: "",
  }, async () => MercadoLivreConnector.searchProducts("celular", { limit: 5 }));

  assert.equal(result.strategyUsed, "demo");
  assert.equal(result.dataMode, "demo");
  assert.equal(result.tokenState, "TOKEN_MISSING");
  assert.ok(!JSON.stringify(result).includes("MELI_ACCESS_TOKEN"));
});

test("erro 403 fica controlado e cai para demo honesto", async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return {
      ok: false,
      status: 403,
      headers: new Map([["content-type", "application/json"]]),
      text: async () => JSON.stringify({ message: "PA_UNAUTHORIZED_RESULT_FROM_POLICIES" }),
      json: async () => ({ message: "PA_UNAUTHORIZED_RESULT_FROM_POLICIES" }),
    };
  };

  try {
    const result = await withEnv({
      MELI_ACCESS_TOKEN: "token-falso",
      MELI_REFRESH_TOKEN: "",
      MELI_CLIENT_ID: "client-falso",
      MELI_CLIENT_SECRET: "secret-falso",
      MELI_REDIRECT_URI: "https://example.com/callback",
    }, async () => MercadoLivreConnector.searchProducts("tv", { limit: 5 }));

    assert.equal(calls >= 1, true);
    assert.equal(result.dataMode, "demo");
    assert.equal(result.strategyUsed, "demo");
    assert.equal(result.statusHttp, 403);
    assert.match(result.error, /403|PA_UNAUTHORIZED_RESULT_FROM_POLICIES/i);
  } finally {
    global.fetch = originalFetch;
  }
});

test("normalizacao de produto real preserva campos principais", () => {
  const normalized = MercadoLivreConnector.normalizeProduct({
    id: "MLB123",
    title: "Samsung Galaxy A15",
    price: 999,
    thumbnail: "https://img.example/a.jpg",
    permalink: "https://produto.mercadolivre.com.br/MLB123",
    seller: { reputation: { level_id: "gold" } },
    rating: 4.8,
    sold_quantity: 120,
    shipping: { free_shipping: true },
    installments: 10,
    available_quantity: 7,
    condition: "new",
  });

  assert.equal(normalized.id, "MLB123");
  assert.equal(normalized.title, "Samsung Galaxy A15");
  assert.equal(normalized.price, 999);
  assert.equal(normalized.image, "https://img.example/a.jpg");
  assert.equal(normalized.permalink, "https://produto.mercadolivre.com.br/MLB123");
  assert.equal(normalized.marketplace, "mercadolivre");
  assert.equal(normalized.dataMode, "real-authenticated");
});

test("fallback seguro mantém demo coerente", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 403,
    headers: new Map([["content-type", "application/json"]]),
    text: async () => JSON.stringify({ message: "blocked" }),
    json: async () => ({ message: "blocked" }),
  });

  try {
    const result = await withEnv({
      MELI_ACCESS_TOKEN: "token-falso",
      MELI_CLIENT_ID: "client-falso",
      MELI_CLIENT_SECRET: "secret-falso",
      MELI_REDIRECT_URI: "https://example.com/callback",
    }, async () => MercadoLivreConnector.searchProducts("celular", { limit: 5 }));

    assert.equal(result.dataMode, "demo");
    assert.ok(Array.isArray(result.products));
    assert.ok(result.products.every((item) => /celular|smartphone|galaxy|moto|redmi|iphone/i.test(`${item.title} ${item.category || ""}`)));
  } finally {
    global.fetch = originalFetch;
  }
});

test("getProduct com item mock retorna item normalizado", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: new Map([["content-type", "application/json"]]),
    json: async () => ({
      id: "MLB999",
      title: "Notebook teste",
      price: 1999,
      thumbnail: "https://img.example/n.jpg",
      permalink: "https://produto.mercadolivre.com.br/MLB999",
      available_quantity: 3,
      condition: "new",
      shipping: { free_shipping: false },
      seller: { reputation: { level_id: "platinum" } },
    }),
    text: async () => JSON.stringify({
      id: "MLB999",
      title: "Notebook teste",
      price: 1999,
      thumbnail: "https://img.example/n.jpg",
      permalink: "https://produto.mercadolivre.com.br/MLB999",
      available_quantity: 3,
      condition: "new",
      shipping: { free_shipping: false },
      seller: { reputation: { level_id: "platinum" } },
    }),
  });

  try {
    await withEnv({
      MELI_ACCESS_TOKEN: "token-falso",
      MELI_CLIENT_ID: "client-falso",
      MELI_CLIENT_SECRET: "secret-falso",
      MELI_REDIRECT_URI: "https://example.com/callback",
    }, async () => {
      const result = await MercadoLivreConnector.getProduct("MLB999");
      assert.equal(result.statusHttp, 200);
      assert.equal(result.item.id, "MLB999");
      assert.equal(result.item.title, "Notebook teste");
      assert.equal(result.item.marketplace, "mercadolivre");
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("diagnostico não expõe token", async () => {
  const diag = MercadoLivreConnector.getDiagnostics();
  assert.ok(!JSON.stringify(diag).includes("token-falso"));
  assert.equal(typeof diag.configured, "boolean");
  assert.equal(typeof diag.tokenState, "string");
});
