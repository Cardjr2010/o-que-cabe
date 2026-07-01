import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import CatalogManager from "../src/catalog/CatalogManager.js";

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "oqc-feed-"));
}

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

function withEnv(overrides, fn) {
  const keys = Object.keys(overrides);
  const previous = {};
  for (const key of keys) {
    previous[key] = process.env[key];
    if (overrides[key] === undefined) delete process.env[key];
    else process.env[key] = overrides[key];
  }

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const key of keys) {
        if (previous[key] === undefined) delete process.env[key];
        else process.env[key] = previous[key];
      }
    });
}

async function loadCsvFeedProvider() {
  const url = new URL("../src/feed/providers/CsvFeedProvider.js", import.meta.url);
  url.searchParams.set("t", `${Date.now()}-${Math.random()}`);
  const module = await import(url.href);
  return module.default;
}

async function loadMiShopFeedProvider() {
  const url = new URL("../src/feed/providers/MiShopFeedProvider.js", import.meta.url);
  url.searchParams.set("t", `${Date.now()}-${Math.random()}`);
  const module = await import(url.href);
  return module.default;
}

async function loadWebHandler() {
  const url = new URL("../api/web.js", import.meta.url);
  url.searchParams.set("t", `${Date.now()}-${Math.random()}`);
  const module = await import(url.href);
  return module.default;
}

const sampleCsv = [
  "sku,title,description,price,currency,url,image,brand,category,model",
  "mi-shop-1,iPhone 15 128GB,Apple smartphone real,4999.90,BRL,https://mishop.example/iphone-15,https://img.example/iphone-15.jpg,Apple,celular,iPhone 15",
  "mi-shop-2,Lenovo IdeaPad 3,Notebook de linha de entrada,2899.90,BRL,https://mishop.example/ideapad-3,https://img.example/ideapad-3.jpg,Lenovo,notebook,IdeaPad 3",
  "mi-shop-3,Sem URL,Produto invalido,199.90,BRL,,https://img.example/invalid.jpg,Marca,outros,Modelo",
].join("\n");

test("CsvFeedProvider detecta e normaliza CSV", async () => {
  const CsvFeedProvider = await loadCsvFeedProvider();
  const provider = new CsvFeedProvider({
    catalogManager: new CatalogManager({ seedPath: path.join(tempDir(), "seed.json") }),
  });

  const parsed = provider.parse(sampleCsv, { source: "mi-shop.csv", format: "csv" });
  assert.equal(parsed.rawCount, 3);
  assert.equal(parsed.products.length, 2);
  assert.equal(parsed.rejectedRows.length, 1);
  assert.equal(parsed.products[0].marketplace, "csv");
  assert.equal(parsed.products[0].sourceType, "csv_feed");
  assert.equal(parsed.products[0].dataMode, "real");
  assert.equal(parsed.products[0].affiliateUrl, "https://mishop.example/iphone-15");
  assert.equal(parsed.products[0].productUrl, "https://mishop.example/iphone-15");
  assert.equal(parsed.products[0].category, "celular");
});

test("MiShopFeedProvider importa no CatalogManager e deduplica", async () => {
  const MiShopFeedProvider = await loadMiShopFeedProvider();
  const baseDir = tempDir();
  const seedPath = path.join(baseDir, "products.seed.json");
  fs.writeFileSync(seedPath, "[]\n", "utf8");
  const catalogManager = new CatalogManager({ seedPath });
  const provider = new MiShopFeedProvider({
    catalogManager,
    seedPath,
  });

  const first = await provider.import("", { feedText: sampleCsv, format: "csv" });
  assert.equal(first.provider, "mi_shop");
  assert.equal(first.imported, 2);
  assert.equal(first.rejected, 1);
  assert.equal(first.duplicates, 0);

  const stored = catalogManager.list().filter((item) => String(item.marketplace).toLowerCase() === "mi_shop");
  assert.equal(stored.length, 2);
  assert.equal(stored[0].sourceType, "csv_feed");
  assert.equal(stored[0].dataMode, "real");
  assert.ok(stored[0].productUrl.includes("iphone-15"));

  const second = await provider.import("", { feedText: sampleCsv, format: "csv" });
  assert.equal(second.imported, 2);
  assert.equal(second.duplicates, 2);
  assert.equal(catalogManager.list().filter((item) => String(item.marketplace).toLowerCase() === "mi_shop").length, 2);
});

test("API /api/feed/providers e /api/feed/import funcionam e alimentam a busca", async () => {
  const baseDir = tempDir();
  const seedPath = path.join(baseDir, "products.seed.json");
  fs.writeFileSync(seedPath, "[]\n", "utf8");

  await withEnv({
    ACTIONPAY_CATALOG_SEED_PATH: seedPath,
  }, async () => {
    const handler = await loadWebHandler();

    const providersRes = createResponse();
    await handler({ url: "/api/feed/providers", method: "GET" }, providersRes);
    const providersBody = JSON.parse(providersRes.body);
    assert.equal(providersRes.statusCode, 200);
    assert.deepEqual(providersBody.providers, ["saldao_informatica", "mi_shop", "csv", "actionpay", "awin"]);

    const importRes = createResponse();
    const feedText = encodeURIComponent(sampleCsv);
    await handler({ url: `/api/feed/import?provider=mi_shop&feedText=${feedText}&format=csv`, method: "POST" }, importRes);
    const importBody = JSON.parse(importRes.body);
    assert.equal(importRes.statusCode, 200);
    assert.equal(importBody.ok, true);
    assert.equal(importBody.provider, "mi_shop");
    assert.equal(importBody.imported, 2);
    assert.equal(importBody.rejected, 1);

    const searchRes = createResponse();
    await handler({ url: "/api/search?q=iphone%2015&mode=total&totalBudget=6000", method: "GET" }, searchRes);
    const searchBody = JSON.parse(searchRes.body);
    assert.equal(searchRes.statusCode, 200);
    assert.ok(Array.isArray(searchBody.products));
    assert.ok(searchBody.products.some((item) => /celular|smartphone|notebook|tv/i.test(`${item.title || ""} ${item.category || ""}`)));
    assert.equal(searchBody.dataMode, "real");
    assert.ok(
      searchBody.products.some((item) => {
        const marketplace = String(item.marketplace || "").toLowerCase();
        const store = String(item.store || "").toLowerCase();
        return marketplace === "saldao_informatica" || marketplace === "mi_shop" || store === "mi shop" || store.includes("saldão");
      }),
    );
  });
});
