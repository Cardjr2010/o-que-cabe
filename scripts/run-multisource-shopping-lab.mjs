import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import CatalogManager from "../src/catalog/CatalogManager.js";
import MercadoLivreSearchProvider from "../src/providers/MercadoLivreSearchProvider.js";
import AmazonRapidApiSearchProvider from "../src/providers/AmazonRapidApiSearchProvider.js";
import SourceIntelligenceLayer from "../src/sources/SourceIntelligenceLayer.js";
import { resolveCatalogSeedPath } from "../src/runtime/catalog-path.js";
import { resolveProjectPath } from "../src/runtime/project-root.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function loadDotEnv() {
  const envPath = path.join(projectRoot, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || /^\s*#/.test(line) || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

const QUERIES = [
  "iPhone 17 256GB",
  "iPhone 17 Pro Max 256GB",
  "Galaxy S25 256GB",
  "Galaxy S25 Ultra 512GB",
  "Xiaomi BE6500",
  "Echo Dot",
  "Fire TV Stick",
  "AirPods Pro",
  "Apple Watch",
  "notebook Lenovo i5 16GB",
  "notebook Dell Ryzen 7 16GB",
  "monitor AOC 144Hz",
  "monitor LG UltraWide",
  "TV Samsung 55",
  "TV LG OLED",
  "PlayStation 5",
  "Nintendo Switch",
  "furadeira Bosch",
  "aspirador WAP",
  "air fryer Philips Walita",
];

async function main() {
  loadDotEnv();
  const catalogManager = new CatalogManager({
    seedPath: process.env.CATALOG_SEED_PATH || resolveCatalogSeedPath(resolveProjectPath("src", "data", "products.seed.json")),
  });
  const layer = new SourceIntelligenceLayer({
    catalogManager,
    mercadoLivreProvider: new MercadoLivreSearchProvider(),
    amazonProvider: new AmazonRapidApiSearchProvider(),
  });

  const rows = [];
  for (const query of QUERIES) {
    const result = await layer.search({ query, limitPerSource: 8 });
    rows.push({
      query,
      selectedSources: result.diagnostics?.plan?.selectedSources || [],
      totalReceived: result.diagnostics?.totalReceived || 0,
      accepted: result.diagnostics?.accepted || 0,
      elapsedMs: result.elapsedMs,
      topProduct: result.products?.[0]?.title || null,
      topSource: result.products?.[0]?.source || null,
      topPrice: result.products?.[0]?.finalPurchaseCost || result.products?.[0]?.price || null,
    });
  }

  process.stdout.write(`${JSON.stringify({ queries: rows }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({
    ok: false,
    message: error?.message || "multisource_lab_failed",
    name: error?.name || "Error",
  }, null, 2)}\n`);
  process.exitCode = 1;
});
