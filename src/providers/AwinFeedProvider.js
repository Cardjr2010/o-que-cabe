import fs from "node:fs";
import path from "node:path";
import CatalogManager from "../catalog/CatalogManager.js";
import MarketplaceProvider from "./MarketplaceProvider.js";

const root = process.cwd();
const defaultStatePath = path.join(root, "data", "awin-import-state.json");
const defaultAdvertisersPath = path.join(root, "data", "awin-advertisers.json");
const defaultCategoryMapPath = path.join(root, "data", "awin-category-map.json");

const DEFAULT_APPROVED_ADVERTISERS = [
  { name: "Stanley BR", categoryGroup: "House & Kitchen" },
  { name: "Shark-Ninja BR", categoryGroup: "House & Kitchen" },
  { name: "Via Inox Tramontina BR", categoryGroup: "House & Kitchen" },
  { name: "Clóvis Calçados BR", categoryGroup: "Shoes" },
  { name: "Posthaus BR", categoryGroup: "Fashion" },
  { name: "Tjama BR", categoryGroup: "Fashion" },
];

const DEFAULT_CATEGORY_MAP = {
  "House & Kitchen": ["Shark-Ninja", "Stanley", "Via Inox Tramontina"],
  Fashion: ["Posthaus", "Tjama"],
  Shoes: ["Clóvis Calçados"],
};

function envValue(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return "";
}

function cleanText(value = "") {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function slugify(value = "") {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isHttpUrl(value = "") {
  const text = cleanText(value);
  if (!text) return false;
  if (/^https?:\/\/(www\.)?awin\.com\/?$/i.test(text)) return false;
  try {
    const parsed = new URL(text);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function loadJsonFromText(text, fallback) {
  try {
    const parsed = JSON.parse(String(text || ""));
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function getValue(raw, ...paths) {
  for (const candidate of paths) {
    if (!candidate) continue;
    const value = String(candidate)
      .split(".")
      .reduce((acc, key) => (acc && typeof acc === "object" ? acc[key] : undefined), raw);
    const text = cleanText(value);
    if (text) return text;
  }
  return "";
}

function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const text = cleanText(value)
    .replace(/\s+/g, "")
    .replace(/[^\d.,-]/g, "");
  if (!text) return 0;
  const normalized = text.includes(",") && text.includes(".") ? text.replace(/\./g, "").replace(",", ".") : text.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitDelimitedLine(line, delimiter = ",") {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (!quoted && char === delimiter) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((item) => cleanText(item));
}

function detectDelimiter(text = "") {
  const sample = String(text || "")
    .split(/\r?\n/)
    .find((line) => cleanText(line)) || "";
  const candidates = [",", "\t", ";", "|"];
  let winner = ",";
  let winnerCount = -1;
  for (const candidate of candidates) {
    const count = sample.split(candidate).length - 1;
    if (count > winnerCount) {
      winner = candidate;
      winnerCount = count;
    }
  }
  return winner;
}

function extractXmlValue(block, tagNames = []) {
  for (const tagName of tagNames) {
    const pattern = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i");
    const match = block.match(pattern);
    if (match && match[1]) return cleanText(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
  }
  return "";
}

function parseXmlFeed(text = "") {
  const blocks = String(text || "").match(/<(?:item|product)[^>]*>[\s\S]*?<\/(?:item|product)>/gi) || [];
  return blocks.map((block) => ({
    id: extractXmlValue(block, ["id", "offerId", "offer_id", "externalId", "external_id"]),
    externalId: extractXmlValue(block, ["offerId", "offer_id", "externalId", "external_id", "id"]),
    title: extractXmlValue(block, ["title", "name", "product_name", "productName"]),
    category: extractXmlValue(block, ["category", "googleProductCategory", "google_product_category", "product_type", "productType"]),
    brand: extractXmlValue(block, ["brand", "manufacturer"]),
    model: extractXmlValue(block, ["model", "mpn"]),
    price: extractXmlValue(block, ["price", "salePrice", "regularPrice", "amount"]),
    currency: extractXmlValue(block, ["currency", "currencyCode"]),
    image: extractXmlValue(block, ["image", "image_link", "imageLink", "thumbnail"]),
    productUrl: extractXmlValue(block, ["productUrl", "product_url", "link", "url", "landingPage", "landing_page", "destination"]),
    affiliateUrl: extractXmlValue(block, ["affiliateUrl", "affiliate_url", "trackingLink", "tracking_link"]),
    seller: extractXmlValue(block, ["seller", "merchant", "merchantName", "merchant_name", "advertiser", "advertiserName"]),
    availability: extractXmlValue(block, ["availability", "stock", "productAvailability"]),
    condition: extractXmlValue(block, ["condition", "productCondition"]),
    description: extractXmlValue(block, ["description", "summary"]),
  }));
}

function parseJsonLines(text = "") {
  const rows = [];
  const errors = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    const trimmed = cleanText(line);
    if (!trimmed || trimmed.startsWith("#")) continue;
    try {
      rows.push(JSON.parse(trimmed));
    } catch (error) {
      errors.push({ reason: "Linha JSON inválida", raw: trimmed, error: error.message });
    }
  }
  return { rows, errors };
}

function parseCsv(text = "") {
  const lines = String(text || "").split(/\r?\n/).filter((line) => cleanText(line));
  if (!lines.length) return { rows: [], errors: [] };
  const delimiter = detectDelimiter(lines[0]);
  const headers = splitDelimitedLine(lines[0], delimiter);
  const rows = [];
  const errors = [];

  for (const line of lines.slice(1)) {
    const values = splitDelimitedLine(line, delimiter);
    if (values.length < headers.length) {
      errors.push({ reason: "Número de colunas inconsistente", raw: line });
      continue;
    }
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    rows.push(row);
  }

  return { rows, errors };
}

function parseJson(text = "") {
  try {
    const parsed = JSON.parse(String(text || ""));
    if (Array.isArray(parsed)) return { rows: parsed, errors: [] };
    if (parsed && typeof parsed === "object") {
      const keys = ["items", "products", "data", "results", "entries"];
      for (const key of keys) {
        if (Array.isArray(parsed[key])) return { rows: parsed[key], errors: [] };
      }
      return { rows: [parsed], errors: [] };
    }
  } catch (error) {
    return { rows: [], errors: [{ reason: "JSON inválido", error: error.message }] };
  }
  return { rows: [], errors: [] };
}

function detectFeedFormatFromSource(source = "", text = "") {
  const lower = cleanText(source).toLowerCase();
  if (lower.endsWith(".jsonl") || lower.endsWith(".ndjson")) return "jsonl";
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xml")) return "xml";
  if (lower.endsWith(".json")) return "json";

  const trimmed = String(text || "").trimStart();
  if (trimmed.startsWith("<")) return "xml";
  if (trimmed.startsWith("[")) return "json";
  if (trimmed.startsWith("{")) return trimmed.includes("\n") ? "jsonl" : "json";
  if (trimmed.includes("\t")) return "csv";
  if (trimmed.includes(";")) return "csv";
  return "jsonl";
}

function validUrlOrEmpty(value = "") {
  const text = cleanText(value);
  return isHttpUrl(text) ? text : "";
}

function arrayify(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function normalizeAdvertiserItem(item = {}, fallback = {}) {
  if (typeof item === "string") {
    return normalizeAdvertiserItem({ name: item }, fallback);
  }
  const name = cleanText(item.name || fallback.name || "");
  return {
    name,
    advertiserId: cleanText(item.advertiserId || item.advertiser_id || fallback.advertiserId || ""),
    publisherId: cleanText(item.publisherId || item.publisher_id || fallback.publisherId || ""),
    feedUrl: cleanText(item.feedUrl || item.feed_url || fallback.feedUrl || ""),
    feedPath: cleanText(item.feedPath || item.feed_path || fallback.feedPath || ""),
    feedText: cleanText(item.feedText || item.feed_text || fallback.feedText || ""),
    feedFormat: cleanText(item.feedFormat || item.feed_format || fallback.feedFormat || ""),
    vertical: cleanText(item.vertical || fallback.vertical || "retail") || "retail",
    locale: cleanText(item.locale || fallback.locale || "en_GB") || "en_GB",
    categoryGroup: cleanText(item.categoryGroup || item.category_group || fallback.categoryGroup || ""),
    enabled: item.enabled !== false && fallback.enabled !== false,
  };
}

function normalizeCategoryMapping(value = {}) {
  const mapping = {};
  const source = value && typeof value === "object" ? value : {};
  for (const [group, labels] of Object.entries(source)) {
    mapping[cleanText(group)] = arrayify(labels).map((label) => cleanText(label)).filter(Boolean);
  }
  return mapping;
}

export class AwinFeedProvider extends MarketplaceProvider {
  constructor(options = {}) {
    super();
    this.catalogManager = options.catalogManager || null;
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
    this.statePath = cleanText(options.statePath || "");
    this.statePathFromEnv = !this.statePath;
    this.now = options.now || (() => new Date().toISOString());
  }

  getCatalogManager() {
    if (this.catalogManager) return this.catalogManager;
    const envSeedPath = cleanText(envValue("AWIN_CATALOG_SEED_PATH"));
    if (!this._runtimeCatalogManager || this._runtimeCatalogSeedPath !== envSeedPath) {
      this._runtimeCatalogSeedPath = envSeedPath;
      this._runtimeCatalogManager = new CatalogManager(envSeedPath ? { seedPath: envSeedPath } : {});
    }
    return this._runtimeCatalogManager;
  }

  getStatePath() {
    if (!this.statePathFromEnv) return this.statePath || defaultStatePath;
    return cleanText(envValue("AWIN_STATE_PATH")) || defaultStatePath;
  }

  getAdvertisers() {
    const explicit = cleanText(envValue("AWIN_ADVERTISERS_JSON", "AWIN_ADVERTISERS"));
    let configured = [];
    if (explicit) {
      configured = loadJsonFromText(explicit, []);
    } else {
      const advertisersPath = cleanText(envValue("AWIN_ADVERTISERS_PATH")) || defaultAdvertisersPath;
      if (fs.existsSync(advertisersPath)) configured = readJson(advertisersPath, []);
    }

    const advertisers = arrayify(configured).map((item) => normalizeAdvertiserItem(item)).filter((item) => item.name);
    if (advertisers.length) return advertisers;
    return DEFAULT_APPROVED_ADVERTISERS.map((item) => normalizeAdvertiserItem(item));
  }

  getCategoryMapping() {
    const explicit = cleanText(envValue("AWIN_CATEGORY_MAP_JSON", "AWIN_CATEGORY_MAP"));
    if (explicit) return normalizeCategoryMapping(loadJsonFromText(explicit, DEFAULT_CATEGORY_MAP));
    const categoryMapPath = cleanText(envValue("AWIN_CATEGORY_MAP_PATH")) || defaultCategoryMapPath;
    if (fs.existsSync(categoryMapPath)) return normalizeCategoryMapping(readJson(categoryMapPath, DEFAULT_CATEGORY_MAP));
    return normalizeCategoryMapping(DEFAULT_CATEGORY_MAP);
  }

  resolveAdvertiserCategoryGroup(advertiser = {}) {
    const categoryGroup = cleanText(advertiser.categoryGroup || "");
    if (categoryGroup) return categoryGroup;
    const mapping = this.getCategoryMapping();
    const advertiserName = cleanText(advertiser.name || "");
    const normalizedName = advertiserName.toLowerCase();
    for (const [group, terms] of Object.entries(mapping)) {
      if (terms.some((term) => normalizedName.includes(term.toLowerCase()))) return group;
    }
    return "";
  }

  getConfig() {
    return {
      publisherId: cleanText(envValue("AWIN_PUBLISHER_ID", "AWIN_ACCOUNT_ID")),
      advertiserId: cleanText(envValue("AWIN_ADVERTISER_ID")),
      accessToken: cleanText(envValue("AWIN_ACCESS_TOKEN")),
      feedUrl: cleanText(envValue("AWIN_FEED_URL")),
      feedPath: cleanText(envValue("AWIN_FEED_PATH")),
      feedText: cleanText(envValue("AWIN_FEED_TEXT")),
      feedFormat: cleanText(envValue("AWIN_FEED_FORMAT")),
      vertical: cleanText(envValue("AWIN_FEED_VERTICAL")) || "retail",
      locale: cleanText(envValue("AWIN_FEED_LOCALE")) || "en_GB",
    };
  }

  configured() {
    const config = this.getConfig();
    const advertisers = this.getAdvertisers();
    const hasGlobal = Boolean(config.feedText || config.feedPath || config.feedUrl || (config.publisherId && config.advertiserId && config.accessToken));
    const hasAdvertiserSource = advertisers.some((item) => Boolean(this.getAdvertiserFeedSource(item).source));
    return Boolean(hasGlobal || hasAdvertiserSource);
  }

  getFeedSource() {
    const config = this.getConfig();
    if (config.feedText) return { type: "inline", source: "inline-feed", format: config.feedFormat || "jsonl", text: config.feedText };
    if (config.feedPath) return { type: "file", source: path.resolve(config.feedPath), format: config.feedFormat || path.extname(config.feedPath).slice(1) || "jsonl" };
    if (config.feedUrl) return { type: "url", source: config.feedUrl, format: config.feedFormat || detectFeedFormatFromSource(config.feedUrl) };
    if (config.publisherId && config.advertiserId && config.accessToken) {
      const format = config.feedFormat || "jsonl";
      const url = `https://api.awin.com/publishers/${encodeURIComponent(config.publisherId)}/awinfeeds/download/${encodeURIComponent(config.advertiserId)}-${encodeURIComponent(config.vertical)}-${encodeURIComponent(config.locale)}.${format}`;
      return { type: "api", source: url, format };
    }
    return { type: "unconfigured", source: "", format: "jsonl" };
  }

  buildOfficialFeedUrl(advertiser = {}) {
    const config = this.getConfig();
    const publisherId = cleanText(advertiser.publisherId || config.publisherId || envValue("AWIN_PUBLISHER_ID", "AWIN_ACCOUNT_ID"));
    const advertiserId = cleanText(advertiser.advertiserId || envValue("AWIN_ADVERTISER_ID"));
    const vertical = cleanText(advertiser.vertical || config.vertical || "retail") || "retail";
    const locale = cleanText(advertiser.locale || config.locale || "en_GB") || "en_GB";
    const format = cleanText(advertiser.feedFormat || config.feedFormat || "jsonl") || "jsonl";
    if (!publisherId || !advertiserId) return "";
    return `https://api.awin.com/publishers/${encodeURIComponent(publisherId)}/awinfeeds/download/${encodeURIComponent(advertiserId)}-${encodeURIComponent(vertical)}-${encodeURIComponent(locale)}.${format}`;
  }

  getAdvertiserFeedSource(advertiser = {}) {
    const item = normalizeAdvertiserItem(advertiser);
    if (item.feedText) return { type: "inline", source: item.name || "inline-feed", format: item.feedFormat || "jsonl", text: item.feedText };
    if (item.feedPath) return { type: "file", source: path.resolve(item.feedPath), format: item.feedFormat || path.extname(item.feedPath).slice(1) || "jsonl" };
    if (item.feedUrl) return { type: "url", source: item.feedUrl, format: item.feedFormat || detectFeedFormatFromSource(item.feedUrl) };
    const officialUrl = this.buildOfficialFeedUrl(item);
    if (officialUrl) return { type: "api", source: officialUrl, format: item.feedFormat || "jsonl" };
    const globalFeed = this.getFeedSource();
    if (globalFeed.type !== "unconfigured") return globalFeed;
    return { type: "unconfigured", source: "", format: "jsonl" };
  }

  async downloadFeed(options = {}) {
    const feedSource = options.feedSource || this.getFeedSource();
    const feedPath = cleanText(options.feedPath || "");
    const feedText = cleanText(options.feedText || "");
    const feedUrl = cleanText(options.feedUrl || "");
    const format = cleanText(options.format || feedSource.format || "jsonl").toLowerCase();

    if (feedText) return { ok: true, source: "inline", format, text: feedText };

    if (feedPath || feedSource.type === "file") {
      const resolvedPath = path.resolve(feedPath || feedSource.source);
      const text = fs.readFileSync(resolvedPath, "utf8");
      return { ok: true, source: resolvedPath, format: detectFeedFormatFromSource(resolvedPath, text), text };
    }

    const targetUrl = feedUrl || feedSource.source;
    if (!targetUrl) return { ok: false, source: "", format, error: "AWIN_FEED_NOT_CONFIGURED" };
    if (!this.fetchImpl) return { ok: false, source: targetUrl, format, error: "FETCH_NOT_AVAILABLE" };

    const config = this.getConfig();
    const headers = { Accept: "application/json,text/plain,text/csv,*/*" };
    if (config.accessToken) headers.Authorization = `Bearer ${config.accessToken}`;

    const response = await this.fetchImpl(targetUrl, { headers });
    const text = await response.text();
    if (!response.ok) {
      const error = new Error(`AWIN_FEED_HTTP_${response.status}`);
      error.status = response.status;
      error.body = text;
      throw error;
    }

    return { ok: true, source: targetUrl, format: detectFeedFormatFromSource(targetUrl, text), text, status: response.status };
  }

  async downloadFeedForAdvertiser(advertiser = {}, options = {}) {
    const manualOverride = cleanText(options.feedText || options.feedPath || options.feedUrl || "");
    if (manualOverride) {
      const source = options.feedText
        ? { type: "inline", source: "inline-feed", format: options.format || "jsonl", text: options.feedText }
        : options.feedPath
          ? { type: "file", source: path.resolve(options.feedPath), format: options.format || path.extname(options.feedPath).slice(1) || "jsonl" }
          : options.feedUrl
            ? { type: "url", source: options.feedUrl, format: options.format || detectFeedFormatFromSource(options.feedUrl) }
            : { type: "unconfigured", source: "", format: options.format || "jsonl" };
      const download = await this.downloadFeed({
        ...options,
        feedSource: source,
        feedPath: source.type === "file" ? source.source : "",
        feedUrl: source.type === "url" ? source.source : "",
        feedText: source.type === "inline" ? source.text : "",
        format: source.format,
      });
      return { ...download, advertiser: normalizeAdvertiserItem(advertiser) };
    }

    const source = this.getAdvertiserFeedSource(advertiser);
    const download = await this.downloadFeed({
      ...options,
      feedSource: source,
      feedPath: source.type === "file" ? source.source : "",
      feedUrl: source.type === "url" || source.type === "api" ? source.source : "",
      feedText: source.type === "inline" ? source.text : "",
      format: source.format,
    });
    return { ...download, advertiser: normalizeAdvertiserItem(advertiser) };
  }

  getDiagnostics() {
    const config = this.getConfig();
    const state = readJson(this.getStatePath(), {});
    const advertisers = this.getAdvertisers();
    const feedAvailable = advertisers.some((item) => Boolean(this.getAdvertiserFeedSource(item).source)) || Boolean(this.getFeedSource().source);
    return {
      configured: this.configured(),
      feedAvailable,
      lastImport: state.lastImport || null,
      totalProducts: this.getCatalogManager().list().filter((item) => String(item.marketplace || "").toLowerCase() === "awin").length,
      advertisers: advertisers.map((item) => ({
        name: item.name,
        enabled: item.enabled,
        categoryGroup: this.resolveAdvertiserCategoryGroup(item) || item.categoryGroup || "",
        hasFeedUrl: Boolean(item.feedUrl),
        hasFeedPath: Boolean(item.feedPath),
        hasAdvertiserId: Boolean(item.advertiserId),
      })),
      feedSource: this.getFeedSource().type,
      feedFormat: this.getFeedSource().format,
      hasPublisherId: Boolean(config.publisherId),
      hasAdvertiserId: Boolean(config.advertiserId),
      hasAccessToken: Boolean(config.accessToken),
    };
  }

  parseFeedText(text = "", options = {}) {
    const source = cleanText(options.source || "");
    const format = cleanText(options.format || detectFeedFormatFromSource(source, text)).toLowerCase();
    let rows = [];
    let errors = [];

    if (format === "csv") {
      const parsed = parseCsv(text);
      rows = parsed.rows;
      errors = parsed.errors;
    } else if (format === "xml") {
      rows = parseXmlFeed(text);
    } else if (format === "json") {
      const parsed = parseJson(text);
      rows = parsed.rows;
      errors = parsed.errors;
    } else if (format === "jsonl") {
      const parsed = parseJsonLines(text);
      rows = parsed.rows;
      errors = parsed.errors;
    } else {
      const parsed = parseJsonLines(text);
      rows = parsed.rows.length ? parsed.rows : parseCsv(text).rows;
      errors = parsed.errors;
    }

    return { rows, errors, format };
  }

  normalizeProduct(raw = {}, context = {}) {
    const title = cleanText(getValue(raw, "title", "name", "product_name", "productName", "offerTitle", "offer_title"));
    const category = cleanText(getValue(raw, "category", "googleProductCategory", "google_product_category", "product_type", "productType")) || cleanText(context.categoryGroup || context.category || "");
    const brand = cleanText(getValue(raw, "brand", "product_brand", "manufacturer", "merchantBrand"));
    const model = cleanText(getValue(raw, "model", "mpn", "product_model", "productModel"));
    const priceValue = getValue(raw, "price.value", "price", "salePrice", "regularPrice", "amount", "priceValue", "offerPrice");
    const price = parseNumber(priceValue);
    const currency = cleanText(getValue(raw, "price.currency", "currency", "currencyCode", "currency_code")) || "BRL";

    const affiliateUrl = validUrlOrEmpty(
      getValue(raw, "affiliateUrl", "affiliate_url", "trackingLink", "tracking_link", "trackingUrl", "tracking_url", "link", "url", "product_url"),
    );
    const productUrl = validUrlOrEmpty(
      getValue(raw, "productUrl", "product_url", "merchantUrl", "merchant_url", "destinationUrl", "destination_url", "link", "url"),
    ) || affiliateUrl;
    const image = validUrlOrEmpty(
      getValue(raw, "image", "image_link", "imageLink", "thumbnail", "picture", "pictureUrl", "picture_url", "imageUrl"),
    );
    const seller = cleanText(getValue(raw, "seller", "merchant", "merchantName", "merchant_name", "advertiser", "advertiserName", "store")) || cleanText(context.advertiser?.name || "") || null;
    const availability = cleanText(getValue(raw, "availability", "stock", "productAvailability", "product_availability")) || "available";
    const condition = cleanText(getValue(raw, "condition", "productCondition", "product_condition")) || "new";
    const importedAt = cleanText(getValue(raw, "importedAt", "lastCheckedAt")) || this.now();
    const marketplace = "awin";
    const sourceType = "awin_feed";
    const externalId = cleanText(getValue(raw, "externalId", "external_id", "offerId", "offer_id", "id", "productId", "product_id")) || slugify(title);
    const id = cleanText(getValue(raw, "id")) || `awin-${slugify(externalId || title || `${Date.now()}`)}`;
    const reasons = [];

    if (!title) reasons.push("Titulo ausente");
    if (!Number.isFinite(price) || price <= 0) reasons.push("Preco ausente");
    if (!affiliateUrl && !productUrl) reasons.push("Link ausente");
    if (!category) reasons.push("Categoria ausente");

    if (reasons.length) {
      return { ok: false, reason: reasons.join("; "), reasons, product: null };
    }

    const resolvedProductUrl = productUrl || affiliateUrl;
    const resolvedAffiliateUrl = affiliateUrl || productUrl;
    return {
      ok: true,
      reason: "",
      reasons: [],
      product: {
        id,
        externalId,
        title,
        category,
        brand: brand || null,
        model: model || null,
        price,
        currency,
        image,
        productUrl: resolvedProductUrl,
        affiliateUrl: resolvedAffiliateUrl,
        marketplace,
        sourceType,
        seller,
        availability,
        condition,
        importedAt,
        updatedAt: importedAt,
        lastCheckedAt: importedAt,
        status: "ACTIVE",
        dataMode: "real",
        description: cleanText(getValue(raw, "description", "summary", "shortDescription", "short_description")),
        advertiser: context.advertiser || null,
        raw,
      },
    };
  }

  async importToCatalog(options = {}) {
    const advertisers = this.getAdvertisers().filter((item) => item.enabled !== false);
    const activeAdvertisers = advertisers.length ? advertisers : [{ name: "Awin Feed", enabled: true }];
    const allProducts = [];
    const rejectedItems = [];
    const importErrors = [];
    let downloaded = 0;

    for (const advertiser of activeAdvertisers) {
      const download = await this.downloadFeedForAdvertiser(advertiser, options);
      if (!download.ok) {
        importErrors.push(`${advertiser.name || "Awin"}: ${download.error || "AWIN_FEED_NOT_CONFIGURED"}`);
        continue;
      }

      const parsed = this.parseFeedText(download.text, { format: download.format, source: download.source });
      downloaded += parsed.rows.length;

      for (const raw of parsed.rows) {
        const candidate = this.normalizeProduct(raw, {
          advertiser: download.advertiser,
          advertiserName: download.advertiser?.name || advertiser.name || "Awin",
          categoryGroup: this.resolveAdvertiserCategoryGroup(download.advertiser || advertiser),
        });
        if (!candidate.ok) {
          rejectedItems.push({
            advertiser: download.advertiser?.name || advertiser.name || "Awin",
            raw,
            reason: candidate.reason,
            reasons: candidate.reasons,
          });
          continue;
        }
        allProducts.push(candidate.product);
      }

      for (const error of parsed.errors || []) {
        importErrors.push(`${advertiser.name || "Awin"}: ${error.reason || "Erro ao interpretar feed"}`);
      }
    }

    const catalogManager = this.getCatalogManager();
    const existing = catalogManager.list();
    const updated = allProducts.filter((product) =>
      existing.some((item) =>
        String(item.id || "") === String(product.id || "") ||
        String(item.externalId || "") === String(product.externalId || "") ||
        String(item.productUrl || "") === String(product.productUrl || "") ||
        String(item.affiliateUrl || "") === String(product.affiliateUrl || "") ||
        (
          cleanText(item.title).toLowerCase() === cleanText(product.title).toLowerCase() &&
          cleanText(item.brand).toLowerCase() === cleanText(product.brand).toLowerCase() &&
          cleanText(item.model).toLowerCase() === cleanText(product.model).toLowerCase()
        )
      ),
    ).length;

    const importResult = typeof catalogManager.importProducts === "function"
      ? catalogManager.importProducts(allProducts, "merge")
      : catalogManager.import(allProducts, "merge");

    const result = {
      configured: this.configured(),
      downloaded,
      imported: importResult.imported,
      updated,
      rejected: rejectedItems.length + (importResult.rejected || 0),
      errors: [
        ...importErrors,
        ...rejectedItems.map((item) => `${item.advertiser || "Awin"}: ${item.reason}`),
        ...((importResult.rejectedItems || []).map((item) => item.reason || item.reasons?.join(", ") || "Produto rejeitado")),
      ],
      advertisers: activeAdvertisers.map((item) => ({
        name: item.name,
        categoryGroup: this.resolveAdvertiserCategoryGroup(item) || item.categoryGroup || "",
      })),
      feedSource: activeAdvertisers.map((item) => item.name).join(", "),
      feedFormat: "mixed",
      productCount: importResult.total || importResult.products?.length || 0,
      products: importResult.products || [],
      rejectedItems: rejectedItems.concat((importResult.rejectedItems || []).map((item) => ({ reason: item.reason, reasons: item.reasons, raw: item.product || item.raw }))),
      lastImport: this.now(),
    };

    this.persistState(result);
    return result;
  }

  persistState(summary = {}) {
    const state = {
      lastImport: summary.lastImport || this.now(),
      feedSource: summary.feedSource || "",
      feedFormat: summary.feedFormat || "",
      configured: Boolean(summary.configured),
      downloaded: summary.downloaded || 0,
      imported: summary.imported || 0,
      updated: summary.updated || 0,
      rejected: summary.rejected || 0,
      errors: Array.isArray(summary.errors) ? summary.errors.slice(0, 20) : [],
      productCount: summary.productCount || 0,
    };
    writeJson(this.getStatePath(), state);
  }

  async searchProducts(query = "", options = {}) {
    const needle = cleanText(query).toLowerCase();
    const products = this.getCatalogManager()
      .list()
      .filter((item) => String(item.marketplace || "").toLowerCase() === "awin")
      .filter((item) => {
        if (!needle) return true;
        const haystack = cleanText(`${item.title || ""} ${item.category || ""} ${item.brand || ""} ${item.model || ""} ${item.seller || ""}`).toLowerCase();
        return haystack.includes(needle);
      });
    const limited = products.slice(0, Number(options.limit || 20));
    return {
      configured: this.configured(),
      statusHttp: 200,
      dataMode: "real",
      strategyUsed: "awin_feed_catalog",
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
        error: "AWIN_PRODUCT_NOT_FOUND",
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

  getStatus() {
    return readJson(this.getStatePath(), {});
  }
}

const awinFeedProvider = new AwinFeedProvider();

export default awinFeedProvider;
