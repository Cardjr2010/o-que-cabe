import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import handler from "../api/web.js";
import RankingEngine from "../src/engines/RankingEngine.js";

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

function parseBody(res) {
  return JSON.parse(res.body);
}

test("Busca do catalogo real retorna recommendations e scoreBreakdown", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("offline");
  };

  try {
    const res = createResponse();
    await handler({ url: "/api/search?q=celular&mode=total&totalBudget=1500" }, res);
    const body = parseBody(res);
    const firstSource = String(
      body.recommendations?.[0]?.product?.marketplace
      || body.recommendations?.[0]?.product?.source
      || body.recommendations?.[0]?.product?.seller
      || body.recommendations?.[0]?.product?.store
      || "",
    ).toLowerCase();

    assert.equal(res.statusCode, 200);
    assert.equal(body.ok, true);
    assert.equal(body.dataMode, "real");
    assert.ok(!firstSource.includes("mi_shop"));
    assert.ok(!firstSource.includes("mercadolivre"));
    assert.ok(Array.isArray(body.products));
    assert.ok(body.products.every((product) => Array.isArray(product.scoreBreakdown)));
    assert.ok(body.recommendations.every((item) => typeof item.reason === "string" && item.reason.length > 0));
  } finally {
    global.fetch = originalFetch;
  }
});

test("Modo total responde 200 e preserva totalBudget", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("offline");
  };

  try {
    const res = createResponse();
    await handler({ url: "/api/search?q=tv&mode=total&totalBudget=500" }, res);
    const body = parseBody(res);

    assert.equal(res.statusCode, 200);
    assert.equal(body.ok, true);
    assert.equal(body.mode, "total");
    assert.equal(body.budget.totalBudget, 500);
    assert.ok(Array.isArray(body.products));
  } finally {
    global.fetch = originalFetch;
  }
});

test("Busca do catalogo real mantem categorias coerentes por busca", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("offline");
  };

  try {
    const cases = [
      { url: "/api/search?q=celular&mode=total&totalBudget=1500", matcher: /celular|smartphone|galaxy|moto|redmi|iphone/i },
      { url: "/api/search?q=tv&mode=total&totalBudget=2000", matcher: /tv|televis/i },
      { url: "/api/search?q=notebook&mode=monthly&monthly=250&months=10", matcher: /notebook|laptop|vivobook|ideapad|aspire/i },
    ];

    for (const testCase of cases) {
      const res = createResponse();
      await handler({ url: testCase.url }, res);
      const body = parseBody(res);

      assert.equal(res.statusCode, 200);
      assert.equal(body.dataMode, "real");
      assert.ok(body.products.length > 0);
      assert.ok(testCase.matcher.test(`${body.products[0]?.title || ""} ${body.products[0]?.category || ""}`));
      assert.ok(body.products.every((product) => {
        const source = String(product.marketplace || product.source || product.store || product.seller || "").toLowerCase();
        const seller = String(product.seller?.name || product.seller || "").toLowerCase();
        const sourceType = String(product.sourceType || "").toLowerCase();
        return !source.includes("mi_shop")
          && !source.includes("mercadolivre")
          && !seller.includes("mi shop")
          && !sourceType.includes("mercadolivre");
      }));
    }
  } finally {
    global.fetch = originalFetch;
  }
});

test("Busca sem cobertura real nao inventa resultado", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("offline");
  };

  try {
    const cases = [
      "/api/search?q=ferramenta&mode=total&totalBudget=500",
      "/api/search?q=flores&mode=total&totalBudget=200",
      "/api/search?q=buqu%C3%AA&mode=total&totalBudget=200",
    ];

    for (const url of cases) {
      const res = createResponse();
      await handler({ url }, res);
      const body = parseBody(res);

      assert.equal(res.statusCode, 200);
      assert.equal(body.dataMode, "none");
      assert.ok(Array.isArray(body.products));
      assert.equal(body.products.length, 0);
    }
  } finally {
    global.fetch = originalFetch;
  }
});

test("Busca de TV prioriza TV principal acima de controle remoto", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("offline");
  };

  try {
    const res = createResponse();
    await handler({ url: "/api/search?q=tv&mode=total&totalBudget=5000" }, res);
    const body = parseBody(res);
    const firstTitle = String(body.products?.[0]?.title || body.products?.[0]?.displayTitle || "");

    assert.equal(res.statusCode, 200);
    assert.equal(body.dataMode, "real");
    assert.ok(body.products.length > 0);
    assert.ok(!/controle remoto|remote control/i.test(firstTitle));
  } finally {
    global.fetch = originalFetch;
  }
});

test("/api/catalog/stats resume marcas, categorias e buscas", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("offline");
  };

  try {
    const res = createResponse();
    await handler({ url: "/api/catalog/stats" }, res);
    const body = parseBody(res);

    assert.equal(res.statusCode, 200);
    assert.equal(body.ok, true);
    assert.equal(body.totalProducts, 2599);
    assert.equal(body.productsPublished, 1664);
    assert.equal(body.productsHidden, 935);
    assert.ok(Array.isArray(body.top20Brands));
    assert.ok(body.top20Brands.length > 0);
    assert.ok(Array.isArray(body.top20Categories));
    assert.ok(body.top20Categories.length > 0);
    assert.ok(Array.isArray(body.topSearches));
    assert.ok(body.topSearches.length > 0);
  } finally {
    global.fetch = originalFetch;
  }
});

test("/api/search entrega advisor com alternativas e comparacao", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("offline");
  };

  try {
    const res = createResponse();
    await handler({ url: "/api/search?q=iphone&mode=total&totalBudget=5000" }, res);
    const body = parseBody(res);

    assert.equal(res.statusCode, 200);
    assert.equal(body.ok, true);
    assert.equal(body.dataMode, "real");
    assert.ok(body.advisor);
    assert.ok(Array.isArray(body.advisor.alternatives));
    assert.ok(Array.isArray(body.advisor.comparison));
    assert.ok(body.advisor.whyThisProduct.length > 0);
  } finally {
    global.fetch = originalFetch;
  }
});
test("CABE aparece antes de APERTADO", () => {
  const ranked = RankingEngine.rankProducts([
    {
      title: "APERTADO forte",
      budgetStatus: "APERTADO",
      score: 99,
      price: 1200,
      dataMode: "demo",
      permalink: "https://example.com/apertado-forte",
      source: "demo",
      store: "Demo",
    },
    {
      title: "CABE simples",
      budgetStatus: "CABE",
      score: 60,
      price: 500,
      dataMode: "demo",
      permalink: "https://example.com/cabe-simples",
      source: "demo",
      store: "Demo",
    },
  ]);

  assert.equal(ranked.recommended[0].product.title, "CABE simples");
  assert.equal(ranked.groups.cabe[0].title, "CABE simples");
});

test("NÃƒO CABE nao vira Melhor escolha se houver CABE", () => {
  const ranked = RankingEngine.rankProducts([
    {
      title: "NÃƒO CABE caro",
      budgetStatus: "NÃƒO CABE",
      score: 100,
      price: 5000,
      dataMode: "demo",
      permalink: "https://example.com/nao-cabe-caro",
      source: "demo",
      store: "Demo",
    },
    {
      title: "CABE disponivel",
      budgetStatus: "CABE",
      score: 70,
      price: 700,
      dataMode: "demo",
      permalink: "https://example.com/cabe-disponivel",
      source: "demo",
      store: "Demo",
    },
  ]);

  assert.equal(ranked.recommended[0].product.title, "CABE disponivel");
  assert.ok(ranked.recommended[0].label.length > 0);
});

test("Cada recomendacao possui reason", () => {
  const ranked = RankingEngine.rankProducts([
    {
      title: "CABE 1",
      budgetStatus: "CABE",
      score: 91,
      price: 300,
      dataMode: "real",
      permalink: "https://example.com/1",
      source: "demo",
      store: "Demo",
    },
    {
      title: "APERTADO 1",
      budgetStatus: "APERTADO",
      score: 80,
      price: 400,
      dataMode: "real",
      permalink: "https://example.com/2",
      source: "demo",
      store: "Demo",
    },
  ]);

  assert.ok(ranked.recommended.every((item) => typeof item.reason === "string" && item.reason.length > 0));
  assert.ok(typeof ranked.summary === "string" && ranked.summary.length > 0);
});

test("Resultado permanece filtrado para fontes visiveis e sem Saldão da Informática", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ results: [] }),
    text: async () => JSON.stringify({ results: [] }),
    headers: new Map(),
  });

  try {
    const res = createResponse();
    await handler({ url: "/api/search?q=casa&mode=total&totalBudget=300" }, res);
    const body = parseBody(res);

    assert.ok(["real", "seed", "demo", "real-authenticated", "real-public"].includes(body.dataMode));
    assert.ok(Array.isArray(body.products));
    for (const product of body.products) {
      const source = String(product.marketplace || product.source || product.store || product.seller || "").toLowerCase();
      const seller = String(product.seller?.name || product.seller || "").toLowerCase();
      const sourceType = String(product.sourceType || "").toLowerCase();
      assert.ok(!source.includes("mi_shop"));
      assert.ok(!source.includes("mercadolivre"));
      assert.ok(!seller.includes("mi shop"));
      assert.ok(!seller.includes("Saldão da Informática"));
      assert.ok(!sourceType.includes("mercadolivre"));
      const link = String(product.permalink || product.productUrl || product.affiliateUrl || "");
      assert.ok(!/mercadolivre\.com\.br\/?$/.test(link));
    }
  } finally {
    global.fetch = originalFetch;
  }
});

test("Texto do botao permanece claro", () => {
  const appJs = fs.readFileSync(path.join(process.cwd(), "public", "app.js"), "utf8");
  assert.ok(appJs.includes("Abrir oferta"));
  assert.ok(/Link indispon/i.test(appJs));
  assert.ok(/Parcelamento estimado/i.test(appJs));
});

