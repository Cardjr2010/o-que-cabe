import test from "node:test";
import assert from "node:assert/strict";
import SearchOrchestrator from "../src/search/SearchOrchestrator.js";
import { normalizeInstallmentData } from "../src/catalog/installments.js";

function createCatalogManager(products = []) {
  return {
    search() {
      return products;
    },
    list() {
      return products;
    },
  };
}

test("Parse de intenÃ§Ã£o entende orÃ§amento mensal e categoria", () => {
  const orchestrator = new SearchOrchestrator({ catalogManager: createCatalogManager() });
  const intent = orchestrator.parseIntent({ query: "celular ate 100 por mes", mode: "monthly" });

  assert.equal(intent.mode, "monthly");
  assert.equal(intent.category, "celular");
  assert.equal(intent.monthly, 100);
  assert.ok(intent.searchText.length > 0);
});

test("Parse de intenÃ§Ã£o entende orÃ§amento total", () => {
  const orchestrator = new SearchOrchestrator({ catalogManager: createCatalogManager() });
  const intent = orchestrator.parseIntent({ query: "notebook ate 2500", mode: "total" });

  assert.equal(intent.mode, "total");
  assert.equal(intent.category, "notebooks");
  assert.equal(intent.totalBudget, 2500);
});

test("Parse de intenÃ§Ã£o usa SEO para monitor gamer, notebook e celular", () => {
  const orchestrator = new SearchOrchestrator({ catalogManager: createCatalogManager() });

  const monitorIntent = orchestrator.parseIntent({ query: "monitor gamer 144hz", mode: "monthly" });
  const notebookIntent = orchestrator.parseIntent({ query: "notebook bom ate 2500", mode: "total" });
  const cellphoneIntent = orchestrator.parseIntent({ query: "celular ate 1000 reais 128gb", mode: "total" });

  assert.equal(monitorIntent.category, "monitores");
  assert.ok(monitorIntent.seoIntent);
  assert.ok(monitorIntent.seoKeywords.includes("144HZ"));
  assert.equal(notebookIntent.category, "notebooks");
  assert.equal(notebookIntent.totalBudget, 2500);
  assert.equal(cellphoneIntent.category, "celulares");
  assert.ok(cellphoneIntent.seoKeywords.includes("128GB"));
});

test("Parcelamento real tem prioridade sobre estimativa", () => {
  const real = normalizeInstallmentData({
    price: 1200,
    installments: {
      count: 12,
      amount: 100,
      total: 1200,
      interestFree: true,
      source: "feed",
      confidence: 0.95,
    },
  });
  const estimated = normalizeInstallmentData({ price: 1200 }, { months: 12 });

  assert.equal(real.installments.available, true);
  assert.equal(real.estimatedInstallment, null);
  assert.equal(real.installmentSource, "feed");
  assert.equal(estimated.installments.available, false);
  assert.equal(estimated.estimatedInstallment.count, 12);
  assert.match(estimated.installmentWarning, /Parcelamento estimado/i);
});

test("Orquestrador preserva parcelamento e dados de orçamento", () => {
  const orchestrator = new SearchOrchestrator({
    catalogManager: createCatalogManager([
      {
        title: "Notebook real",
        marketplace: "saldao_informatica",
        dataMode: "real",
        sourceType: "csv_feed",
        price: 2500,
        installments: {
          available: true,
          count: 10,
          amount: 250,
          total: 2500,
          interestFree: true,
          source: "feed",
          confidence: 0.95,
        },
      },
    ]),
  });

  const intent = orchestrator.parseIntent({ query: "notebook ate 2500", mode: "total", totalBudget: 2500 });
  const prepared = orchestrator.prepareProducts([
    {
      title: "Notebook real",
      marketplace: "saldao_informatica",
      dataMode: "real",
      sourceType: "csv_feed",
      price: 2500,
      installments: {
        available: true,
        count: 10,
        amount: 250,
        total: 2500,
        interestFree: true,
        source: "feed",
        confidence: 0.95,
      },
    },
  ], intent);

  assert.equal(prepared.ok, true);
  assert.equal(prepared.returnedCount, 1);
  assert.ok(prepared.products[0]);
  assert.ok(prepared.products[0].budgetContext);
  assert.ok("installmentSource" in prepared.products[0]);
});

