import fs from "node:fs";
import { projectRoot } from "../runtime/project-root.js";

import path from "node:path";

const root = projectRoot;
const oauthPath = path.join(root, "data", "mercadolivre-oauth.json");
const demoPath = path.join(root, "data", "mercadolivre-demo-products.json");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readOAuth() {
  return readJson(oauthPath, null);
}

function envValue(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return "";
}

function getClientId() {
  return envValue("MELI_CLIENT_ID", "CLIENT_ID", "MERCADOLIVRE_CLIENT_ID", "MERCADO_LIVRE_CLIENT_ID");
}

function getClientSecret() {
  return envValue("MELI_CLIENT_SECRET", "CLIENT_SECRET", "MERCADOLIVRE_CLIENT_SECRET", "MERCADO_LIVRE_CLIENT_SECRET");
}

function getRedirectUri() {
  return envValue("MELI_REDIRECT_URI", "REDIRECT_URI");
}

function getAccessToken() {
  return envValue("MELI_ACCESS_TOKEN");
}

function getRefreshToken() {
  return envValue("MELI_REFRESH_TOKEN");
}

function tokenState() {
  if (getAccessToken()) return "available";
  const oauth = readOAuth();
  if (oauth?.access_token) {
    const expiresAt = Number(oauth.expires_at || 0);
    if (expiresAt && Date.now() >= expiresAt - 60_000) return "TOKEN_EXPIRED";
    return "available";
  }
  return "TOKEN_MISSING";
}

function getStoredToken() {
  return getAccessToken() || readOAuth()?.access_token || "";
}

function tokenExpired() {
  const oauth = readOAuth();
  if (!oauth?.access_token) return true;
  const expiresAt = Number(oauth.expires_at || 0);
  if (!expiresAt) return false;
  return Date.now() >= expiresAt - 60_000;
}

function hasConfiguration() {
  return Boolean(getClientId() && getClientSecret() && getRedirectUri());
}

function isMercadoLivreItemId(value) {
  return /(?:^|[^A-Z0-9])MLB[-]?\d{6,}(?:[^A-Z0-9]|$)/i.test(String(value || ""));
}

function extractMercadoLivreItemId(value) {
  const match = String(value || "").match(/(?:MLB[-]?)(\d{6,})/i);
  return match ? `MLB${match[1]}` : null;
}

function getProductImage(item = {}) {
  return item.thumbnail || (Array.isArray(item.pictures) ? item.pictures[0]?.url : "") || item.image || "";
}

function getPermalink(item = {}) {
  return item.permalink || item.permalink_url || item.url || "";
}

function normalizeProduct(rawItem = {}, dataMode = "real-authenticated") {
  const seller = rawItem.seller || rawItem.owner || null;
  const shipping = rawItem.shipping || null;
  const installments = rawItem.installments?.quantity ?? rawItem.installments ?? null;
  return {
    id: rawItem.id || "",
    itemId: rawItem.id || "",
    title: rawItem.title || "Produto Mercado Livre",
    price: Number(rawItem.price ?? rawItem.total_price ?? 0) || 0,
    image: getProductImage(rawItem),
    productUrl: getPermalink(rawItem),
    permalink: getPermalink(rawItem),
    seller,
    reputation: rawItem.seller?.reputation?.level_id || rawItem.reputation || null,
    sellerReputation: rawItem.seller?.reputation || rawItem.seller_reputation || null,
    rating: rawItem.rating ?? rawItem.seller?.reputation?.metrics?.claims?.rate ?? null,
    soldQuantity: rawItem.sold_quantity ?? rawItem.available_quantity ?? null,
    shipping,
    freeShipping: Boolean(rawItem.shipping?.free_shipping ?? rawItem.free_shipping),
    installments,
    marketplace: "mercado_livre",
    dataMode,
    source: "mercado_livre",
    sourceName: "Mercado Livre",
    sourceLabel: "Mercado Livre",
    condition: rawItem.condition ?? null,
    availableQuantity: rawItem.available_quantity ?? null,
    description: rawItem.title || rawItem.description || "",
    category: rawItem.category_id || rawItem.category || "",
    raw: rawItem,
  };
}

function detectError(error) {
  if (!error) {
    return { code: "", statusHttp: 200, message: "" };
  }
  if (typeof error === "string") {
    if (error === "TOKEN_MISSING" || error === "TOKEN_EXPIRED") {
      return { code: error, statusHttp: 401, message: error };
    }
    return { code: "ERROR", statusHttp: 500, message: error };
  }
  const code = error.code || error.message || "ERROR";
  const statusHttp = Number(error.status || error.statusHttp || (code === "TOKEN_MISSING" ? 401 : code === "TOKEN_EXPIRED" ? 401 : 500));
  return {
    code,
    statusHttp,
    message: error.message || code,
  };
}

function mapDemoProducts(query, products = []) {
  const q = String(query || "").trim().toLowerCase();
  const rules = {
    celular: { include: ["celular", "smartphone", "galaxy", "moto", "redmi", "iphone"], exclude: ["tv", "notebook", "tablet", "casa", "presente", "air fryer"] },
    tv: { include: ["tv", "televisao", "televisão", "smart tv", "smarttv", "oled", "qled"], exclude: ["celular", "notebook", "tablet", "casa", "presente"] },
    relogio: { include: ["relogio", "relógio", "smartwatch", "watch", "pulseira inteligente"], exclude: ["celular", "notebook", "tablet", "casa", "presente"] },
    notebook: { include: ["notebook", "laptop", "ideapad", "vivobook", "aspire", "thinkpad"], exclude: ["celular", "tv", "tablet", "casa", "presente"] },
    presente: { include: ["presente", "kit", "caneca", "bloco", "acessório", "acessorio"], exclude: ["celular", "tv", "notebook", "tablet"] },
    casa: { include: ["casa", "air fryer", "fritadeira", "aspirador", "cozinha"], exclude: ["celular", "tv", "notebook", "tablet"] },
    tablet: { include: ["tablet", "galaxy tab", "ipad"], exclude: ["celular", "tv", "notebook", "casa", "presente"] },
  };
  const rule = rules[q] || null;
  return products.filter((item) => {
    const text = `${item.title || ""} ${item.category || ""}`.toLowerCase();
    if (!q) return true;
    if (rule) {
      return rule.include.some((term) => text.includes(term)) && !rule.exclude.some((term) => text.includes(term));
    }
    return text.includes(q);
  });
}

function decodeHtmlEntities(value = "") {
  return String(value)
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&#x27;", "'");
}

function cleanText(value = "") {
  return decodeHtmlEntities(String(value || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim());
}

function absolutizeBingUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://www.bing.com${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function parseBingShoppingHtml(html = "", query = "") {
  const q = String(query || "").trim().toLowerCase();
  const anchors = [...String(html || "").matchAll(/<a[^>]*href="([^"]*bing\.com\/aclick[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
  const products = anchors
    .map((block, index) => {
      const href = block[1] || "";
      const text = cleanText(block[2] || "");
      const decoded = (() => {
        try {
          const url = new URL(href, "https://www.bing.com");
          const destination = url.searchParams.get("u");
          if (destination) {
            try {
              return decodeURIComponent(Buffer.from(destination.replace(/^a1/, ""), "base64").toString("utf8"));
            } catch {
              return decodeURIComponent(destination);
            }
          }
          return "";
        } catch {
          return "";
        }
      })();
      const priceMatch = text.match(/R\$\s*([0-9.,]+)/i);
      const price = Number((priceMatch?.[1] || "").replace(/\./g, "").replace(",", ".") || 0);
      const titlePart = text.split(/R\$\s*[0-9.,]+/i)[0] || text;
      const title = cleanText(titlePart).replace(/\s+(Amazon BR|Mercado Livre|Envio gratuito|Frete grátis).*$/i, "").trim();
      const image = "";
      const seller = cleanText((text.match(/\b(Amazon BR|Mercado Livre|Americanas|Magazine Luiza|AliExpress|Shopee)\b/i) || [])[1] || "");
      const offerLink = decoded && /^https?:\/\//i.test(decoded) ? decoded : href;
      const rawDescription = text;
      const category = q || "";
      if (!title || !offerLink || !price) return null;
      return {
        id: `bing-${index + 1}-${q || "shop"}`,
        title,
        price: Number.isFinite(price) ? price : 0,
        image,
        productUrl: offerLink,
        permalink: offerLink,
        seller: seller || null,
        reputation: null,
        rating: null,
        soldQuantity: null,
        shipping: null,
        installments: null,
        marketplace: "bing-shopping",
        dataMode: "real-public",
        source: "bing-shopping",
        store: "Bing Shopping",
        condition: null,
        availableQuantity: null,
        description: rawDescription,
        category,
        raw: { title, price: Number.isFinite(price) ? price : 0, image, seller, offerLink, href },
      };
    })
    .filter(Boolean);
  return products;
}

async function fetchJson(endpoint, init = {}) {
  const response = await fetch(endpoint, {
    redirect: "follow",
    headers: {
      Accept: "application/json",
      "User-Agent": "OQueCabe/1.0",
      ...(init.headers || {}),
    },
    ...init,
  });
  const contentType = response.headers.get("content-type") || "";
  const rawText = await response.text().catch(() => "");
  let body = rawText;
  if (contentType.includes("application/json")) {
    try {
      body = JSON.parse(rawText);
    } catch {
      body = rawText;
    }
  }
  return { response, body, rawText };
}

async function searchAuthenticated(query, options = {}) {
  const token = getStoredToken();
  if (!token) {
    return { products: [], dataMode: "demo", strategyUsed: "demo", statusHttp: 401, error: "TOKEN_MISSING", tokenState: "TOKEN_MISSING", rawCount: 0, returnedCount: 0, firstFive: [] };
  }
  if (tokenExpired() && !getAccessToken()) {
    return { products: [], dataMode: "demo", strategyUsed: "demo", statusHttp: 401, error: "TOKEN_EXPIRED", tokenState: "TOKEN_EXPIRED", rawCount: 0, returnedCount: 0, firstFive: [] };
  }

  const endpoint = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=${Number(options.limit || 20)}`;
  const { response, body, rawText } = await fetchJson(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const results = Array.isArray(body?.results) ? body.results : [];
  if (!response.ok) {
    const error = detectError({ status: response.status, message: body?.message || body?.error || rawText || `HTTP ${response.status}` });
    return {
      products: [],
      dataMode: "demo",
      strategyUsed: "authenticated-search",
      statusHttp: error.statusHttp,
      error: error.code || error.message,
      tokenState: response.status === 403 ? "TOKEN_EXPIRED" : tokenState(),
      rawCount: results.length,
      returnedCount: 0,
      firstFive: results.slice(0, 5).map((item) => ({
        title: item?.title || "",
        price: item?.price ?? null,
        permalink: item?.permalink || "",
        image: getProductImage(item),
      })),
    };
  }

  const products = results.map((item) => normalizeProduct(item, "real-authenticated"));
  return {
    products,
    dataMode: "real-authenticated",
    strategyUsed: "authenticated-search",
    statusHttp: response.status,
    error: "",
    tokenState: tokenState(),
    rawCount: results.length,
    returnedCount: products.length,
    firstFive: products.slice(0, 5).map((item) => ({
      title: item.title,
      price: item.price,
      permalink: item.permalink,
      image: item.image,
    })),
  };
}

async function searchCatalog(query, options = {}) {
  const token = getStoredToken();
  if (!token) return { products: [], dataMode: "demo", strategyUsed: "catalog", statusHttp: 401, error: "TOKEN_MISSING", tokenState: "TOKEN_MISSING", rawCount: 0, returnedCount: 0, firstFive: [] };
  const endpoint = `https://api.mercadolibre.com/products/search?site_id=MLB&q=${encodeURIComponent(query)}&limit=${Number(options.limit || 20)}`;
  const { response, body, rawText } = await fetchJson(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const results = Array.isArray(body?.results) ? body.results : Array.isArray(body?.products) ? body.products : [];
  if (!response.ok) {
    const error = detectError({ status: response.status, message: body?.message || body?.error || rawText || `HTTP ${response.status}` });
    return {
      products: [],
      dataMode: "demo",
      strategyUsed: "catalog",
      statusHttp: error.statusHttp,
      error: error.code || error.message,
      tokenState: response.status === 403 ? "TOKEN_EXPIRED" : tokenState(),
      rawCount: results.length,
      returnedCount: 0,
      firstFive: [],
    };
  }
  const products = results.map((item) => normalizeProduct(item, "real-authenticated"));
  return {
    products,
    dataMode: "real-authenticated",
    strategyUsed: "catalog",
    statusHttp: response.status,
    error: "",
    tokenState: tokenState(),
    rawCount: results.length,
    returnedCount: products.length,
    firstFive: products.slice(0, 5).map((item) => ({
      title: item.title,
      price: item.price,
      permalink: item.permalink,
      image: item.image,
    })),
  };
}

async function searchPublicShopping(query, options = {}) {
  const q = String(query || "").trim();
  if (!q) {
    return { products: [], dataMode: "demo", strategyUsed: "bing-shopping", statusHttp: 400, error: "QUERY_EMPTY", tokenState: tokenState(), rawCount: 0, returnedCount: 0, firstFive: [] };
  }
  const endpoint = `https://www.bing.com/shop?q=${encodeURIComponent(q)}&cc=br&setlang=pt-BR`;
  const { response, rawText } = await fetchJson(endpoint, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  const products = parseBingShoppingHtml(rawText, q);
  if (!response.ok || !products.length) {
    return {
      products: [],
      dataMode: "demo",
      strategyUsed: "bing-shopping",
      statusHttp: response.status,
      error: products.length ? "" : `BING_EMPTY_${response.status}`,
      tokenState: tokenState(),
      rawCount: 0,
      returnedCount: 0,
      firstFive: [],
    };
  }
  return {
    products: products.slice(0, Number(options.limit || 20)),
    dataMode: "real-public",
    strategyUsed: "bing-shopping",
    statusHttp: response.status,
    error: "",
    tokenState: tokenState(),
    rawCount: products.length,
    returnedCount: products.length,
    firstFive: products.slice(0, 5).map((item) => ({
      title: item.title,
      price: item.price,
      permalink: item.permalink,
      image: item.image,
    })),
  };
}

async function getProduct(itemId) {
  const token = getStoredToken();
  if (!token) {
    return { error: "TOKEN_MISSING", tokenState: "TOKEN_MISSING" };
  }
  if (tokenExpired() && !getAccessToken()) {
    return { error: "TOKEN_EXPIRED", tokenState: "TOKEN_EXPIRED" };
  }
  const endpoint = `https://api.mercadolibre.com/items/${encodeURIComponent(itemId)}`;
  const { response, body, rawText } = await fetchJson(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = detectError({ status: response.status, message: body?.message || body?.error || rawText || `HTTP ${response.status}` });
    return { error: error.code || error.message, statusHttp: error.statusHttp, tokenState: response.status === 403 ? "TOKEN_EXPIRED" : tokenState() };
  }
  return {
    item: normalizeProduct(body, "real-authenticated"),
    statusHttp: response.status,
    tokenState: tokenState(),
  };
}

async function getProductByQuery(query, options = {}) {
  const queryValue = String(query || "").trim();
  const itemId = options.itemId || extractMercadoLivreItemId(queryValue);
  if (itemId) {
    const direct = await getProduct(itemId);
    if (direct?.item) {
      return {
        products: [direct.item],
        dataMode: "real-authenticated",
        strategyUsed: "item-lookup",
        statusHttp: direct.statusHttp || 200,
        error: "",
        tokenState: direct.tokenState || tokenState(),
        rawCount: 1,
        returnedCount: 1,
        firstFive: [{
          title: direct.item.title,
          price: direct.item.price,
          permalink: direct.item.permalink,
          image: direct.item.image,
        }],
      };
    }
  }

  const strategies = [
    () => searchAuthenticated(queryValue, options),
    () => searchCatalog(queryValue, options),
    () => searchPublicShopping(queryValue, options),
  ];
  let lastError = "";
  let lastStatus = 200;

  for (const strategy of strategies) {
    const result = await strategy();
    if (result.products && result.products.length) {
      return { ...result, strategyUsed: result.strategyUsed || "authenticated-search" };
    }
    if (result.error) {
      lastError = result.error;
      lastStatus = result.statusHttp || lastStatus;
    }
    if (result.error && !String(result.error).includes("TOKEN_MISSING") && !String(result.error).includes("TOKEN_EXPIRED")) {
      continue;
    }
  }

  const demo = mapDemoProducts(query, readJson(demoPath, []));
  const products = demo.map((item) => normalizeProduct({ ...item, permalink: item.permalink || item.url }, "demo"));
  return {
    products,
    dataMode: "demo",
    strategyUsed: "demo",
    statusHttp: lastError ? lastStatus : 200,
    error: products.length ? (lastError || "") : "DEMO_EMPTY",
    tokenState: tokenState(),
    rawCount: products.length,
    returnedCount: products.length,
    firstFive: products.slice(0, 5).map((item) => ({
      title: item.title,
      price: item.price,
      permalink: item.permalink,
      image: item.image,
    })),
  };
}

function getDiagnostics() {
  return {
    configured: hasConfiguration(),
    hasClientId: Boolean(getClientId()),
    hasClientSecret: Boolean(getClientSecret()),
    hasRedirectUri: Boolean(getRedirectUri()),
    hasAccessToken: Boolean(getStoredToken()),
    hasRefreshToken: Boolean(getRefreshToken() || readOAuth()?.refresh_token),
    tokenState: tokenState(),
  };
}

export default {
  searchProducts: getProductByQuery,
  getProduct,
  getProductImage,
  getPermalink,
  normalizeProduct,
  detectError,
  getDiagnostics,
  getTokenState: tokenState,
  hasConfiguration,
  isMercadoLivreItemId,
  extractMercadoLivreItemId,
};
