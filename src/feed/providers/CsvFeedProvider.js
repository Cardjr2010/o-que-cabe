import FeedProvider, { parseCsvText } from "../FeedProvider.js";
import { normalizeImportedProduct } from "../../importers/ProductImporter.js";

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

function guessCategory(title = "", fallback = "") {
  const text = normalizeText(`${title} ${fallback}`);
  if (["celular", "smartphone", "iphone", "galaxy", "moto", "redmi"].some((term) => text.includes(term))) return "celular";
  if (["notebook", "laptop", "ideapad", "vivobook", "thinkpad", "aspire", "inspiron"].some((term) => text.includes(term))) return "notebook";
  if (["tv", "televis", "smart tv", "roku", "oled", "qled"].some((term) => text.includes(term))) return "tv";
  if (["tablet", "ipad", "galaxy tab"].some((term) => text.includes(term))) return "tablet";
  if (["monitor"].some((term) => text.includes(term))) return "monitor";
  return fallback || "outros";
}

function splitAliases(value = "") {
  return String(value || "")
    .split("|")
    .map((item) => cleanText(item))
    .filter(Boolean);
}

export default class CsvFeedProvider extends FeedProvider {
  constructor(options = {}) {
    super({ ...options, networkName: options.networkName || "csv" });
    this.fieldAliases = {
      id: splitAliases(options.fieldAliases?.id || "id"),
      externalId: splitAliases(options.fieldAliases?.externalId || "externalId|sku"),
      title: splitAliases(options.fieldAliases?.title || "title|name"),
      description: splitAliases(options.fieldAliases?.description || "description|summary"),
      brand: splitAliases(options.fieldAliases?.brand || "brand|vendor"),
      category: splitAliases(options.fieldAliases?.category || "category"),
      model: splitAliases(options.fieldAliases?.model || "model|mpn"),
      price: splitAliases(options.fieldAliases?.price || "price|salePrice|regularPrice|amount"),
      currency: splitAliases(options.fieldAliases?.currency || "currency|currencyId|currencyCode"),
      image: splitAliases(options.fieldAliases?.image || "image|picture|thumbnail|imageLink|image_link"),
      productUrl: splitAliases(options.fieldAliases?.productUrl || "productUrl|url|link"),
      affiliateUrl: splitAliases(options.fieldAliases?.affiliateUrl || "affiliateUrl|trackingLink|trackingUrl"),
      marketplace: splitAliases(options.fieldAliases?.marketplace || "marketplace"),
      seller: splitAliases(options.fieldAliases?.seller || "seller|merchant|store"),
      condition: splitAliases(options.fieldAliases?.condition || "condition"),
      availability: splitAliases(options.fieldAliases?.availability || "availability"),
      lastCheckedAt: splitAliases(options.fieldAliases?.lastCheckedAt || "lastCheckedAt"),
    };
  }

  resolveField(row = {}, aliases = []) {
    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(row, alias)) {
        const value = cleanText(row[alias]);
        if (value !== "") return value;
      }
    }
    return "";
  }

  parse(csvText = "", options = {}) {
    const { headers, rows } = parseCsvText(csvText);
    const products = [];
    const rejectedRows = [];
    for (const row of rows) {
      const normalized = this.normalize(row, { headers, ...options });
      if (!normalized) {
        rejectedRows.push({ row, reason: "Linha inválida após normalização." });
        continue;
      }
      products.push(normalized);
    }
    return {
      rawCount: rows.length,
      products,
      rejectedRows,
      errors: [],
      headers,
    };
  }

  normalize(row = {}, context = {}) {
    const title = this.resolveField(row, this.fieldAliases.title);
    const price = this.resolveField(row, this.fieldAliases.price);
    const url = this.resolveField(row, [...this.fieldAliases.productUrl, ...this.fieldAliases.affiliateUrl]);
    if (!title || !price || !url || !isHttpUrl(url)) return null;

    const externalId = this.resolveField(row, this.fieldAliases.externalId) || this.resolveField(row, this.fieldAliases.id);
    const categoryRaw = this.resolveField(row, this.fieldAliases.category);
    const brand = this.resolveField(row, this.fieldAliases.brand);
    const model = this.resolveField(row, this.fieldAliases.model);
    const currency = this.resolveField(row, this.fieldAliases.currency) || "BRL";
    const image = this.resolveField(row, this.fieldAliases.image);
    const marketplace = this.resolveField(row, this.fieldAliases.marketplace) || this.networkName || "csv";
    const seller = this.resolveField(row, this.fieldAliases.seller) || marketplace;
    const condition = this.resolveField(row, this.fieldAliases.condition) || "new";
    const availability = this.resolveField(row, this.fieldAliases.availability) || "available";
    const lastCheckedAt = this.resolveField(row, this.fieldAliases.lastCheckedAt) || new Date().toISOString();
    const description = this.resolveField(row, this.fieldAliases.description);
    const category = guessCategory(title, categoryRaw);

    const raw = {
      id: this.resolveField(row, this.fieldAliases.id) || externalId || "",
      externalId: externalId || this.resolveField(row, this.fieldAliases.id) || "",
      title,
      description,
      brand,
      category,
      model,
      price: Number(String(price).replace(",", ".")),
      currency,
      image,
      productUrl: url,
      affiliateUrl: this.resolveField(row, this.fieldAliases.affiliateUrl) || url,
      marketplace,
      seller,
      availability,
      condition,
      sourceType: "csv_feed",
      dataMode: "real",
      importedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastCheckedAt,
    };

    const normalized = normalizeImportedProduct(raw);
    if (!normalized) return null;

    return {
      ...normalized,
      marketplace,
      sourceType: "csv_feed",
      dataMode: "real",
      seller,
      availability,
      description,
      source: "csv_feed",
    };
  }

  async import(source, options = {}) {
    return super.import(source, options);
  }
}
