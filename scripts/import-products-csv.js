import fs from "node:fs";
import path from "node:path";
import CsvProductImporter from "../src/importers/CsvProductImporter.js";
import CatalogManager from "../src/catalog/CatalogManager.js";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Uso: node scripts/import-products-csv.js data/products.sample.csv");
  process.exit(1);
}

const absoluteCsvPath = path.isAbsolute(csvPath) ? csvPath : path.join(process.cwd(), csvPath);
if (!fs.existsSync(absoluteCsvPath)) {
  console.error(`Arquivo não encontrado: ${absoluteCsvPath}`);
  process.exit(1);
}

const importer = new CsvProductImporter();
const catalog = new CatalogManager();
const csvText = fs.readFileSync(absoluteCsvPath, "utf8");
const result = importer.importFromCsv(csvText);
const merged = catalog.import(result.imported, "merge");

const summary = importer.summarize(result);
console.log(`Total lido: ${summary.total}`);
console.log(`Válidos: ${summary.valid}`);
console.log(`Rejeitados: ${summary.rejected}`);
if (summary.reasons.length) {
  console.log("Motivos:");
  for (const reason of summary.reasons) console.log(`- ${reason}`);
}
console.log(`Importados no catálogo: ${merged.imported}`);
console.log(`Total no catálogo: ${merged.total}`);
