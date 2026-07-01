import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import CatalogManager from "../src/catalog/CatalogManager.js";

async function loadSaldaoProvider() {
  const url = new URL("../src/providers/SaldaoInformaticaFeedProvider.js", import.meta.url);
  url.searchParams.set("t", `${Date.now()}-${Math.random()}`);
  const module = await import(url.href);
  return module.SaldaoInformaticaFeedProvider;
}

function tempSeedPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oqc-saldao-"));
  const seedPath = path.join(dir, "products.seed.json");
  fs.writeFileSync(seedPath, "[]\n", "utf8");
  return seedPath;
}

test("SaldaoInformaticaFeedProvider import a fonte real do Saldão", async () => {
  const SaldaoInformaticaFeedProvider = await loadSaldaoProvider();
  const seedPath = tempSeedPath();
  const provider = new SaldaoInformaticaFeedProvider({
    catalogManager: new CatalogManager({ seedPath }),
    feedPath: path.resolve("data", "saldao-feed.xml"),
  });

  const parsed = provider.parse(fs.readFileSync(path.resolve("data", "saldao-feed.xml"), "utf8"));
  assert.ok(Array.isArray(parsed.offers));
  assert.ok(parsed.offers.length > 0);

  const first = provider.normalizeOffer(parsed.offers[0], parsed);
  assert.equal(first.ok, true);
  assert.equal(first.product.marketplace, "saldao_informatica");
  assert.equal(first.product.seller, "Saldão da Informática");
  assert.equal(first.product.dataMode, "real");
  assert.ok(first.product.productUrl.startsWith("https://"));

  const result = await provider.import();
  assert.equal(result.configured, true);
  assert.ok(result.imported > 0);
  assert.equal(result.rejected >= 0, true);

  const stored = provider.getCatalogManager().list().filter((item) => String(item.marketplace || "").toLowerCase() === "saldao_informatica");
  assert.ok(stored.length > 0);
  assert.ok(stored.every((item) => item.seller === "Saldão da Informática"));
});
