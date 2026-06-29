import CatalogManager from "../catalog/CatalogManager.js";
import { projectRoot } from "../runtime/project-root.js";

const root = projectRoot;


const MERCHANT_API_BASE = "https://merchantapi.googleapis.com";

function envValue(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return "";
}

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slugify(value = "") {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pickFirst(values = []) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = pickFirst(value);
      if (nested) return nested;
      continue;
    }
    const text = cleanText(value);
    if (text) return text;
  }
  return "";
}

function normalizeCategory(raw = {}) {
  const fromCategory = pickFirst([
    raw.googleProductCategory,
    raw.google_product_category,
    raw.category,
    raw.productCategory,
  ]);
  if (fromCategory) return fromCategory;

  const productTypes = raw.productTypes || raw.product_types || raw.productType || raw.product_type;
  if (Array.isArray(productTypes)) return pickFirst(productTypes);
  return pickFirst([productTypes]);
}

function normalizePrice(raw = {}) {
  const source = raw.price || raw.offerPrice || raw.salePrice || raw.listPrice || raw.priceInfo || {};
  if (typeof source === "number") {
    return { price: source, currency: raw.currency || raw.currencyCode || "BRL" };
  }
  if (typeof source === "string") {
    const parsed = Number(source);
    return { price: Number.isFinite(parsed) ? parsed : 0, currency: raw.currency || raw.currencyCode || "BRL" };
  }
  const amountMicros = Number(source.amountMicros ?? source.amount_micros ?? source.microAmount ?? 0);
  if (Number.isFinite(amountMicros) && amountMicros > 0) {
    return {
      price: amountMicros / 1_000_000,
      currency: source.currencyCode || source.currency || raw.currency || raw.currencyCode || "BRL",
    };
  }
  const amount = Number(source.value ?? source.amount ?? source.price ?? 0);
  return {
    price: Number.isFinite(amount) ? amount : 0,
    currency: source.currencyCode || source.currency || raw.currency || raw.currencyCode || "BRL",
  };
}

function pickProductUrl(raw = {}) {
  return cleanText(
    raw.link ||
      raw.productUrl ||
      raw.product_url ||
      raw.url ||
      raw.permalink ||
      raw.destination ||
      raw.canonicalLink ||
      raw.canonical_link ||
      "",
  );
}

function pickImage(raw = {}) {
  const picture = Array.isArray(raw.pictures) ? raw.pictures[0] : null;
  return cleanText(
    raw.imageLink ||
      raw.image_link ||
      raw.thumbnail ||
      raw.image ||
      picture?.url ||
      raw.additionalImageLinks?.[0] ||
      raw.additional_image_links?.[0] ||
      "",
  );
}

function pickSeller(raw = {}) {
  return (
    pickFirst([
      raw.seller?.name,
      raw.seller?.displayName,
      raw.seller?.display_name,
      raw.merchantName,
      raw.merchant_name,
      raw.brand,
    ]) || null
  );
}

function pickAvailability(raw = {}) {
  return pickFirst([raw.availability, raw.productAvailability, raw.product_availability]) || "available";
}

function pickCondition(raw = {}) {
  return pickFirst([raw.condition, raw.productCondition, raw.product_condition]) || "new";
}

function normalizeRawProducts(response = {}) {
  const items = Array.isArray(response.products)
    ? response.products
    : Array.isArray(response.items)
      ? response.items
      : Array.isArray(response.results)
        ? response.results
        : [];
  return items;
}

export class GoogleMerchantProductsAdapter {
  constructor(options = {}) {
    this.accountId = options.accountId || envValue("GOOGLE_MERCHANT_ACCOUNT_ID");
    this.accessToken = options.accessToken || envValue("GOOGLE_MERCHANT_ACCESS_TOKEN");
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
    this.catalogManager = options.catalogManager || new CatalogManager();
  }

  configured() {
    return Boolean(this.accountId && this.accessToken);
  }

  getDiagnostics() {
    return {
      hasAccountId: Boolean(this.accountId),
      hasAccessToken: Boolean(this.accessToken),
      configured: this.configured(),
    };
  }

  async requestJson(url, init = {}) {
    if (!this.accountId || !this.accessToken) {
      return {
        ok: false,
        status: 401,
        body: null,
        error: "GOOGLE_MERCHANT_NOT_CONFIGURED",
      };
    }

    const response = await this.fetchImpl(url, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.accessToken}`,
        ...(init.headers || {}),
      },
    });

    const rawText = await response.text().catch(() => "");
    let body = rawText;
    try {
      body = rawText ? JSON.parse(rawText) : {};
    } catch {
      body = rawText;
    }

    return {
      ok: response.ok,
      status: response.status,
      headers: response.headers,
      body,
      rawText,
    };
  }

  normalizeProduct(raw = {}) {
    const title = cleanText(raw.title || raw.name || raw.offerId || raw.id || "");
    const category = cleanText(normalizeCategory(raw));
    const { price, currency } = normalizePrice(raw);
    const productUrl = pickProductUrl(raw);
    const image = pickImage(raw);
    const reasons = [];

    if (!title) reasons.push("Título ausente");
    if (!category) reasons.push("Categoria ausente");
    if (!Number.isFinite(price) || price <= 0) reasons.push("Preço ausente");
    if (!productUrl) reasons.push("Link ausente");

    if (reasons.length) {
      return {
        ok: false,
        product: null,
        reason: reasons.join("; "),
        reasons,
      };
    }

    const externalId = cleanText(
      raw.offerId ||
        raw.offer_id ||
        raw.id ||
        raw.name ||
        raw.productId ||
        raw.product_id ||
        title,
    );
    const id = cleanText(raw.name || raw.id || `google-merchant-${slugify(externalId || title)}`) || `google-merchant-${Date.now()}`;
    const rawDataMode = cleanText(raw.dataMode || raw.mode || "real");
    const marketplace = "google_merchant";
    const sourceType = cleanText(raw.sourceType || "google_merchant_api");
    const importedAt = cleanText(raw.importedAt || raw.lastCheckedAt || new Date().toISOString());

    return {
      ok: true,
      reason: "",
      reasons: [],
      product: {
        id,
        externalId,
        title,
        category,
        brand: cleanText(raw.brand || raw.manufacturer || ""),
        model: cleanText(raw.model || raw.mpn || ""),
        price,
        currency,
        image,
        productUrl,
        affiliateUrl: cleanText(raw.affiliateUrl || ""),
        marketplace,
        sourceType,
        condition: pickCondition(raw),
        availability: pickAvailability(raw),
        seller: pickSeller(raw),
        rating: raw.rating ?? null,
        shipping: raw.shipping ?? null,
        installments: raw.installments ?? null,
        lastCheckedAt: importedAt,
        importedAt,
        updatedAt: importedAt,
        status: cleanText(raw.status || "ACTIVE") || "ACTIVE",
        dataMode: rawDataMode,
        description: cleanText(raw.description || raw.summary || ""),
        raw,
      },
    };
  }

  async listDataSources() {
    if (!this.accountId || !this.accessToken) {
      return {
        configured: false,
        statusHttp: 401,
        dataSources: [],
        error: "GOOGLE_MERCHANT_NOT_CONFIGURED",
      };
    }

    const endpoint = `${MERCHANT_API_BASE}/datasources/v1/accounts/${encodeURIComponent(this.accountId)}/dataSources`;
    const result = await this.requestJson(endpoint);
    const dataSources = Array.isArray(result.body?.dataSources) ? result.body.dataSources : [];
    return {
      configured: true,
      statusHttp: result.status,
      dataSources,
      error: result.ok ? "" : result.body?.message || result.body?.error || result.rawText || `HTTP ${result.status}`,
      raw: result.body,
    };
  }

  async fetchDataSource(dataSourceId) {
    if (!this.accountId || !this.accessToken) {
      return {
        configured: false,
        statusHttp: 401,
        error: "GOOGLE_MERCHANT_NOT_CONFIGURED",
      };
    }

    const name = String(dataSourceId || "");
    const resource = name.startsWith("accounts/") ? name : `accounts/${this.accountId}/dataSources/${name}`;
    const endpoint = `${MERCHANT_API_BASE}/datasources/v1/${encodeURIComponent(resource).replace(/%2F/g, "/")}:fetch`;
    const result = await this.requestJson(endpoint, { method: "POST" });
    return {
      configured: true,
      statusHttp: result.status,
      error: result.ok ? "" : result.body?.message || result.body?.error || result.rawText || `HTTP ${result.status}`,
      body: result.body,
    };
  }

  async listProducts(options = {}) {
    if (!this.accountId || !this.accessToken) {
      return {
        configured: false,
        statusHttp: 401,
        dataMode: "demo",
        strategyUsed: "google_merchant_api",
        error: "GOOGLE_MERCHANT_NOT_CONFIGURED",
        rawCount: 0,
        returnedCount: 0,
        fetched: 0,
        imported: 0,
        rejected: 0,
        updated: 0,
        errors: [],
        products: [],
        firstFive: [],
      };
    }

    const params = new URLSearchParams();
    if (options.pageSize) params.set("pageSize", String(options.pageSize));
    if (options.pageToken) params.set("pageToken", String(options.pageToken));

    const endpoint = `${MERCHANT_API_BASE}/products/v1/accounts/${encodeURIComponent(this.accountId)}/products${params.toString() ? `?${params.toString()}` : ""}`;
    const result = await this.requestJson(endpoint);
    const rawProducts = normalizeRawProducts(result.body);
    const normalized = rawProducts.map((raw) => this.normalizeProduct(raw));
    const accepted = normalized.filter((item) => item.ok).map((item) => item.product);
    const rejected = normalized.filter((item) => !item.ok);

    return {
      configured: true,
      statusHttp: result.status,
      dataMode: "real",
      strategyUsed: "google_merchant_api",
      error: result.ok ? "" : result.body?.message || result.body?.error || result.rawText || `HTTP ${result.status}`,
      rawCount: rawProducts.length,
      returnedCount: accepted.length,
      fetched: rawProducts.length,
      imported: accepted.length,
      rejected: rejected.length,
      updated: 0,
      errors: rejected.map((item) => item.reason),
      products: accepted,
      rejectedItems: rejected,
      firstFive: accepted.slice(0, 5).map((item) => ({
        title: item.title,
        price: item.price,
        permalink: item.productUrl,
        image: item.image,
      })),
      raw: result.body,
    };
  }

  async getProduct(productId) {
    if (!this.accountId || !this.accessToken) {
      return {
        configured: false,
        statusHttp: 401,
        dataMode: "demo",
        error: "GOOGLE_MERCHANT_NOT_CONFIGURED",
        product: null,
      };
    }

    const name = String(productId || "").startsWith("accounts/")
      ? String(productId)
      : `accounts/${this.accountId}/products/${encodeURIComponent(String(productId || ""))}`;
    const endpoint = `${MERCHANT_API_BASE}/products/v1/${name}`;
    const result = await this.requestJson(endpoint);
    if (!result.ok) {
      return {
        configured: true,
        statusHttp: result.status,
        dataMode: "demo",
        error: result.body?.message || result.body?.error || result.rawText || `HTTP ${result.status}`,
        product: null,
        raw: result.body,
      };
    }

    const normalized = this.normalizeProduct(result.body);
    if (!normalized.ok) {
      return {
        configured: true,
        statusHttp: 422,
        dataMode: "demo",
        error: normalized.reason,
        product: null,
        raw: result.body,
      };
    }

    return {
      configured: true,
      statusHttp: result.status,
      dataMode: "real",
      error: "",
      product: normalized.product,
      raw: result.body,
    };
  }

  async searchProducts(query = "", options = {}) {
    const result = await this.listProducts(options);
    const needle = cleanText(query).toLowerCase();
    if (!needle) {
      return result;
    }
    const products = (result.products || []).filter((product) => {
      const haystack = `${product.title || ""} ${product.category || ""} ${product.brand || ""} ${product.model || ""} ${product.externalId || ""}`.toLowerCase();
      return haystack.includes(needle);
    });
    return {
      ...result,
      products,
      returnedCount: products.length,
      firstFive: products.slice(0, 5).map((item) => ({
        title: item.title,
        price: item.price,
        permalink: item.productUrl,
        image: item.image,
      })),
    };
  }

  async importToCatalog(options = {}) {
    const result = await this.listProducts(options);
    const accepted = Array.isArray(result.products) ? result.products : [];
    if (!this.configured()) {
      return {
        configured: false,
        fetched: 0,
        imported: 0,
        rejected: 0,
        updated: 0,
        errors: [result.error || "GOOGLE_MERCHANT_NOT_CONFIGURED"],
      };
    }

    const existing = this.catalogManager.list();
    const updated = accepted.filter((product) =>
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

    const importResult = this.catalogManager.import(accepted, options.mode || "merge");
    return {
      configured: true,
      fetched: result.rawCount || accepted.length,
      imported: importResult.imported,
      rejected: (result.rejected || 0) + (importResult.rejected || 0),
      updated,
      errors: [...(result.errors || []), ...((importResult.rejectedItems || []).map((item) => item.reason || item.reasons?.join(", ") || "Produto rejeitado"))],
      strategyUsed: result.strategyUsed || "google_merchant_api",
      statusHttp: result.statusHttp || 200,
      products: importResult.products || [],
      rejectedItems: importResult.rejectedItems || [],
    };
  }
}

export default GoogleMerchantProductsAdapter;
