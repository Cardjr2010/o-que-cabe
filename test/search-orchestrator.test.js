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
  assert.equal(intent.category, "notebook");
  assert.equal(intent.totalBudget, 2500);
});

test("Parse de intenÃ§Ã£o usa SEO para monitor gamer, notebook e celular", () => {
  const orchestrator = new SearchOrchestrator({ catalogManager: createCatalogManager() });

  const monitorIntent = orchestrator.parseIntent({ query: "monitor gamer 144hz", mode: "monthly" });
  const notebookIntent = orchestrator.parseIntent({ query: "notebook bom ate 2500", mode: "total" });
  const cellphoneIntent = orchestrator.parseIntent({ query: "celular ate 1000 reais 128gb", mode: "total" });

  assert.equal(monitorIntent.category, "monitor");
  assert.ok(monitorIntent.seoIntent);
  assert.ok(monitorIntent.seoKeywords.includes("144HZ"));
  assert.equal(notebookIntent.category, "notebook");
  assert.equal(notebookIntent.totalBudget, 2500);
  assert.equal(cellphoneIntent.category, "celular");
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


test("iPhone prioriza aparelho principal sobre acess?rio", () => {
  const orchestrator = new SearchOrchestrator({
    catalogManager: createCatalogManager([
      {
        title: "Capa para iPhone 15",
        brand: "Apple",
        category: "capa",
        normalizedCategory: "capa",
        productType: "accessory",
        isAccessory: true,
        marketplace: "saldao_informatica",
        dataMode: "real",
        sourceType: "csv_feed",
        price: 79.9,
      },
      {
        title: "iPhone 15 128GB",
        brand: "Apple",
        category: "celular",
        normalizedCategory: "celular",
        productType: "principal",
        isAccessory: false,
        marketplace: "saldao_informatica",
        dataMode: "real",
        sourceType: "csv_feed",
        price: 4999.9,
      },
    ]),
  });

  const result = orchestrator.search({ query: "iphone", mode: "total", totalBudget: 5000 });

  assert.equal(result.dataMode, "real");
  assert.ok(result.products.length > 0);
  assert.match(String(result.products[0].displayTitle || result.products[0].title), /iPhone 15/i);
  assert.ok(!/Capa/i.test(String(result.products[0].displayTitle || result.products[0].title)));
});

test("Samsung e Galaxy priorizam smartphone principal", () => {
  const orchestrator = new SearchOrchestrator({
    catalogManager: createCatalogManager([
      {
        title: "Capa para Samsung Galaxy A15",
        brand: "Samsung",
        category: "capa",
        normalizedCategory: "capa",
        productType: "accessory",
        isAccessory: true,
        marketplace: "saldao_informatica",
        dataMode: "real",
        sourceType: "csv_feed",
        price: 49.9,
      },
      {
        title: "Smartphone Samsung Galaxy A15 128GB",
        brand: "Samsung",
        category: "celular",
        normalizedCategory: "celular",
        productType: "principal",
        isAccessory: false,
        marketplace: "saldao_informatica",
        dataMode: "real",
        sourceType: "csv_feed",
        price: 1299.9,
      },
      {
        title: "Monitor Samsung 19",
        brand: "Samsung",
        category: "monitor",
        normalizedCategory: "monitor",
        productType: "principal",
        isAccessory: false,
        marketplace: "saldao_informatica",
        dataMode: "real",
        sourceType: "csv_feed",
        price: 199.9,
      },
    ]),
  });

  const samsung = orchestrator.search({ query: "samsung", mode: "total", totalBudget: 3000 });
  const galaxy = orchestrator.search({ query: "galaxy a15", mode: "total", totalBudget: 1500 });

  assert.equal(samsung.dataMode, "real");
  assert.equal(galaxy.dataMode, "real");
  assert.match(String(samsung.products[0].displayTitle || samsung.products[0].title), /Galaxy A15/i);
  assert.match(String(galaxy.products[0].displayTitle || galaxy.products[0].title), /Galaxy A15/i);
});

