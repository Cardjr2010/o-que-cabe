import path from "node:path";
import CatalogRepository from "./CatalogRepository.js";
import CatalogValidator from "./CatalogValidator.js";
import CatalogUpdater from "./CatalogUpdater.js";
import CatalogExporter from "./CatalogExporter.js";
import { loadSeedProducts, normalizeImportedProduct } from "../importers/ProductImporter.js";

const root = process.cwd();
const seedPath = path.join(root, "data", "products.seed.json");

export default class CatalogManager {
  constructor(options = {}) {
    this.seedPath = options.seedPath || seedPath;
    this.repository = options.repository || new CatalogRepository();
    this.validator = options.validator || new CatalogValidator();
    this.updater = options.updater || new CatalogUpdater();
    this.exporter = options.exporter || new CatalogExporter();
  }

  list() {
    return loadSeedProducts(this.seedPath);
  }

  getById(id) {
    return this.list().find((item) => item.id === id) || null;
  }

  validate(product) {
    return this.validator.validate(product);
  }

  normalize(product) {
    return normalizeImportedProduct(product);
  }

  import(products = [], mode = "merge") {
    const accepted = [];
    const rejected = [];

    for (const raw of (Array.isArray(products) ? products : [])) {
      const validation = this.validate(raw);
      if (!validation.ok) {
        rejected.push({ product: raw, reasons: validation.reasons, reason: validation.reasons.join(", ") });
        continue;
      }
      const normalized = this.normalize(raw);
      if (!normalized) {
        rejected.push({ product: raw, reasons: ["produto inválido após normalização"], reason: "produto inválido após normalização" });
        continue;
      }
      accepted.push(normalized);
    }

    const current = this.list();
    const merged = mode === "replace" ? accepted : this.updater.merge(current, accepted);
    this.repository.write(this.seedPath, merged);
    return {
      imported: accepted.length,
      rejected: rejected.length,
      rejectedItems: rejected,
      total: merged.length,
      products: merged,
    };
  }

  remove(id) {
    const next = this.updater.remove(this.list(), id);
    this.repository.write(this.seedPath, next);
    return next;
  }

  disable(id) {
    const next = this.updater.disable(this.list(), id);
    this.repository.write(this.seedPath, next);
    return next;
  }

  export(format = "json") {
    const products = this.list();
    return String(format).toLowerCase() === "csv" ? this.exporter.toCsv(products) : this.exporter.toJson(products);
  }

  search(filters = {}) {
    const { category = "", brand = "", marketplace = "", status = "", minPrice = 0, maxPrice = Infinity, q = "" } = filters;
    const needle = String(q || "").toLowerCase();
    return this.list().filter((item) => {
      if (category && String(item.category || "").toLowerCase() !== String(category).toLowerCase()) return false;
      if (brand && String(item.brand || "").toLowerCase() !== String(brand).toLowerCase()) return false;
      if (marketplace && String(item.marketplace || "").toLowerCase() !== String(marketplace).toLowerCase()) return false;
      if (status && String(item.status || "ACTIVE").toLowerCase() !== String(status).toLowerCase()) return false;
      const price = Number(item.price || 0);
      if (price < Number(minPrice || 0) || price > Number(maxPrice || Infinity)) return false;
      if (needle) {
        const text = `${item.title || ""} ${item.category || ""} ${item.brand || ""} ${item.model || ""}`.toLowerCase();
        return text.includes(needle);
      }
      return true;
    });
  }

  diagnostics() {
    const items = this.list();
    return {
      seedPath: this.seedPath,
      count: items.length,
      statuses: items.reduce((acc, item) => {
        const key = String(item.status || "ACTIVE");
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
      marketplaces: items.reduce((acc, item) => {
        const key = String(item.marketplace || "unknown");
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    };
  }
}

export { CatalogRepository, CatalogValidator, CatalogUpdater, CatalogExporter };
