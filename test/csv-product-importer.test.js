import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import CsvProductImporter, { rowToProduct } from "../src/importers/CsvProductImporter.js";
import CatalogManager from "../src/catalog/CatalogManager.js";
import handler from "../api/web.js";

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

test("CSV válido importa produto", () => {
  const result = rowToProduct({
    title: "Samsung Galaxy A15",
    category: "celular",
    price: "899",
    productUrl: "https://lista.mercadolivre.com.br/samsung-galaxy-a15-256gb",
    marketplace: "Mercado Livre",
  });

  assert.equal(result.ok, true);
  assert.equal(result.product.price, 899);
  assert.equal(result.product.dataMode, "seed");
  assert.equal(result.product.sourceType, "csv");
});

test("CSV sem link rejeita", () => {
  const result = rowToProduct({
    title: "Sem link",
    category: "celular",
    price: "100",
    marketplace: "Mercado Livre",
  });

  assert.equal(result.ok, false);
  assert.match(result.reason, /link/i);
});

test("CSV com affiliateUrl usa affiliateUrl antes de productUrl", () => {
  const importer = new CsvProductImporter();
  const result = importer.importFromCsv([
    "id,externalId,title,category,brand,model,price,currency,image,productUrl,affiliateUrl,marketplace,sourceType,condition,lastCheckedAt",
    "csv-1,ext-1,Produto Afiliado,notebook,Marca,Modelo,1999,BRL,https://example.com/x.png,https://lista.mercadolivre.com.br/produto,https://afiliado.exemplo/produto,Mercado Livre,csv,new,2026-06-25T00:00:00-03:00",
  ].join("\n"));

  assert.equal(result.imported.length, 1);
  assert.equal(result.imported[0].productUrl, "https://afiliado.exemplo/produto");
  assert.equal(result.imported[0].permalink, "https://afiliado.exemplo/produto");
});

test("price string vira número", () => {
  const result = rowToProduct({
    title: "TV teste",
    category: "tv",
    price: "2299",
    productUrl: "https://lista.mercadolivre.com.br/tv-teste",
    marketplace: "Mercado Livre",
  });

  assert.equal(result.ok, true);
  assert.equal(result.product.price, 2299);
});

test("duplicado não duplica", () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), ".tmp-"));
  const seedPath = path.join(tempDir, "products.seed.json");
  fs.writeFileSync(seedPath, "[]\n", "utf8");
  const catalog = new CatalogManager({ seedPath });
  const result = catalog.import([
    {
      id: "dup-1",
      externalId: "ext-1",
      title: "Produto 1",
      category: "celular",
      price: 100,
      productUrl: "https://lista.mercadolivre.com.br/produto-1",
      marketplace: "Mercado Livre",
      dataMode: "seed",
    },
    {
      id: "dup-1",
      externalId: "ext-1",
      title: "Produto 1 atualizado",
      category: "celular",
      price: 120,
      productUrl: "https://lista.mercadolivre.com.br/produto-1",
      marketplace: "Mercado Livre",
      dataMode: "seed",
    },
  ]);
  const duplicates = result.products.filter((item) => item.id === "dup-1");
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].price, 120);
});

test("seed é atualizada corretamente", () => {
  const importer = new CsvProductImporter();
  const csvText = fs.readFileSync(path.join(process.cwd(), "data", "products.sample.csv"), "utf8");
  const result = importer.importFromCsv(csvText);
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), ".tmp-"));
  const seedPath = path.join(tempDir, "products.seed.json");
  fs.writeFileSync(seedPath, "[]\n", "utf8");
  const catalog = new CatalogManager({ seedPath });
  const merged = catalog.import(result.imported);

  assert.ok(merged.total >= result.imported.length);
  assert.ok(merged.products.some((item) => item.title === "Samsung Galaxy A15"));
});

test("produto inválido retorna motivo", () => {
  const result = rowToProduct({
    title: "",
    category: "celular",
    price: "100",
    marketplace: "Mercado Livre",
  });

  assert.equal(result.ok, false);
  assert.ok(result.reason.length > 0);
});

test("/api/search encontra produto importado no catálogo real", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("offline");
  };

  try {
    const res = createResponse();
    await handler({ url: "/api/search?q=celular&mode=total&totalBudget=1500" }, res);
    const body = JSON.parse(res.body);

    assert.equal(res.statusCode, 200);
    assert.ok(body.products.length > 0);
    assert.equal(body.dataMode, "real");
    assert.equal(body.recommendations[0].product.dataMode, "real");
    assert.equal(body.recommendations[0].product.marketplace, "mi_shop");
  } finally {
    global.fetch = originalFetch;
  }
});

test("CatalogManager recebe produtos importados pelo CSV", () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), ".tmp-"));
  const seedPath = path.join(tempDir, "products.seed.json");
  fs.writeFileSync(seedPath, "[]\n", "utf8");
  const catalog = new CatalogManager({ seedPath });
  const importer = new CsvProductImporter();
  const csvText = fs.readFileSync(path.join(process.cwd(), "data", "products.sample.csv"), "utf8");
  const result = importer.importFromCsv(csvText);
  const merged = catalog.import(result.imported);

  assert.ok(merged.products.length > 0);
  assert.ok(catalog.search({ category: "celular" }).length > 0);
});
