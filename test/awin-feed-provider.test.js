import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import CatalogManager from "../src/catalog/CatalogManager.js";

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
    if (overrides[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = overrides[key];
    }
  }

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const key of keys) {
        if (previous[key] === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = previous[key];
        }
      }
    });
}

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "oqc-awin-"));
}

async function loadAwinProviderClass() {
  const url = new URL("../src/providers/AwinFeedProvider.js", import.meta.url);
  url.searchParams.set("t", `${Date.now()}-${Math.random()}`);
  const module = await import(url.href);
  return module.AwinFeedProvider;
}

test("AwinFeedProvider parse JSONL e CSV", async () => {
  const ProviderClass = await loadAwinProviderClass();
  {
    const providerInstance = new ProviderClass({
      catalogManager: {
        list: () => [],
        import: () => ({ imported: 0, rejected: 0, rejectedItems: [], products: [], total: 0 }),
      },
      statePath: path.join(tempDir(), "awin-state.json"),
      fetchImpl: async () => {
        throw new Error("fetch nao deveria ser chamado");
      },
    });

    const jsonl = [
      JSON.stringify({
        id: "awin-1",
        title: "Samsung Galaxy A15",
        category: "celular",
        brand: "Samsung",
        price: { value: "999.90", currency: "BRL" },
        link: "https://loja.example/a15",
        image_link: "https://img.example/a15.jpg",
      }),
      JSON.stringify({
        id: "awin-2",
        title: "Lenovo IdeaPad 3",
        category: "notebook",
        brand: "Lenovo",
        price: { value: "2899.90", currency: "BRL" },
        link: "https://loja.example/ideapad-3",
      }),
    ].join("\n");
    const parsedJsonl = providerInstance.parseFeedText(jsonl, { source: "feed.jsonl", format: "jsonl" });
    assert.equal(parsedJsonl.rows.length, 2);
    assert.equal(parsedJsonl.errors.length, 0);

    const csv = [
      "id,title,category,brand,price,currency,productUrl,image",
      "awin-3,TV Samsung Crystal 50,TV,Samsung,2199.90,BRL,https://loja.example/tv50,https://img.example/tv50.jpg",
    ].join("\n");
    const parsedCsv = providerInstance.parseFeedText(csv, { source: "feed.csv", format: "csv" });
    assert.equal(parsedCsv.rows.length, 1);
    assert.equal(parsedCsv.rows[0].title, "TV Samsung Crystal 50");
  }
});

test("AwinFeedProvider normaliza, rejeita e deduplica via CatalogManager", async () => {
  const AwinFeedProvider = await loadAwinProviderClass();
  const baseDir = tempDir();
  const seedPath = path.join(baseDir, "products.seed.json");
  const feedPath = path.join(baseDir, "awin-feed.jsonl");
  fs.writeFileSync(feedPath, [
    JSON.stringify({
      id: "awin-1",
      offerId: "awin-1",
      title: "Samsung Galaxy A15",
      category: "celular",
      brand: "Samsung",
      model: "A15",
      price: { value: "999.90", currency: "BRL" },
      link: "https://loja.example/a15",
      image_link: "https://img.example/a15.jpg",
      seller: "Loja Parceira",
      availability: "in stock",
      condition: "new",
    }),
    JSON.stringify({
      id: "awin-2",
      offerId: "awin-2",
      title: "Lenovo IdeaPad 3",
      category: "notebook",
      brand: "Lenovo",
      model: "IdeaPad 3",
      price: { value: "2899.90", currency: "BRL" },
      affiliateUrl: "https://tracking.example/ideapad-3",
      productUrl: "https://loja.example/ideapad-3",
      image: "https://img.example/ideapad-3.jpg",
      seller: "Loja Parceira",
      availability: "in stock",
      condition: "new",
    }),
    JSON.stringify({
      id: "awin-3",
      title: "Sem link",
      category: "tv",
      price: { value: "2199.90", currency: "BRL" },
    }),
  ].join("\n"), "utf8");

  const catalogManager = new CatalogManager({ seedPath });
  const provider = new AwinFeedProvider({
    catalogManager,
    statePath: path.join(baseDir, "awin-state.json"),
    fetchImpl: async () => {
      throw new Error("fetch nao deveria ser chamado");
    },
  });

  await withEnv({
    AWIN_ADVERTISERS_JSON: JSON.stringify([
      { name: "Stanley BR", feedPath, categoryGroup: "House & Kitchen" },
    ]),
    AWIN_CATEGORY_MAP_JSON: JSON.stringify({
      "House & Kitchen": ["Stanley"],
      Fashion: ["Posthaus", "Tjama"],
      Shoes: ["Clóvis Calçados"],
    }),
  }, async () => {
    const first = await provider.importToCatalog();
    assert.equal(first.configured, true);
    assert.equal(first.downloaded, 3);
    assert.equal(first.imported, 2);
    assert.equal(first.rejected, 1);
    assert.ok(first.errors.some((item) => /Link ausente/i.test(item)));

    const stored = catalogManager.list().filter((item) => String(item.marketplace).toLowerCase() === "awin");
    assert.equal(stored.length, 2);
    assert.equal(stored[0].marketplace, "awin");
    assert.equal(stored[0].sourceType, "awin_feed");
    assert.equal(stored[0].dataMode, "real");
    assert.equal(stored[0].seller, "Loja Parceira");
    assert.equal(stored[0].category, "celular");
    assert.equal(stored[1].affiliateUrl, "https://tracking.example/ideapad-3");
    assert.equal(stored[1].productUrl, "https://tracking.example/ideapad-3");

    const second = await provider.importToCatalog();
    const storedAgain = catalogManager.list().filter((item) => String(item.marketplace).toLowerCase() === "awin");
    assert.equal(storedAgain.length, 2);
    assert.ok(second.updated >= 2 || second.imported >= 2);
  });
});

test("API /api/awin/status nao expõe segredo", async () => {
  await withEnv({
    AWIN_FEED_PATH: "",
    AWIN_FEED_URL: "",
    AWIN_ACCESS_TOKEN: "",
    AWIN_PUBLISHER_ID: "",
    AWIN_ADVERTISER_ID: "",
    AWIN_ADVERTISERS_JSON: JSON.stringify([
      { name: "Stanley BR", categoryGroup: "House & Kitchen" },
      { name: "Posthaus BR", categoryGroup: "Fashion" },
    ]),
  }, async () => {
    const url = new URL("../api/web.js", import.meta.url);
    url.searchParams.set("t", String(Date.now()));
    const handler = (await import(url.href)).default;
    const res = createResponse();
    await handler({ url: "/api/awin/status", method: "GET" }, res);
    const body = JSON.parse(res.body);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(Object.keys(body).sort(), ["advertisers", "configured", "feedAvailable", "lastImport", "totalProducts"]);
    assert.equal(body.advertisers.length, 2);
    assert.ok(!JSON.stringify(body).includes("token"));
  });
});

test("API /api/awin/import usa feed local e escreve no catálogo de teste", async () => {
  const baseDir = tempDir();
  const seedPath = path.join(baseDir, "products.seed.json");
  const statePath = path.join(baseDir, "awin-state.json");
  const feedPath = path.join(baseDir, "awin-feed.jsonl");
  fs.writeFileSync(seedPath, "[]\n", "utf8");
  fs.writeFileSync(feedPath, [
    JSON.stringify({
      id: "awin-9",
      title: "AOC Roku TV 43",
      category: "tv",
      brand: "AOC",
      model: "Roku TV 43",
      price: { value: "1799.90", currency: "BRL" },
      productUrl: "https://loja.example/aoc-roku-43",
      image: "https://img.example/aoc-roku-43.jpg",
    }),
  ].join("\n"), "utf8");

  await withEnv({
    AWIN_CATALOG_SEED_PATH: seedPath,
    AWIN_STATE_PATH: statePath,
    AWIN_FEED_PATH: feedPath,
    AWIN_FEED_FORMAT: "jsonl",
    AWIN_ACCESS_TOKEN: "token-teste",
    AWIN_PUBLISHER_ID: "publisher-teste",
    AWIN_ADVERTISER_ID: "advertiser-teste",
    AWIN_ADVERTISERS_JSON: JSON.stringify([
      { name: "AOC", feedPath, categoryGroup: "House & Kitchen" },
    ]),
  }, async () => {
    const url = new URL("../api/web.js", import.meta.url);
    url.searchParams.set("t", String(Date.now()));
    const handler = (await import(url.href)).default;
    const res = createResponse();
    await handler({ url: "/api/awin/import?format=jsonl", method: "POST" }, res);
    const body = JSON.parse(res.body);

    assert.equal(res.statusCode, 200);
    assert.equal(body.ok, true);
    assert.equal(body.configured, true);
    assert.equal(body.imported, 1);
    assert.equal(body.downloaded, 1);
    assert.equal(body.rejected, 0);

    const saved = JSON.parse(fs.readFileSync(seedPath, "utf8"));
    assert.equal(saved.length, 1);
    assert.equal(saved[0].title, "AOC Roku TV 43");
    assert.equal(saved[0].marketplace, "awin");
    assert.equal(saved[0].sourceType, "awin_feed");
    assert.equal(saved[0].dataMode, "real");
    assert.ok(fs.existsSync(statePath));
  });
});
