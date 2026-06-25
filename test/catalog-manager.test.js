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
      marketplace: "Mercado Livre",
      productUrl: "https://lista.mercadolivre.com.br/samsung-galaxy-a15-256gb",
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
      marketplace: "Mercado Livre",
      productUrl: "https://lista.mercadolivre.com.br/samsung-galaxy-a15-256gb",
      dataMode: "seed",
    },
  ]);

  assert.equal(duplicate.imported, 1);
  assert.equal(manager.list().length, 1);
  assert.equal(manager.getById("cat-1").price, 999);
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
      marketplace: "Mercado Livre",
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
      productUrl: "https://lista.mercadolivre.com.br/produto-export",
      marketplace: "Mercado Livre",
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
      productUrl: "https://lista.mercadolivre.com.br/notebook-x",
      marketplace: "Mercado Livre",
      dataMode: "seed",
    },
  ]);
  const manager = new CatalogManager({ seedPath: temp.filePath });
  const result = manager.search({ category: "notebook", marketplace: "Mercado Livre", minPrice: 1000, maxPrice: 3000 });

  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Notebook X");
});

test("Catalog page e API retornam catálogo", async () => {
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
    assert.match(pageRes.body, /Catálogo interno/);
  } finally {
    global.fetch = originalFetch;
  }
});
