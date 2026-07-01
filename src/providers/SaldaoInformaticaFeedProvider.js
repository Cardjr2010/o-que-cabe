import fs from "node:fs";
import path from "node:path";
import FeedProvider from "../feed/FeedProvider.js";
import CatalogManager from "../catalog/CatalogManager.js";
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
} from "../catalog/ProductNormalizer.js";
import { projectRoot } from "../runtime/project-root.js";
import { resolveCatalogSeedPath } from "../runtime/catalog-path.js";

const root = projectRoot;
const defaultFeedPath = path.join(root, "data", "saldao-feed.xml");
const defaultCatalogSeedPath = resolveCatalogSeedPath(path.join(root, "data", "products.seed.json"));

function cleanText(value = "") {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeText(value = "") {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isHttpUrl(value = "") {
  const text = cleanText(value);
  if (!text) return false;
  try {
    const parsed = new URL(text);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const text = cleanText(value).replace(/[^\d.,-]/g, "");
  if (!text) return 0;
  const hasComma = text.includes(",");
  const hasDot = text.includes(".");
  let normalized = text;
  if (hasComma && hasDot) {
    normalized = text.lastIndexOf(",") > text.lastIndexOf(".")
      ? text.replace(/\./g, "").replace(",", ".")
      : text.replace(/,/g, "");
  } else if (hasComma) {
    const decimalComma = /,\d{1,2}$/.test(text);
    normalized = decimalComma ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  } else if (hasDot) {
    const decimalDot = /\.\d{1,2}$/.test(text);
    normalized = decimalDot ? text.replace(/,/g, "") : text.replace(/\./g, "");
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function slugify(value = "") {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseXmlBlocks(text = "", tagName = "item") {
  const source = String(text || "");
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  return [...source.matchAll(regex)].map((match) => match[0]);
}

function extractTagValue(block = "", tagNames = []) {
  for (const tagName of tagNames) {
    const pattern = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i");
    const match = String(block || "").match(pattern);
    if (match && match[1] != null) {
      return cleanText(String(match[1]).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
    }
  }
  return "";
}

function extractAttributes(block = "") {
  const attrs = {};
  const start = String(block || "").match(/^<\s*([a-z0-9:_-]+)([^>]*)>/i);
  const attrText = start ? start[2] || "" : "";
  for (const attrMatch of attrText.matchAll(/([a-z0-9:_-]+)\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    attrs[attrMatch[1]] = String(attrMatch[3] ?? attrMatch[4] ?? "").trim();
  }
  return attrs;
}

function parsePrice(rawPrice = "") {
  const text = cleanText(rawPrice);
  const match = text.match(/([0-9][0-9.,]*)/);
  if (!match) return { price: 0, currency: "BRL" };
  const numeric = String(match[1]).trim();
  const hasComma = numeric.includes(",");
  const hasDot = numeric.includes(".");
  let normalized = numeric;
  if (hasComma && hasDot) {
    normalized = numeric.lastIndexOf(",") > numeric.lastIndexOf(".")
      ? numeric.replace(/\./g, "").replace(",", ".")
      : numeric.replace(/,/g, "");
  } else if (hasComma) {
    normalized = /,\d{1,2}$/.test(numeric) ? numeric.replace(/\./g, "").replace(",", ".") : numeric.replace(/,/g, "");
  } else if (hasDot) {
    normalized = /\.(\d{1,2})$/.test(numeric) ? numeric : numeric.replace(/\./g, "");
  }
  const amount = Number(normalized);
  const currencyMatch = text.match(/\b([A-Z]{3})\b/);
  const currency = cleanText(currencyMatch?.[1] || "BRL") || "BRL";
  return {
    price: Number.isFinite(amount) ? amount : 0,
    currency,
  };
}

function parseAvailability(value = "") {
  const text = normalizeText(value);
  if (!text || ["in stock", "in_stock", "available", "available true", "true", "1", "sim", "yes"].includes(text)) return "available";
  if (["out of stock", "out_of_stock", "unavailable", "false", "0", "nao", "não", "no"].includes(text)) return "unavailable";
  return cleanText(value) || "available";
}

function parseCondition(value = "") {
  const text = normalizeText(value);
  if (!text) return "refurbished";
  if (text.includes("new")) return "new";
  if (text.includes("used")) return "used";
  if (text.includes("refurb")) return "refurbished";
  return cleanText(value) || "refurbished";
}

function guessMarketplaceLabel() {
  return "saldao_informatica";
}

function normalizeSourceLabel(item = {}) {
  const source = normalizeText(item.marketplace || item.source || "");
  if (source === "saldao_informatica" || source === "actionpay_saldao" || source === "balcao_de_informatica") return "Saldão da Informática";
  return cleanText(item.seller || item.store || item.marketplace || item.source || "Saldão da Informática") || "Saldão da Informática";
}

export class SaldaoInformaticaFeedProvider extends FeedProvider {
  constructor(options = {}) {
    super({ ...options, networkName: options.networkName || "saldao_informatica" });
    this.catalogManager = options.catalogManager || new CatalogManager({
      ...(options.catalogOptions || {}),
      seedPath: options.catalogSeedPath || defaultCatalogSeedPath,
    });
    this.feedPath = cleanText(options.feedPath || process.env.SALDAO_FEED_PATH || defaultFeedPath);
    this.feedUrl = cleanText(options.feedUrl || process.env.SALDAO_FEED_URL || "");
    this.feedText = cleanText(options.feedText || process.env.SALDAO_FEED_TEXT || "");
    this.sourceName = cleanText(options.sourceName || "Saldão da Informática");
  }

  getCatalogManager() {
    return this.catalogManager;
  }

  configured() {
    return Boolean(this.feedText || this.feedUrl || this.feedPath);
  }

  getFeedSource() {
    if (this.feedText) return { type: "inline", source: "inline-feed", text: this.feedText, format: "xml" };
    if (this.feedUrl) return { type: "url", source: this.feedUrl, format: "xml" };
    if (this.feedPath) return { type: "file", source: this.feedPath, format: "xml" };
    return { type: "unconfigured", source: "", format: "xml" };
  }

  getDiagnostics() {
    const items = this.catalogManager.list().filter((item) => normalizeText(item.marketplace || item.source || "") === "saldao_informatica");
    return {
      configured: this.configured(),
      feedAvailable: Boolean(this.feedPath && fs.existsSync(this.feedPath)) || Boolean(this.feedUrl) || Boolean(this.feedText),
      feedPath: this.feedPath,
      feedUrl: this.feedUrl,
      totalProducts: items.length,
      sourceName: this.sourceName,
    };
  }

  readSource(source = "", options = {}) {
    const text = String(source || "").trim();
    const inlineText = String(options.text || options.feedText || "").trim();
    const effectiveText = inlineText || text;
    if (!effectiveText) {
      return { ok: false, error: "FEED_SOURCE_MISSING", text: "", source: "" };
    }

    if (inlineText) {
      return { ok: true, text: inlineText, source: options.source || "inline-feed", statusHttp: 200 };
    }

    if (/^https?:\/\//i.test(text)) {
      if (!this.fetchImpl) return { ok: false, error: "FETCH_NOT_AVAILABLE", text: "", source: text };
      return this.fetchImpl(text, { headers: { Accept: "application/xml,text/xml,text/plain,*/*" } })
        .then(async (response) => {
          const body = await response.text().catch(() => "");
          if (!response.ok) {
            return { ok: false, error: `HTTP_${response.status}`, statusHttp: response.status, text: body, source: text };
          }
          return { ok: true, text: body, source: text, statusHttp: response.status };
        });
    }

    const absolutePath = path.resolve(text);
    if (!fs.existsSync(absolutePath)) {
      return { ok: false, error: "FEED_SOURCE_NOT_FOUND", text: "", source: absolutePath };
    }
    return { ok: true, text: fs.readFileSync(absolutePath, "utf8"), source: absolutePath, statusHttp: 200 };
  }

  parse(text = "") {
    const source = String(text || "");
    const categories = {};
    for (const block of parseXmlBlocks(source, "item")) {
      const categoryId = extractTagValue(block, ["g:product_type", "product_type", "category"]);
      if (categoryId) {
        const key = cleanText(categoryId);
        categories[key] = key;
      }
    }

    const offers = parseXmlBlocks(source, "item").map((block) => ({
      id: extractTagValue(block, ["g:id", "id"]),
      title: extractTagValue(block, ["title", "g:title"]),
      description: extractTagValue(block, ["description", "g:description"]),
      link: extractTagValue(block, ["link", "g:link"]),
      image: extractTagValue(block, ["g:image_link", "image_link", "image"]),
      condition: extractTagValue(block, ["g:condition", "condition"]) || "refurbished",
      productType: extractTagValue(block, ["g:product_type", "product_type", "category"]),
      availability: extractTagValue(block, ["g:availability", "availability"]),
      price: extractTagValue(block, ["g:price", "price"]),
      gtin: extractTagValue(block, ["g:gtin", "gtin"]),
      brand: extractTagValue(block, ["g:brand", "brand"]),
      identifierExists: extractTagValue(block, ["g:identifier_exists", "identifier_exists"]),
      additionalImageLink: extractTagValue(block, ["g:additional_image_link", "additional_image_link"]),
      shippingWeight: extractTagValue(block, ["g:shipping_weight", "shipping_weight"]),
      raw: block,
    }));

    return { categories, offers, raw: source, warnings: [] };
  }

  normalizeOffer(raw = {}, context = {}) {
    const title = cleanText(raw.title || raw.name || raw.productName || "");
    const { price, currency } = parsePrice(raw.price);
    const productUrl = cleanText(raw.link || raw.url || raw.productUrl || raw.permalink || "");
    const image = cleanText(raw.image || raw.image_link || raw.additionalImageLink || "");
    const reasons = [];

    if (!title) reasons.push("Título ausente");
    if (!Number.isFinite(price) || price <= 0) reasons.push("Preço inválido");
    if (!productUrl || !isHttpUrl(productUrl)) reasons.push("Link inválido");

    if (reasons.length) {
      return { ok: false, reason: reasons.join("; "), reasons, warnings: [], product: null };
    }

    const originalTitle = title;
    const displayTitle = cleanText(resolvePortugueseDisplayTitle(originalTitle, buildDisplayTitle(originalTitle)));
    const language = detectLanguage(originalTitle);
    const inferredCategory = sanitizeCategory(inferCategoryFromFields({
      title: originalTitle,
      description: raw.description || "",
      category: raw.productType || "",
      brand: raw.brand || "",
      model: raw.model || "",
    }, displayTitle), displayTitle);
    const brand = cleanText(raw.brand || extractBrand(`${displayTitle} ${raw.description || ""}`) || "");
    const model = cleanText(raw.model || extractModel(displayTitle || originalTitle, brand || "") || "");
    const productType = cleanText(raw.productType || inferProductType(inferredCategory, normalizeForAnalysis(`${displayTitle} ${raw.description || ""}`)) || "product").toLowerCase();
    const marketplace = guessMarketplaceLabel();
    const sourceType = "feed";
    const importedAt = new Date().toISOString();
    const sourceOfferId = cleanText(raw.id || raw.gtin || raw.externalId || slugify(originalTitle) || "");

    return {
      ok: true,
      warnings: [],
      product: {
        id: `saldao-${slugify(sourceOfferId || originalTitle)}`,
        externalId: sourceOfferId || `saldao-${slugify(originalTitle)}`,
        title: originalTitle,
        originalTitle,
        displayTitle,
        category: inferredCategory,
        normalizedCategory: inferredCategory,
        productType,
        brand: brand || null,
        model: model || null,
        isAccessory: ["pelicula", "capa", "cabo", "carregador", "acessorio"].includes(inferredCategory) || ["accessory", "piece", "compatible"].includes(productType),
        compatibility: cleanText(raw.compatibility || ""),
        language,
        normalizationWarnings: [],
        seller: normalizeSourceLabel({ marketplace, seller: this.sourceName }),
        price,
        currency,
        image,
        productUrl,
        affiliateUrl: productUrl,
        marketplace,
        sourceType,
        condition: parseCondition(raw.condition),
        availability: parseAvailability(raw.availability),
        lastCheckedAt: importedAt,
        importedAt,
        updatedAt: importedAt,
        dataMode: "real",
        source: marketplace,
        store: this.sourceName,
        description: cleanText(raw.description || ""),
        gtin: cleanText(raw.gtin || ""),
        raw,
      },
    };
  }

  async import(source, options = {}) {
    const effectiveSource = source || options.source || options.feedPath || options.feedUrl || options.feedText || this.feedPath;
    const read = await this.readSource(effectiveSource, options);
    if (!read.ok) {
      return {
        provider: this.name,
        configured: this.configured(),
        imported: 0,
        updated: 0,
        duplicates: 0,
        rejected: 0,
        errors: [read.error || "FEED_SOURCE_ERROR"],
        products: [],
        rejectedRows: [],
        rawCount: 0,
        format: options.format || "xml",
      };
    }

    const parsed = this.parse(read.text, { ...options, source: read.source });
    const normalized = [];
    const rejectedRows = [];

    for (const raw of parsed.offers || []) {
      const candidate = this.normalizeOffer(raw, parsed);
      if (!candidate.ok) {
        rejectedRows.push({ raw, reason: candidate.reason, reasons: candidate.reasons });
        continue;
      }
      normalized.push(candidate.product);
    }

    const importResult = typeof this.catalogManager.importProducts === "function"
      ? this.catalogManager.importProducts(normalized, "merge")
      : this.catalogManager.import(normalized, "merge");

    return {
      provider: this.name,
      configured: this.configured(),
      imported: importResult.imported || 0,
      updated: importResult.updated || 0,
      duplicates: 0,
      rejected: rejectedRows.length + (importResult.rejected || 0),
      errors: [
        ...(parsed.errors || []),
        ...rejectedRows.map((item) => item.reason),
        ...((importResult.rejectedItems || []).map((item) => item.reason || item.reasons?.join(", ") || "Produto rejeitado")),
      ],
      products: importResult.products || normalized,
      rejectedRows,
      rawCount: normalized.length + rejectedRows.length,
      format: "xml",
      source: read.source,
      sourceName: this.sourceName,
      totalProducts: this.catalogManager.list().filter((item) => normalizeText(item.marketplace || item.source || "") === "saldao_informatica").length,
    };
  }

  async importToCatalog(options = {}) {
    return this.import(options.source || options.feedPath || options.feedUrl || options.feedText || this.feedPath, options);
  }

  async searchProducts(query = "", options = {}) {
    const needle = normalizeText(query);
    const products = this.catalogManager.list()
      .filter((item) => normalizeText(item.marketplace || item.source || "") === "saldao_informatica")
      .filter((item) => {
        if (!needle) return true;
        const haystack = normalizeText([
          item.title,
          item.displayTitle,
          item.originalTitle,
          item.category,
          item.normalizedCategory,
          item.brand,
          item.model,
          item.description,
        ].filter(Boolean).join(" "));
        return haystack.includes(needle);
      });
    const limited = products.slice(0, Number(options.limit || 20));
    return {
      configured: this.configured(),
      statusHttp: 200,
      dataMode: "real",
      strategyUsed: "saldao_feed_catalog",
      error: "",
      rawCount: products.length,
      returnedCount: limited.length,
      products: limited,
      firstFive: limited.slice(0, 5).map((item) => ({
        title: item.title,
        price: item.price,
        permalink: item.productUrl || item.affiliateUrl || "",
        image: item.image || "",
      })),
    };
  }

  async getProduct(itemId) {
    const item = this.catalogManager.list().find((product) =>
      normalizeText(product.marketplace || product.source || "") === "saldao_informatica" &&
      (
        String(product.id || "") === String(itemId || "") ||
        String(product.externalId || "") === String(itemId || "") ||
        String(product.productUrl || "") === String(itemId || "") ||
        String(product.affiliateUrl || "") === String(itemId || "")
      )
    );

    if (!item) {
      return {
        configured: this.configured(),
        statusHttp: 404,
        dataMode: "demo",
        error: "SALDAO_PRODUCT_NOT_FOUND",
        product: null,
      };
    }

    return {
      configured: this.configured(),
      statusHttp: 200,
      dataMode: String(item.dataMode || "real"),
      error: "",
      product: item,
    };
  }

  getPermalink(item = {}) {
    return cleanText(item.affiliateUrl || item.productUrl || item.permalink || "");
  }

  getImage(item = {}) {
    return cleanText(item.image || item.thumbnail || "");
  }
}

const saldaoInformaticaFeedProvider = new SaldaoInformaticaFeedProvider();

export default saldaoInformaticaFeedProvider;
