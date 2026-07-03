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
import { normalizeImportedProduct } from "../importers/ProductImporter.js";
import { projectRoot } from "../runtime/project-root.js";
import { resolveCatalogSeedPath } from "../runtime/catalog-path.js";

const root = projectRoot;
const defaultFeedPaths = [
  path.join(root, "data", "infostore-feed-3029.xml"),
  path.join(root, "data", "infostore-feed-3030.xml"),
];
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
    normalized = /,\d{1,2}$/.test(text) ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  } else if (hasDot) {
    normalized = /\.\d{1,2}$/.test(text) ? text : text.replace(/\./g, "");
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseXmlBlocks(text = "", tagName = "item") {
  const source = String(text || "");
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\/${tagName}>`, "gi");
  return [...source.matchAll(regex)].map((match) => match[0]);
}

function extractTagValue(block = "", tagNames = []) {
  for (const tagName of tagNames) {
    const pattern = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\/${tagName}>`, "i");
    const match = String(block || "").match(pattern);
    if (match && match[1] != null) {
      return cleanText(String(match[1]).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
    }
  }
  return "";
}

function parsePrice(raw = {}) {
  const candidate = raw.salePrice || raw.sale_price || raw.price || raw.regularPrice || raw.regular_price || raw.amount || "";
  const price = parseNumber(candidate);
  const currency = cleanText(raw.currency || raw.currencyId || raw.currencyCode || raw.currency_id || "BRL").toUpperCase() || "BRL";
  return { price, currency };
}

function parseOfferBlock(block = "") {
  return {
    id: extractTagValue(block, ["g:id", "id"]),
    title: extractTagValue(block, ["g:title", "title"]),
    description: extractTagValue(block, ["g:description", "description"]),
    link: extractTagValue(block, ["g:link", "link"]),
    image: extractTagValue(block, ["g:image_link", "image_link", "image"]),
    additionalImageLink: extractTagValue(block, ["g:additional_image_link", "additional_image_link"]),
    condition: extractTagValue(block, ["g:condition", "condition"]),
    productType: extractTagValue(block, ["g:product_type", "product_type", "category"]),
    category: extractTagValue(block, ["g:google_product_category", "google_product_category", "googleProductCategory"]),
    availability: extractTagValue(block, ["g:availability", "availability"]),
    price: extractTagValue(block, ["g:sale_price", "sale_price", "g:price", "price"]),
    salePrice: extractTagValue(block, ["g:sale_price", "sale_price"]),
    regularPrice: extractTagValue(block, ["g:price", "price"]),
    gtin: extractTagValue(block, ["g:gtin", "gtin"]),
    brand: extractTagValue(block, ["g:brand", "brand"]),
    identifierExists: extractTagValue(block, ["g:identifier_exists", "identifier_exists"]),
    mpn: extractTagValue(block, ["g:mpn", "mpn"]),
    raw: block,
  };
}

export class InfoStoreFeedProvider extends FeedProvider {
  constructor(options = {}) {
    super({ ...options, networkName: options.networkName || "infostore" });
    this.catalogManager = options.catalogManager || new CatalogManager({
      ...(options.catalogOptions || {}),
      seedPath: options.catalogSeedPath || defaultCatalogSeedPath,
    });
    this.feedPaths = Array.isArray(options.feedPaths) && options.feedPaths.length
      ? options.feedPaths.map((item) => cleanText(item)).filter(Boolean)
      : [...defaultFeedPaths];
    this.feedPath = cleanText(options.feedPath || this.feedPaths[0] || process.env.INFOSTORE_FEED_PATH || defaultFeedPaths[0]);
    this.feedPathSecondary = cleanText(options.feedPathSecondary || this.feedPaths[1] || process.env.INFOSTORE_FEED_PATH_SECONDARY || defaultFeedPaths[1]);
    this.feedUrl = cleanText(options.feedUrl || process.env.INFOSTORE_FEED_URL || "");
    this.feedText = cleanText(options.feedText || process.env.INFOSTORE_FEED_TEXT || "");
    this.sourceName = cleanText(options.sourceName || "Info Store - Informática");
  }

  getCatalogManager() {
    return this.catalogManager;
  }

  configured() {
    return Boolean(this.feedText || this.feedUrl || this.feedPath || this.feedPathSecondary);
  }

  getFeedSources() {
    return [this.feedPath, this.feedPathSecondary].filter(Boolean);
  }

  getDiagnostics() {
    const items = this.catalogManager.list().filter((item) => normalizeText(item.marketplace || item.source || "") === "infostore");
    return {
      configured: this.configured(),
      feedAvailable: Boolean(this.feedUrl || this.feedText || this.getFeedSources().some((filePath) => fs.existsSync(filePath))),
      feedPaths: this.getFeedSources(),
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
    const blocks = parseXmlBlocks(source, "item");
    const categories = {};
    const offers = blocks.map((block) => {
      const offer = parseOfferBlock(block);
      const categoryKey = cleanText(offer.productType || offer.category);
      if (categoryKey) categories[categoryKey] = categoryKey;
      return offer;
    });
    return { categories, offers, raw: source, warnings: [] };
  }

  normalizeOffer(raw = {}) {
    const title = cleanText(raw.title || raw.name || raw.productName || "");
    const { price, currency } = parsePrice(raw);
    const productUrl = cleanText(raw.link || raw.url || raw.productUrl || raw.permalink || "");
    const image = cleanText(raw.image || raw.image_link || raw.additionalImageLink || "");
    const reasons = [];

    if (!title) reasons.push("Título ausente.");
    if (!price || !Number.isFinite(price) || price <= 0) reasons.push("Preço inválido.");
    if (!productUrl || !isHttpUrl(productUrl)) reasons.push("Link inválido.");
    if (!image || !isHttpUrl(image)) reasons.push("Imagem ausente.");

    if (reasons.length) {
      return { ok: false, reasons, raw };
    }

    const originalTitle = title;
    const displayTitle = resolvePortugueseDisplayTitle(originalTitle, buildDisplayTitle(originalTitle));
    const language = detectLanguage(originalTitle);
    const inferredCategory = inferCategoryFromFields(displayTitle, raw.description || "") || raw.category || raw.productType || "";
    const normalizedCategory = sanitizeCategory(inferredCategory, originalTitle);
    const productType = inferProductType(normalizedCategory, normalizeForAnalysis(`${displayTitle} ${raw.description || ""}`)) || "product";
    const brand = raw.brand || extractBrand(`${displayTitle} ${raw.description || ""}`) || null;
    const model = raw.model || extractModel(displayTitle || originalTitle, brand || "") || null;
    const marketplace = "infostore";
    const seller = this.sourceName;

    const normalized = normalizeImportedProduct({
      id: raw.id || raw.gtin || raw.mpn || title,
      externalId: raw.externalId || raw.id || raw.gtin || raw.mpn || title,
      gtin: raw.gtin || "",
      mpn: raw.mpn || "",
      sku: raw.sku || "",
      title,
      originalTitle,
      displayTitle,
      category: normalizedCategory,
      normalizedCategory,
      productType,
      brand,
      model,
      isAccessory: Boolean(raw.isAccessory),
      compatibility: raw.compatibility || "",
      language,
      normalizationWarnings: [],
      seller,
      price,
      currency,
      image,
      productUrl,
      affiliateUrl: productUrl,
      marketplace,
      sourceType: "infostore_feed",
      condition: cleanText(raw.condition || "new") || "new",
      availability: cleanText(raw.availability || "available") || "available",
      lastCheckedAt: cleanText(raw.lastCheckedAt || new Date().toISOString()),
      importedAt: cleanText(raw.importedAt || new Date().toISOString()),
      dataMode: "real",
      description: cleanText(raw.description || raw.summary || ""),
      source: "infostore_feed",
      store: marketplace,
      permalink: productUrl,
    });

    if (!normalized) {
      return { ok: false, reasons: ["Produto rejeitado após normalização."], raw };
    }

    return {
      ok: true,
      product: {
        ...normalized,
        marketplace: "infostore",
        sourceType: "infostore_feed",
        dataMode: "real",
        seller: this.sourceName,
        store: "infostore",
        source: "infostore_feed",
        permalink: productUrl,
        productUrl,
        affiliateUrl: productUrl,
        description: cleanText(raw.description || raw.summary || normalized.description || ""),
      },
      raw,
      reasons: [],
    };
  }

  async parseFeedText(text = "") {
    const parsed = this.parse(text);
    const products = [];
    const rejectedItems = [];
    for (const offer of parsed.offers) {
      const normalizedOffer = this.normalizeOffer(offer);
      if (!normalizedOffer.ok) {
        rejectedItems.push({ raw: offer, reason: normalizedOffer.reasons.join(" ") });
        continue;
      }
      products.push(normalizedOffer.product);
    }
    return {
      ...parsed,
      products,
      rejectedItems,
      rawCount: parsed.offers.length,
    };
  }

  async import(source = "", options = {}) {
    const sources = [];
    if (options.text || options.feedText || source) {
      const read = await this.readSource(source, options);
      if (!read.ok) {
        return {
          provider: this.name,
          configured: this.configured(),
          imported: 0,
          updated: 0,
          duplicates: 0,
          rejected: 0,
          errors: [read.error || "FEED_SOURCE_ERROR"],
          warnings: [],
          products: [],
          rejectedRows: [],
          rawCount: 0,
          feedPaths: this.getFeedSources(),
        };
      }
      sources.push({ text: read.text, source: read.source, statusHttp: read.statusHttp || 200 });
    } else {
      for (const feedPath of this.getFeedSources()) {
        const read = await this.readSource(feedPath, options);
        if (read.ok) sources.push({ text: read.text, source: read.source, statusHttp: read.statusHttp || 200 });
      }
    }

    if (!sources.length) {
      return {
        provider: this.name,
        configured: this.configured(),
        imported: 0,
        updated: 0,
        duplicates: 0,
        rejected: 0,
        errors: ["INFOSTORE_FEED_SOURCE_MISSING"],
        warnings: [],
        products: [],
        rejectedRows: [],
        rawCount: 0,
        feedPaths: this.getFeedSources(),
      };
    }

    const normalized = [];
    const rejectedRows = [];
    let rawCount = 0;
    for (const sourceItem of sources) {
      const parsed = await this.parseFeedText(sourceItem.text, { source: sourceItem.source });
      rawCount += parsed.rawCount || 0;
      normalized.push(...parsed.products);
      rejectedRows.push(...parsed.rejectedItems);
    }

    const duplicates = normalized.filter((item) => this.isDuplicate(item)).length;
    const result = typeof this.catalog.importProducts === "function"
      ? this.catalog.importProducts(normalized, options.mode || "merge")
      : this.catalog.import(normalized, options.mode || "merge");

    return {
      provider: this.name,
      configured: this.configured(),
      imported: result.imported || 0,
      updated: result.updated || 0,
      duplicates,
      rejected: (result.rejected || 0) + rejectedRows.length,
      errors: [
        ...(result.errors || []),
        ...(rejectedRows.map((item) => item.reason || "Produto rejeitado.")),
      ],
      warnings: Array.isArray(result.warnings) ? result.warnings : [],
      products: result.products || normalized,
      rejectedRows,
      rawCount,
      feedPaths: this.getFeedSources(),
    };
  }

  async importToCatalog(source = "", options = {}) {
    return this.import(source, options);
  }

  async searchProducts(query = "", options = {}) {
    const needle = cleanText(query).toLowerCase();
    const products = this.getCatalogManager()
      .list()
      .filter((item) => String(item.marketplace || "").toLowerCase() === "infostore")
      .filter((item) => {
        if (!needle) return true;
        const haystack = cleanText(`${item.displayTitle || item.title || ""} ${item.title || ""} ${item.category || ""} ${item.brand || ""} ${item.model || ""} ${item.seller || ""}`).toLowerCase();
        return haystack.includes(needle);
      });
    const limited = products.slice(0, Number(options.limit || 20));
    return {
      configured: this.configured(),
      statusHttp: 200,
      dataMode: "real",
      strategyUsed: "infostore_feed_catalog",
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
    const item = this.getCatalogManager().list().find((product) =>
      String(product.id || "") === String(itemId || "") ||
      String(product.externalId || "") === String(itemId || "") ||
      String(product.productUrl || "") === String(itemId || "") ||
      String(product.affiliateUrl || "") === String(itemId || ""),
    );
    if (!item) {
      return {
        configured: this.configured(),
        statusHttp: 404,
        dataMode: "demo",
        error: "INFOSTORE_PRODUCT_NOT_FOUND",
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

export default InfoStoreFeedProvider;

