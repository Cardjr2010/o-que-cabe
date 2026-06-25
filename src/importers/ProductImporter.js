import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const seedPath = path.join(root, "data", "products.seed.json");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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
  const value = normalizeText(text);
  if (["celular", "smartphone", "iphone", "galaxy", "moto", "redmi"].some((term) => value.includes(term))) return "celular";
  if (["tv", "televis", "smart tv", "qled", "oled", "roku"].some((term) => value.includes(term))) return "tv";
  if (["notebook", "laptop", "vivobook", "ideapad", "aspire", "inspiron"].some((term) => value.includes(term))) return "notebook";
  return "";
}

export function normalizeImportedProduct(raw = {}) {
  const title = String(raw.title || raw.name || raw.productName || "").trim();
  const productUrl = String(raw.affiliateUrl || raw.productUrl || raw.permalink || raw.url || "").trim();
  if (!title || !isValidProductUrl(productUrl)) return null;

  const category = String(raw.category || inferCategory(`${title} ${raw.description || ""}`) || "").toLowerCase();
  const price = Number(raw.price || raw.salePrice || raw.regularPrice || 0);
  if (!Number.isFinite(price) || price <= 0) return null;

  const marketplace = String(raw.marketplace || raw.store || "Mercado Livre").trim() || "Mercado Livre";
  const importedAt = String(raw.importedAt || raw.lastCheckedAt || new Date().toISOString()).trim();
  const sourceType = String(raw.sourceType || "woocommerce-style").trim();

  return {
    id: String(raw.id || raw.externalId || slugify(title) || `oqc-${Date.now()}`),
    externalId: String(raw.externalId || raw.id || slugify(title) || ""),
    title,
    category,
    brand: raw.brand || null,
    model: raw.model || null,
    price,
    currency: raw.currency || "BRL",
    image: raw.image || raw.thumbnail || "",
    productUrl,
    affiliateUrl: raw.affiliateUrl || "",
    marketplace,
    sourceType,
    condition: raw.condition || "new",
    lastCheckedAt: raw.lastCheckedAt || importedAt,
    importedAt,
    dataMode: "seed",
    priceHistory: Array.isArray(raw.priceHistory) ? raw.priceHistory : [],
    description: raw.description || raw.summary || "",
    source: "mercadolivre",
    store: marketplace,
    url: productUrl,
    permalink: isValidProductUrl(raw.permalink) ? raw.permalink : productUrl,
  };
}

export function loadSeedProducts(filePath = seedPath) {
  const items = readJson(filePath, []);
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
