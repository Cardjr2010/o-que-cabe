import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/web.js";
import MarketIntelligenceEngine from "../src/catalog/MarketIntelligenceEngine.js";

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

test("MarketIntelligenceEngine respeita base mínima e sinaliza histórico insuficiente", () => {
  const engine = new MarketIntelligenceEngine();
  const product = {
    id: "market-1",
    title: "Monitor Gamer 27",
    price: 150,
    priceHistory: [{ date: "2026-07-02T00:00:00.000Z", price: 150 }],
  };

  const snapshot = engine.buildProductSnapshot(product);

  assert.equal(snapshot.currentPrice, 150);
  assert.equal(snapshot.minPrice, 150);
  assert.equal(snapshot.maxPrice, 150);
  assert.equal(snapshot.priceIndicator, "insufficient");
  assert.equal(snapshot.priceIndicatorLabel, "Histórico de preço ainda insuficiente.");
  assert.equal(snapshot.trend, "insufficient");
  assert.equal(snapshot.trendLabel, "Histórico de preço ainda insuficiente.");
  assert.equal(snapshot.promotion.isRealPromotion, false);
  assert.equal(snapshot.promotion.label, "Histórico de preço ainda insuficiente.");
  assert.equal(snapshot.alert.enabled, true);
  assert.equal(snapshot.advice, "Histórico de preço ainda insuficiente.");
});

test("MarketIntelligenceEngine usa trilha suficiente para tendência e promoção, mas segura indicador sem 3 registros", () => {
  const engine = new MarketIntelligenceEngine();
  const product = {
    id: "market-2",
    title: "Notebook Gamer",
    price: 1300,
    priceHistory: [
      { date: "2026-07-01T00:00:00.000Z", price: 1000 },
      { date: "2026-07-02T00:00:00.000Z", price: 1300 },
    ],
  };

  const snapshot = engine.buildProductSnapshot(product);

  assert.equal(snapshot.priceIndicator, "insufficient");
  assert.equal(snapshot.trend, "up");
  assert.equal(snapshot.promotion.isRealPromotion, false);
  assert.equal(snapshot.advice, "Histórico de preço ainda insuficiente.");
});

test("MarketIntelligenceEngine sinaliza alta e alerta de espera com histórico suficiente", () => {
  const engine = new MarketIntelligenceEngine();
  const product = {
    id: "market-3",
    title: "Notebook Gamer",
    price: 1300,
    priceHistory: [
      { date: "2026-07-01T00:00:00.000Z", price: 1000 },
      { date: "2026-07-02T00:00:00.000Z", price: 1150 },
      { date: "2026-07-03T00:00:00.000Z", price: 1300 },
    ],
  };

  const snapshot = engine.buildProductSnapshot(product);

  assert.equal(snapshot.priceIndicator, "high");
  assert.equal(snapshot.trend, "up");
  assert.match(snapshot.advice, /esperar/i);
});

test("/api/market/stats retorna estatísticas de mercado", async () => {
  const res = createResponse();
  await handler({ url: "/api/market/stats" }, res);
  const body = parseBody(res);

  assert.equal(res.statusCode, 200);
  assert.equal(body.ok, true);
  assert.ok(Number.isFinite(body.monitoredProducts));
  assert.ok(Array.isArray(body.biggestDrops));
  assert.ok(Array.isArray(body.biggestRises));
  assert.ok(Array.isArray(body.cheapestCategories));
  assert.ok(body.alertArchitecture);
});

test("/api/search expõe insights de mercado no produto e no advisor", async () => {
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
    assert.ok(body.products[0].market);
    assert.ok(body.products[0].market.priceIndicator);
    assert.ok(body.advisor.market);
    assert.ok(body.advisor.market.advice);
  } finally {
    global.fetch = originalFetch;
  }
});
