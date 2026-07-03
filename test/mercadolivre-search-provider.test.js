import test from "node:test";
import assert from "node:assert/strict";
import MercadoLivreSearchProvider from "../src/providers/MercadoLivreSearchProvider.js";

function withFetch(mockFetch, fn) {
  const originalFetch = global.fetch;
  global.fetch = mockFetch;
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      global.fetch = originalFetch;
    });
}

function withEnv(env, fn) {
  const original = {};
  for (const [key, value] of Object.entries(env)) {
    original[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const [key, value] of Object.entries(original)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    });
}

test("busca direta do Mercado Livre retorna apenas anúncios reais com itemId e permalink", async () => {
  const provider = new MercadoLivreSearchProvider();
  const payload = {
    results: [
      {
        id: "MLB100",
        title: "iPhone 15 128GB",
        price: 4999.9,
        currency_id: "BRL",
        thumbnail: "https://img.example/iphone.jpg",
        permalink: "https://produto.mercadolivre.com.br/MLB100-iphone-15-128gb",
        condition: "new",
        available_quantity: 5,
        seller: {
          id: 1,
          nickname: "Apple Store",
          reputation: { level_id: "5_green" },
        },
        shipping: { free_shipping: true },
        installments: { quantity: 10, amount: 499.99, rate: 0, currency_id: "BRL" },
      },
      {
        id: "MLB101",
        title: "Capa para iPhone 15",
        price: 39.9,
        currency_id: "BRL",
        thumbnail: "https://img.example/case.jpg",
        permalink: "https://produto.mercadolivre.com.br/MLB101-capa-iphone-15",
        condition: "new",
        available_quantity: 50,
        seller: {
          id: 2,
          nickname: "Acessorios BR",
          reputation: { level_id: "green" },
        },
        shipping: { free_shipping: false },
        installments: { quantity: 1, amount: 39.9, rate: 0, currency_id: "BRL" },
      },
      {
        id: "MLB102",
        title: "Resultado genérico",
        price: 129.9,
        currency_id: "BRL",
        thumbnail: "https://img.example/generic.jpg",
        permalink: "https://www.mercadolivre.com.br",
        condition: "new",
        available_quantity: 12,
        seller: { nickname: "Loja Genérica" },
      },
    ],
  };

  await withFetch(async () => ({
    ok: true,
    status: 200,
    headers: new Map([["content-type", "application/json"]]),
    text: async () => JSON.stringify(payload),
  }), async () => {
    const result = await provider.searchProducts("iphone", { limit: 10 });

    assert.equal(result.strategyUsed, "mercado_livre_direct_item_search");
    assert.equal(result.dataMode, "real");
    assert.equal(result.returnedCount, 2);
    assert.equal(result.products.length, 2);

    const [item, accessory] = result.products;
    assert.equal(item.itemId, "MLB100");
    assert.equal(item.permalink, "https://produto.mercadolivre.com.br/MLB100-iphone-15-128gb");
    assert.equal(item.title, "iPhone 15 128GB");
    assert.equal(item.freeShipping, true);
    assert.equal(item.seller.nickname, "Apple Store");
    assert.equal(item.sellerReputation.level_id, "5_green");
    assert.ok(!/mercadolivre\.com\.br\/?$/.test(item.permalink));
    assert.equal(accessory.itemId, "MLB101");
    assert.match(accessory.title, /capa/i);
    assert.ok(accessory.permalink.includes("MLB101"));
  });
});

test("acessorios nao sobem acima de aparelho principal na busca por iphone", async () => {
  const provider = new MercadoLivreSearchProvider();
  const payload = {
    results: [
      {
        id: "MLB200",
        title: "Capa para iPhone 15",
        price: 39.9,
        currency_id: "BRL",
        thumbnail: "https://img.example/case.jpg",
        permalink: "https://produto.mercadolivre.com.br/MLB200-capa-iphone-15",
        condition: "new",
        available_quantity: 50,
      },
      {
        id: "MLB201",
        title: "iPhone 15 128GB",
        price: 4999.9,
        currency_id: "BRL",
        thumbnail: "https://img.example/iphone.jpg",
        permalink: "https://produto.mercadolivre.com.br/MLB201-iphone-15-128gb",
        condition: "new",
        available_quantity: 5,
      },
    ],
  };

  await withFetch(async () => ({
    ok: true,
    status: 200,
    headers: new Map([["content-type", "application/json"]]),
    text: async () => JSON.stringify(payload),
  }), async () => {
    const result = await provider.searchProducts("iphone", { limit: 10 });
    assert.equal(result.products[0].itemId, "MLB201");
    assert.equal(result.products[0].title, "iPhone 15 128GB");
  });
});

test("quando nao houver item direto, provider retorna fallback textual sem link genérico", async () => {
  const provider = new MercadoLivreSearchProvider();

  await withFetch(async () => ({
    ok: true,
    status: 200,
    headers: new Map([["content-type", "application/json"]]),
    text: async () => JSON.stringify({ results: [] }),
  }), async () => {
    const result = await provider.searchProducts("produto inexistente", { limit: 10 });

    assert.equal(result.products.length, 0);
    assert.equal(result.dataMode, "demo");
    assert.equal(result.error, "NO_DIRECT_ITEMS");
    assert.match(result.fallbackText, /Mercado Livre/i);
  });
});

test("envia Authorization Bearer quando token OAuth estiver configurado", async () => {
  const provider = new MercadoLivreSearchProvider({ accessToken: "token-secreto" });
  let capturedHeaders = {};

  await withFetch(async (_url, options = {}) => {
    capturedHeaders = options.headers || {};
    return {
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      text: async () => JSON.stringify({
        results: [
          {
            id: "MLB300",
            title: "Samsung Galaxy S24",
            price: 3999,
            currency_id: "BRL",
            thumbnail: "https://img.example/s24.jpg",
            permalink: "https://produto.mercadolivre.com.br/MLB300-samsung-galaxy-s24",
            condition: "new",
          },
        ],
      }),
    };
  }, async () => {
    const result = await provider.searchProducts("samsung galaxy", { limit: 5 });

    assert.equal(capturedHeaders.Authorization, "Bearer token-secreto");
    assert.equal(result.tokenState, "available");
    assert.equal(result.authMode, "bearer");
    assert.equal(result.products[0].itemId, "MLB300");
    assert.ok(!JSON.stringify(result).includes("token-secreto"));
  });
});

test("renova token com refresh_token quando a primeira chamada responder 403", async () => {
  const provider = new MercadoLivreSearchProvider();
  provider.getToken = () => "";
  provider.getRefreshToken = () => "refresh-token-test";
  provider.getClientId = () => "client-id-test";
  provider.getClientSecret = () => "client-secret-test";
  let searchCalls = 0;
  let oauthCalls = 0;

  await withEnv({
    MELI_ACCESS_TOKEN: "",
    MERCADOLIVRE_ACCESS_TOKEN: "",
    MERCADO_LIVRE_ACCESS_TOKEN: "",
    MELI_REFRESH_TOKEN: "",
    MERCADOLIVRE_REFRESH_TOKEN: "",
    MERCADO_LIVRE_REFRESH_TOKEN: "",
    MELI_CLIENT_ID: "",
    MELI_CLIENT_SECRET: "",
  }, async () => {
    await withFetch(async (url, options = {}) => {
      const target = String(url);
      if (target.includes("/oauth/token")) {
        oauthCalls += 1;
        assert.equal(options.method, "POST");
        return {
          ok: true,
          status: 200,
          headers: new Map([["content-type", "application/json"]]),
          text: async () => JSON.stringify({
            access_token: "novo-token",
            refresh_token: "refresh-token-test",
            expires_in: 21600,
            user_id: 123,
          }),
          json: async () => ({
            access_token: "novo-token",
            refresh_token: "refresh-token-test",
            expires_in: 21600,
            user_id: 123,
          }),
        };
      }

      searchCalls += 1;
      if (searchCalls === 1) {
        return {
          ok: false,
          status: 403,
          headers: new Map([["content-type", "application/json"]]),
          text: async () => JSON.stringify({ message: "forbidden" }),
        };
      }

      assert.equal(options.headers.Authorization, "Bearer novo-token");
      return {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        text: async () => JSON.stringify({
          results: [
            {
              id: "MLB901",
              title: "iPhone 17 Pro Max",
              price: 9999,
              currency_id: "BRL",
              thumbnail: "https://img.example/iphone17.jpg",
              permalink: "https://produto.mercadolivre.com.br/MLB901-iphone-17-pro-max",
              condition: "new",
            },
          ],
        }),
      };
    }, async () => {
      const result = await provider.searchProducts("iphone 17 pro max", { limit: 5 });
      assert.equal(oauthCalls, 1);
      assert.equal(result.dataMode, "real");
      assert.equal(result.products[0].itemId, "MLB901");
      assert.equal(result.products[0].permalink, "https://produto.mercadolivre.com.br/MLB901-iphone-17-pro-max");
    });
  });
});

test("aceita endpoint/proxy configurado e normaliza resposta aninhada", async () => {
  const provider = new MercadoLivreSearchProvider({
    searchEndpoint: "https://woo.example.test/ml-search?query={query}&limit={limit}",
  });
  let calledUrl = "";

  await withFetch(async (url) => {
    calledUrl = String(url);
    return {
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      text: async () => JSON.stringify({
        data: {
          results: [
            {
              id: "MLB400",
              title: "Notebook Gamer Lenovo",
              price: 4599,
              currency_id: "BRL",
              thumbnail: "https://img.example/notebook.jpg",
              permalink: "https://produto.mercadolivre.com.br/MLB400-notebook-gamer-lenovo",
              condition: "new",
            },
            {
              id: "MLB401",
              title: "Busca generica notebook",
              price: 99,
              permalink: "https://lista.mercadolivre.com.br/notebook-gamer",
            },
          ],
        },
      }),
    };
  }, async () => {
    const result = await provider.searchProducts("notebook gamer", { limit: 5 });

    assert.equal(calledUrl, "https://woo.example.test/ml-search?query=notebook%20gamer&limit=5");
    assert.equal(result.returnedCount, 1);
    assert.equal(result.products[0].itemId, "MLB400");
    assert.equal(result.products[0].permalink, "https://produto.mercadolivre.com.br/MLB400-notebook-gamer-lenovo");
  });
});

test("getDiagnostics expõe token OAuth e proxy configurados sem vazar segredo", () => {
  const provider = new MercadoLivreSearchProvider({
    accessToken: "token-secreto",
    searchEndpoint: "https://proxy.example.test/ml-search",
  });

  const diagnostics = provider.getDiagnostics();
  assert.equal(diagnostics.configured, true);
  assert.equal(diagnostics.hasAccessToken, true);
  assert.equal(diagnostics.hasSearchEndpoint, true);
  assert.equal(diagnostics.tokenState, "available");
  assert.equal(diagnostics.authMode, "bearer");
  assert.equal(diagnostics.searchEndpoint, "https://proxy.example.test/ml-search");
  assert.ok(!JSON.stringify(diagnostics).includes("token-secreto"));
});

test("getDiagnostics reconhece refresh token configurado", async () => {
  const provider = new MercadoLivreSearchProvider();
  provider.getToken = () => "";
  provider.getRefreshToken = () => "refresh-token-test";
  provider.getClientId = () => "client-id-test";
  provider.getClientSecret = () => "client-secret-test";

  const diagnostics = provider.getDiagnostics();
  assert.equal(diagnostics.configured, true);
  assert.equal(diagnostics.hasRefreshToken, true);
  assert.equal(diagnostics.authMode, "refresh-token");
  assert.ok(!JSON.stringify(diagnostics).includes("refresh-token-test"));
});
