import fs from "node:fs";
import path from "node:path";
import CatalogManager from "../src/catalog/CatalogManager.js";
import { SaldaoInformaticaFeedProvider } from "../src/providers/SaldaoInformaticaFeedProvider.js";
import { projectRoot } from "../src/runtime/project-root.js";

function resolveArg(index, fallback = "") {
  return String(process.argv[index] || fallback).trim();
}

const root = projectRoot;
const feedPath = path.resolve(resolveArg(2, path.join(root, "data", "saldao-feed.xml")));
const seedPath = path.resolve(resolveArg(3, path.join(root, "data", "products.seed.json")));

if (!fs.existsSync(feedPath)) {
  console.error(`Feed não encontrado: ${feedPath}`);
  process.exit(1);
}

const catalogManager = new CatalogManager({ seedPath });
const provider = new SaldaoInformaticaFeedProvider({
  catalogManager,
  feedPath,
  sourceName: "Saldão da Informática",
  networkName: "saldao_informatica",
});

const result = await provider.import(feedPath);

console.log(JSON.stringify({
  feedPath,
  seedPath,
  configured: result.configured,
  imported: result.imported,
  updated: result.updated,
  rejected: result.rejected,
  rawCount: result.rawCount,
  totalProducts: catalogManager.list().length,
  marketplaceCount: catalogManager.list().filter((item) => String(item.marketplace || "").toLowerCase() === "saldao_informatica").length,
  errors: result.errors,
}, null, 2));
