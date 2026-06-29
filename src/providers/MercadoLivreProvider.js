import fs from "node:fs";
import path from "node:path";
import MarketplaceProvider from "./MarketplaceProvider.js";
import MercadoLivreConnector from "../connectors/MercadoLivreConnector.js";
import CatalogManager from "../catalog/CatalogManager.js";
import { resolveCatalogSeedPath } from "../runtime/catalog-path.js";
import { projectRoot } from "../runtime/project-root.js";


const root = projectRoot;
const seedPath = resolveCatalogSeedPath(path.join(root, "data", "products.seed.json"));
const catalogManager = new CatalogManager({ seedPath });

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
    .toLowerCase();
}

function seedRules(query = "") {
  const q = normalizeText(query).trim();
  const rules = {
    celular: { include: ["celular", "smartphone", "galaxy", "moto", "redmi", "iphone"], exclude: ["tv", "notebook", "tablet", "casa", "presente", "air fryer"] },
    tv: { include: ["tv", "televisao", "smart tv", "smarttv", "oled", "qled", "roku"], exclude: ["celular", "notebook", "tablet", "casa", "presente"] },
    relogio: { include: ["relogio", "smartwatch", "watch", "pulseira inteligente"], exclude: ["celular", "notebook", "tablet", "casa", "presente"] },
    notebook: { include: ["notebook", "laptop", "ideapad", "vivobook", "aspire", "inspiron"], exclude: ["celular", "tv", "tablet", "casa", "presente"] },
    presente: { include: ["presente", "kit", "caneca", "bloco", "acessorio"], exclude: ["celular", "tv", "notebook", "tablet"] },
    casa: { include: ["casa", "air fryer", "fritadeira", "aspirador", "cozinha"], exclude: ["celular", "tv", "notebook", "tablet"] },
    tablet: { include: ["tablet", "ipad", "galaxy tab"], exclude: ["celular", "tv", "notebook", "casa", "presente"] },
  };
  return rules[q] || null;
}

function matchSeedProduct(product = {}, query = "") {
  const q = normalizeText(query).trim();
  const text = normalizeText(`${product.title || ""} ${product.category || ""}`);
  if (!q) return true;
  const rule = seedRules(q);
  if (rule) {
    return rule.include.some((term) => text.includes(term)) && !rule.exclude.some((term) => text.includes(term));
  }
  return text.includes(q);
}

function mapSeedProduct(raw = {}) {
  return {
    id: raw.id || "",
    title: raw.title || "",
    category: raw.category || "",
    store: "Mercado Livre",
    price: Number(raw.price || 0),
    currency: raw.currency || "BRL",
    image: raw.image || "",
    productUrl: raw.productUrl || raw.url || "",
    permalink: raw.productUrl || raw.url || "",
    marketplace: "mercadolivre",
    condition: raw.condition || "new",
    lastCheckedAt: raw.lastCheckedAt || "",
    dataMode: "seed",
    source: "mercadolivre",
    description: raw.description || raw.title || "",
    availableQuantity: raw.availableQuantity ?? null,
    seller: raw.seller || null,
    rating: raw.rating ?? null,
    soldQuantity: raw.soldQuantity ?? null,
    shipping: raw.shipping || null,
    installments: raw.installments ?? null,
    affiliateUrl: raw.affiliateUrl || null,
    priceHistory: Array.isArray(raw.priceHistory) ? raw.priceHistory : [],
    raw,
  };
}

function catalogSourceLabel(item = {}) {
  const source = String(item.marketplace || item.source || item.store || "").trim().toLowerCase();
  if (source === "mi_shop" || source === "mishop" || source === "mi shop") return "Mi Shop";
  if (source === "actionpay") return "Actionpay";
  if (source === "awin") return "Awin";
  if (source === "google_merchant") return "Google Merchant";
  if (source === "mercadolivre" || source === "mercado livre") return "Loja parceira";
  return String(item.store || item.marketplace || item.source || "Loja parceira");
}

function buildCatalogSearchText(item = {}) {
  return normalizeText([
    item.title,
    item.category,
    item.brand,
    item.model,
    item.description,
    item.seller,
    item.marketplace,
    item.source,
    item.store,
  ].filter(Boolean).join(" "));
}

function matchCatalogQuery(item = {}, query = "") {
  const q = normalizeText(query).trim();
  if (!q) return true;
  const text = buildCatalogSearchText(item);
  const termsByQuery = {
    celular: ["celular", "smartphone", "galaxy", "moto", "redmi", "iphone"],
    smartphone: ["celular", "smartphone", "galaxy", "moto", "redmi", "iphone"],
    relogio: ["relogio", "relógio", "smartwatch", "watch", "pulseira inteligente"],
    relógio: ["relogio", "relógio", "smartwatch", "watch", "pulseira inteligente"],
    notebook: ["notebook", "laptop", "ideapad", "vivobook", "aspire", "inspiron"],
    tablet: ["tablet", "ipad", "galaxy tab", "tab"],
    fone: ["fone", "headphone", "earbud", "auricular", "airpods", "buds"],
    carregador: ["carregador", "charger", "fonte", "usb c", "usb-c"],
    xiaomi: ["xiaomi", "redmi", "poco", "mi "],
    redmi: ["xiaomi", "redmi", "poco", "mi "],
    poco: ["xiaomi", "redmi", "poco", "mi "],
  };
  const terms = termsByQuery[q] || [q];
  return terms.some((term) => text.includes(normalizeText(term)));
}

function isRealCatalogItem(item = {}) {
  const source = String(item.dataMode || item.mode || item.marketplace || item.source || "").toLowerCase();
  return source === "real" || source === "real-authenticated" || source === "real-public" || source === "seed" || String(item.marketplace || "").toLowerCase() === "mi_shop" || String(item.marketplace || "").toLowerCase() === "awin" || String(item.marketplace || "").toLowerCase() === "actionpay" || String(item.marketplace || "").toLowerCase() === "google_merchant";
}

function normalizeCatalogProduct(item = {}) {
  const permalink = String(item.permalink || item.productUrl || item.affiliateUrl || item.url || "").trim();
  const productUrl = String(item.productUrl || item.affiliateUrl || item.permalink || item.url || "").trim();
  const image = String(item.image || item.thumbnail || "").trim();
  return {
    id: String(item.id || item.externalId || item.sku || item.gtin || item.ean || item.title || ""),
    title: String(item.title || ""),
    category: String(item.category || ""),
    store: catalogSourceLabel(item),
    price: Number(item.price || 0),
    currency: String(item.currency || "BRL"),
    image,
    productUrl,
    permalink,
    marketplace: String(item.marketplace || item.source || "mercadolivre"),
    condition: String(item.condition || "new"),
    lastCheckedAt: String(item.lastCheckedAt || item.updatedAt || item.importedAt || ""),
    dataMode: String(item.dataMode || item.mode || "seed"),
    source: String(item.source || item.marketplace || "mercadolivre"),
    description: String(item.description || ""),
    availableQuantity: item.availableQuantity ?? null,
    seller: item.seller || null,
    rating: item.rating ?? null,
    soldQuantity: item.soldQuantity ?? null,
    shipping: item.shipping || null,
    installments: item.installments ?? null,
    affiliateUrl: String(item.affiliateUrl || ""),
    priceHistory: Array.isArray(item.priceHistory) ? item.priceHistory : [],
    raw: item.raw || item,
  };
}

class MercadoLivreProvider extends MarketplaceProvider {
  searchCatalogProducts(query = "", options = {}) {
    const q = String(query || "").trim();
    const catalog = catalogManager.list().filter((item) => item && Number(item.price || 0) > 0 && (item.productUrl || item.affiliateUrl || item.permalink || item.url));
    const realItems = catalog.filter((item) => isRealCatalogItem(item) && matchCatalogQuery(item, q));
    const seedItems = catalog.filter((item) => !isRealCatalogItem(item) && matchCatalogQuery(item, q));
    const ranked = [...realItems, ...seedItems].sort((a, b) => {
      const aReal = isRealCatalogItem(a) ? 1 : 0;
      const bReal = isRealCatalogItem(b) ? 1 : 0;
      if (bReal !== aReal) return bReal - aReal;
      const aSource = String(a.marketplace || a.source || "").toLowerCase() === "mi_shop" ? 1 : 0;
      const bSource = String(b.marketplace || b.source || "").toLowerCase() === "mi_shop" ? 1 : 0;
      if (bSource !== aSource) return bSource - aSource;
      const byPrice = Number(a.price || 0) - Number(b.price || 0);
      if (byPrice !== 0) return byPrice;
      return String(a.title || "").localeCompare(String(b.title || ""), "pt-BR");
    });
    const limited = ranked.slice(0, Number(options.limit || 20));
    return {
      products: limited.map((item) => normalizeCatalogProduct({
        ...item,
        marketplace: String(item.marketplace || item.source || "mercadolivre"),
        source: String(item.source || item.marketplace || "mercadolivre"),
        dataMode: String(item.dataMode || item.mode || (isRealCatalogItem(item) ? "real" : "seed")),
        store: catalogSourceLabel(item),
      })),
      dataMode: ranked.some(isRealCatalogItem) ? "real" : "seed",
      strategyUsed: ranked.some(isRealCatalogItem) ? "catalog_real" : "catalog_seed",
      statusHttp: 200,
      error: "",
      tokenState: "available",
      rawCount: ranked.length,
      returnedCount: limited.length,
      firstFive: limited.slice(0, 5).map((item) => ({
        title: item.title,
        price: item.price,
        permalink: item.productUrl || item.affiliateUrl || item.permalink || item.url || "",
        image: item.image || item.thumbnail || "",
      })),
    };
  }

  async searchProducts(query, options = {}) {
    const catalogResult = this.searchCatalogProducts(query, options);
    if (catalogResult.products.length) {
      return catalogResult;
    }

    const result = await MercadoLivreConnector.searchProducts(query, options);
    return {
      ...result,
      products: Array.isArray(result.products)
        ? result.products.map((product) => this.normalizeProduct(product))
        : [],
    };
  }

  async getProduct(itemId) {
    const result = await MercadoLivreConnector.getProduct(itemId);
    if (result?.item) {
      return { ...result, item: this.normalizeProduct(result.item) };
    }
    return result;
  }

  getPermalink(item) {
    return MercadoLivreConnector.getPermalink(item);
  }

  getImage(item) {
    return MercadoLivreConnector.getProductImage(item);
  }

  normalizeProduct(rawItem) {
    if (String(rawItem?.dataMode || "").toLowerCase() === "seed") {
      return mapSeedProduct(rawItem);
    }
    const product = MercadoLivreConnector.normalizeProduct(rawItem, rawItem?.dataMode || "real-authenticated");
    return {
      ...product,
      marketplace: "mercadolivre",
      source: "mercadolivre",
      dataMode: product.dataMode || "real-authenticated",
    };
  }

  getDiagnostics() {
    return MercadoLivreConnector.getDiagnostics();
  }
}

const mercadoLivreProvider = new MercadoLivreProvider();

export { MercadoLivreProvider };
export default mercadoLivreProvider;
