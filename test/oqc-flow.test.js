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

test("Busca de celular traz complementos separados sem misturar acessorio no produto principal", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("offline");
  };

  try {
    const res = createResponse();
    await handler({ url: "/api/search?q=iphone%2017%20pro%20max&mode=total&totalBudget=10000" }, res);
    const body = parseBody(res);
    const firstTitle = String(body.products?.[0]?.title || body.products?.[0]?.displayTitle || "");
    const complements = body.complementaryRecommendations || [];

    assert.equal(res.statusCode, 200);
    assert.equal(body.dataMode, "real");
    assert.match(firstTitle, /iphone/i);
    assert.ok(!/(capa|pel[íi]cula|fone|carregador|cabo|power bank)/i.test(firstTitle));
    assert.ok(Array.isArray(complements));
    assert.ok(complements.length >= 1);
    assert.ok(complements.every((item) => item.product && item.label && item.reason));
    assert.ok(complements.every((item) => /(fone|carregador|power bank|pel[íi]cula|capa|cabo)/i.test(String(item.product.title || item.product.displayTitle || ""))));

    const accessoryRes = createResponse();
    await handler({ url: "/api/search?q=capa%20para%20iphone%2017&mode=total&totalBudget=100" }, accessoryRes);
    const accessoryBody = parseBody(accessoryRes);
    assert.deepEqual(accessoryBody.complementaryRecommendations || [], []);
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

test("Browse de categoria abre lista publicada e ordena sem puxar acessorios obvios", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("offline");
  };

  try {
    const notebookRes = createResponse();
    await handler({ url: "/api/search?q=notebook&category=Notebooks&mode=total&totalBudget=999999&browse=category&sort=price_asc&limit=300" }, notebookRes);
    const notebookBody = parseBody(notebookRes);
    const notebookTitles = notebookBody.products.map((product) => String(product.title || product.displayTitle || "").toLowerCase());
    const notebookSources = notebookBody.products.map((product) => String(product.sourceName || product.sourceLabel || product.marketplace || product.source || "").toLowerCase());

    assert.equal(notebookRes.statusCode, 200);
    assert.equal(notebookBody.browseMode, "category");
    assert.equal(notebookBody.sort, "price_asc");
    assert.ok(notebookBody.displayedCount <= 300);
    assert.ok(notebookBody.totalMatchedProducts > 40);
    assert.ok(notebookSources.some((source) => source.includes("amazon") || source.includes("mercado_livre")));
    assert.ok(notebookTitles.every((title) => title.includes("notebook") || title.includes("laptop") || title.includes("chromebook") || title.includes("macbook")));
    assert.ok(notebookTitles.every((title) => !/(case|capa|fonte|adaptador|mem[oó]ria ram|carregador)/i.test(title)));

    const tvRes = createResponse();
    await handler({ url: "/api/search?q=tv&category=TVs&mode=total&totalBudget=999999&browse=category&sort=price_asc&limit=300" }, tvRes);
    const tvBody = parseBody(tvRes);
    const tvTitles = tvBody.products.map((product) => String(product.title || product.displayTitle || "").toLowerCase());

    assert.equal(tvBody.browseMode, "category");
    assert.equal(tvBody.sort, "price_asc");
    assert.ok(tvBody.totalMatchedProducts > 0);
    assert.ok(tvTitles.every((title) => !/(cftv|controle remoto|tv stick|media player|tv box|box tv|suporte)/i.test(title)));

    const installmentRes = createResponse();
    await handler({ url: "/api/search?q=tv&category=TVs&mode=total&totalBudget=999999&browse=category&sort=installment_asc&limit=300" }, installmentRes);
    const installmentBody = parseBody(installmentRes);
    assert.equal(installmentBody.sort, "installment_asc");
  } finally {
    global.fetch = originalFetch;
  }
});

test("Rota publica de categoria renderiza pagina dedicada com busca pre-carregada", async () => {
  const res = createResponse();
  await handler({ url: "/categoria/tv" }, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.headers["Content-Type"] || res.headers["content-type"] || "", /text\/html/);
  assert.match(res.body, /data-category-page="true"/);
  assert.match(res.body, /data-category-query="tv"/);
  assert.match(res.body, /data-category-category="TVs"/);
  assert.match(res.body, /TVs que cabem no orçamento \| O Que Cabe/);
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
      "/api/search?q=flores&mode=total&totalBudget=200",
      "/api/search?q=buqu%C3%AA&mode=total&totalBudget=200",
      "/api/search?q=xyz987produtoimpossivel&mode=total&totalBudget=200",
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

test("Busca de ferramenta usa produto parceiro monitorado sem tratar como oferta fresca", async () => {
  const res = createResponse();
  await handler({ url: "/api/search?q=furadeira&mode=total&totalBudget=500" }, res);
  const body = parseBody(res);

  assert.equal(res.statusCode, 200);
  assert.equal(body.dataMode, "real");
  assert.ok(Array.isArray(body.products));
  assert.ok(body.products.length > 0);
  assert.ok(body.products.every((product) => String(product.dataMode || "").toLowerCase() !== "demo"));
  assert.ok(body.products.some((product) => /furadeira|parafusadeira|ferramenta|bosch|makita|dewalt/i.test(product.title || "")));
});

test("Busca especifica de casa nao usa oferta verificada vencida e busca ampla pede refinamento", async () => {
  const specificRes = createResponse();
  await handler({ url: "/api/search?q=garrafa%20termica%20matterhorn&mode=total&totalBudget=100" }, specificRes);
  const specificBody = parseBody(specificRes);

  assert.equal(specificRes.statusCode, 200);
  assert.ok(!specificBody.products.some((product) => product.asin === "B07K8XJF9D"));

  const broadRes = createResponse();
  await handler({ url: "/api/search?q=casa&mode=total&totalBudget=50" }, broadRes);
  const broadBody = parseBody(broadRes);

  assert.equal(broadRes.statusCode, 200);
  assert.equal(broadBody.strategyUsed, "refinement-needed");
  assert.equal(broadBody.products.length, 0);
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
    assert.equal(body.totalProducts, 3317);
    assert.equal(body.productsPublished, 2382);
    assert.equal(body.productsHidden, 935);
    assert.ok(Array.isArray(body.top20Brands));
    assert.ok(body.top20Brands.length > 0);
    assert.ok(Array.isArray(body.top20Categories));
    assert.ok(body.top20Categories.length > 0);
    assert.ok(Array.isArray(body.topSearches));
    assert.ok(body.topSearches.length > 0);
    assert.ok(body.curatedOffers);
    assert.ok(Number(body.curatedOffers.total || 0) > 0);
    assert.ok(Array.isArray(body.curatedOffers.bySource));
    assert.ok(body.curatedOffers.bySource.some((entry) => entry.value === "Amazon" && entry.count > 0));
    assert.ok(body.curatedOffers.bySource.some((entry) => entry.value === "Mercado Livre" && entry.count > 0));
    assert.ok(Array.isArray(body.inventorySummary));
    assert.ok(body.inventorySummary.some((entry) => entry.source === "Amazon" && entry.type === "verified_affiliate_offer"));
    assert.ok(body.inventorySummary.some((entry) => entry.source === "Mercado Livre" && entry.type === "verified_affiliate_offer"));
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

