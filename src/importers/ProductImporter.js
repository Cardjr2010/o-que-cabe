import fs from "node:fs";
import { projectRoot, resolveProjectPath } from "../runtime/project-root.js";
import { resolveCatalogSeedPath } from "../runtime/catalog-path.js";

import path from "node:path";
import CatalogRepository from "../catalog/CatalogRepository.js";
import {
  buildDisplayTitle,
  detectLanguage,
  extractBrand,
  extractModel,
  inferCategoryFromFields,
  inferProductType,
  normalizeForAnalysis,
  resolvePortugueseDisplayTitle,
  sanitizeCategory,
  normalizeText,
} from "../catalog/ProductNormalizer.js";

const root = projectRoot;
const seedPath = resolveCatalogSeedPath(path.join(root, "data", "products.seed.json"));
const repository = new CatalogRepository();
const canonicalSeedPaths = new Set(
  [
    resolveProjectPath("data", "products.seed.json"),
    resolveProjectPath("public", "data", "products.seed.json"),
  ].map((value) => String(value || "").replace(/\\/g, "/")),
);

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function slugify(value = "") {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSearchUrl(title = "") {
  const slug = slugify(title);
  return slug ? `https://lista.mercadolivre.com.br/${slug}` : "";
}

function isValidProductUrl(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "https://www.mercadolivre.com.br" || normalized === "https://mercadolivre.com.br") return false;
  if (normalized === "https://www.mercadolivre.com.br/" || normalized === "https://mercadolivre.com.br/") return false;
  return /^https?:\/\/.+/i.test(normalized);
}

function inferCategory(text = "") {
  return inferCategoryFromFields({ title: text }, text) || "";
}

export function normalizeImportedProduct(raw = {}) {
  const title = String(raw.title || raw.name || raw.productName || "").trim();
  const productUrl = String(raw.affiliateUrl || raw.productUrl || raw.permalink || raw.url || "").trim();
  if (!title || !isValidProductUrl(productUrl)) return null;

  const price = Number(raw.price || raw.salePrice || raw.regularPrice || 0);
  if (!Number.isFinite(price) || price <= 0) return null;

  const marketplace = String(raw.marketplace || raw.store || "Mercado Livre").trim() || "Mercado Livre";
  const importedAt = String(raw.importedAt || raw.lastCheckedAt || new Date().toISOString()).trim();
  const sourceType = String(raw.sourceType || "woocommerce-style").trim();
  const sourceValue = String(raw.source || raw.sourceType || marketplace)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  const originalTitle = String(raw.originalTitle || title).trim();
  const displayTitle = String(resolvePortugueseDisplayTitle(originalTitle, raw.displayTitle || buildDisplayTitle(originalTitle))).trim();
  const language = String(raw.language || detectLanguage(originalTitle)).trim();
  const inferredCategory = sanitizeCategory(inferCategory(`${title} ${raw.description || ""}`) || "", originalTitle);
  const normalizedCategory = inferredCategory !== "outros"
    ? inferredCategory
    : sanitizeCategory(raw.normalizedCategory || raw.category || "", originalTitle);
  const productType = String(raw.productType || inferProductType(normalizedCategory, normalizeForAnalysis(`${displayTitle} ${raw.description || ""}`)) || "product").toLowerCase();
  const brand = raw.brand || extractBrand(`${displayTitle} ${raw.description || ""}`) || null;
  const model = raw.model || extractModel(displayTitle || originalTitle, brand || "") || null;
  const isAccessory = Boolean((raw.isAccessory ?? ["accessory", "piece", "compatible"].includes(productType)) || ["pelicula", "capa", "cabo", "carregador", "acessorio", "peca"].includes(normalizedCategory));
  const compatibility = String(raw.compatibility || "").trim();
  const normalizationWarnings = Array.isArray(raw.normalizationWarnings) && raw.normalizationWarnings.length
    ? [...new Set(raw.normalizationWarnings.filter(Boolean).map((item) => String(item).trim()))]
    : [];

  return {
    id: String(raw.id || raw.externalId || raw.gtin || raw.ean || raw.upc || slugify(title) || `oqc-${Date.now()}`),
    externalId: String(raw.externalId || raw.id || raw.gtin || raw.ean || raw.upc || slugify(title) || ""),
    gtin: String(raw.gtin || raw.ean || raw.upc || raw.isbn || "").trim(),
    mpn: String(raw.mpn || "").trim(),
    sku: String(raw.sku || "").trim(),
    title,
    originalTitle,
    displayTitle,
    category: sanitizeCategory(raw.category || normalizedCategory || inferCategory(`${title} ${raw.description || ""}`) || "", originalTitle),
    normalizedCategory: normalizedCategory || inferCategory(`${title} ${raw.description || ""}`) || "outros",
    productType: productType || "product",
    brand: brand || null,
    model: model || null,
    isAccessory: Boolean(isAccessory),
    compatibility: compatibility || "",
    language,
    normalizationWarnings,
    seller: raw.seller || raw.merchant || raw.advertiser || null,
    price,
    currency: raw.currency || "BRL",
    image: raw.image || raw.thumbnail || "",
    productUrl,
    affiliateUrl: raw.affiliateUrl || "",
    marketplace,
    sourceType,
    condition: raw.condition || "new",
    availability: raw.availability || "available",
    lastCheckedAt: raw.lastCheckedAt || importedAt,
    importedAt,
    dataMode: String(raw.dataMode || raw.mode || "seed"),
    priceHistory: Array.isArray(raw.priceHistory) ? raw.priceHistory : [],
    description: raw.description || raw.summary || "",
    source: raw.source || sourceValue || "seed",
    store: marketplace,
    url: productUrl,
    permalink: isValidProductUrl(raw.permalink) ? raw.permalink : productUrl,
  };
}

export function loadSeedProducts(filePath = seedPath) {
  const resolvedPath = String(filePath || "").trim();
  const normalizedPath = resolvedPath.replace(/\\/g, "/");
  const items = fs.existsSync(resolvedPath)
    ? repository.read(resolvedPath, [])
    : canonicalSeedPaths.has(normalizedPath)
      ? repository.read(resolveProjectPath("data", "products.seed.json"), [])
      : [];
  return Array.isArray(items) ? items.map((item) => normalizeImportedProduct(item)).filter(Boolean) : [];
}

export class ProductImporter {
  constructor(options = {}) {
    this.seedPath = options.seedPath || seedPath;
  }

  loadSeedProducts() {
    return loadSeedProducts(this.seedPath);
  }

  normalizeImportedProduct(raw) {
    return normalizeImportedProduct(raw);
  }

  getDiagnostics() {
    const products = this.loadSeedProducts();
    return {
      seedPath: this.seedPath,
      count: products.length,
      categories: products.reduce((acc, item) => {
        acc[item.category || "unknown"] = (acc[item.category || "unknown"] || 0) + 1;
        return acc;
      }, {}),
    };
  }
}

export default ProductImporter;
