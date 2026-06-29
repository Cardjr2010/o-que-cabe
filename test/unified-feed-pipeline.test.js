import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import CatalogManager from "../src/catalog/CatalogManager.js";

async function loadActionpayFeedProviderClass() {
  const url = new URL("../src/providers/ActionpayFeedProvider.js", import.meta.url);
  return (await import(url.href)).ActionpayFeedProvider;
}

async function loadApiHandler() {
  const url = new URL("../api/web.js", import.meta.url);
  return (await import(url.href)).default;
}

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "oqc-unified-feed-"));
}

function createSeedFile(items = []) {
  const dir = tempDir();
  const seedPath = path.join(dir, "seed.json");
  fs.writeFileSync(seedPath, `${JSON.stringify(items, null, 2)}\n`);
  return { dir, seedPath };
}

test("ActionpayFeedProvider importa o mesmo pipeline para o CatalogManager", async () => {
  const ActionpayFeedProvider = await loadActionpayFeedProviderClass();
  const { seedPath } = createSeedFile([]);
  const catalogManager = new CatalogManager({ seedPath });
  const provider = new ActionpayFeedProvider({
    catalogManager,
    catalogSeedPath: seedPath,
    sourceOfferId: "13241",
    provider: {
      isConfigured: () => true,
      apiKey: "key",
      sourceId: "source",
      defaultSubId: "oqc",
      saldaoOfferId: "13241",
      getDiagnostics: () => ({ configured: true, hasApiKey: true, hasSourceId: true, offerId: "13241", defaultSubId: "oqc" }),
      async getYmls() {
        return {
          ok: true,
          items: [{ offerId: "13241", offerName: "Saldão da Informática - Notebooks, iPhones e TVs.", ymlId: "yml-1" }],
        };
      },
      async getDeeplinkYml() {
        return {
          ok: true,
          text: `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog>
  <shop>
    <categories>
      <category id="1">Celulares</category>
    </categories>
    <offers>
      <offer id="ap-1" available="true">
        <url>https://example.com/iphone-13</url>
        <price>2999.00</price>
        <currencyId>BRL</currencyId>
        <categoryId>1</categoryId>
        <picture>https://example.com/iphone.jpg</picture>
        <name>iPhone 13 128GB</name>
        <vendor>Apple</vendor>
        <model>A2482</model>
        <description>Produto real importado via feed.</description>
      </offer>
    </offers>
  </shop>
</yml_catalog>`,
          data: {},
          raw: "",
          statusHttp: 200,
        };
      },
    },
  });

  const result = await provider.import();
  assert.equal(result.configured, true);
  assert.equal(result.imported > 0, true);
  assert.equal(result.rejected, 0);
  const stored = catalogManager.list().filter((item) => String(item.marketplace || "").toLowerCase() === "actionpay");
  assert.equal(stored.length, 1);
  assert.equal(stored[0].title, "iPhone 13 128GB");
});

test("GET /api/feed/status resume providers e contagens", async () => {
  const handler = await loadApiHandler();
  const res = {
    statusCode: 200,
    headers: {},
    chunks: [],
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(chunk) {
      if (chunk) this.chunks.push(Buffer.from(String(chunk)));
    },
  };

  await handler({ url: "/api/feed/status", method: "GET" }, res);
  const body = JSON.parse(Buffer.concat(res.chunks).toString("utf8"));
  assert.equal(body.ok, true);
  assert.ok(Array.isArray(body.providers));
  assert.ok(body.providers.some((item) => item.provider === "mi_shop"));
  assert.ok(body.providers.some((item) => item.provider === "csv"));
  assert.ok(body.providers.some((item) => item.provider === "actionpay"));
  assert.ok(body.providers.some((item) => item.provider === "awin"));
  assert.equal(typeof body.totalProducts, "number");
});

test("POST /api/feed/import/actionpay responde sem quebrar a API", async () => {
  const handler = await loadApiHandler();
  const res = {
    statusCode: 200,
    headers: {},
    chunks: [],
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(chunk) {
      if (chunk) this.chunks.push(Buffer.from(String(chunk)));
    },
  };

  await handler({ url: "/api/feed/import/actionpay?feedText=%7B%22items%22%3A%5B%5D%7D&format=json", method: "POST" }, res);
  const body = JSON.parse(Buffer.concat(res.chunks).toString("utf8"));
  assert.equal(body.ok === true || body.ok === false, true);
  assert.ok(Object.prototype.hasOwnProperty.call(body, "provider"));
});
