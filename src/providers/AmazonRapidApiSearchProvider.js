import { normalizeText, scoreProductMatch } from "../catalog/ProductNormalizer.js";
import { buildOfferPricing } from "../pricing/CouponProvider.js";

const DEFAULT_HOST = "real-time-amazon-data.p.rapidapi.com";
const DEFAULT_ENDPOINT = `https://${DEFAULT_HOST}/search`;

function envValue(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return String(value).trim();
  }
  return "";
}

function configuredRapidApiKey(explicitValue = "") {
  if (explicitValue !== undefined && explicitValue !== null && String(explicitValue).trim()) {
    return String(explicitValue).trim();
  }
  return envValue("RAPIDAPI_AMAZON_KEY");
}

function configuredRapidApiHost(explicitValue = "") {
  if (explicitValue !== undefined && explicitValue !== null && String(explicitValue).trim()) {
    return String(explicitValue).trim();
  }
  return envValue("RAPIDAPI_AMAZON_HOST", "AMAZON_RAPIDAPI_HOST") || DEFAULT_HOST;
}

function configuredEndpoint(explicitValue = "") {
  if (explicitValue !== undefined && explicitValue !== null && String(explicitValue).trim()) {
    return String(explicitValue).trim();
  }
  return envValue("AMAZON_SEARCH_ENDPOINT") || DEFAULT_ENDPOINT;
}

function toNumber(value, fallback = 0) {
  if (value == null || value === "") return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const normalized = String(value)
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function extractResults(body = {}) {
  if (Array.isArray(body?.data?.products)) return body.data.products;
  if (Array.isArray(body?.data?.results)) return body.data.results;
  if (Array.isArray(body?.products)) return body.products;
  if (Array.isArray(body?.results)) return body.results;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body)) return body;
  return [];
}

function isAmazonProductUrl(value = "") {
  const url = String(value || "").trim();
  return /^https?:\/\/(?:www\.)?amazon\.com\.br\//i.test(url);
}

function looksLikeGenericAmazonUrl(value = "") {
  const url = String(value || "").trim().toLowerCase();
  if (!url) return true;
  if (url === "https://www.amazon.com.br" || url === "https://amazon.com.br") return true;
  if (url === "https://www.amazon.com.br/" || url === "https://amazon.com.br/") return true;
  if (url.includes("/s?")) return true;
  if (url.includes("/gp/search")) return true;
  if (url.includes("/b?")) return true;
  return !(/\/dp\/[A-Z0-9]{10}/i.test(url) || /\/gp\/product\/[A-Z0-9]{10}/i.test(url));
}

function extractAsin(item = {}) {
  return String(
    item.asin
    || item.ASIN
    || item.product_asin
    || item.product_id
    || item.id
    || "",
  ).trim();
}

function extractUrl(item = {}) {
  const candidates = [
    item.product_url,
    item.url,
    item.link,
    item.detail_page_url,
    item.detailPageURL,
    item.permalink,
  ];
  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (isAmazonProductUrl(value) && !looksLikeGenericAmazonUrl(value)) return value;
  }
  return "";
}

function extractImage(item = {}) {
  return String(
    item.product_photo
    || item.thumbnail
    || item.image
    || item.images?.[0]
    || item.images?.primary
    || "",
  ).trim();
}

function extractTitle(item = {}) {
  return String(
    item.product_title
    || item.title
    || item.name
    || "",
  ).trim();
}

function extractAvailability(item = {}) {
  const candidates = [
    item.product_availability,
    item.availability,
    item.availability_status,
    item.stock_status,
  ];
  return String(candidates.find((value) => value != null) || "").trim();
}

function extractCondition(item = {}) {
  return String(item.condition || item.product_condition || "new").trim().toLowerCase();
}

function extractPrice(item = {}) {
  return toNumber(
    item.product_price
    ?? item.price
    ?? item.price_value
    ?? item.current_price
    ?? item.offer_price
    ?? item.buybox_price
    ?? item.price?.amount,
    0,
  );
}

function extractOriginalPrice(item = {}) {
  return toNumber(
    item.product_original_price
    ?? item.original_price
    ?? item.was_price
    ?? item.list_price,
    0,
  );
}

function extractSeller(item = {}) {
  return {
    name: String(
      item.seller_name
      || item.merchant_name
      || item.seller
      || item.merchant
      || "Amazon"
    ).trim(),
    reputation: null,
  };
}

function isAccessoryIntent(query = "") {
  return /\b(capa|case|pelicula|pel[íi]cula|carregador|cabo|fone|headphone|earbud|airpods|strap|pulseira|suporte|acessorio|acess[oó]rio)\b/i.test(String(query || ""));
}

function isAccessoryItem(item = {}) {
  const text = normalizeText([
    extractTitle(item),
    item.category,
    item.subcategory,
    item.product_byline,
  ].filter(Boolean).join(" "));
  return /\b(capa|case|pelicula|carregador|cabo|fone|headphone|earbud|airpods|strap|pulseira|suporte|accessory|adapter|adaptador|cover)\b/.test(text);
}

function rankItem(item = {}, query = "") {
  const text = normalizeText([
    extractTitle(item),
    item.category,
    item.subcategory,
    item.brand,
    item.product_byline,
  ].filter(Boolean).join(" "));
  const queryText = normalizeText(query);
  const score = scoreProductMatch({ title: extractTitle(item), category: item.category, brand: item.brand }, query);
  const exactBonus = queryText && text.includes(queryText) ? 3 : 0;
  const accessoryPenalty = isAccessoryItem(item) && !isAccessoryIntent(query) ? -3 : 0;
  const imageBonus = extractImage(item) ? 0.25 : 0;
  const urlBonus = extractUrl(item) ? 0.25 : 0;
  return score + exactBonus + accessoryPenalty + imageBonus + urlBonus;
}

function normalizeAmazonItem(item = {}, query = "") {
  const asin = extractAsin(item);
  const permalink = extractUrl(item);
  const title = extractTitle(item);
  const price = extractPrice(item);
  const originalPrice = extractOriginalPrice(item) || null;
  const shippingPrice = toNumber(item.shipping_price ?? item.delivery_price ?? 0, 0);
  const couponText = String(item.coupon_text || item.coupon || "").trim();
  const pricing = buildOfferPricing({
    price,
    shipping: {
      price: shippingPrice,
      free: shippingPrice === 0,
    },
    coupon: couponText
      ? {
          source: "amazon",
          code: null,
          type: "fixed",
          value: 0,
          verifiedAt: null,
          status: "unverified",
        }
      : null,
  });

  return {
    source: "amazon",
    sourceName: "Amazon",
    sourceLabel: "Amazon",
    marketplace: "amazon",
    provider: "rapidapi_amazon",
    sourceProductId: asin,
    asin,
    itemId: asin,
    id: asin,
    title,
    displayTitle: title,
    brand: String(item.brand || item.product_byline || "").trim() || null,
    model: null,
    category: String(item.category || item.product_category || "").trim(),
    price,
    currency: "BRL",
    originalPrice,
    discountPercent: originalPrice && originalPrice > price
      ? Number((((originalPrice - price) / originalPrice) * 100).toFixed(2))
      : null,
    coupon: pricing.coupon,
    shipping: pricing.shipping,
    installment: {
      count: null,
      amount: null,
      hasInterest: null,
      isEstimated: false,
    },
    installments: null,
    seller: extractSeller(item),
    condition: extractCondition(item),
    availability: extractAvailability(item),
    image: extractImage(item),
    thumbnail: extractImage(item),
    permalink,
    productUrl: permalink,
    affiliateUrl: permalink,
    lastCheckedAt: new Date().toISOString(),
    matchScore: rankItem(item, query),
    sourceQualityScore: [
      Boolean(title),
      Boolean(price > 0),
      Boolean(permalink),
      Boolean(extractImage(item)),
      Boolean(extractAvailability(item)),
    ].reduce((sum, flag) => sum + (flag ? 1 : 0), 0) / 5,
    finalPrice: pricing.finalPrice,
    dataMode: "real",
    sourceType: "amazon_direct_item_search",
    raw: item,
  };
}

export class AmazonRapidApiSearchProvider {
  constructor({ fetchImpl = null, apiKey = "", apiHost = "", searchEndpoint = "" } = {}) {
    this.fetchImpl = fetchImpl;
    this.apiKey = apiKey;
    this.apiHost = apiHost;
    this.searchEndpoint = searchEndpoint;
  }

  getApiKey() {
    return configuredRapidApiKey(this.apiKey);
  }

  getApiHost() {
    return configuredRapidApiHost(this.apiHost);
  }

  getEndpoint() {
    return configuredEndpoint(this.searchEndpoint);
  }

  buildUrl({ query = "", category = "", brand = "", model = "", maxPrice = 0, limit = 10, marketplace = "BR" } = {}) {
    const url = new URL(this.getEndpoint());
    const searchQuery = [query, brand, model].filter(Boolean).join(" ").trim() || category || query;
    if (!url.searchParams.has("query")) url.searchParams.set("query", searchQuery);
    if (!url.searchParams.has("country")) url.searchParams.set("country", marketplace);
    if (!url.searchParams.has("sort_by")) url.searchParams.set("sort_by", "RELEVANCE");
    if (!url.searchParams.has("product_condition")) url.searchParams.set("product_condition", "ALL");
    if (!url.searchParams.has("is_prime")) url.searchParams.set("is_prime", "false");
    if (!url.searchParams.has("deals_and_discounts")) url.searchParams.set("deals_and_discounts", "NONE");
    if (!url.searchParams.has("page")) url.searchParams.set("page", "1");
    if (!url.searchParams.has("limit")) url.searchParams.set("limit", String(limit));
    if (maxPrice > 0 && !url.searchParams.has("max_price")) url.searchParams.set("max_price", String(maxPrice));
    return url.toString();
  }

  async searchProducts(query = "", options = {}) {
    const q = String(query || "").trim();
    if (!q) {
      return {
        products: [],
        dataMode: "demo",
        strategyUsed: "amazon_direct_item_search",
        statusHttp: 400,
        error: "QUERY_EMPTY",
        rawCount: 0,
        returnedCount: 0,
      };
    }

    const apiKey = this.getApiKey();
    const apiHost = this.getApiHost();
    if (!apiKey || !apiHost) {
      return {
        products: [],
        dataMode: "demo",
        strategyUsed: "amazon_direct_item_search",
        statusHttp: 503,
        error: "AMAZON_NOT_CONFIGURED",
        rawCount: 0,
        returnedCount: 0,
      };
    }

    const fetchImpl = this.fetchImpl || globalThis.fetch;
    const response = await fetchImpl(this.buildUrl({
      query: q,
      category: options.category || "",
      brand: options.brand || "",
      model: options.model || "",
      maxPrice: Number(options.maxPrice || options.totalBudget || 0),
      limit: Number(options.limit || 10),
      marketplace: options.marketplace || "BR",
    }), {
      headers: {
        Accept: "application/json",
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": apiHost,
      },
    });
    const rawText = await response.text().catch(() => "");
    let body = {};
    try {
      body = rawText ? JSON.parse(rawText) : {};
    } catch {
      body = {};
    }

    if (!response.ok) {
      return {
        products: [],
        dataMode: "demo",
        strategyUsed: "amazon_direct_item_search",
        statusHttp: response.status,
        error: body?.message || body?.error || `HTTP ${response.status}`,
        rawCount: 0,
        returnedCount: 0,
      };
    }

    const results = extractResults(body);
    const normalized = results
      .map((item) => normalizeAmazonItem(item, q))
      .filter((item) => item.asin && item.permalink && !looksLikeGenericAmazonUrl(item.permalink) && item.price > 0 && item.title)
      .sort((left, right) => {
        const scoreDelta = Number(right.matchScore || 0) - Number(left.matchScore || 0);
        if (scoreDelta !== 0) return scoreDelta;
        const accessoryDelta = Number(Boolean(isAccessoryItem(right.raw))) - Number(Boolean(isAccessoryItem(left.raw)));
        if (accessoryDelta !== 0) return accessoryDelta;
        return Number(left.finalPrice || left.price || 0) - Number(right.finalPrice || right.price || 0);
      })
      .slice(0, Number(options.limit || 10));

    return {
      products: normalized,
      dataMode: normalized.length ? "real" : "demo",
      strategyUsed: "amazon_direct_item_search",
      statusHttp: response.status,
      error: normalized.length ? "" : "NO_DIRECT_ITEMS",
      rawCount: results.length,
      returnedCount: normalized.length,
      firstFive: normalized.slice(0, 5).map((item) => ({
        asin: item.asin,
        title: item.title,
        finalPrice: item.finalPrice,
        permalink: item.permalink,
      })),
    };
  }

  getDiagnostics() {
    const apiKey = this.getApiKey();
    return {
      configured: Boolean(apiKey && this.getApiHost() && this.getEndpoint()),
      provider: "rapidapi_amazon",
      hasKey: Boolean(apiKey),
      hasHost: Boolean(this.getApiHost()),
      hasEndpoint: Boolean(this.getEndpoint()),
      authMode: apiKey ? "rapidapi-key" : "none",
    };
  }
}

export default AmazonRapidApiSearchProvider;
