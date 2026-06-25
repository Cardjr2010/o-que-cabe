import fs from "node:fs";
import path from "node:path";
import MarketplaceProvider from "./MarketplaceProvider.js";
import MercadoLivreConnector from "../connectors/MercadoLivreConnector.js";

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

class MercadoLivreProvider extends MarketplaceProvider {
  async searchProducts(query, options = {}) {
    const seed = readJson(seedPath, []).filter((item) => item && item.title && matchSeedProduct(item, query));
    if (seed.length) {
      const products = seed
        .map((item) => mapSeedProduct(item))
        .slice(0, Number(options.limit || 20));
      return {
        products: products.map((product) => this.normalizeProduct(product)),
        dataMode: "seed",
        strategyUsed: "seed",
        statusHttp: 200,
        error: "",
        tokenState: "available",
        rawCount: seed.length,
        returnedCount: products.length,
        firstFive: products.slice(0, 5).map((item) => ({
          title: item.title,
          price: item.price,
          permalink: item.permalink,
          image: item.image,
        })),
      };
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
