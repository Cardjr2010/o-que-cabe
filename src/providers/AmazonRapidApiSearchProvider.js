import { normalizeText, scoreProductMatch } from "../catalog/ProductNormalizer.js";
import { buildOfferPricing } from "../pricing/CouponProvider.js";

const DEFAULT_RAPIDAPI_HOST = "real-time-amazon-data.p.rapidapi.com";
const DEFAULT_RAPIDAPI_ENDPOINT = `https://${DEFAULT_RAPIDAPI_HOST}/search`;
const DEFAULT_CREATORS_TOKEN_URL = "https://api.amazon.com/auth/o2/token";
const DEFAULT_CREATORS_SEARCH_URL = "https://creatorsapi.amazon/catalog/v1/searchItems";

let creatorsTokenCache = null;

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
  return envValue("RAPIDAPI_AMAZON_HOST", "AMAZON_RAPIDAPI_HOST") || DEFAULT_RAPIDAPI_HOST;
}

function configuredRapidApiEndpoint(explicitValue = "") {
  if (explicitValue !== undefined && explicitValue !== null && String(explicitValue).trim()) {
    return String(explicitValue).trim();
  }
  return envValue("AMAZON_SEARCH_ENDPOINT") || DEFAULT_RAPIDAPI_ENDPOINT;
}

function configuredCreatorsClientId(explicitValue = "") {
  if (explicitValue !== undefined && explicitValue !== null && String(explicitValue).trim()) {
    return String(explicitValue).trim();
  }
  return envValue("AMAZON_CREATORS_CLIENT_ID");
}

function configuredCreatorsClientSecret(explicitValue = "") {
  if (explicitValue !== undefined && explicitValue !== null && String(explicitValue).trim()) {
    return String(explicitValue).trim();
  }
  return envValue("AMAZON_CREATORS_CLIENT_SECRET");
}

function configuredAssociateTag(explicitValue = "") {
  if (explicitValue !== undefined && explicitValue !== null && String(explicitValue).trim()) {
    return String(explicitValue).trim();
  }
  return envValue("AMAZON_ASSOCIATE_TAG");
}

function configuredMarketplace(explicitValue = "") {
  if (explicitValue !== undefined && explicitValue !== null && String(explicitValue).trim()) {
    return String(explicitValue).trim();
  }
  return envValue("AMAZON_MARKETPLACE", "RAPIDAPI_AMAZON_MARKETPLACE") || "www.amazon.com.br";
}

function configuredCreatorsTokenUrl(explicitValue = "") {
  if (explicitValue !== undefined && explicitValue !== null && String(explicitValue).trim()) {
    return String(explicitValue).trim();
  }
  return envValue("AMAZON_CREATORS_TOKEN_URL") || DEFAULT_CREATORS_TOKEN_URL;
}

function configuredCreatorsSearchUrl(explicitValue = "") {
  if (explicitValue !== undefined && explicitValue !== null && String(explicitValue).trim()) {
    return String(explicitValue).trim();
  }
  return envValue("AMAZON_CREATORS_SEARCH_URL") || DEFAULT_CREATORS_SEARCH_URL;
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
  if (Array.isArray(body?.searchResult?.items)) return body.searchResult.items;
  if (Array.isArray(body?.SearchResult?.Items)) return body.SearchResult.Items;
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
    item.detailPageURL,
    item.detailPageUrl,
    item.product_url,
    item.url,
    item.link,
    item.permalink,
  ];
  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (isAmazonProductUrl(value) && !looksLikeGenericAmazonUrl(value)) return value;
  }
  return "";
}

function extractImage(item = {}) {
  const nested = item?.images?.primary;
  return String(
    nested?.medium?.url
    || nested?.large?.url
    || nested?.small?.url
    || item.product_photo
    || item.thumbnail
    || item.image
    || item.images?.[0]
    || "",
  ).trim();
}

function extractTitle(item = {}) {
  return String(
    item?.itemInfo?.title?.displayValue
    || item.product_title
    || item.title
    || item.name
    || "",
  ).trim();
}

function extractAvailability(item = {}) {
  const candidates = [
    item.availability?.message,
    item.product_availability,
    item.availability,
    item.availability_status,
    item.stock_status,
  ];
  const value = candidates.find((candidate) => candidate != null);
  return String(value || "").trim();
}

function extractCondition(item = {}) {
  return String(item.condition || item.product_condition || "new").trim().toLowerCase();
}

function extractPrice(item = {}) {
  return toNumber(
    item?.offersV2?.listings?.[0]?.price?.amount
    ?? item?.offers?.listings?.[0]?.price?.amount
    ?? item.product_price
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
    item?.offersV2?.listings?.[0]?.savingBasis?.amount
    ?? item?.offers?.listings?.[0]?.savingBasis?.amount
    ?? item.product_original_price
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
  return /\b(capa|case|pelicula|carregador|cabo|fone|headphone|earbud|airpods|strap|pulseira|suporte|accessory|adapter|adaptador|cover|wallet|bumper|skin|replacement|display|tela|bateria)\b/.test(text);
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

function normalizeAmazonItem(item = {}, query = "", providerName = "amazon") {
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
    provider: providerName,
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

function normalizeErrorType(body = {}, responseStatus = 0, fallback = "") {
  return String(
    body?.reason
    || body?.type
    || body?.error
    || body?.code
    || fallback
    || `HTTP_${responseStatus || 0}`
  ).trim();
}

export class AmazonRapidApiSearchProvider {
  constructor({
    fetchImpl = null,
    apiKey = "",
    apiHost = "",
    searchEndpoint = "",
    creatorsClientId = "",
    creatorsClientSecret = "",
    creatorsTokenUrl = "",
    creatorsSearchUrl = "",
    associateTag = "",
    marketplace = "",
    timeoutMs = 12000,
  } = {}) {
    this.fetchImpl = fetchImpl;
    this.apiKey = apiKey;
    this.apiHost = apiHost;
    this.searchEndpoint = searchEndpoint;
    this.creatorsClientId = creatorsClientId;
    this.creatorsClientSecret = creatorsClientSecret;
    this.creatorsTokenUrl = creatorsTokenUrl;
    this.creatorsSearchUrl = creatorsSearchUrl;
    this.associateTag = associateTag;
    this.marketplace = marketplace;
    this.timeoutMs = timeoutMs;
    this.lastStatus = null;
    this.lastErrorType = null;
    this.lastSuccessAt = null;
  }

  getApiKey() {
    return configuredRapidApiKey(this.apiKey);
  }

  getApiHost() {
    return configuredRapidApiHost(this.apiHost);
  }

  getEndpoint() {
    return configuredRapidApiEndpoint(this.searchEndpoint);
  }

  getCreatorsClientId() {
    return configuredCreatorsClientId(this.creatorsClientId);
  }

  getCreatorsClientSecret() {
    return configuredCreatorsClientSecret(this.creatorsClientSecret);
  }

  getCreatorsTokenUrl() {
    return configuredCreatorsTokenUrl(this.creatorsTokenUrl);
  }

  getCreatorsSearchUrl() {
    return configuredCreatorsSearchUrl(this.creatorsSearchUrl);
  }

  getAssociateTag() {
    return configuredAssociateTag(this.associateTag);
  }

  getMarketplace() {
    return configuredMarketplace(this.marketplace);
  }

  getProviderMode() {
    if (this.getCreatorsClientId() && this.getCreatorsClientSecret() && this.getAssociateTag()) {
      return "creators";
    }
    if (this.getApiKey() && this.getApiHost() && this.getEndpoint()) {
      return "rapidapi";
    }
    return "none";
  }

  providerName() {
    return this.getProviderMode() === "creators" ? "amazon_creators_api" : "rapidapi_amazon";
  }

  setDiagnostics({ status = null, errorType = null, success = false } = {}) {
    if (status !== null) this.lastStatus = Number(status);
    this.lastErrorType = errorType ? String(errorType) : null;
    if (success) this.lastSuccessAt = new Date().toISOString();
  }

  buildRapidApiUrl({ query = "", category = "", brand = "", model = "", maxPrice = 0, limit = 10, marketplace = "BR" } = {}) {
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

  async requestWithTimeout(url, options = {}) {
    const fetchImpl = this.fetchImpl || globalThis.fetch;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error("PROVIDER_TIMEOUT")), this.timeoutMs);
    try {
      return await fetchImpl(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async getCreatorsToken() {
    const now = Date.now();
    if (creatorsTokenCache && creatorsTokenCache.expiresAt > now + 60_000) {
      return creatorsTokenCache.accessToken;
    }

    const response = await this.requestWithTimeout(this.getCreatorsTokenUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: this.getCreatorsClientId(),
        client_secret: this.getCreatorsClientSecret(),
        scope: "creatorsapi::default",
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body?.access_token) {
      this.setDiagnostics({
        status: response.status,
        errorType: normalizeErrorType(body, response.status, "AMAZON_TOKEN_FAILED"),
      });
      return { ok: false, response, body, accessToken: "" };
    }

    creatorsTokenCache = {
      accessToken: body.access_token,
      expiresAt: now + (Number(body.expires_in || 3600) * 1000),
    };
    return { ok: true, response, body, accessToken: body.access_token };
  }

  async searchViaCreators(query = "", options = {}) {
    const q = String(query || "").trim();
    const tokenResult = await this.getCreatorsToken();
    if (!tokenResult.ok || !tokenResult.accessToken) {
      return {
        products: [],
        dataMode: "demo",
        strategyUsed: "amazon_direct_item_search",
        statusHttp: tokenResult.response?.status || 503,
        error: normalizeErrorType(tokenResult.body, tokenResult.response?.status, "AMAZON_TOKEN_FAILED"),
        provider: this.providerName(),
        rawCount: 0,
        returnedCount: 0,
        firstFive: [],
      };
    }

    const searchQuery = [q, options.brand || "", options.model || ""].filter(Boolean).join(" ").trim();
    const response = await this.requestWithTimeout(this.getCreatorsSearchUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-marketplace": this.getMarketplace(),
      },
      body: JSON.stringify({
        partnerTag: this.getAssociateTag(),
        partnerType: "Associates",
        keywords: searchQuery,
        itemCount: Number(options.limit || 10),
        resources: [
          "images.primary.medium",
          "images.primary.large",
          "itemInfo.title",
          "offersV2.listings.price",
        ],
      }),
    });
    const rawText = await response.text().catch(() => "");
    let body = {};
    try {
      body = rawText ? JSON.parse(rawText) : {};
    } catch {
      body = {};
    }

    const results = extractResults(body);
    const normalized = results
      .map((item) => normalizeAmazonItem(item, searchQuery, this.providerName()))
      .filter((item) => item.asin && item.permalink && !looksLikeGenericAmazonUrl(item.permalink) && item.price > 0 && item.title)
      .sort((left, right) => {
        const scoreDelta = Number(right.matchScore || 0) - Number(left.matchScore || 0);
        if (scoreDelta !== 0) return scoreDelta;
        const accessoryDelta = Number(Boolean(isAccessoryItem(right.raw))) - Number(Boolean(isAccessoryItem(left.raw)));
        if (accessoryDelta !== 0) return accessoryDelta;
        return Number(left.finalPrice || left.price || 0) - Number(right.finalPrice || right.price || 0);
      })
      .slice(0, Number(options.limit || 10));

    const errorType = response.ok
      ? (normalized.length ? null : "NO_DIRECT_ITEMS")
      : normalizeErrorType(body, response.status, "AMAZON_CREATORS_FAILED");
    this.setDiagnostics({
      status: response.status,
      errorType,
      success: response.ok && normalized.length > 0,
    });

    return {
      products: normalized,
      dataMode: normalized.length ? "real" : "demo",
      strategyUsed: "amazon_direct_item_search",
      statusHttp: response.status,
      error: errorType || "",
      provider: this.providerName(),
      rawCount: results.length,
      returnedCount: normalized.length,
      firstFive: normalized.slice(0, 5).map((item) => ({
        asin: item.asin,
        title: item.title,
        finalPrice: item.finalPrice,
        permalink: item.permalink,
      })),
      rawResponseSample: response.ok ? undefined : {
        message: body?.message || null,
        reason: body?.reason || null,
        type: body?.type || null,
      },
    };
  }

  async searchViaRapidApi(query = "", options = {}) {
    const q = String(query || "").trim();
    const response = await this.requestWithTimeout(this.buildRapidApiUrl({
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
        "x-rapidapi-key": this.getApiKey(),
        "x-rapidapi-host": this.getApiHost(),
      },
    });
    const rawText = await response.text().catch(() => "");
    let body = {};
    try {
      body = rawText ? JSON.parse(rawText) : {};
    } catch {
      body = {};
    }

    const results = extractResults(body);
    const normalized = results
      .map((item) => normalizeAmazonItem(item, q, this.providerName()))
      .filter((item) => item.asin && item.permalink && !looksLikeGenericAmazonUrl(item.permalink) && item.price > 0 && item.title)
      .sort((left, right) => {
        const scoreDelta = Number(right.matchScore || 0) - Number(left.matchScore || 0);
        if (scoreDelta !== 0) return scoreDelta;
        const accessoryDelta = Number(Boolean(isAccessoryItem(right.raw))) - Number(Boolean(isAccessoryItem(left.raw)));
        if (accessoryDelta !== 0) return accessoryDelta;
        return Number(left.finalPrice || left.price || 0) - Number(right.finalPrice || right.price || 0);
      })
      .slice(0, Number(options.limit || 10));

    const errorType = response.ok
      ? (normalized.length ? null : "NO_DIRECT_ITEMS")
      : normalizeErrorType(body, response.status, "AMAZON_RAPIDAPI_FAILED");
    this.setDiagnostics({
      status: response.status,
      errorType,
      success: response.ok && normalized.length > 0,
    });

    return {
      products: normalized,
      dataMode: normalized.length ? "real" : "demo",
      strategyUsed: "amazon_direct_item_search",
      statusHttp: response.status,
      error: errorType || "",
      provider: this.providerName(),
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

  async searchProducts(query = "", options = {}) {
    const q = String(query || "").trim();
    if (!q) {
      return {
        products: [],
        dataMode: "demo",
        strategyUsed: "amazon_direct_item_search",
        statusHttp: 400,
        error: "QUERY_EMPTY",
        provider: this.providerName(),
        rawCount: 0,
        returnedCount: 0,
        firstFive: [],
      };
    }

    const mode = this.getProviderMode();
    if (mode === "creators") {
      return this.searchViaCreators(q, options);
    }
    if (mode === "rapidapi") {
      return this.searchViaRapidApi(q, options);
    }
    this.setDiagnostics({ status: 503, errorType: "AMAZON_NOT_CONFIGURED" });
    return {
      products: [],
      dataMode: "demo",
      strategyUsed: "amazon_direct_item_search",
      statusHttp: 503,
      error: "AMAZON_NOT_CONFIGURED",
      provider: "amazon_unconfigured",
      rawCount: 0,
      returnedCount: 0,
      firstFive: [],
    };
  }

  async probe(query = "iphone 17") {
    const mode = this.getProviderMode();
    const diagnostics = this.getDiagnostics();
    if (mode === "none") {
      return {
        ...diagnostics,
        authenticated: false,
        reachable: false,
        operational: false,
      };
    }
    const result = await this.searchProducts(query, { limit: 3, marketplace: "BR" });
    return {
      ...this.getDiagnostics(),
      authenticated: mode === "creators" ? result.statusHttp !== 401 : Boolean(this.getApiKey()),
      reachable: Boolean(result.statusHttp),
      operational: result.dataMode === "real" && Number(result.returnedCount || 0) > 0,
      lastStatus: result.statusHttp,
      lastErrorType: result.error || null,
      received: Number(result.rawCount || 0),
      accepted: Number(result.returnedCount || 0),
      firstFive: result.firstFive || [],
    };
  }

  getDiagnostics() {
    const mode = this.getProviderMode();
    const provider = this.providerName();
    if (mode === "creators") {
      return {
        configured: Boolean(this.getCreatorsClientId() && this.getCreatorsClientSecret() && this.getAssociateTag()),
        provider,
        authMode: "oauth_client_credentials",
        hasKey: false,
        hasHost: false,
        hasEndpoint: Boolean(this.getCreatorsSearchUrl()),
        hasClientId: Boolean(this.getCreatorsClientId()),
        hasClientSecret: Boolean(this.getCreatorsClientSecret()),
        hasAssociateTag: Boolean(this.getAssociateTag()),
        marketplace: this.getMarketplace(),
        lastStatus: this.lastStatus,
        lastErrorType: this.lastErrorType,
        lastSuccessAt: this.lastSuccessAt,
      };
    }

    if (mode === "rapidapi") {
      const apiKey = this.getApiKey();
      return {
        configured: Boolean(apiKey && this.getApiHost() && this.getEndpoint()),
        provider,
        authMode: apiKey ? "rapidapi-key" : "none",
        hasKey: Boolean(apiKey),
        hasHost: Boolean(this.getApiHost()),
        hasEndpoint: Boolean(this.getEndpoint()),
        hasClientId: false,
        hasClientSecret: false,
        hasAssociateTag: false,
        marketplace: this.getMarketplace(),
        lastStatus: this.lastStatus,
        lastErrorType: this.lastErrorType,
        lastSuccessAt: this.lastSuccessAt,
      };
    }

    return {
      configured: false,
      provider: "amazon_unconfigured",
      authMode: "none",
      hasKey: false,
      hasHost: false,
      hasEndpoint: false,
      hasClientId: false,
      hasClientSecret: false,
      hasAssociateTag: false,
      marketplace: this.getMarketplace(),
      lastStatus: this.lastStatus,
      lastErrorType: this.lastErrorType,
      lastSuccessAt: this.lastSuccessAt,
    };
  }
}

export default AmazonRapidApiSearchProvider;
