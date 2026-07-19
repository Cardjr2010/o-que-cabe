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


test("iPhone prioriza aparelho principal sobre acess?rio", async () => {
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

  const result = await orchestrator.search({ query: "iphone", mode: "total", totalBudget: 5000 });

  assert.equal(result.dataMode, "real");
  assert.ok(result.products.length > 0);
  assert.match(String(result.products[0].displayTitle || result.products[0].title), /iPhone 15/i);
  assert.ok(!/Capa/i.test(String(result.products[0].displayTitle || result.products[0].title)));
});

test("Samsung e Galaxy priorizam smartphone principal", async () => {
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

  const samsung = await orchestrator.search({ query: "samsung", mode: "total", totalBudget: 3000 });
  const galaxy = await orchestrator.search({ query: "galaxy a15", mode: "total", totalBudget: 1500 });

  assert.equal(samsung.dataMode, "real");
  assert.equal(galaxy.dataMode, "real");
  assert.match(String(samsung.products[0].displayTitle || samsung.products[0].title), /Galaxy A15/i);
  assert.match(String(galaxy.products[0].displayTitle || galaxy.products[0].title), /Galaxy A15/i);
});

test("Consulta curta sem cobertura aciona fallback do Mercado Livre com itemId e permalink", async () => {
  let providerCalls = 0;
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
        title: "Cabo para iPhone 15",
        brand: "Apple",
        category: "cabo",
        normalizedCategory: "cabo",
        productType: "accessory",
        isAccessory: true,
        marketplace: "saldao_informatica",
        dataMode: "real",
        sourceType: "csv_feed",
        price: 49.9,
      },
    ]),
    marketplaceSearchProvider: {
      async searchProducts(query) {
        providerCalls += 1;
        assert.match(String(query), /iphone 17 pro max/i);
        return {
          products: [
            {
              itemId: "MLB123",
              id: "MLB123",
              title: "iPhone 17 Pro Max 256GB",
              price: 8999.9,
              image: "https://http2.mlstatic.com/item.jpg",
              permalink: "https://www.mercadolivre.com.br/item/MLB123",
              condition: "new",
              seller: { id: 1, nickname: "loja oficial" },
              sellerReputation: { level_id: "5_green" },
              availableQuantity: 3,
              source: "mercado_livre",
              marketplace: "mercado_livre",
              dataMode: "real",
            },
            {
              itemId: "MLB456",
              id: "MLB456",
              title: "Capa para iPhone 17 Pro Max",
              price: 99.9,
              image: "https://http2.mlstatic.com/item2.jpg",
              permalink: "https://www.mercadolivre.com.br/item/MLB456",
              condition: "new",
              seller: { id: 2, nickname: "acessorios" },
              sellerReputation: null,
              availableQuantity: 10,
              source: "mercado_livre",
              marketplace: "mercado_livre",
              dataMode: "real",
            },
            {
              itemId: "MLB789",
              id: "MLB789",
              title: "Resultado sem permalink",
              price: 100,
              image: "https://http2.mlstatic.com/item3.jpg",
              permalink: "",
              condition: "new",
              seller: { id: 3, nickname: "sem link" },
              availableQuantity: 1,
              source: "mercado_livre",
              marketplace: "mercado_livre",
              dataMode: "real",
            },
          ],
          rawCount: 3,
          returnedCount: 3,
          fallbackText: "Não encontramos no catálogo principal do OQC, mas encontramos estas ofertas no Mercado Livre.",
          statusHttp: 200,
        };
      },
    },
  });

  const result = await orchestrator.search({ query: "iphone 17 pro max", mode: "total", totalBudget: 12000 });

  assert.equal(providerCalls, 1);
  assert.equal(result.fallbackUsed, true);
  assert.equal(result.fallbackSource, "mercado_livre");
  assert.match(result.fallbackWarning, /Nao encontramos opcoes suficientes no catalogo principal do OQC/i);
  assert.ok(result.products.length > 0);
  assert.equal(result.dataMode, "real");
  assert.equal(result.strategyUsed, "catalog-search+mercado-livre-fallback");
  const mlProducts = result.products.filter((product) => String(product.source || product.marketplace || "").includes("mercado_livre"));
  assert.ok(mlProducts.length > 0);
  assert.ok(mlProducts.every((product) => String(product.itemId || "").length > 0));
  assert.ok(mlProducts.every((product) => String(product.permalink || product.productUrl || "").length > 0));
  assert.ok(!result.products.some((product) => String(product.itemId || "") === "MLB789"));
  assert.ok(result.products.some((product) => /iPhone 17 Pro Max/i.test(String(product.title || product.displayTitle || ""))));
});

test("Catálogo OQC forte não chama fallback do Mercado Livre", async () => {
  let providerCalls = 0;
  const orchestrator = new SearchOrchestrator({
    catalogManager: createCatalogManager([
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
      {
        title: "iPhone 14 128GB",
        brand: "Apple",
        category: "celular",
        normalizedCategory: "celular",
        productType: "principal",
        isAccessory: false,
        marketplace: "saldao_informatica",
        dataMode: "real",
        sourceType: "csv_feed",
        price: 4299.9,
      },
      {
        title: "iPhone 13 128GB",
        brand: "Apple",
        category: "celular",
        normalizedCategory: "celular",
        productType: "principal",
        isAccessory: false,
        marketplace: "saldao_informatica",
        dataMode: "real",
        sourceType: "csv_feed",
        price: 3299.9,
      },
    ]),
    marketplaceSearchProvider: {
      async searchProducts() {
        providerCalls += 1;
        return { products: [], rawCount: 0, returnedCount: 0, fallbackText: "", statusHttp: 200 };
      },
    },
  });

  const result = await orchestrator.search({ query: "iphone", mode: "total", totalBudget: 5000 });

  assert.equal(providerCalls, 0);
  assert.equal(result.fallbackUsed, false);
  assert.equal(result.strategyUsed, "catalog-search");
  assert.equal(result.dataMode, "real");
  assert.ok(result.products.length >= 3);
  assert.match(String(result.products[0].title || result.products[0].displayTitle || ""), /iPhone/i);
});

test("Sem token ou proxy configurado, o fallback do Mercado Livre nao eh acionado", async () => {
  let providerCalls = 0;
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
    ]),
    marketplaceSearchProvider: {
      getDiagnostics() {
        return {
          configured: false,
          hasAccessToken: false,
          hasSearchEndpoint: false,
          tokenState: "TOKEN_MISSING_OR_REQUIRED",
          authMode: "anonymous",
        };
      },
      async searchProducts() {
        providerCalls += 1;
        return { products: [], rawCount: 0, returnedCount: 0, fallbackText: "", statusHttp: 403 };
      },
    },
  });

  const result = await orchestrator.search({ query: "iphone 17 pro max", mode: "total", totalBudget: 12000 });

  assert.equal(providerCalls, 0);
  assert.equal(result.fallbackUsed, false);
  assert.equal(result.fallbackAttempted, false);
  assert.equal(result.fallbackSource, "mercado_livre");
  assert.match(result.fallbackWarning, /Mercado Livre indisponivel sem autenticacao configurada/i);
});

