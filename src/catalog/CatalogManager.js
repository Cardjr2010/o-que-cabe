import path from "node:path";
import { projectRoot } from "../runtime/project-root.js";
import { resolveCatalogSeedPath } from "../runtime/catalog-path.js";

import CatalogRepository from "./CatalogRepository.js";
import CatalogValidator from "./CatalogValidator.js";
import CatalogUpdater from "./CatalogUpdater.js";
import CatalogExporter from "./CatalogExporter.js";
import { loadSeedProducts, normalizeImportedProduct } from "../importers/ProductImporter.js";
import { normalizeText, scoreProductMatch } from "./ProductNormalizer.js";
import { getCatalogSeedCandidates } from "../runtime/catalog-path.js";

const root = projectRoot;
const seedPath = resolveCatalogSeedPath(path.join(root, "data", "products.seed.json"));

function sourcePriorityForItem(item = {}) {
  const source = normalizeText([
    item.marketplace,
    item.source,
    item.sourceType,
    item.seller,
    item.store,
  ].filter(Boolean).join(" "));

  if (source.includes("saldao") || source.includes("saldão")) return 0;
  if (source.includes("infostore") || source.includes("info store")) return 1;
  if (source.includes("actionpay")) return 2;
  if (source.includes("awin")) return 3;
  if (source.includes("mi_shop") || source.includes("mi shop") || source.includes("mishop")) return 4;
  if (source.includes("mercadolivre") || source.includes("mercado livre")) return 5;
  return 6;
}

function isExcludedSource(item = {}) {
  const source = normalizeText([
    item.marketplace,
    item.source,
    item.sourceType,
    item.seller,
    item.store,
  ].filter(Boolean).join(" "));
  return source.includes("mi_shop")
    || source.includes("mi shop")
    || source.includes("mishop")
    || source.includes("mercadolivre")
    || source.includes("mercado livre");
}

function looksLikeAccessory(item = {}) {
  const text = normalizeText([
    item.displayTitle,
    item.originalTitle,
    item.title,
    item.normalizedCategory,
    item.category,
    item.productType,
    item.description,
    item.compatibility,
  ].filter(Boolean).join(" "));
  return [
    "capa",
    "capinha",
    "case",
    "cover",
    "pelicula",
    "pel?cula",
    "vidro",
    "protetor",
    "screen protector",
    "film",
    "carregador",
    "charger",
    "cabo",
    "cable",
    "fonte",
    "adapter",
    "adaptador",
    "strap",
    "pulseira",
    "controle remoto",
    "remote control",
    "holder",
    "power bank",
    "powerbank",
    "audio glasses",
    "smart audio glasses",
    "bamper",
    "bumper",
    "watch band",
    "smart band",
    "suporte",
    "acessorio",
    "accessory",
    "peca",
    "piece",
    "compatible",
  ].some((term) => text.includes(term));
}

function sourceKey(item = {}) {
  return String([
    item.marketplace,
    item.source,
    item.sourceType,
    item.seller,
    item.store,
  ].filter(Boolean).join(" ") || "unknown").trim() || "unknown";
}

function isVisibleSource(item = {}) {
  return !isExcludedSource(item);
}

function groupBySource(items = []) {
  const counts = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    const key = sourceKey(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source, "pt-BR"));
}

export default class CatalogManager {
  constructor(options = {}) {
    this.seedPath = options.seedPath || seedPath;
    this.repository = options.repository || new CatalogRepository();
    this.validator = options.validator || new CatalogValidator();
    this.updater = options.updater || new CatalogUpdater();
    this.exporter = options.exporter || new CatalogExporter();
  }

  list() {
    return this.getPublishedItems();
  }

  getRawItems() {
    return loadSeedProducts(this.seedPath);
  }

  getPublishedItems() {
    return this.getRawItems().filter((item) => isVisibleSource(item));
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
      accepted.push({
        ...normalized,
        status: normalized.status || this.validator.detectStatus(normalized),
        availability: normalized.availability || "available",
        updatedAt: normalized.updatedAt || new Date().toISOString(),
        importedAt: normalized.importedAt || new Date().toISOString(),
        priceHistory: Array.isArray(normalized.priceHistory) ? normalized.priceHistory : [],
      });
    }

    const current = this.getPublishedItems();
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

  importProducts(products = [], mode = "merge") {
    return this.import(products, mode);
  }

  remove(id) {
    const next = this.updater.remove(this.getPublishedItems(), id);
    this.repository.write(this.seedPath, next);
    return next;
  }

  disable(id) {
    const next = this.updater.disable(this.getPublishedItems(), id);
    this.repository.write(this.seedPath, next);
    return next;
  }

  export(format = "json") {
    const products = this.getPublishedItems();
    return String(format).toLowerCase() === "csv" ? this.exporter.toCsv(products) : this.exporter.toJson(products);
  }

  search(filters = {}) {
    const { category = "", brand = "", marketplace = "", status = "", minPrice = 0, maxPrice = Infinity, q = "" } = filters;
    const needle = String(q || "").trim();
    const normalizedNeedle = normalizeText(needle);
    const accessoryIntent = /\b(capa|case|pelicula|pel[íi]cula|carregador|cabo|fone|headphone|airpods|earbud|strap|pulseira|acessorio|acess[óo]rio)\b/i.test(needle);
    const results = this.list().filter((item) => {
      if (isExcludedSource(item)) return false;
      if (category && String(item.category || "").toLowerCase() !== String(category).toLowerCase()) return false;
      if (brand && String(item.brand || "").toLowerCase() !== String(brand).toLowerCase()) return false;
      if (marketplace && String(item.marketplace || "").toLowerCase() !== String(marketplace).toLowerCase()) return false;
      if (status && String(item.status || "ACTIVE").toLowerCase() !== String(status).toLowerCase()) return false;
      const price = Number(item.price || 0);
      if (price < Number(minPrice || 0) || price > Number(maxPrice || Infinity)) return false;
      if (needle) {
        const itemAccessory = Boolean(item.isAccessory || ["accessory", "piece", "compatible"].includes(String(item.productType || "").toLowerCase()) || looksLikeAccessory(item));
        if (!accessoryIntent && itemAccessory) return false;
        const text = [
          item.displayTitle,
          item.originalTitle,
          item.title,
          item.normalizedCategory,
          item.productType,
          item.category,
          item.brand,
          item.model,
          item.compatibility,
          item.description,
        ].filter(Boolean).join(" ");
        return normalizeText(text).includes(normalizedNeedle) || scoreProductMatch(item, needle) > 0;
      }
      return true;
    });
    if (needle) {
      return results.sort((a, b) => {
        const sourceDiff = sourcePriorityForItem(a) - sourcePriorityForItem(b);
        if (sourceDiff !== 0) return sourceDiff;
        const scoreDiff = scoreProductMatch(b, needle) - scoreProductMatch(a, needle);
        if (scoreDiff !== 0) return scoreDiff;
        const aAccessory = Boolean(a.isAccessory || ["accessory", "piece", "compatible"].includes(String(a.productType || "").toLowerCase()) || looksLikeAccessory(a));
        const bAccessory = Boolean(b.isAccessory || ["accessory", "piece", "compatible"].includes(String(b.productType || "").toLowerCase()) || looksLikeAccessory(b));
        if (aAccessory !== bAccessory) return aAccessory ? 1 : -1;
        const byPrice = Number(a.price || 0) - Number(b.price || 0);
        if (byPrice !== 0) return byPrice;
        return String(a.displayTitle || a.title || "").localeCompare(String(b.displayTitle || b.title || ""), "pt-BR");
      });
    }
    return results;
  }

  diagnostics() {
    const rawItems = this.getRawItems();
    const publishedItems = rawItems.filter((item) => isVisibleSource(item));
    const filteredItems = rawItems.filter((item) => !isVisibleSource(item));
    const hiddenSources = groupBySource(filteredItems);
    const topSources = groupBySource(rawItems);
    return {
      seedPath: this.seedPath,
      seedUsed: this.seedPath,
      seedCandidates: getCatalogSeedCandidates(),
      rawCount: rawItems.length,
      publishedCount: publishedItems.length,
      filteredCount: filteredItems.length,
      hiddenProducts: filteredItems.length,
      filterReasons: hiddenSources.map((item) => ({
        source: item.source,
        count: item.count,
        reason: "Fonte ocultada do catálogo publicado (Mi Shop / Mercado Livre).",
      })),
      sourceCounts: topSources,
      hiddenSources,
      count: publishedItems.length,
      statuses: publishedItems.reduce((acc, item) => {
        const key = String(item.status || "ACTIVE");
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
      marketplaces: publishedItems.reduce((acc, item) => {
        const key = String(item.marketplace || "unknown");
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    };
  }
}

export { CatalogRepository, CatalogValidator, CatalogUpdater, CatalogExporter };

