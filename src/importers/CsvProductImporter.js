import path from "node:path";
import { projectRoot } from "../runtime/project-root.js";

import { normalizeImportedProduct } from "./ProductImporter.js";

const root = projectRoot;

function splitCsvLine(line = "") {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(csvText = "") {
  const lines = String(csvText || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function isValidValue(value) {
  return String(value || "").trim().length > 0;
}

function isValidUrl(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return /^https?:\/\/.+/i.test(normalized) && !normalized.includes("placeholder");
}

function importError(reason, row = {}) {
  return {
    ok: false,
    reason,
    title: String(row.title || row.name || "").trim(),
    externalId: String(row.externalId || row.id || "").trim(),
  };
}

function rowToProduct(row = {}) {
  const title = String(row.title || "").trim();
  const category = String(row.category || "").trim();
  const price = String(row.price || "").trim();
  const productUrl = String(row.productUrl || "").trim();
  const affiliateUrl = String(row.affiliateUrl || "").trim();
  const marketplace = String(row.marketplace || "").trim();

  if (!isValidValue(title)) return importError("Campo obrigatório ausente: title.", row);
  if (!isValidValue(category)) return importError("Campo obrigatório ausente: category.", row);
  if (!isValidValue(price)) return importError("Campo obrigatório ausente: price.", row);
  if (!isValidValue(marketplace)) return importError("Campo obrigatório ausente: marketplace.", row);
  if (!isValidUrl(affiliateUrl) && !isValidUrl(productUrl)) return importError("Produto sem link válido em productUrl ou affiliateUrl.", row);

  const raw = {
    id: row.id,
    externalId: row.externalId,
    title,
    category,
    brand: row.brand || "",
    model: row.model || "",
    price: Number(price),
    currency: row.currency || "BRL",
    image: row.image || "",
    productUrl,
    affiliateUrl,
    marketplace,
    sourceType: row.sourceType || "csv",
    condition: row.condition || "new",
    lastCheckedAt: row.lastCheckedAt || "",
    importedAt: new Date().toISOString(),
    dataMode: "seed",
  };

  const normalized = normalizeImportedProduct(raw);
  if (!normalized) return importError("Produto inválido após normalização.", row);
  return { ok: true, product: normalized };
}

export class CsvProductImporter {
  constructor(options = {}) {
    this.seedPath = options.seedPath || path.join(root, "data", "products.seed.json");
  }

  parse(csvText) {
    return parseCsv(csvText);
  }

  importFromCsv(csvText) {
    const rows = parseCsv(csvText);
    const imported = [];
    const rejected = [];

    for (const row of rows) {
      const result = rowToProduct(row);
      if (result.ok) {
        imported.push(result.product);
      } else {
        rejected.push(result);
      }
    }

    return { imported, rejected, rows };
  }

  summarize(result) {
    return {
      total: result.rows?.length || 0,
      valid: result.imported?.length || 0,
      rejected: result.rejected?.length || 0,
      reasons: (result.rejected || []).map((item) => item.reason),
    };
  }
}

export { parseCsv, rowToProduct };
export default CsvProductImporter;