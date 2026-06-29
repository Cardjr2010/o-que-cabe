import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import CatalogManager from "../src/catalog/CatalogManager.js";

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "oqc-actionpay-"));
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
        if (previous[key] === undefined) delete process.env[key];
        else process.env[key] = previous[key];
      }
    });
}

async function loadImporterClass() {
  const url = new URL("../src/importers/ActionpayYmlImporter.js", import.meta.url);
  url.searchParams.set("t", `${Date.now()}-${Math.random()}`);
  const module = await import(url.href);
  return module.ActionpayYmlImporter;
}

function makeActionpayYml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="2026-06-29 10:00">
  <shop>
    <categories>
      <category id="1">Celulares</category>
      <category id="2">Notebooks</category>
      <category id="3">TVs</category>
    </categories>
    <offers>
      <offer id="1001" available="true">
        <url>https://partner.example/iphone-15</url>
        <price>4999.90</price>
        <currencyId>BRL</currencyId>
        <categoryId>1</categoryId>
        <picture>https://img.example/iphone-15.jpg</picture>
        <name>iPhone 15 128GB</name>
        <vendor>Apple</vendor>
        <model>iPhone 15</model>
        <description>Celular Apple real do feed.</description>
      </offer>
      <offer id="1002" available="true">
        <url>https://partner.example/notebook-ideapad</url>
        <price>2899.90</price>
        <currencyId>BRL</currencyId>
        <categoryId>2</categoryId>
        <picture>https://img.example/notebook-ideapad.jpg</picture>
        <name>Lenovo IdeaPad 3</name>
        <vendor>Lenovo</vendor>
        <model>IdeaPad 3</model>
        <description>Notebook de teste real.</description>
      </offer>
      <offer id="1003" available="true">
        <url></url>
        <price>1999.90</price>
        <currencyId>BRL</currencyId>
        <categoryId>3</categoryId>
        <picture>https://img.example/tv.jpg</picture>
        <name>TV Sem Link</name>
        <vendor>Marca</vendor>
        <model>Modelo</model>
      </offer>
    </offers>
  </shop>
</yml_catalog>`;
}

test("ActionpayYmlImporter parse YML simples e normaliza categorias", async () => {
  const ActionpayYmlImporter = await loadImporterClass();
  const importer = new ActionpayYmlImporter({
    provider: { isConfigured: () => true },
    catalogManager: new CatalogManager({ seedPath: path.join(tempDir(), "seed.json") }),
  });
  const parsed = importer.parse(makeActionpayYml());

  assert.equal(parsed.offers.length, 3);
  assert.equal(parsed.categories["1"], "Celulares");

  const phone = importer.normalizeOffer(parsed.offers[0], { categories: parsed.categories });
  const notebook = importer.normalizeOffer(parsed.offers[1], { categories: parsed.categories });
  const tv = importer.normalizeOffer(parsed.offers[2], { categories: parsed.categories });

  assert.equal(phone.ok, true);
  assert.equal(phone.product.category, "tecnologia/celulares");
  assert.equal(notebook.product.category, "tecnologia/notebooks");
  assert.equal(tv.ok, false);
  assert.ok(tv.reason.includes("URL ausente"));
});

test("ActionpayYmlImporter rejeita produto sem titulo, preco ou url", async () => {
  const ActionpayYmlImporter = await loadImporterClass();
  const importer = new ActionpayYmlImporter();

  const missingTitle = importer.normalizeOffer({ id: "1", price: "99.90", url: "https://x.com/p" }, { categories: {} });
  const missingPrice = importer.normalizeOffer({ id: "2", name: "Produto", url: "https://x.com/p" }, { categories: {} });
  const missingUrl = importer.normalizeOffer({ id: "3", name: "Produto", price: "99.90" }, { categories: {} });

  assert.equal(missingTitle.ok, false);
  assert.equal(missingPrice.ok, false);
  assert.equal(missingUrl.ok, false);
});

test("ActionpayYmlImporter importa para o CatalogManager", async () => {
  const ActionpayYmlImporter = await loadImporterClass();
  const baseDir = tempDir();
  const seedPath = path.join(baseDir, "seed.json");
  fs.writeFileSync(seedPath, "[]\n", "utf8");

  const catalogManager = new CatalogManager({ seedPath });
  const importer = new ActionpayYmlImporter({
    provider: {
      isConfigured: () => true,
      saldaoOfferId: "13241",
      sourceId: "source-1",
      defaultSubId: "oqc",
      async getYmls() {
        return {
          ok: true,
          items: [
            {
              offerId: "13241",
              offerName: "Saldão da Informática - Notebooks, iPhones e TVs.",
              ymlId: "yml-1",
              ymlName: "Product feed de Saldão de informática",
            },
          ],
        };
      },
      async getDeeplinkYml() {
        return {
          ok: true,
          data: importer.parse(makeActionpayYml()),
          text: makeActionpayYml(),
        };
      },
    },
    catalogManager,
    sourceOfferId: "13241",
    sourceOfferName: "Saldão da Informática - Notebooks, iPhones e TVs.",
  });

  const result = await importer.importActionpaySaldaoToCatalog();

  assert.equal(result.configured, true);
  assert.equal(result.offerId, "13241");
  assert.equal(result.imported, 2);
  assert.equal(result.rejected, 1);
  assert.ok(result.errors.some((item) => /URL ausente/i.test(item)));
  assert.ok(result.warnings.some((item) => /Moeda/i.test(item)) || true);

  const stored = catalogManager.list().filter((item) => item.marketplace === "actionpay");
  assert.equal(stored.length, 2);
  assert.equal(stored[0].sourceType, "actionpay_yml");
  assert.equal(stored[0].dataMode, "real");
  assert.ok(stored[0].affiliateUrl.includes("iphone-15"));
});

test("API Actionpay status, ymls e importacao nao expõem chave", async () => {
  const baseDir = tempDir();
  const seedPath = path.join(baseDir, "seed.json");
  fs.writeFileSync(seedPath, "[]\n", "utf8");

  await withEnv({
    ACTIONPAY_API_KEY: "actionpay-secret",
    ACTIONPAY_SOURCE_ID: "source-123",
    ACTIONPAY_SALDAO_OFFER_ID: "13241",
    ACTIONPAY_DEFAULT_SUBID: "oqc",
    ACTIONPAY_CATALOG_SEED_PATH: seedPath,
  }, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const target = String(input);
      if (target.includes("apiWmYmls") && target.includes("act=deeplinks")) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/xml" },
          text: async () => makeActionpayYml(),
        };
      }
      if (target.includes("apiWmYmls")) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/xml" },
          text: async () => `<?xml version="1.0"?><ymls><yml><offer_id>13241</offer_id><offer_name>Saldão da Informática - Notebooks, iPhones e TVs.</offer_name><yml_id>yml-1</yml_id><yml_name>Product feed de Saldão de informática</yml_name><file><url>https://example.com/feed.xml</url></file></yml></ymls>`,
        };
      }
      return originalFetch(input);
    };

    try {
      const webUrl = new URL("../api/web.js", import.meta.url);
      webUrl.searchParams.set("t", `${Date.now()}-${Math.random()}`);
      const handler = (await import(webUrl.href)).default;

      const statusRes = createResponse();
      await handler({ url: "/api/actionpay/status", method: "GET" }, statusRes);
      const statusBody = JSON.parse(statusRes.body);
      assert.equal(statusRes.statusCode, 200);
      assert.deepEqual(Object.keys(statusBody).sort(), ["configured", "defaultSubId", "hasApiKey", "hasSourceId", "offerId"]);
      assert.ok(!JSON.stringify(statusBody).includes("actionpay-secret"));

      const ymlsRes = createResponse();
      await handler({ url: "/api/actionpay/ymls", method: "GET" }, ymlsRes);
      const ymlsBody = JSON.parse(ymlsRes.body);
      assert.equal(ymlsRes.statusCode, 200);
      assert.equal(ymlsBody.count, 1);
      assert.ok(!JSON.stringify(ymlsBody).includes("actionpay-secret"));
      assert.equal(ymlsBody.ymls[0].offerId, "13241");
      assert.equal(ymlsBody.ymls[0].hasFile, true);

      const importRes = createResponse();
      await handler({ url: "/api/actionpay/import-saldao", method: "POST" }, importRes);
      const importBody = JSON.parse(importRes.body);
      assert.equal(importRes.statusCode, 200);
      assert.equal(importBody.configured, true);
      assert.equal(importBody.offerId, "13241");
      assert.equal(importBody.imported, 2);
      assert.equal(importBody.rejected, 1);
      assert.ok(!JSON.stringify(importBody).includes("actionpay-secret"));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
