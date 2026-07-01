import fs from "node:fs";
import path from "node:path";
import BudgetEngine from "../src/engines/BudgetEngine.js";
import ScoreEngine from "../src/engines/ScoreEngine.js";
import RankingEngine from "../src/engines/RankingEngine.js";
import RiskEngine from "../src/engines/RiskEngine.js";
import ExplanationEngine from "../src/engines/ExplanationEngine.js";
import CsvFeedProvider from "../src/feed/providers/CsvFeedProvider.js";
import MiShopFeedProvider from "../src/feed/providers/MiShopFeedProvider.js";
import { SaldaoInformaticaFeedProvider } from "../src/providers/SaldaoInformaticaFeedProvider.js";
import { MercadoLivreProvider } from "../src/providers/MercadoLivreProvider.js";
import { AwinFeedProvider } from "../src/providers/AwinFeedProvider.js";
import { ActionpayFeedProvider } from "../src/providers/ActionpayFeedProvider.js";
import { ActionpayProvider } from "../src/providers/ActionpayProvider.js";
import { ActionpayYmlImporter } from "../src/importers/ActionpayYmlImporter.js";
import CatalogManager from "../src/catalog/CatalogManager.js";
import { GoogleMerchantProductsAdapter } from "../src/adapters/GoogleMerchantProductsAdapter.js";
import { buildHomeCatalogData } from "../src/runtime/home-data.js";
import { projectRoot, resolveProjectPath } from "../src/runtime/project-root.js";
import { resolveCatalogSeedPath, getCatalogSeedCandidates } from "../src/runtime/catalog-path.js";

const root = projectRoot;
const bundledPublicDir = resolveProjectPath("api", "static");
const publicDir = fs.existsSync(bundledPublicDir) ? bundledPublicDir : resolveProjectPath("public");
const oauthPath = resolveProjectPath("data", "mercadolivre-oauth.json");
const productsPath = resolveProjectPath("data", "products.json");
const mercadolivreDemoPath = resolveProjectPath("data", "mercadolivre-demo-products.json");
const mlLinksPath = resolveProjectPath("data", "mercadolivre-links.json");
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
let catalogManagerInstance = null;
function getCatalogManager() {
  if (!catalogManagerInstance) {
    catalogManagerInstance = new CatalogManager({
      seedPath: process.env.ACTIONPAY_CATALOG_SEED_PATH || process.env.AWIN_CATALOG_SEED_PATH || process.env.CATALOG_SEED_PATH || resolveCatalogSeedPath(resolveProjectPath("data", "products.seed.json")),
    });
  }
  return catalogManagerInstance;
}
let googleMerchantAdapter = null;
function getGoogleMerchantAdapter() {
  if (!googleMerchantAdapter) {
    googleMerchantAdapter = new GoogleMerchantProductsAdapter({ catalogManager: getCatalogManager() });
  }
  return googleMerchantAdapter;
}
let awinFeedProvider = null;
function getAwinFeedProvider() {
  if (!awinFeedProvider) {
    awinFeedProvider = new AwinFeedProvider({ catalogManager: getCatalogManager() });
  }
  return awinFeedProvider;
}
let actionpayFeedProvider = null;
let actionpayProvider = null;
let actionpayYmlImporter = null;
let mercadoLivreProviderInstance = null;
function createFeedProvider(providerName = "mi_shop", options = {}) {
  const name = String(providerName || "").trim().toLowerCase();
  const baseOptions = {
    catalogManager: getCatalogManager(),
    seedPath: options.seedPath || resolveCatalogSeedPath(resolveProjectPath("data", "products.seed.json")),
    fetchImpl: options.fetchImpl || globalThis.fetch,
  };
  if (name === "mi_shop") {
    return new MiShopFeedProvider({
      ...baseOptions,
      ...options,
    });
  }
  if (name === "csv") {
    return new CsvFeedProvider({
      ...baseOptions,
      ...options,
    });
  }
  if (name === "actionpay") {
    if (!actionpayFeedProvider) {
      actionpayFeedProvider = new ActionpayFeedProvider({
        provider: createActionpayProvider(),
        catalogManager: getCatalogManager(),
        importer: createActionpayImporter(),
      });
    }
    return actionpayFeedProvider;
  }
  if (name === "awin") {
    return getAwinFeedProvider();
  }
  if (name === "saldao_informatica" || name === "saldao") {
    return new SaldaoInformaticaFeedProvider({
      ...baseOptions,
      networkName: "saldao_informatica",
      feedPath: options.feedPath || process.env.SALDAO_FEED_PATH || resolveProjectPath("data", "saldao-feed.xml"),
      sourceName: options.sourceName || "Saldão da Informática",
    });
  }
  return null;
}

function getFeedProviderNames() {
  return ["saldao_informatica", "mi_shop", "csv", "actionpay", "awin"];
}

function createActionpayProvider() {
  if (!actionpayProvider) {
    actionpayProvider = new ActionpayProvider({
      apiKey: process.env.ACTIONPAY_API_KEY || "",
      sourceId: process.env.ACTIONPAY_SOURCE_ID || "",
      defaultSubId: process.env.ACTIONPAY_DEFAULT_SUBID || "oqc",
      saldaoOfferId: process.env.ACTIONPAY_SALDAO_OFFER_ID || "13241",
    });
  }
  return actionpayProvider;
}

function createActionpayImporter() {
  if (!actionpayYmlImporter) {
    actionpayYmlImporter = new ActionpayYmlImporter({
      provider: createActionpayProvider(),
      catalogManager: getCatalogManager(),
      catalogSeedPath: process.env.ACTIONPAY_CATALOG_SEED_PATH || resolveCatalogSeedPath(resolveProjectPath("data", "products.seed.json")),
      sourceOfferId: process.env.ACTIONPAY_SALDAO_OFFER_ID || "13241",
      sourceOfferName: "Saldão da Informática - Notebooks, iPhones e TVs.",
    });
  }
  return actionpayYmlImporter;
}

function getMercadoLivreProvider() {
  if (!mercadoLivreProviderInstance) {
    mercadoLivreProviderInstance = new MercadoLivreProvider();
  }
  return mercadoLivreProviderInstance;
}

function getFeedProviderInstance(providerName = "mi_shop", options = {}) {
  const name = String(providerName || "").trim().toLowerCase();
  const baseOptions = {
    catalogManager: getCatalogManager(),
    seedPath: options.seedPath || resolveCatalogSeedPath(resolveProjectPath("data", "products.seed.json")),
    fetchImpl: options.fetchImpl || globalThis.fetch,
  };
  if (name === "mi_shop") {
    return new MiShopFeedProvider({ ...baseOptions, ...options });
  }
  if (name === "csv") {
    return new CsvFeedProvider({ ...baseOptions, ...options });
  }
  if (name === "actionpay") {
    if (!actionpayFeedProvider) {
      actionpayFeedProvider = new ActionpayFeedProvider({
        provider: createActionpayProvider(),
        catalogManager: getCatalogManager(),
        importer: createActionpayImporter(),
      });
    }
    return actionpayFeedProvider;
  }
  if (name === "awin") {
    return getAwinFeedProvider();
  }
  if (name === "saldao_informatica" || name === "saldao") {
    return new SaldaoInformaticaFeedProvider({
      ...baseOptions,
      networkName: "saldao_informatica",
      feedPath: options.feedPath || process.env.SALDAO_FEED_PATH || resolveProjectPath("data", "saldao-feed.xml"),
      sourceName: options.sourceName || "Saldão da Informática",
    });
  }
  return null;
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function getFeedProviderStatus(providerName = "") {
  const name = String(providerName || "").trim().toLowerCase();
  const provider = getFeedProviderInstance(name, { fetchImpl: globalThis.fetch });
  if (!provider) {
    return {
      provider: name,
      configured: false,
      lastSync: null,
      productCount: 0,
      updated: 0,
      errors: ["Provider não suportado."],
    };
  }
  const diagnostics = typeof provider.getDiagnostics === "function"
    ? provider.getDiagnostics()
    : typeof provider.getStatus === "function"
      ? provider.getStatus()
      : {};
  const catalogCount = provider?.getCatalogManager?.()
    ? provider.getCatalogManager().list().filter((item) => {
      const marketplace = String(item.marketplace || item.sourceType || item.source || "").toLowerCase();
      const seller = String(item.seller || item.store || "").toLowerCase();
      if (name === "mi_shop") return marketplace === "mi_shop";
      if (name === "csv") return marketplace === "csv" || marketplace === "csv_feed";
      if (name === "actionpay") return marketplace === "actionpay";
      if (name === "awin") return marketplace === "awin";
      if (name === "saldao_informatica" || name === "saldao") {
        return marketplace === "saldao_informatica" || marketplace === "actionpay_saldao" || seller.includes("saldao");
      }
      return false;
    }).length
    : 0;
  const productCount = typeof diagnostics.totalProducts === "number"
    ? diagnostics.totalProducts
    : typeof diagnostics.count === "number"
      ? diagnostics.count
      : Array.isArray(diagnostics.products)
        ? diagnostics.products.length
        : catalogCount;
  return {
    provider: name,
    configured: Boolean(diagnostics.configured),
    lastSync: diagnostics.lastImport || diagnostics.lastSync || null,
    productCount,
    updated: diagnostics.updated || 0,
    errors: Array.isArray(diagnostics.errors) ? diagnostics.errors : [],
  };
}

function send(res, status, body, headers = {}) {
  res.statusCode = status;
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(body);
}

function sendJson(res, status, data) {
  send(res, status, JSON.stringify(data), {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
}

function headersToObject(headers) {
  const output = {};
  for (const [key, value] of headers.entries()) {
    output[key] = value;
  }
  return output;
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
  }[ext] || "application/octet-stream";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safeJoin(base, target) {
  const normalized = path.normalize(target).replace(/^(\.\.[/\\])+/, "");
  return path.join(base, normalized);
}

function hasToken() {
  const data = readJson(oauthPath, null);
  return Boolean(data && data.access_token);
}

function readProducts() {
  return readJson(productsPath, []);
}

function readMercadoLivreDemoProducts() {
  return readJson(mercadolivreDemoPath, []);
}

function readMercadoLivreLinks() {
  return readJson(mlLinksPath, []);
}

function safeStat(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      size: stats.size,
    };
  } catch {
    return {
      exists: false,
      size: 0,
    };
  }
}

function describeCatalogSeedSource(seedPathResolved, seedFileExists, catalogCount) {
  const normalized = String(seedPathResolved || "");
  if (normalized.includes("src/data/products.seed.json")) return "src/data/products.seed.json";
  if (normalized.includes("public/data/products.seed.json")) return "public/data/products.seed.json";
  if (normalized.includes("data/products.seed.json")) return "data/products.seed.json";
  return seedFileExists ? "data/products.seed.json" : "fallback";
}

function getCatalogHealthSnapshot() {
  try {
    const items = getCatalogManager().list();
    const sample = items.slice(0, 3).map((item) => ({
      id: item?.id || "",
      title: item?.title || "",
      price: Number(item?.price || 0),
      marketplace: item?.marketplace || "",
      dataMode: item?.dataMode || "",
    }));
    const schemaErrors = items.flatMap((item, index) => {
      const issues = [];
      if (!item?.title) issues.push(`item[${index}] missing title`);
      if (!item?.category) issues.push(`item[${index}] missing category`);
      if (!Number.isFinite(Number(item?.price || 0)) || Number(item?.price || 0) <= 0) issues.push(`item[${index}] invalid price`);
      return issues;
    }).slice(0, 10);
    return {
      catalogLoaded: true,
      catalogCount: items.length,
      sample,
      schemaErrors,
      error: "",
    };
  } catch (error) {
    return {
      catalogLoaded: false,
      catalogCount: 0,
      sample: [],
      schemaErrors: [],
      error: error?.message || "CATALOG_HEALTH_ERROR",
    };
  }
}

function getFrontendHealthSnapshot() {
  const indexPath = resolveProjectPath("public", "index.html");
  const appPath = resolveProjectPath("public", "app.js");
  const cssPath = resolveProjectPath("public", "styles.css");
  const indexFound = fs.existsSync(indexPath);
  const appFound = fs.existsSync(appPath);
  const cssFound = fs.existsSync(cssPath);
  const errors = [];
  if (!indexFound) errors.push("public/index.html ausente");
  if (!appFound) errors.push("public/app.js ausente");
  if (!cssFound) errors.push("public/styles.css ausente");
  return {
    indexFound,
    appFound,
    cssFound,
    mainLoaded: indexFound && appFound && cssFound,
    buildVersion: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_BUILD_ID || process.env.GIT_COMMIT || "local",
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "local",
    errors,
  };
}

function buildMercadoLivreSearchUrl(product) {
  const query = String(product || "").trim().toLowerCase();
  if (!query) return "";
  const slug = query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `https://lista.mercadolivre.com.br/${slug}`;
}

function getBuildMarker() {
  return {
    ok: true,
    buildCommit: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
    buildTime: process.env.VERCEL_DEPLOYMENT_CREATED_AT || new Date().toISOString(),
    apiVersion: "health-minimal-002",
  };
}

function isGenericMercadoLivreUrl(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || normalized === "https://www.mercadolivre.com.br" || normalized === "https://mercadolivre.com.br" || normalized === "https://www.mercadolivre.com.br/" || normalized === "https://mercadolivre.com.br/";
}

function readMercadoLivreToken() {
  return readJson(oauthPath, null);
}

async function fetchMercadoLivreSearch(query, limit = 12) {
  const q = String(query || "").trim();
  if (!q) return [];
  const endpoint = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=${limit}`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": "OQueCabe-MVP/1.0",
    },
  });
  if (!response.ok) {
    const error = new Error(`Mercado Livre search HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  return Array.isArray(data?.results) ? data.results : [];
}

async function fetchMercadoLivreSearchDiagnostics(query, limit = 12, token = "") {
  const q = String(query || "").trim();
  if (!q) {
    return {
      endpoint: "",
      statusHttp: 400,
      error: "Query vazia.",
      rawCount: 0,
      returnedCount: 0,
      firstFive: [],
      headers: {},
      usedToken: Boolean(token),
    };
  }
  const endpoint = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=${limit}`;
  const headers = {
    Accept: "application/json, text/plain, */*",
    "User-Agent": "OQueCabe-MVP/1.0",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(endpoint, { headers, redirect: "follow" });
  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text().catch(() => "");
  let body = rawBody;
  if (contentType.includes("application/json")) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = rawBody;
    }
  }
  const results = Array.isArray(body?.results) ? body.results : [];
  return {
    endpoint,
    statusHttp: response.status,
    headers: headersToObject(response.headers),
    rawCount: results.length,
    returnedCount: results.length,
    firstFive: results.slice(0, 5).map((item) => ({
      title: item?.title || "",
      price: item?.price ?? null,
      permalink: item?.permalink || "",
      image: item?.thumbnail || (Array.isArray(item?.pictures) && item.pictures[0]?.url) || "",
    })),
    error: response.ok ? "" : (body?.message || body?.error || body?.status || rawBody || `HTTP ${response.status}`),
    usedToken: Boolean(token),
  };
}

function normalizeSource(source) {
  const value = String(source || "mercadolivre").toLowerCase();
  if (value === "amazon") return "amazon";
  if (value === "magalu") return "magalu";
  if (value === "demo") return "demo";
  return "mercadolivre";
}

function scoreDemoProduct(product, budgetTotal) {
  let score = 100;
  if (!product.rating) score -= 10;
  if (product.rating && product.rating < 4) score -= 15;
  if (!product.image) score -= 10;
  if (!product.description || product.description.trim().length < 40) score -= 5;
  if (product.price_brl > budgetTotal) score -= 30;
  return Math.max(0, Math.min(100, score));
}

function classifyFit(price, monthlyBudget, months, mode = "monthly", totalBudget = 0) {
  const context = BudgetEngine.buildBudgetContext({ mode, monthly: monthlyBudget, months, totalBudget });
  return BudgetEngine.classifyBudgetFit(price, context);
}

function normalizeDemoProducts(products, monthlyBudget, months, query, source) {
  const q = String(query || "").trim().toLowerCase();
  const categoryRules = {
    celular: {
      include: ["celular", "smartphone", "galaxy", "moto", "redmi", "iphone"],
      exclude: ["air fryer", "câmera", "camera", "notebook", "tablet", "casa"],
    },
    tv: {
      include: ["tv", "televisao", "televis?o", "smart tv", "smarttv", "oled", "qled", "roku"],
      exclude: ["celular", "smartphone", "notebook", "tablet", "casa", "presente"],
    },
    relogio: {
      include: ["relógio", "relogio", "smartwatch", "watch", "pulseira inteligente"],
      exclude: ["celular", "smartphone", "notebook", "tablet", "casa", "presente"],
    },
    notebook: {
      include: ["notebook", "laptop", "ultrabook", "ideapad", "thinkpad"],
      exclude: ["celular", "smartphone", "tablet", "casa", "presente"],
    },
    tablet: {
      include: ["tablet", "tab", "ipad", "galaxy tab"],
      exclude: ["celular", "smartphone", "notebook", "casa", "presente"],
    },
    casa: {
      include: ["casa", "air fryer", "fritadeira", "aspirador", "cozinha"],
      exclude: ["celular", "smartphone", "notebook", "tablet"],
    },
    presente: {
      include: ["presente", "kit", "caneca", "bloco", "acessório", "acessorio"],
      exclude: ["celular", "smartphone", "notebook", "tablet"],
    },
  };
  const rule = categoryRules[q] || null;
  const normalized = products
    .filter((product) => {
      if (!query) return true;
      const text = `${product.title} ${product.category || ""}`.toLowerCase();
      if (rule) {
        const hasInclude = rule.include.some((term) => text.includes(term));
        const hasExclude = rule.exclude.some((term) => text.includes(term));
        return hasInclude && !hasExclude;
      }
      if (source === "mercadolivre") {
        return text.includes(q) || ["celular", "notebook", "tablet", "casa", "presente"].includes(q);
      }
      if (source === "amazon") {
        return text.includes(q) || ["celular", "notebook", "tablet", "casa", "presente"].includes(q);
      }
      if (source === "magalu") {
        return text.includes(q) || ["celular", "notebook", "tablet", "casa", "presente"].includes(q);
      }
      return text.includes(q) || ["celular", "notebook", "tablet", "casa", "presente"].includes(q);
    })
    .map((product) => {
      const price_brl = Number(product.price || 0);
      const installmentValue = Number(product.installmentValue || (price_brl / (product.installments || months)));
      const status = classifyFit(price_brl, monthlyBudget, months);
      const isDemoSource = source === "demo";
      return {
        id: product.id,
        title: product.title,
        category: product.category,
        store: source === "amazon" ? "Amazon" : source === "magalu" ? "Magalu" : "Loja parceira",
        price: price_brl,
        image: product.image || "",
        rating: product.rating ?? null,
        description: product.riskNote || product.description || "",
        note: product.riskNote || "Dados de teste — preços simulados.",
        url: "",
        permalink: "",
        installments: product.installments || months,
        installmentValue,
        status,
        score: scoreDemoProduct({ ...product, price_brl }, monthlyBudget * months),
        relevance: relevanceScore(q, product),
        dataMode: "demo",
        source,
      };
    })
    .sort((a, b) => {
      const rank = { "CABE": 0, "APERTADO": 1, "NÃO CABE": 2 };
      const byRank = rank[a.status] - rank[b.status];
      if (byRank !== 0) return byRank;
      const byRelevance = (b.relevance || 0) - (a.relevance || 0);
      if (byRelevance !== 0) return byRelevance;
      return b.score - a.score;
    });

  const grouped = { "CABE": [], "APERTADO": [], "NÃO CABE": [] };
  for (const item of normalized) grouped[item.status].push(item);
  return [
    ...grouped["CABE"].slice(0, 8),
    ...grouped["APERTADO"].slice(0, 4),
    ...grouped["NÃO CABE"].slice(0, 3),
  ];
}

function buildOqcBudgetContext({ mode, monthly, months, totalBudget }) {
  return BudgetEngine.buildBudgetContext({ mode, monthly, months, totalBudget });
}

function enrichWithOqc(product, context, query) {
  const price = Number(product.price || 0);
  const budgetStatus = BudgetEngine.classifyBudgetFit(price, context);
  const scoreResult = ScoreEngine.evaluateProduct({
    ...product,
    title: product.title || "",
    price,
    seller: product.seller || {
      reputation: product.store || product.source || "",
      rating: product.storeRating ?? product.rating ?? null,
      sales: product.soldQuantity ?? product.availableQuantity ?? 0,
    },
    shippingCost: product.shippingCost ?? product.shipping_cost ?? 0,
    freeShipping: Boolean(product.freeShipping ?? product.free_shipping ?? false),
    deliveryDays: product.deliveryDays ?? product.delivery_days ?? 0,
    warrantyMonths: product.warrantyMonths ?? product.warranty_months ?? 0,
    brand: product.brand || "",
    reviewCount: product.reviewCount ?? product.reviewsCount ?? 0,
    soldQuantity: product.soldQuantity ?? 0,
    referencePrice: product.referencePrice ?? 0,
  }, context);

  return {
    ...product,
    budgetStatus,
    status: budgetStatus,
    score: scoreResult.score,
    scoreBreakdown: scoreResult.breakdown,
    scoreExplanation: scoreResult.explanation,
    searchTerm: query,
    productUrl: product.productUrl || product.permalink || product.url || "",
    permalink: product.permalink || product.productUrl || product.url || "",
  };
}

function attachFinancialInsights(product, context, query, rank = 0, siblings = []) {
  const risk = RiskEngine.evaluateRisk(product, context);
  const explanation = ExplanationEngine.buildExplanation(product, {
    budget: context,
    risk,
    rank,
    query,
    siblings,
    status: product.status || product.budgetStatus,
  });

  return {
    ...product,
    risk,
    explanation: explanation.text,
    explanationShort: explanation.shortText,
    explanationBullets: explanation.bullets,
    oqc: {
      ...(product.oqc || {}),
      riskLevel: risk.riskLevel,
      riskScore: risk.riskScore,
      riskReasons: risk.reasons,
      riskWarnings: risk.warnings,
      waitSimulation: risk.waitSimulation,
      explanation: explanation.text,
      explanationShort: explanation.shortText,
      explanationBullets: explanation.bullets,
    },
  };
}

function buildOqcResponse({ products, query, mode, monthly, months, totalBudget, dataMode }) {
  const budget = buildOqcBudgetContext({ mode, monthly, months, totalBudget });
  const enriched = products.map((product) => enrichWithOqc(product, budget, query));
  const ranked = RankingEngine.rankProducts(enriched, query);
  const productsWithInsights = (ranked.products || enriched).map((product, index, list) => attachFinancialInsights(product, budget, query, index, list));
  const recommendations = (ranked.recommended || []).map((item) => ({
    ...item,
    product: attachFinancialInsights(item.product || {}, budget, query, item.rank - 1, productsWithInsights),
  }));
  const groups = {
    ...ranked.groups,
    cabe: (ranked.groups?.cabe || []).map((item, index, list) => attachFinancialInsights(item, budget, query, index, list)),
    apertado: (ranked.groups?.apertado || []).map((item, index, list) => attachFinancialInsights(item, budget, query, index, list)),
    naoCabe: (ranked.groups?.naoCabe || []).map((item, index, list) => attachFinancialInsights(item, budget, query, index, list)),
  };
  return {
    query,
    mode,
    budget,
    dataMode,
    recommendations,
    groups,
    summary: ranked.summary,
    products: productsWithInsights,
  };
}

function buildFallbackRealResponse({ products, query, mode, monthly, months, totalBudget, dataMode }) {
  const budget = buildOqcBudgetContext({ mode, monthly, months, totalBudget });
  const enriched = products.map((product) => {
    const price = Number(product.price || 0);
    let scoreResult = { score: 0, breakdown: [], explanation: "" };
    try {
      scoreResult = ScoreEngine.evaluateProduct({
        ...product,
        title: product.title || "",
        price,
        seller: product.seller || {
          reputation: product.store || product.source || "",
          rating: product.storeRating ?? product.rating ?? null,
          sales: product.soldQuantity ?? product.availableQuantity ?? 0,
        },
        shippingCost: product.shippingCost ?? product.shipping_cost ?? 0,
        freeShipping: Boolean(product.freeShipping ?? product.free_shipping ?? false),
        deliveryDays: product.deliveryDays ?? product.delivery_days ?? 0,
        warrantyMonths: product.warrantyMonths ?? product.warranty_months ?? 0,
        brand: product.brand || "",
        reviewCount: product.reviewCount ?? product.reviewsCount ?? 0,
        soldQuantity: product.soldQuantity ?? 0,
        referencePrice: product.referencePrice ?? 0,
      }, budget);
    } catch {
      scoreResult = { score: 0, breakdown: [], explanation: "" };
    }

    const budgetStatus = BudgetEngine.classifyBudgetFit(price, budget);
    return {
      ...product,
      budgetStatus,
      status: budgetStatus,
      score: scoreResult.score,
      scoreBreakdown: scoreResult.breakdown,
      scoreExplanation: scoreResult.explanation,
      searchTerm: query,
      productUrl: product.productUrl || product.permalink || product.url || "",
      permalink: product.permalink || product.productUrl || product.url || "",
      oqc: {
        ...(product.oqc || {}),
        budgetStatus,
        budgetScore: budgetStatus === "CABE" ? 1 : budgetStatus === "APERTADO" ? 0.55 : 0.05,
        trustScore: 0,
        valueScore: 0,
        relevanceScore: 0,
        finalScore: scoreResult.score / 100,
        reasons: Array.isArray(scoreResult.breakdown) ? scoreResult.breakdown.map((item) => item?.reason).filter(Boolean) : [],
        warnings: [],
        badges: [budgetStatus === "CABE" ? "cabe" : budgetStatus === "APERTADO" ? "apertado" : "fora-do-orcamento", "real"],
      },
    };
  });
  const ordered = BudgetEngine.sortByBudgetPriority(enriched);
  const groups = BudgetEngine.groupBudgetPriority(enriched);
  const productsWithInsights = ordered.map((product, index, list) => attachFinancialInsights(product, budget, query, index, list));
  const recommended = ordered.slice(0, 3).map((product, index) => ({
    rank: index + 1,
    label: index === 0 ? (product.status === "CABE" ? "Melhor escolha" : "Melhor alternativa dentro do possivel") : index === 1 ? "Boa alternativa" : "Opcao economica",
    reason: `${product.status === "CABE" ? "Cabe no orcamento." : product.status === "APERTADO" ? "Cabe, mas esta apertado." : "Fica acima do orcamento."} Produto real do catalogo disponivel.`,
    product: {
      ...product,
      reason: `${product.status === "CABE" ? "Cabe no orcamento." : product.status === "APERTADO" ? "Cabe, mas esta apertado." : "Fica acima do orcamento."} Produto real do catalogo disponivel.`,
    },
  })).map((item, index) => ({
    ...item,
    product: attachFinancialInsights(item.product, budget, query, index, productsWithInsights),
  }));
  return {
    query,
    mode,
    budget,
    dataMode,
    recommendations: recommended,
    groups,
    summary: "Os resultados priorizam produtos reais do catalogo quando a pontuacao completa precisa de fallback.",
    products: productsWithInsights,
  };
}

function renderExplorerPage({ title, heading, description, view, badge, endpoint, inputLabel, inputPlaceholder, quickLabel, quickButtons }) {
  const buttons = quickButtons
    .map((item) => `<button type="button" data-query="${escapeHtml(item.query)}" data-monthly="${item.monthly || 100}" data-months="${item.months || 12}">${escapeHtml(item.label)}</button>`)
    .join("");

  return `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <meta name="theme-color" content="#091a35" />
      <link rel="stylesheet" href="/styles.css" />
      <link rel="icon" href="/favicon.png" type="image/png" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/logo-oqc.png" />
    </head>
    <body data-view="${escapeHtml(view)}" data-endpoint="${escapeHtml(endpoint)}">
      <header class="topbar">
        <a class="brand" href="/"><img class="brand-mark" src="/logo-oqc.png" alt="OQC" /><strong>O Que Cabe</strong></a>
        <div class="trust-pill">Curadoria de Confiança</div>
      </header>
      <main>
        <section class="hero">
          <div class="hero-copy">
            <h1>${escapeHtml(heading)}</h1>
            <p>${escapeHtml(description)}</p>
          </div>
          <form id="searchForm" class="search-card">
            <div class="mode-tabs" aria-label="Tipo de orçamento">
              <button class="active" type="button">Orçamento Mensal</button>
              <button type="button">Orçamento Total</button>
            </div>
            <div class="field field-product">
              <label for="productInput">${escapeHtml(inputLabel)}</label>
              <div class="input-icon">
                <svg viewBox="0 0 24 24"><path d="m21 21-5-5"/><circle cx="10" cy="10" r="7"/></svg>
                <input id="productInput" name="product" placeholder="${escapeHtml(inputPlaceholder)}" required />
              </div>
            </div>
            <div class="field">
              <label for="monthlyInput">Máx. mensal</label>
              <div class="money-input">
                <span>R$</span>
                <input id="monthlyInput" name="monthly" type="number" min="1" step="1" value="100" required />
              </div>
            </div>
            <div class="field">
              <label for="monthsInput">Prazo</label>
              <select id="monthsInput" name="months">
                <option value="3">3x</option>
                <option value="6">6x</option>
                <option value="10">10x</option>
                <option value="12" selected>12x</option>
                <option value="24">24x</option>
              </select>
            </div>
            <button class="submit-button" type="submit">Descobrir</button>
            <div class="quick-row">
              <span>${escapeHtml(quickLabel)}</span>
              ${buttons}
            </div>
          </form>
        </section>
        <section class="results-area">
          <div class="section-head">
            <div>
              <p class="panel-label">Seu teto estimado: <strong id="budgetTotal">R$ 1.200,00</strong> <span id="budgetLine">R$ 100,00 por mês em até 12x</span></p>
              <h2 id="summaryTitle">Faça uma busca para começar</h2>
            </div>
            <span class="source-badge" id="sourceBadge">${escapeHtml(badge)}</span>
          </div>
          <div class="notice" id="notice" hidden></div>
          <div class="grid" id="results">
            <article class="empty-state">
              <strong>Teste uma busca rápida</strong>
              <span>O resultado aparece aqui com parcela, total e botão de oferta.</span>
            </article>
          </div>
        </section>
      </main>
      <script src="/app.js"></script>
    </body>
  </html>`;
}

function renderHome() {
  try {
    return fs.readFileSync(path.join(publicDir, "index.html"), "utf8");
  } catch {
    return `<!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>O Que Cabe</title>
        <meta name="theme-color" content="#091a35" />
      </head>
      <body>
        <main style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;padding:32px;max-width:720px;margin:0 auto;">
          <h1>O Que Cabe</h1>
          <p>O site está iniciando em modo seguro. A interface completa será carregada assim que o arquivo principal estiver disponível.</p>
        </main>
      </body>
    </html>`;
  }
}

function renderProductPage() {
  return renderExplorerPage({
    title: "Teste Produtos | O Que Cabe",
    heading: "Teste produtos com DummyJSON.",
    description: "Busca de produtos de teste sem depender de marketplaces ao vivo.",
    view: "products",
    badge: "DummyJSON",
    endpoint: "/api/teste-produtos",
    inputLabel: "Produto",
    inputPlaceholder: "Ex: phone, laptop, shoes",
    quickLabel: "Experimente:",
    quickButtons: [
      { label: "Smartphone", query: "phone", monthly: 100, months: 12 },
      { label: "Notebook", query: "laptop", monthly: 200, months: 12 },
      { label: "Perfume", query: "perfume", monthly: 80, months: 12 },
    ],
  });
}

function renderTravelPage() {
  return renderExplorerPage({
    title: "Teste Viagens | O Que Cabe",
    heading: "Teste viagens com cards mockados.",
    description: "Simulação de destinos para preparar a futura vertical de viagens.",
    view: "travel",
    badge: "Viagem mock",
    endpoint: "/api/teste-viagens",
    inputLabel: "Destino",
    inputPlaceholder: "Ex: Rio de Janeiro",
    quickLabel: "Destinos:",
    quickButtons: [
      { label: "Rio", query: "Rio", monthly: 150, months: 12 },
      { label: "São Paulo", query: "São Paulo", monthly: 120, months: 12 },
      { label: "Salvador", query: "Salvador", monthly: 180, months: 12 },
    ],
  });
}

function renderMercadoLivrePage() {
  const connected = hasToken();
  return renderExplorerPage({
    title: "Mercado Livre Manual | O Que Cabe",
    heading: "Teste produtos reais do Mercado Livre.",
    description: "Cole uma URL ou digite uma categoria. O sistema busca o item real pela API do Mercado Livre.",
    view: "mercadolivre",
    badge: "Mercado Livre",
    endpoint: "/api/mercadolivre-item",
    inputLabel: "URL ou categoria",
    inputPlaceholder: "Cole a URL do produto ou digite celular",
    quickLabel: "Exemplos:",
    quickButtons: [
      { label: "Celular", query: "celular", monthly: 100, months: 10 },
      { label: "Notebook", query: "notebook", monthly: 200, months: 10 },
      { label: "Casa", query: "casa", monthly: 80, months: 10 },
    ],
  }).replace(
    '<div class="notice" id="notice" hidden></div>',
    connected
      ? '<div class="notice" id="notice">Digite ou cole uma URL do Mercado Livre. Também é possível testar por categoria. A busca roda com debounce.</div>'
      : '<div class="notice" id="notice">Conecte sua conta Mercado Livre para consultar produtos reais.</div>',
  );
}

function mercadolivreRedirectUri() {
  return process.env.MELI_REDIRECT_URI || "https://o-que-cabe.vercel.app/auth/mercadolivre/callback";
}

function mercadolivreAuthUrl() {
  const clientId = process.env.MELI_CLIENT_ID || "";
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: mercadolivreRedirectUri(),
  });
  return `https://auth.mercadolibre.com.br/authorization?${params.toString()}`;
}

function extractMercadoLivreItemId(url) {
  const value = String(url || "");
  const match = value.match(/(?:MLB[-]?)(\d{6,})/i);
  return match ? `MLB${match[1]}` : null;
}

function normalizeMercadoLivreItem(item, fallback = {}) {
  const picture = Array.isArray(item?.pictures) && item.pictures.length > 0 ? item.pictures[0]?.url || "" : "";
  return {
    id: item?.id || fallback.id || "",
    title: item?.title || fallback.title || "",
    price: item?.price ?? fallback.price ?? null,
    image: item?.thumbnail || picture || fallback.image || "",
    permalink: item?.permalink || fallback.permalink || "",
  };
}

function normalizeMercadoLivreSearchItem(item, monthly, months) {
  const normalized = normalizeMercadoLivreItem(item);
  const price = Number(normalized.price || 0);
  const monthlyPrice = months > 0 ? price / months : price;
  const status = monthlyPrice <= monthly ? "CABE" : monthlyPrice <= monthly * 1.2 ? "APERTADO" : "NÃO CABE";
  return {
    id: normalized.id,
    title: normalized.title,
    category: String(item?.category_id || item?.category || "").toLowerCase(),
    store: "Mercado Livre",
    source: "mercadolivre",
    price,
    image: normalized.image || "",
    thumbnail: normalized.image || "",
    permalink: normalized.permalink || "",
    productUrl: normalized.permalink || "",
    affiliateUrl: null,
    monthlyPrice,
    installments: months,
    installmentValue: monthlyPrice,
    status,
    score: 100,
    description: item?.title || "",
    condition: item?.condition || "",
    availableQuantity: item?.available_quantity ?? null,
    dataMode: "real",
  };
}

function renderCatalogPage(query = {}) {
  const items = getCatalogManager().search({
    q: query.q || "",
    category: query.category || "",
    brand: query.brand || "",
    marketplace: query.marketplace || "",
    status: query.status || "",
    minPrice: query.minPrice || 0,
    maxPrice: query.maxPrice || Infinity,
  });
  const rows = items.map((item) => `
    <tr>
      <td>${escapeHtml(item.title || "")}</td>
      <td>${escapeHtml(item.category || "")}</td>
      <td>${escapeHtml(item.marketplace || "")}</td>
      <td>${escapeHtml(String(item.price ?? ""))}</td>
      <td>${escapeHtml(item.updatedAt || item.lastCheckedAt || "")}</td>
      <td>${escapeHtml(item.status || "ACTIVE")}</td>
    </tr>
  `).join("");

  return `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Catálogo OQC</title>
      <link rel="stylesheet" href="/styles.css" />
    </head>
    <body>
      <header class="topbar">
        <a class="brand" href="/"><img class="brand-mark" src="/logo-oqc.png" alt="OQC" /><strong>Catálogo OQC</strong></a>
      </header>
      <main style="padding:24px;max-width:1200px;margin:0 auto;">
        <h1 style="margin:0 0 12px;">Catálogo interno</h1>
        <p style="margin:0 0 16px;">Produtos gerenciados pelo OQC. Importar, exportar, editar, desativar e excluir podem ser ligados depois sem mudar o motor.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
          <a class="submit-button" href="/api/catalog?action=export&format=json">Export JSON</a>
          <a class="submit-button" href="/api/catalog?action=export&format=csv">Export CSV</a>
          <button class="submit-button" type="button" disabled>Import</button>
          <button class="submit-button" type="button" disabled>Edit</button>
          <button class="submit-button" type="button" disabled>Disable</button>
          <button class="submit-button" type="button" disabled>Delete</button>
        </div>
        <form method="get" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:20px;">
          <input name="q" placeholder="Search" value="${escapeHtml(query.q || "")}" />
          <input name="category" placeholder="Category" value="${escapeHtml(query.category || "")}" />
          <input name="marketplace" placeholder="Marketplace" value="${escapeHtml(query.marketplace || "")}" />
          <input name="brand" placeholder="Brand" value="${escapeHtml(query.brand || "")}" />
          <input name="status" placeholder="Status" value="${escapeHtml(query.status || "")}" />
          <button class="submit-button" type="submit">Search</button>
        </form>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;">Product</th>
              <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;">Category</th>
              <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;">Marketplace</th>
              <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;">Price</th>
              <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;">Last Update</th>
              <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="6" style="padding:12px;">Nenhum produto encontrado.</td></tr>'}
          </tbody>
        </table>
      </main>
    </body>
  </html>`;
}

async function searchMercadoLivreWithDiagnostics(query, limit = 20) {
  const q = String(query || "").trim();
  if (!q) {
    return { rawCount: 0, returnedCount: 0, results: [], error: "" };
  }
  try {
    const results = await fetchMercadoLivreSearch(q, limit);
    return {
      rawCount: Array.isArray(results) ? results.length : 0,
      returnedCount: Array.isArray(results) ? results.length : 0,
      results: Array.isArray(results) ? results : [],
      error: "",
    };
  } catch (error) {
    return {
      rawCount: 0,
      returnedCount: 0,
      results: [],
      error: error?.message || "Erro na busca do Mercado Livre",
    };
  }
}

function relevanceScore(query, product) {
  const q = String(query || "").trim().toLowerCase();
  const text = `${product.title || ""} ${product.category || ""}`.toLowerCase();
  const termsByQuery = {
    celular: ["celular", "smartphone", "galaxy", "moto", "redmi", "iphone"],
    relogio: ["relógio", "relogio", "smartwatch", "watch", "pulseira inteligente"],
    notebook: ["notebook", "laptop", "ideapad", "vivobook", "aspire"],
    tablet: ["tablet", "ipad", "galaxy tab", "tab"],
    casa: ["casa", "air fryer", "fritadeira", "aspirador", "cozinha"],
    presente: ["presente", "kit", "caneca", "bloco", "acessório", "acessorio"],
  };
  const terms = termsByQuery[q] || [q];
  return terms.reduce((score, term) => score + (text.includes(term) ? 20 : 0), 0);
}

function buildMercadoLivreManualResult({ item, itemId, monthly, months }) {
  const price = Number(item?.price ?? 0);
  const monthlyPrice = months > 0 ? price / months : price;
  const status = monthlyPrice <= monthly ? "CABE" : monthlyPrice <= monthly * 1.2 ? "APERTADO" : "NÃO CABE";
  return {
    ok: true,
    mode: "mercadolivre",
    dataMode: item?.real ? "real" : "demo",
    products: [{
      id: item?.id || itemId,
      title: item?.title || item?.name || "Produto Mercado Livre",
      category: item?.category || "",
      store: "Mercado Livre",
      source: "mercadolivre",
      price,
      image: item?.image || item?.thumbnail || (Array.isArray(item?.pictures) && item.pictures[0]?.url) || "",
      url: item?.affiliateUrl || (isGenericMercadoLivreUrl(item?.url) ? buildMercadoLivreSearchUrl(item?.title || itemId) : item?.url) || item?.permalink || buildMercadoLivreSearchUrl(item?.title || itemId),
      productUrl: (isGenericMercadoLivreUrl(item?.permalink) ? buildMercadoLivreSearchUrl(item?.title || itemId) : item?.permalink) || item?.url || buildMercadoLivreSearchUrl(item?.title || itemId),
      affiliateUrl: item?.affiliateUrl || null,
      monthlyPrice,
      installments: months,
      installmentValue: monthlyPrice,
      status,
      score: 100,
      description: item?.description || "",
      condition: item?.condition || "new",
      availableQuantity: item?.availableQuantity ?? item?.available_quantity ?? null,
    }],
  };
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;
  const method = String(req.method || "GET").toUpperCase();

  if (pathname === "/api/health") {
    sendJson(res, 200, getBuildMarker());
    return;
  }

  if (pathname === "/") {
    send(res, 200, renderHome(), { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  if (pathname === "/app.js") {
    const filePath = path.join(publicDir, "app.js");
    if (fs.existsSync(filePath)) {
      send(res, 200, fs.readFileSync(filePath), { "Content-Type": contentType(filePath) });
      return;
    }
  }

  if (pathname === "/styles.css") {
    const filePath = path.join(publicDir, "styles.css");
    if (fs.existsSync(filePath)) {
      send(res, 200, fs.readFileSync(filePath), { "Content-Type": contentType(filePath) });
      return;
    }
  }

  if (pathname === "/api/search") {
    const q = url.searchParams.get("q") || "";
    const mode = (url.searchParams.get("mode") || "monthly").toLowerCase();
    const monthly = mode === "total" ? Number(url.searchParams.get("monthly") || "0") : Number(url.searchParams.get("monthly") || "50");
    const months = Number(url.searchParams.get("months") || "12");
    const totalBudget = mode === "total"
      ? Number(url.searchParams.get("totalBudget") || "0")
      : Number(url.searchParams.get("totalBudget") || (monthly * months));
    let providerResult = null;
    try {
      providerResult = await getMercadoLivreProvider().searchProducts(q, {
        limit: 20,
        mode,
        monthly,
        months,
        totalBudget,
      });
      const selectedProducts = Array.isArray(providerResult.products) ? providerResult.products : [];
      const dataMode = providerResult.dataMode || (providerResult.strategyUsed === "demo" ? "demo" : "real-authenticated");
      const response = buildOqcResponse({
        products: selectedProducts,
        query: q,
        mode,
        monthly,
        months,
        totalBudget,
        dataMode,
      });

      sendJson(res, 200, {
        ok: true,
        ...response,
        strategyUsed: providerResult.strategyUsed,
        tokenState: providerResult.tokenState,
        statusHttp: providerResult.statusHttp,
        returnedCount: providerResult.returnedCount,
        firstFive: providerResult.firstFive,
        warning: selectedProducts.length ? "" : "Não encontramos exemplo demonstrativo confiável para este orçamento.",
      });
    } catch (error) {
      let response = null;
      const providerProducts = Array.isArray(providerResult?.products) ? providerResult.products : [];
      if (providerProducts.length) {
        try {
          response = buildFallbackRealResponse({
            products: providerProducts,
            query: q,
            mode,
            monthly,
            months,
            totalBudget,
            dataMode: providerResult?.dataMode || "real",
          });
        } catch {
          response = null;
        }
      }
      if (!response) {
        const demoProducts = normalizeDemoProducts(readMercadoLivreDemoProducts(), monthly, months, q, "mercadolivre").map((item) => ({
          ...item,
          dataMode: "demo",
        }));
        response = buildOqcResponse({
          products: demoProducts,
          query: q,
          mode,
          monthly,
          months,
          totalBudget,
          dataMode: "demo",
        });
      }
      sendJson(res, 200, {
        ok: true,
        ...response,
        warning: providerProducts.length
          ? `${error.message || "Falha na integração com a base parceira"}. Mostrando resultados reais com fallback de ranking por enquanto.`
          : `${error.message || "Falha na integração com a base parceira"}. Mostrando demonstração por enquanto.`,
      });
    }
    return;
  }
  if (pathname === "/api/feed/status") {
    const providers = getFeedProviderNames().map((name) => getFeedProviderStatus(name));
    sendJson(res, 200, {
      ok: true,
      providers,
      totalProducts: providers.reduce((sum, item) => sum + Number(item.productCount || 0), 0),
      lastSync: providers.reduce((latest, item) => {
        if (!item.lastSync) return latest;
        if (!latest) return item.lastSync;
        return String(item.lastSync) > String(latest) ? item.lastSync : latest;
      }, null),
    });
    return;
  }

  if (pathname === "/api/feed/providers") {
    sendJson(res, 200, {
      ok: true,
      providers: getFeedProviderNames(),
    });
    return;
  }

  if (pathname === "/api/health") {
    const seedPathResolved = resolveCatalogSeedPath(resolveProjectPath("data", "products.seed.json"));
    const catalogHealth = getCatalogHealthSnapshot();
    const seedFile = safeStat(seedPathResolved);
    const sourceUsed = describeCatalogSeedSource(seedPathResolved, seedFile.exists, catalogHealth.catalogCount);
    sendJson(res, 200, {
      ok: true,
      runtime: `node ${process.versions.node}`,
      catalogLoaded: catalogHealth.catalogLoaded,
      catalogCount: catalogHealth.catalogCount,
      seedFileExists: seedFile.exists,
      seedFileSize: seedFile.size,
      resolvedSeedPath: seedPathResolved,
      sourceUsed,
      error: catalogHealth.error || "",
    });
    return;
  }

  if (pathname === "/api/catalog/health") {
    const seedPathResolved = resolveCatalogSeedPath(resolveProjectPath("data", "products.seed.json"));
    const catalogHealth = getCatalogHealthSnapshot();
    const seedFile = safeStat(seedPathResolved);
    const sourceUsed = describeCatalogSeedSource(seedPathResolved, seedFile.exists, catalogHealth.catalogCount);
    sendJson(res, 200, {
      ok: true,
      runtime: `node ${process.versions.node}`,
      seedFileExists: seedFile.exists,
      seedFileSize: seedFile.size,
      resolvedSeedPath: seedPathResolved,
      sourceUsed,
      ...catalogHealth,
    });
    return;
  }

  if (pathname === "/api/frontend-health") {
    sendJson(res, 200, {
      ok: true,
      ...getFrontendHealthSnapshot(),
    });
    return;
  }

  if (pathname === "/api/home-data") {
    sendJson(res, 200, buildHomeCatalogData());
    return;
  }

  if (pathname === "/api/feed/import" || pathname.startsWith("/api/feed/import/")) {
    if (method !== "POST") {
      sendJson(res, 405, { ok: false, message: "Use POST para importar feeds." });
      return;
    }
    const providerName = pathname.startsWith("/api/feed/import/")
      ? String(pathname.split("/").pop() || "").trim().toLowerCase()
      : String(url.searchParams.get("provider") || "mi_shop").trim().toLowerCase();
    const feedProvider = createFeedProvider(providerName, {
      fetchImpl: globalThis.fetch,
    });
    if (!feedProvider) {
      sendJson(res, 400, {
        ok: false,
        provider: providerName,
        message: "Provider de feed nao suportado.",
        providers: getFeedProviderNames(),
      });
      return;
    }
    try {
      const source = url.searchParams.get("feedPath")
        || url.searchParams.get("feedUrl")
        || "";
      const result = await feedProvider.import(source, {
        mode: url.searchParams.get("mode") || "merge",
        format: url.searchParams.get("format") || "",
        feedText: url.searchParams.get("feedText") || "",
        offerId: url.searchParams.get("offerId") || "",
        sourceId: url.searchParams.get("sourceId") || "",
        subId1: url.searchParams.get("subId1") || "",
      });
      sendJson(res, 200, {
        ok: true,
        provider: providerName,
        imported: result.imported || 0,
        updated: result.updated || 0,
        duplicates: result.duplicates || 0,
        rejected: result.rejected || 0,
        errors: result.errors || [],
      });
    } catch (error) {
      sendJson(res, 200, {
        ok: false,
        provider: providerName,
        imported: 0,
        updated: 0,
        duplicates: 0,
        rejected: 0,
        errors: [error.message || "Erro ao importar feed."],
      });
    }
    return;
  }
  if (pathname === "/api/ml-connector-test") {
    const q = url.searchParams.get("q") || "";
    const mode = (url.searchParams.get("mode") || "monthly").toLowerCase();
    const monthly = mode === "total" ? Number(url.searchParams.get("monthly") || "0") : Number(url.searchParams.get("monthly") || "50");
    const months = Number(url.searchParams.get("months") || "12");
    const totalBudget = mode === "total"
      ? Number(url.searchParams.get("totalBudget") || "0")
      : Number(url.searchParams.get("totalBudget") || (monthly * months));
    const result = await getMercadoLivreProvider().searchProducts(q, { limit: 20, mode, monthly, months, totalBudget });
    sendJson(res, result.statusHttp || 200, {
      configured: getMercadoLivreProvider().getDiagnostics ? getMercadoLivreProvider().getDiagnostics().configured : true,
      tokenState: result.tokenState || (getMercadoLivreProvider().getDiagnostics ? getMercadoLivreProvider().getDiagnostics().tokenState : "available"),
      strategyUsed: result.strategyUsed || "",
      statusHttp: result.statusHttp || 200,
      returnedCount: result.returnedCount || 0,
      firstFive: result.firstFive || [],
      error: result.error || "",
    });
    return;
  }

  if (pathname === "/api/teste-produtos") {
    const q = url.searchParams.get("q") || "";
    const mode = (url.searchParams.get("mode") || "monthly").toLowerCase();
    const monthly = mode === "total" ? Number(url.searchParams.get("monthly") || "0") : Number(url.searchParams.get("monthly") || "50");
    const months = Number(url.searchParams.get("months") || "12");
    const totalBudget = mode === "total"
      ? Number(url.searchParams.get("totalBudget") || "0")
      : Number(url.searchParams.get("totalBudget") || (monthly * months));
    const classifyByMode = mode === "total"
      ? (price) => {
        if (price <= totalBudget) return "CABE";
        if (price <= totalBudget * 1.2) return "APERTADO";
        return "NÃO CABE";
      }
      : (price) => {
        const installment = price / months;
        if (installment <= monthly) return "CABE";
        if (installment <= monthly * 1.2) return "APERTADO";
        return "NÃO CABE";
      };
    const products = normalizeDemoProducts(readMercadoLivreDemoProducts(), monthly, months, q, "mercadolivre").map((item) => ({
      ...item,
      status: classifyByMode(item.price || 0),
      dataMode: "demo",
    })).sort((a, b) => {
      const rank = { "CABE": 0, "APERTADO": 1, "NÃO CABE": 2 };
      const byRank = rank[a.status] - rank[b.status];
      if (byRank !== 0) return byRank;
      return (b.score || 0) - (a.score || 0);
    });
    sendJson(res, 200, {
      ok: true,
      mode,
      products,
      totalBudget,
      warning: products.length ? "" : "Nenhum produto encontrado dentro desse orçamento. Tente aumentar o valor mensal ou o orçamento total.",
    });
    return;
  }

  if (pathname === "/api/ml-search-test") {
    const q = url.searchParams.get("q") || "";
    const mode = (url.searchParams.get("mode") || "monthly").toLowerCase();
    const monthly = Number(url.searchParams.get("monthly") || "50");
    const months = Number(url.searchParams.get("months") || "12");
    const totalBudget = Number(url.searchParams.get("totalBudget") || (monthly * months));
    const classifyByMode = mode === "total"
      ? (price) => {
        if (price <= totalBudget) return "CABE";
        if (price <= totalBudget * 1.2) return "APERTADO";
        return "NÃO CABE";
      }
      : (price) => {
        const installment = price / months;
        if (installment <= monthly) return "CABE";
        if (installment <= monthly * 1.2) return "APERTADO";
        return "NÃO CABE";
      };
    const realSearch = await searchMercadoLivreWithDiagnostics(q, 20);
    const realProducts = realSearch.results
      .map((item) => {
        const normalized = normalizeMercadoLivreSearchItem(item, monthly, months);
        return {
          ...normalized,
          status: classifyByMode(normalized.price || 0),
          monthlyPrice: normalized.price / months,
          installmentValue: normalized.price / months,
          dataMode: "real",
        };
      })
      .filter((item) => item.title);
    const demoProducts = normalizeDemoProducts(readMercadoLivreDemoProducts(), monthly, months, q, "mercadolivre").map((item) => ({
      ...item,
      status: classifyByMode(item.price || 0),
      dataMode: "demo",
    }));
    const products = realProducts.length ? realProducts : demoProducts;
    const dataMode = realProducts.length ? "real" : "demo";
    sendJson(res, 200, {
      configured: Boolean(process.env.MELI_CLIENT_ID && process.env.MELI_CLIENT_SECRET && process.env.MELI_REDIRECT_URI),
      authenticated: hasToken(),
      dataMode,
      statusHttp: realSearch.error ? 502 : 200,
      mode,
      rawCount: realSearch.rawCount,
      returnedCount: products.length,
      error: realSearch.error || "",
      firstFive: products.slice(0, 5).map((item) => ({
        title: item.title,
        price: item.price,
        permalink: item.permalink || item.productUrl || item.url || "",
        image: item.image || item.thumbnail || "",
      })),
      sample: products.slice(0, 3),
    });
    return;
  }

  if (pathname === "/api/ml-public-search-test") {
    const q = url.searchParams.get("q") || "";
    const token = readMercadoLivreToken()?.access_token || "";
    try {
      const diagnostic = await fetchMercadoLivreSearchDiagnostics(q, 20, token);
      sendJson(res, diagnostic.statusHttp || 200, {
        ok: !diagnostic.error,
        configured: Boolean(process.env.MELI_CLIENT_ID && process.env.MELI_CLIENT_SECRET && process.env.MELI_REDIRECT_URI),
        authenticated: Boolean(token),
        endpoint: diagnostic.endpoint,
        statusHttp: diagnostic.statusHttp,
        rawCount: diagnostic.rawCount,
        returnedCount: diagnostic.returnedCount,
        firstFive: diagnostic.firstFive,
        error: diagnostic.error,
        headers: diagnostic.headers,
        calledFrom: "backend",
        cors: "not-applicable-backend-to-backend",
        userAgent: "OQueCabe-MVP/1.0",
        tokenState: token ? "present" : "absent",
      });
    } catch (error) {
      sendJson(res, 502, {
        ok: false,
        configured: Boolean(process.env.MELI_CLIENT_ID && process.env.MELI_CLIENT_SECRET && process.env.MELI_REDIRECT_URI),
        authenticated: Boolean(token),
        endpoint: `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=20`,
        statusHttp: 502,
        rawCount: 0,
        returnedCount: 0,
        firstFive: [],
        error: error?.message || "Erro ao consultar Mercado Livre.",
        headers: {},
        calledFrom: "backend",
        cors: "not-applicable-backend-to-backend",
        userAgent: "OQueCabe-MVP/1.0",
        tokenState: token ? "present" : "absent",
      });
    }
    return;
  }

  if (pathname === "/api/ml-auth-status") {
    sendJson(res, 200, {
      configured: Boolean(process.env.MELI_CLIENT_ID && process.env.MELI_CLIENT_SECRET && process.env.MELI_REDIRECT_URI),
      authenticated: hasToken(),
      token_expired: false,
      redirectUri: mercadolivreRedirectUri(),
      hasClientId: Boolean(process.env.MELI_CLIENT_ID),
      hasClientSecret: Boolean(process.env.MELI_CLIENT_SECRET),
    });
    return;
  }

  if (pathname === "/api/google-merchant/status") {
    const diagnostics = getGoogleMerchantAdapter().getDiagnostics();
    sendJson(res, 200, {
      hasAccountId: diagnostics.hasAccountId,
      hasAccessToken: diagnostics.hasAccessToken,
      configured: diagnostics.configured,
    });
    return;
  }

  if (pathname === "/api/google-merchant/import") {
    if (method !== "POST") {
      sendJson(res, 405, { ok: false, message: "Use POST para importar produtos do Google Merchant." });
      return;
    }
    if (!getGoogleMerchantAdapter().configured()) {
      sendJson(res, 400, {
        ok: false,
        message: "Google Merchant não configurado.",
        configured: false,
        hasAccountId: getGoogleMerchantAdapter().getDiagnostics().hasAccountId,
        hasAccessToken: getGoogleMerchantAdapter().getDiagnostics().hasAccessToken,
      });
      return;
    }
    const result = await getGoogleMerchantAdapter().importToCatalog({
      pageSize: Number(url.searchParams.get("pageSize") || "250"),
      pageToken: url.searchParams.get("pageToken") || "",
      mode: url.searchParams.get("mode") || "merge",
    });
    sendJson(res, result.statusHttp || 200, {
      ok: true,
      ...result,
    });
    return;
  }

  if (pathname === "/api/awin/status") {
    const diagnostics = getAwinFeedProvider().getDiagnostics();
    sendJson(res, 200, {
      configured: diagnostics.configured,
      feedAvailable: diagnostics.feedAvailable,
      advertisers: diagnostics.advertisers || [],
      lastImport: diagnostics.lastImport,
      totalProducts: diagnostics.totalProducts ?? diagnostics.productCount ?? 0,
    });
    return;
  }

  if (pathname === "/api/awin/import") {
    if (method !== "POST") {
      sendJson(res, 405, { ok: false, message: "Use POST para importar o feed da Awin." });
      return;
    }
    if (!getAwinFeedProvider().configured()) {
      sendJson(res, 400, {
        ok: false,
        message: "Awin não configurada.",
        configured: false,
      });
      return;
    }
    const result = await getAwinFeedProvider().importToCatalog({
      feedPath: url.searchParams.get("feedPath") || "",
      feedUrl: url.searchParams.get("feedUrl") || "",
      feedText: url.searchParams.get("feedText") || "",
      format: url.searchParams.get("format") || "",
    });
    sendJson(res, result.configured ? 200 : 400, {
      ok: true,
      ...result,
    });
    return;
  }

  if (pathname === "/api/actionpay/status") {
    const actionpayProvider = createActionpayProvider();
    const diagnostics = actionpayProvider.getDiagnostics();
    sendJson(res, 200, {
      configured: diagnostics.configured,
      hasApiKey: diagnostics.hasApiKey,
      hasSourceId: diagnostics.hasSourceId,
      offerId: diagnostics.offerId,
      defaultSubId: diagnostics.defaultSubId,
    });
    return;
  }

  if (pathname === "/api/actionpay/ymls") {
    const actionpayProvider = createActionpayProvider();
    if (!actionpayProvider.isConfigured()) {
      sendJson(res, 400, {
        ok: false,
        configured: false,
        message: "Actionpay não configurada.",
      });
      return;
    }
    const offerId = url.searchParams.get("offerId") || actionpayProvider.saldaoOfferId;
    const result = await actionpayProvider.getYmls(offerId);
    sendJson(res, result.ok ? 200 : (result.statusHttp || 400), {
      ok: result.ok,
      configured: actionpayProvider.isConfigured(),
      offerId,
      ymls: (result.items || []).map((item) => ({
        offerId: item.offerId,
        offerName: item.offerName,
        ymlId: item.ymlId,
        ymlName: item.ymlName,
        hasFile: Boolean(item.file?.url),
        hasInfoFile: Boolean(item.infoFile?.url),
        hasRegionalFile: Boolean(item.regionalFile?.url),
      })),
      count: (result.items || []).length,
    });
    return;
  }

  if (pathname === "/api/actionpay/import-saldao") {
    if (method !== "POST") {
      sendJson(res, 405, { ok: false, message: "Use POST para importar o feed da Actionpay." });
      return;
    }
    const actionpayProvider = createActionpayProvider();
    const actionpayYmlImporter = createActionpayImporter();
    if (!actionpayProvider.isConfigured()) {
      sendJson(res, 400, {
        ok: false,
        configured: false,
        message: "Actionpay não configurada.",
        hasApiKey: actionpayProvider.getDiagnostics().hasApiKey,
        hasSourceId: actionpayProvider.getDiagnostics().hasSourceId,
      });
      return;
    }
    const result = await actionpayYmlImporter.importActionpaySaldaoToCatalog({
      offerId: url.searchParams.get("offerId") || actionpayProvider.saldaoOfferId,
      sourceId: url.searchParams.get("sourceId") || actionpayProvider.sourceId,
      subId1: url.searchParams.get("subId1") || actionpayProvider.defaultSubId,
    });
    sendJson(res, result.configured ? 200 : 400, {
      ok: result.configured,
      ...result,
    });
    return;
  }

  if (pathname === "/auth/mercadolivre") {
    if (!process.env.MELI_CLIENT_ID || !process.env.MELI_REDIRECT_URI) {
      sendJson(res, 400, { ok: false, message: "Mercado Livre não configurado." });
      return;
    }
    res.statusCode = 302;
    res.setHeader("Location", mercadolivreAuthUrl());
    res.end();
    return;
  }

  if (pathname === "/auth/mercadolivre/callback") {
    const code = url.searchParams.get("code") || "";
    if (!code) {
      sendJson(res, 400, { ok: false, message: "Código OAuth ausente." });
      return;
    }
    sendJson(res, 200, {
      ok: true,
      received: true,
      redirectUri: mercadolivreRedirectUri(),
      message: "Callback Mercado Livre recebido.",
    });
    return;
  }

  if (pathname === "/webhook") {
    sendJson(res, 200, { status: "ok", webhook: true });
    return;
  }

  if (pathname === "/api/ml-test-item") {
    const itemId = url.searchParams.get("itemId") || "";
    if (!itemId) {
      sendJson(res, 400, { ok: false, message: "Informe itemId." });
      return;
    }
    const links = readMercadoLivreLinks();
    const match = links.find((item) => extractMercadoLivreItemId(item.url) === itemId || itemId === item.id);
    const fallback = readMercadoLivreDemoProducts().find((item) => item.id && String(item.id).toLowerCase().includes(String(itemId).toLowerCase()));
    const candidate = fallback || match || null;
    if (!candidate) {
      sendJson(res, 200, { ok: false, title: "", price: null, image: "", permalink: "", message: "Item não localizado na base de teste." });
      return;
    }
    sendJson(res, 200, {
      ok: true,
      title: candidate.title || "",
      price: candidate.price ?? null,
      image: candidate.image || candidate.thumbnail || "",
      permalink: candidate.url || candidate.permalink || "",
    });
    return;
  }

  if (pathname === "/api/mercadolivre-item" || pathname === "/api/mercadolivre-manual") {
    const mode = (url.searchParams.get("mode") || "monthly").toLowerCase();
    const monthly = Number(url.searchParams.get("monthly") || "100");
    const months = Number(url.searchParams.get("months") || "12");
    const totalBudget = Number(url.searchParams.get("totalBudget") || (monthly * months));
    const q = (url.searchParams.get("q") || url.searchParams.get("category") || "").trim();
    const urlParam = url.searchParams.get("url") || "";
    const itemId = extractMercadoLivreItemId(urlParam);

    if (urlParam || itemId) {
      const links = readMercadoLivreLinks();
      const matchedLink = links.find((entry) => extractMercadoLivreItemId(entry.url) === itemId || entry.id === itemId);
      const demo = readMercadoLivreDemoProducts().find((entry) => String(entry.id).toLowerCase().includes(String(itemId || "").toLowerCase()));
      const candidate = matchedLink || demo || null;
      if (!candidate) {
        sendJson(res, 200, { ok: true, mode: "mercadolivre", products: [], warning: "Nenhum item encontrado para a URL informada." });
        return;
      }
      sendJson(res, 200, buildMercadoLivreManualResult({ item: candidate, itemId: itemId || candidate.id, monthly, months }));
      return;
    }

    const products = normalizeDemoProducts(readMercadoLivreDemoProducts(), monthly, months, q, "mercadolivre").map((item) => ({
      ...item,
      status: mode === "total"
        ? (item.price <= totalBudget ? "CABE" : item.price <= totalBudget * 1.2 ? "APERTADO" : "NÃO CABE")
        : (item.price / months <= monthly ? "CABE" : item.price / months <= monthly * 1.2 ? "APERTADO" : "NÃO CABE"),
      dataMode: "demo",
    })).sort((a, b) => {
      const rank = { "CABE": 0, "APERTADO": 1, "NÃO CABE": 2 };
      const byRank = rank[a.status] - rank[b.status];
      if (byRank !== 0) return byRank;
      return (b.score || 0) - (a.score || 0);
    });
    sendJson(res, 200, {
      ok: true,
      mode,
      products,
      totalBudget,
      warning: products.length ? "" : "Nenhum produto encontrado dentro desse orçamento. Tente aumentar o valor mensal ou o orçamento total.",
    });
    return;
  }

  if (pathname === "/teste-produtos") {
    send(res, 200, renderProductPage().replace(
      '<div class="mode-tabs" aria-label="Tipo de orçamento">',
      '<div class="mode-tabs" aria-label="Tipo de orçamento">',
    ), { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  if (pathname === "/teste-viagens") {
    send(res, 200, renderTravelPage(), { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  if (pathname === "/mercadolivre-manual") {
    send(res, 200, renderMercadoLivrePage(), { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  if (pathname === "/catalog") {
    const query = Object.fromEntries(url.searchParams.entries());
    send(res, 200, renderCatalogPage(query), { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  if (pathname === "/api/catalog") {
    const action = (url.searchParams.get("action") || "list").toLowerCase();
    const format = (url.searchParams.get("format") || "json").toLowerCase();
    if (action === "export") {
      const body = getCatalogManager().export(format);
      send(res, 200, body, {
        "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
      });
      return;
    }
    sendJson(res, 200, {
      ok: true,
      ...getCatalogManager().diagnostics(),
      products: getCatalogManager().search(Object.fromEntries(url.searchParams.entries())),
    });
    return;
  }

  if (pathname === "/favicon.ico") {
    const filePath = path.join(publicDir, "favicon.svg");
    if (fs.existsSync(filePath)) {
      send(res, 200, fs.readFileSync(filePath), { "Content-Type": contentType(filePath) });
      return;
    }
  }

  const staticCandidate = safeJoin(publicDir, pathname);
  if (fs.existsSync(staticCandidate) && fs.statSync(staticCandidate).isFile()) {
    send(res, 200, fs.readFileSync(staticCandidate), { "Content-Type": contentType(staticCandidate) });
    return;
  }

  if (pathname === "/favicon.png") {
    const pngPath = path.join(publicDir, "favicon.png");
    if (fs.existsSync(pngPath)) {
      send(res, 200, fs.readFileSync(pngPath), { "Content-Type": contentType(pngPath) });
      return;
    }
  }

  if (pathname === "/favicon.svg") {
    const svgPath = path.join(publicDir, "favicon.svg");
    if (fs.existsSync(svgPath)) {
      send(res, 200, fs.readFileSync(svgPath), { "Content-Type": contentType(svgPath) });
      return;
    }
  }

  if (pathname === "/logo-oqc.png") {
    const pngPath = path.join(publicDir, "logo-oqc.png");
    if (fs.existsSync(pngPath)) {
      send(res, 200, fs.readFileSync(pngPath), { "Content-Type": contentType(pngPath) });
      return;
    }
  }

  if (pathname === "/logo-oqc.svg") {
    const svgPath = path.join(publicDir, "logo-oqc.svg");
    if (fs.existsSync(svgPath)) {
      send(res, 200, fs.readFileSync(svgPath), { "Content-Type": contentType(svgPath) });
      return;
    }
  }

  sendJson(res, 404, { status: "not_found" });
  } catch (error) {
    try {
      sendJson(res, 500, {
        ok: false,
        error: error?.message || "ERRO_INTERNO_DO_SERVIDOR",
        status: "error",
      });
    } catch {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: error?.message || "ERRO_INTERNO_DO_SERVIDOR", status: "error" }));
    }
  }
}




















