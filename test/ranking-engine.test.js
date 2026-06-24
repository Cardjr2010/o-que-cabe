import test from "node:test";
import assert from "node:assert/strict";
import RankingEngine from "../src/engines/RankingEngine.js";

function product(overrides = {}) {
  return {
    title: "Produto base",
    price: 100,
    budgetStatus: "CABE",
    score: 80,
    permalink: "https://example.com/item",
    source: "mercadolivre",
    store: "Mercado Livre",
    dataMode: "real",
    ...overrides,
  };
}

test("CABE com score menor vence NÃO CABE com score maior", () => {
  const result = RankingEngine.rankProducts([
    product({ title: "Nao cabe forte", budgetStatus: "NÃO CABE", score: 99, price: 500 }),
    product({ title: "Cabe fraco", budgetStatus: "CABE", score: 60, price: 100 }),
  ]);

  assert.equal(result.recommended[0].product.title, "Cabe fraco");
  assert.equal(result.recommended[0].rank, 1);
});

test("CABE é ordenado por score", () => {
  const result = RankingEngine.rankProducts([
    product({ title: "Cabe B", budgetStatus: "CABE", score: 70 }),
    product({ title: "Cabe A", budgetStatus: "CABE", score: 90 }),
    product({ title: "Apertado", budgetStatus: "APERTADO", score: 100 }),
  ]);

  assert.equal(result.groups.cabe[0].title, "Cabe A");
  assert.equal(result.groups.cabe[1].title, "Cabe B");
  assert.equal(result.recommended[0].product.title, "Cabe A");
});

test("APERTADO vira destaque quando não há CABE", () => {
  const result = RankingEngine.rankProducts([
    product({ title: "Apertado 1", budgetStatus: "APERTADO", score: 88 }),
    product({ title: "Apertado 2", budgetStatus: "APERTADO", score: 70 }),
  ]);

  assert.equal(result.recommended[0].product.title, "Apertado 1");
  assert.match(result.recommended[0].label, /Boa alternativa|Melhor escolha/i);
  assert.ok(result.summary.length > 0);
});

test("demo recebe label demonstrativo", () => {
  const result = RankingEngine.rankProducts([
    product({ title: "Demo 1", dataMode: "demo", budgetStatus: "CABE", score: 95 }),
    product({ title: "Demo 2", dataMode: "demo", budgetStatus: "APERTADO", score: 90 }),
  ]);

  assert.equal(result.recommended[0].label, "Exemplo demonstrativo");
  assert.match(result.recommended[0].reason, /Exemplo demonstrativo/i);
  assert.match(result.summary, /exemplos demonstrativos/i);
});

test("produto com link válido vence empate", () => {
  const result = RankingEngine.rankProducts([
    product({ title: "Sem link", score: 85, permalink: "" }),
    product({ title: "Com link", score: 85, permalink: "https://example.com/real" }),
  ]);

  assert.equal(result.groups.cabe[0].title, "Com link");
});

test("produto sem link fica abaixo em empate", () => {
  const result = RankingEngine.rankProducts([
    product({ title: "Sem link", score: 85, permalink: "" }),
    product({ title: "Com link", score: 85, permalink: "https://example.com/real" }),
  ]);

  assert.equal(result.groups.cabe[1].title, "Sem link");
});

test("summary explica a decisão", () => {
  const realResult = RankingEngine.rankProducts([
    product({ title: "Real 1", budgetStatus: "CABE", score: 95, dataMode: "real" }),
    product({ title: "Real 2", budgetStatus: "APERTADO", score: 70, dataMode: "real" }),
  ]);

  assert.match(realResult.summary, /priorizam produtos que cabem no orçamento/i);
});
