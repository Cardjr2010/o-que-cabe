import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import CatalogManager from "../src/catalog/CatalogManager.js";
import handler from "../api/web.js";

function createTempSeed(initial = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oqc-catalog-"));
  const filePath = path.join(dir, "products.seed.json");
  fs.writeFileSync(filePath, `${JSON.stringify(initial, null, 2)}\n`, "utf8");
  return { dir, filePath };
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

test("CatalogManager importa, atualiza e evita duplicados", () => {
  const temp = createTempSeed([]);
  const manager = new CatalogManager({ seedPath: temp.filePath });

  const result = manager.import([
    {
      id: "cat-1",
      externalId: "ext-1",
      title: "Samsung Galaxy A15",
      category: "celular",
      brand: "Samsung",
      model: "A15",
      price: 899,
      marketplace: "Saldão da Informática",
      productUrl: "https://example.com/samsung-galaxy-a15-256gb",
      dataMode: "seed",
    },
  ]);

  assert.equal(result.imported, 1);
  assert.equal(result.rejected, 0);
  assert.equal(manager.list().length, 1);

  const duplicate = manager.import([
    {
      id: "cat-1",
      externalId: "ext-1",
      title: "Samsung Galaxy A15 atualizado",
      category: "celular",
      brand: "Samsung",
      model: "A15",
      price: 999,
      marketplace: "Saldão da Informática",
      productUrl: "https://example.com/samsung-galaxy-a15-256gb",
      dataMode: "seed",
    },
  ]);

  assert.equal(duplicate.imported, 1);
  assert.equal(manager.list().length, 1);
  assert.equal(manager.getById("cat-1").price, 999);
  assert.ok(Array.isArray(manager.getById("cat-1").priceHistory));
  assert.ok(manager.getById("cat-1").priceHistory.length >= 1);
});

test("CatalogManager registra histÃ³rico quando o preÃ§o muda", () => {
  const temp = createTempSeed([
    {
      id: "cat-history",
      externalId: "ext-history",
      title: "Produto Historico",
      category: "tv",
      brand: "Marca",
      model: "Modelo",
      price: 1000,
      currency: "BRL",
      productUrl: "https://example.com/produto-historico",
      marketplace: "Saldão da Informática",
      dataMode: "seed",
      priceHistory: [{ date: "2026-06-01", price: 1000 }],
      importedAt: "2026-06-01T00:00:00-03:00",
      updatedAt: "2026-06-01T00:00:00-03:00",
    },
  ]);
  const manager = new CatalogManager({ seedPath: temp.filePath });

  const result = manager.import([
    {
      id: "cat-history",
      externalId: "ext-history",
      title: "Produto Historico",
      category: "tv",
      brand: "Marca",
      model: "Modelo",
      price: 1200,
      currency: "BRL",
      productUrl: "https://example.com/produto-historico",
      marketplace: "Saldão da Informática",
      dataMode: "seed",
    },
  ]);

  const item = manager.getById("cat-history");
  assert.equal(result.imported, 1);
  assert.equal(item.price, 1200);
  assert.ok(item.priceHistory.length >= 2);
  assert.equal(item.priceHistory[0].price, 1000);
  assert.equal(item.priceHistory.at(-1).price, 1200);
});

test("CatalogManager rejeita produto sem link", () => {
  const temp = createTempSeed([]);
  const manager = new CatalogManager({ seedPath: temp.filePath });

  const result = manager.import([
    {
      id: "cat-2",
      title: "Produto sem link",
      category: "celular",
      brand: "Marca",
      model: "Modelo",
      price: 100,
      marketplace: "Saldão da Informática",
      dataMode: "seed",
    },
  ]);

  assert.equal(result.imported, 0);
  assert.equal(result.rejected, 1);
  assert.match(result.rejectedItems[0].reason, /link/i);
});

test("CatalogManager exporta JSON e CSV", () => {
  const temp = createTempSeed([
    {
      id: "cat-3",
      externalId: "ext-3",
      title: "Produto Export",
      category: "tv",
      brand: "Marca",
      model: "Modelo",
      price: 2299,
      currency: "BRL",
      productUrl: "https://example.com/produto-export",
      marketplace: "Saldão da Informática",
      dataMode: "seed",
    },
  ]);
  const manager = new CatalogManager({ seedPath: temp.filePath });

  assert.match(manager.export("json"), /Produto Export/);
  assert.match(manager.export("csv"), /Produto Export/);
});

test("CatalogManager busca por filtros", () => {
  const temp = createTempSeed([
    {
      id: "cat-4",
      externalId: "ext-4",
      title: "Notebook X",
      category: "notebook",
      brand: "Lenovo",
      model: "IdeaPad",
      price: 1999,
      currency: "BRL",
      productUrl: "https://example.com/notebook-x",
      marketplace: "Saldão da Informática",
      dataMode: "seed",
    },
  ]);
  const manager = new CatalogManager({ seedPath: temp.filePath });
  const result = manager.search({ category: "notebook", marketplace: "Saldão da Informática", minPrice: 1000, maxPrice: 3000 });

  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Notebook X");
});

test("Catalog page e API retornam catÃ¡logo", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("offline");
  };

  try {
    const res = createResponse();
    await handler({ url: "/api/catalog" }, res);
    const body = JSON.parse(res.body);
    assert.equal(res.statusCode, 200);
    assert.ok(body.count >= 30);

    const pageRes = createResponse();
    await handler({ url: "/catalog" }, pageRes);
    assert.equal(pageRes.statusCode, 200);
    assert.match(pageRes.body, /Cat..logo interno/i);
  } finally {
    global.fetch = originalFetch;
  }
});

