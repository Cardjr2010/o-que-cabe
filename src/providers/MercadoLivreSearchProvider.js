import { scoreProductMatch, normalizeText } from "../catalog/ProductNormalizer.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { resolveProjectPath } from "../runtime/project-root.js";

const oauthPaths = [
  resolveProjectPath("data", "mercadolivre-oauth.json"),
  resolveProjectPath("data", "mercadolivre-oauth.tmp.json"),
  resolveProjectPath("data", "mercadolivre-oauth.cache.json"),
  path.join(os.tmpdir(), "mercadolivre-oauth.json"),
];
let refreshPromise = null;

function readStoredOAuth() {
  for (const filePath of oauthPaths) {
    const oauth = readJson(filePath, null);
    if (oauth && (oauth.access_token || oauth.refresh_token)) {
      return oauth;
    }
  }
  return null;
}

function writeStoredOAuthMetadata(patch = {}) {
  if (!patch || typeof patch !== "object" || !Object.keys(patch).length) return;
  const base = readStoredOAuth() || {};
  const nextValue = {
    ...base,
    ...patch,
  };
  for (const filePath of oauthPaths) {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(nextValue, null, 2), "utf8");
      return;
    } catch {
      /* ignore write failures in serverless */
    }
  }
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function envValue(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return String(value).trim();
  }
  return "";
}

function readStoredAccessToken() {
  const oauth = readStoredOAuth();
  return String(oauth?.access_token || "").trim();
}

function readStoredRefreshToken() {
  const oauth = readStoredOAuth();
  return String(oauth?.refresh_token || "").trim();
}

function configuredAccessToken(explicitToken = "") {
  if (explicitToken !== undefined && explicitToken !== null) {
    return String(explicitToken || "").trim();
  }
  return envValue("MELI_ACCESS_TOKEN", "MERCADOLIVRE_ACCESS_TOKEN", "MERCADO_LIVRE_ACCESS_TOKEN")
    || readStoredAccessToken();
}

function configuredRefreshToken(explicitToken = "") {
  if (explicitToken !== undefined && explicitToken !== null) {
    return String(explicitToken || "").trim();
  }
  return envValue("MELI_REFRESH_TOKEN", "MERCADOLIVRE_REFRESH_TOKEN", "MERCADO_LIVRE_REFRESH_TOKEN")
    || readStoredRefreshToken();
}

function mercadolivreClientId(explicitValue = "") {
  if (explicitValue !== undefined && explicitValue !== null) {
    return String(explicitValue || "").trim();
  }
  return envValue("MELI_CLIENT_ID", "CLIENT_ID", "MERCADOLIVRE_CLIENT_ID", "MERCADO_LIVRE_CLIENT_ID");
}

function mercadolivreClientSecret(explicitValue = "") {
  if (explicitValue !== undefined && explicitValue !== null) {
    return String(explicitValue || "").trim();
  }
  return envValue("MELI_CLIENT_SECRET", "CLIENT_SECRET", "MERCADOLIVRE_CLIENT_SECRET", "MERCADO_LIVRE_CLIENT_SECRET");
}

function mercadolivreConfigured(clientId = "", clientSecret = "") {
  return Boolean(mercadolivreClientId(clientId) && mercadolivreClientSecret(clientSecret));
}

async function refreshAccessToken(provider, refreshToken) {
  const token = String(refreshToken || "").trim();
  const clientId = provider?.getClientId?.() || mercadolivreClientId();
  const clientSecret = provider?.getClientSecret?.() || mercadolivreClientSecret();
  if (!token || !mercadolivreConfigured(clientId, clientSecret)) return null;
  const fetchImpl = provider?.fetchImpl || globalThis.fetch;
  const response = await fetchImpl("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token,
    }),
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  if (!payload?.access_token) return null;
  const stored = {
    ...payload,
    refresh_token: payload.refresh_token || token,
    expires_at: payload.expires_in ? Date.now() + (Number(payload.expires_in) * 1000) : undefined,
    created_at: new Date().toISOString(),
  };
  for (const filePath of oauthPaths) {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(stored, null, 2), "utf8");
      break;
    } catch {
      /* ignore write failures in serverless */
    }
  }
  return stored.access_token;
}

async function ensureRefreshedAccessToken(provider, refreshToken) {
  if (refreshPromise) {
    return refreshPromise;
  }
  refreshPromise = refreshAccessToken(provider, refreshToken)
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

function buildSearchEndpoint({ siteId = "MLB", query = "", limit = 20, searchEndpoint = "" } = {}) {
  const configuredEndpoint = String(searchEndpoint || envValue("MERCADOLIVRE_SEARCH_ENDPOINT", "MELI_SEARCH_ENDPOINT") || "").trim();
  if (configuredEndpoint) {
    if (/\{(?:q|query|limit|siteId)\}/.test(configuredEndpoint)) {
      return configuredEndpoint
        .replaceAll("{q}", encodeURIComponent(query))
        .replaceAll("{query}", encodeURIComponent(query))
        .replaceAll("{limit}", encodeURIComponent(String(limit)))
        .replaceAll("{siteId}", encodeURIComponent(siteId));
    }
    const url = new URL(configuredEndpoint);
    if (!url.searchParams.has("q")) url.searchParams.set("q", query);
    if (!url.searchParams.has("limit")) url.searchParams.set("limit", String(limit));
    if (!url.searchParams.has("site_id")) url.searchParams.set("site_id", siteId);
    return url.toString();
  }
  return `https://api.mercadolibre.com/sites/${encodeURIComponent(siteId)}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
}

function extractResults(body = {}) {
  if (Array.isArray(body?.results)) return body.results;
  if (Array.isArray(body?.products)) return body.products;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.data?.results)) return body.data.results;
  if (Array.isArray(body?.data?.products)) return body.data.products;
  if (Array.isArray(body)) return body;
  return [];
}

function looksLikeGenericMercadoLivreUrl(value = "") {
  const url = String(value || "").trim().toLowerCase();
  if (!url) return true;
  if (url === "https://www.mercadolivre.com.br" || url === "https://mercadolivre.com.br") return true;
  if (url === "https://www.mercadolivre.com.br/" || url === "https://mercadolivre.com.br/") return true;
  if (url.includes("lista.mercadolivre.com.br")) return true;
  if (url.includes("/search")) return true;
  if (url.includes("/categoria")) return true;
  if (url.includes("/categories")) return true;
  return !/\/MLB[\w-]+/i.test(url);
}

function normalizeSeller(item = {}) {
  const seller = item.seller || {};
  const nickname = seller.nickname ?? seller.name ?? seller.official_store_name ?? item.seller_nickname ?? null;
  return {
    id: seller.id ?? seller.seller_id ?? item.seller_id ?? null,
    name: nickname,
    nickname,
    official_store_name: seller.official_store_name ?? item.official_store_name ?? null,
    reputation: seller.reputation || item.seller_reputation || null,
  };
}

function normalizeInstallments(item = {}) {
  if (!item.installments) return null;
  if (typeof item.installments === "number") {
    return {
      quantity: item.installments,
      amount: null,
      rate: null,
      currency_id: item.currency_id || "BRL",
      available: true,
    };
  }
  return {
    quantity: item.installments.quantity ?? item.installments.count ?? null,
    amount: item.installments.amount ?? null,
    rate: item.installments.rate ?? null,
    currency_id: item.installments.currency_id || item.currency_id || "BRL",
    available: item.installments.available ?? true,
  };
}

function normalizeShipping(item = {}) {
  const shipping = item.shipping || {};
  const freeShipping = Boolean(shipping.free_shipping ?? shipping.freeShipping ?? item.free_shipping);
  return {
    ...shipping,
    freeShipping,
    free_shipping: freeShipping,
  };
}

function normalizeMercadoLivreItem(item = {}) {
  const permalink = String(item.permalink || item.productUrl || item.url || "").trim();
  const image = String(item.thumbnail || item.image || item.pictures?.[0]?.url || "").trim();
  const seller = normalizeSeller(item);
  const shipping = normalizeShipping(item);
  const installments = normalizeInstallments(item);
  const freeShipping = Boolean(shipping.freeShipping ?? shipping.free_shipping);
  const itemId = String(item.id || "").trim();
  return {
    itemId,
    id: itemId,
    title: String(item.title || "").trim(),
    price: Number(item.price ?? item.total_price ?? 0) || 0,
    currency: String(item.currency_id || item.currency || "BRL"),
    thumbnail: image,
    image,
    condition: String(item.condition || "").trim() || null,
    seller,
    sellerReputation: seller.reputation || item.seller_reputation || null,
    availableQuantity: item.available_quantity ?? null,
    permalink,
    productUrl: permalink,
    installments,
    shipping,
    freeShipping,
    source: "mercado_livre",
    sourceName: "Mercado Livre",
    sourceLabel: "Mercado Livre",
    marketplace: "mercado_livre",
    dataMode: "real",
    sourceType: "mercado_livre_direct_item_search",
    category: String(item.category_id || item.category || "").trim(),
    description: String(item.title || item.description || "").trim(),
    raw: item,
  };
}

function isAccessoryIntent(query = "") {
  return /\b(capa|case|pelicula|pel[íi]cula|carregador|cabo|fone|headphone|earbud|airpods|strap|pulseira|suporte|acessorio|acess[óo]rio|protector|protetor|holder)\b/i.test(String(query || ""));
}

function isAccessoryItem(item = {}) {
  const text = normalizeText([
    item.title,
    item.description,
    item.category,
    item.brand,
    item.model,
  ].filter(Boolean).join(" "));
  return /\b(capa|case|pelicula|pelicula|carregador|cabo|fone|headphone|earbud|airpods|strap|pulseira|suporte|acessorio|acessorio|protector|protetor|holder|cover|film|screen protector)\b/.test(text);
}

function rankItem(item = {}, query = "") {
  const text = normalizeText([
    item.title,
    item.description,
    item.category,
    item.seller?.nickname,
    item.seller?.official_store_name,
  ].filter(Boolean).join(" "));
  const score = scoreProductMatch(item, query);
  const queryText = normalizeText(query);
  const exact = queryText && text.includes(queryText) ? 3 : 0;
  const accessoryPenalty = isAccessoryItem(item) && !isAccessoryIntent(query) ? -3 : 0;
  const imageBonus = item.thumbnail ? 0.25 : 0;
  const permalinkBonus = item.permalink ? 0.25 : 0;
  const quantityBonus = Number(item.availableQuantity || 0) > 0 ? 0.2 : 0;
  return score + exact + accessoryPenalty + imageBonus + permalinkBonus + quantityBonus;
}

export class MercadoLivreSearchProvider {
  constructor({ fetchImpl = null, siteId = "MLB", limit = 20, accessToken = null, refreshToken = null, clientId = null, clientSecret = null, searchEndpoint = "" } = {}) {
    this.fetchImpl = fetchImpl;
    this.siteId = siteId;
    this.limit = limit;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.searchEndpoint = searchEndpoint;
  }

  getToken() {
    return configuredAccessToken(this.accessToken);
  }

  getRefreshToken() {
    return configuredRefreshToken(this.refreshToken);
  }

  getClientId() {
    return mercadolivreClientId(this.clientId);
  }

  getClientSecret() {
    return mercadolivreClientSecret(this.clientSecret);
  }

  async resolveToken({ forceRefresh = false } = {}) {
    const accessToken = this.getToken();
    if (accessToken && !forceRefresh) return accessToken;
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return "";
    return await ensureRefreshedAccessToken(this, refreshToken);
  }

  async searchProducts(query = "", options = {}) {
    const q = String(query || "").trim();
    const limit = Number(options.limit || this.limit || 20);
    if (!q) {
      return {
        products: [],
        dataMode: "demo",
        strategyUsed: "mercado_livre_direct_item_search",
        statusHttp: 400,
        error: "QUERY_EMPTY",
        fallbackText: "Não encontramos no catálogo principal do OQC, mas encontramos estas ofertas no Mercado Livre.",
        rawCount: 0,
        returnedCount: 0,
        firstFive: [],
      };
    }

    const endpoint = buildSearchEndpoint({
      siteId: this.siteId,
      query: q,
      limit,
      searchEndpoint: options.searchEndpoint || this.searchEndpoint,
    });
    let accessToken = String(options.accessToken || this.getToken() || "").trim();
    const headers = {
      Accept: "application/json",
      "User-Agent": "OQueCabe/1.0",
    };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const fetchImpl = this.fetchImpl || globalThis.fetch;
    let response = await fetchImpl(endpoint, {
      headers,
    });
    const rawText = await response.text().catch(() => "");
    let body = {};
    try {
      body = rawText ? JSON.parse(rawText) : {};
    } catch {
      body = {};
    }

    if (!response.ok && (response.status === 401 || response.status === 403)) {
      const refreshedToken = await this.resolveToken({ forceRefresh: true });
      if (refreshedToken) {
        accessToken = refreshedToken;
        response = await fetchImpl(endpoint, {
          headers: {
            ...headers,
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const retryText = await response.text().catch(() => "");
        try {
          body = retryText ? JSON.parse(retryText) : {};
        } catch {
          body = {};
        }
      }
    }

    if (!response.ok) {
      writeStoredOAuthMetadata({
        last_status: response.status,
        last_error_type: response.status === 401 || response.status === 403
          ? "auth_failed"
          : "search_failed",
        last_checked_at: new Date().toISOString(),
      });
      return {
        products: [],
        dataMode: "demo",
        strategyUsed: "mercado_livre_direct_item_search",
        statusHttp: response.status,
        error: response.status === 403 && !accessToken
          ? "TOKEN_MISSING_OR_REQUIRED"
          : (body?.message || body?.error || `HTTP ${response.status}`),
        tokenState: accessToken ? "available" : "missing",
        authMode: accessToken ? "bearer" : "anonymous",
        fallbackText: "Não encontramos no catálogo principal do OQC, mas encontramos estas ofertas no Mercado Livre.",
        rawCount: 0,
        returnedCount: 0,
        firstFive: [],
      };
    }

    const results = extractResults(body);
    const normalized = results
      .map((item) => normalizeMercadoLivreItem(item))
      .filter((item) => item.itemId && item.permalink && !looksLikeGenericMercadoLivreUrl(item.permalink) && item.title && Number(item.price || 0) > 0)
      .sort((a, b) => {
        const bScore = rankItem(b, q);
        const aScore = rankItem(a, q);
        if (bScore !== aScore) return bScore - aScore;
        const aAccessory = isAccessoryItem(a);
        const bAccessory = isAccessoryItem(b);
        if (aAccessory !== bAccessory) return aAccessory ? 1 : -1;
        return Number(a.price || 0) - Number(b.price || 0);
      })
      .slice(0, limit);

    const hasDirectItems = normalized.length > 0;
    writeStoredOAuthMetadata({
      last_status: response.status,
      last_error_type: hasDirectItems ? null : "no_direct_items",
      last_checked_at: new Date().toISOString(),
      last_validated_at: hasDirectItems ? new Date().toISOString() : (readStoredOAuth()?.last_validated_at || null),
    });
    return {
      products: normalized,
      dataMode: hasDirectItems ? "real" : "demo",
      strategyUsed: "mercado_livre_direct_item_search",
      statusHttp: response.status,
      error: hasDirectItems ? "" : "NO_DIRECT_ITEMS",
      tokenState: accessToken ? "available" : "missing",
      authMode: accessToken ? "bearer" : "anonymous",
      fallbackText: hasDirectItems ? "" : "Não encontramos no catálogo principal do OQC, mas encontramos estas ofertas no Mercado Livre.",
      rawCount: results.length,
      returnedCount: normalized.length,
      firstFive: normalized.slice(0, 5).map((item) => ({
        title: item.title,
        price: item.price,
        permalink: item.permalink,
        image: item.image,
      })),
    };
  }

  normalizeResult(item = {}) {
    return normalizeMercadoLivreItem(item);
  }

  getDiagnostics() {
    const configuredToken = this.getToken();
    const configuredRefresh = this.getRefreshToken();
    const configuredSearchEndpoint = String(this.searchEndpoint || envValue("MERCADOLIVRE_SEARCH_ENDPOINT", "MELI_SEARCH_ENDPOINT") || "").trim();
    const storedOAuth = readStoredOAuth() || {};
    return {
      configured: Boolean(configuredToken || configuredRefresh || configuredSearchEndpoint || mercadolivreConfigured(this.getClientId(), this.getClientSecret())),
      hasAccessToken: Boolean(configuredToken),
      hasRefreshToken: Boolean(configuredRefresh),
      hasSearchEndpoint: Boolean(configuredSearchEndpoint),
      tokenState: configuredToken ? "available" : "TOKEN_MISSING_OR_REQUIRED",
      authMode: configuredToken ? "bearer" : (configuredRefresh ? "refresh-token" : (configuredSearchEndpoint ? "proxy" : "anonymous")),
      searchEndpoint: configuredSearchEndpoint || "",
      lastStatus: Number.isFinite(Number(storedOAuth.last_status)) ? Number(storedOAuth.last_status) : null,
      lastErrorType: storedOAuth.last_error_type ? String(storedOAuth.last_error_type) : null,
      lastCheckedAt: storedOAuth.last_checked_at ? String(storedOAuth.last_checked_at) : null,
      lastValidatedAt: storedOAuth.last_validated_at ? String(storedOAuth.last_validated_at) : null,
    };
  }
}

export default MercadoLivreSearchProvider;
