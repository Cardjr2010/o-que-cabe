import test from "node:test";
import assert from "node:assert/strict";
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

test("Busca demo retorna recommendations e scoreBreakdown", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ results: [] }),
    text: async () => JSON.stringify({ results: [] }),
    headers: new Map(),
  });

  try {
    const req = { url: "/api/search?q=celular&mode=total&totalBudget=1500" };
    const res = createResponse();
    await handler(req, res);
    const body = JSON.parse(res.body);

    assert.equal(res.statusCode, 200);
    assert.equal(body.ok, true);
    assert.equal(body.dataMode, "demo");
    assert.ok(Array.isArray(body.recommendations));
    assert.ok(body.recommendations.length > 0);
    assert.ok(Array.isArray(body.products));
    assert.ok(body.products.every((product) => Array.isArray(product.scoreBreakdown)));
    assert.ok(body.recommendations.every((item) => typeof item.reason === "string" && item.reason.length > 0));
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
      permalink: "https://lista.mercadolivre.com.br/apertado-forte",
      source: "mercadolivre",
      store: "Mercado Livre",
    },
    {
      title: "CABE simples",
      budgetStatus: "CABE",
      score: 60,
      price: 500,
      dataMode: "demo",
      permalink: "https://lista.mercadolivre.com.br/cabe-simples",
      source: "mercadolivre",
      store: "Mercado Livre",
    },
  ]);

  assert.equal(ranked.recommended[0].product.title, "CABE simples");
  assert.equal(ranked.groups.cabe[0].title, "CABE simples");
});

test("NÃO CABE não vira Melhor escolha se houver CABE", () => {
  const ranked = RankingEngine.rankProducts([
    {
      title: "NÃO CABE caro",
      budgetStatus: "NÃO CABE",
      score: 100,
      price: 5000,
      dataMode: "demo",
      permalink: "https://lista.mercadolivre.com.br/nao-cabe-caro",
      source: "mercadolivre",
      store: "Mercado Livre",
    },
    {
      title: "CABE disponível",
      budgetStatus: "CABE",
      score: 70,
      price: 700,
      dataMode: "demo",
      permalink: "https://lista.mercadolivre.com.br/cabe-disponivel",
      source: "mercadolivre",
      store: "Mercado Livre",
    },
  ]);

  assert.equal(ranked.recommended[0].product.title, "CABE disponível");
  assert.ok(ranked.recommended[0].label.length > 0);
});

test("Cada recomendação possui reason", () => {
  const ranked = RankingEngine.rankProducts([
    {
      title: "CABE 1",
      budgetStatus: "CABE",
      score: 91,
      price: 300,
      dataMode: "real",
      permalink: "https://example.com/1",
      source: "mercadolivre",
      store: "Mercado Livre",
    },
    {
      title: "APERTADO 1",
      budgetStatus: "APERTADO",
      score: 80,
      price: 400,
      dataMode: "real",
      permalink: "https://example.com/2",
      source: "mercadolivre",
      store: "Mercado Livre",
    },
  ]);

  assert.ok(ranked.recommended.every((item) => typeof item.reason === "string" && item.reason.length > 0));
  assert.match(ranked.summary, /priorizam produtos que cabem no orçamento|exemplos demonstrativos/i);
});

test("Demo não usa anúncio real no link", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ results: [] }),
    text: async () => JSON.stringify({ results: [] }),
    headers: new Map(),
  });

  try {
    const req = { url: "/api/search?q=relogio&mode=total&totalBudget=300" };
    const res = createResponse();
    await handler(req, res);
    const body = JSON.parse(res.body);
    const first = body.products[0];

    assert.equal(body.dataMode, "demo");
    assert.ok(first.permalink.includes("lista.mercadolivre.com.br"));
    assert.ok(first.dataMode === "demo");
  } finally {
    global.fetch = originalFetch;
  }
});
