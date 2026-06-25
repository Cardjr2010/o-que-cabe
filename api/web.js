import fs from "node:fs";
import path from "node:path";
import BudgetEngine from "../src/engines/BudgetEngine.js";
import ScoreEngine from "../src/engines/ScoreEngine.js";
import RankingEngine from "../src/engines/RankingEngine.js";
import MercadoLivreProvider from "../src/providers/MercadoLivreProvider.js";

const root = process.cwd();
const publicDir = path.join(root, "public");
const oauthPath = path.join(root, "data", "mercadolivre-oauth.json");
const productsPath = path.join(root, "data", "products.json");
const mercadolivreDemoPath = path.join(root, "data", "mercadolivre-demo-products.json");
const mlLinksPath = path.join(root, "data", "mercadolivre-links.json");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
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
        store: source === "mercadolivre" ? "Mercado Livre" : source === "amazon" ? "Amazon" : source === "magalu" ? "Magalu" : "Loja de Teste",
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

function buildOqcResponse({ products, query, mode, monthly, months, totalBudget, dataMode }) {
  const budget = buildOqcBudgetContext({ mode, monthly, months, totalBudget });
  const enriched = products.map((product) => enrichWithOqc(product, budget, query));
  const ranked = RankingEngine.rankProducts(enriched, query);
  return {
    query,
    mode,
    budget,
    dataMode,
    recommendations: ranked.recommended,
    groups: ranked.groups,
    summary: ranked.summary,
    products: ranked.products || enriched,
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
  return fs.readFileSync(path.join(publicDir, "index.html"), "utf8");
}

function renderProductPage() {
  return renderExplorerPage({
    title: "Teste Produtos | O Que Cabe",
    heading: "Teste produtos com DummyJSON.",
    description: "Busca de produtos de teste sem depender de Amazon ou Mercado Livre.",
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
  const status = monthlyPrice <= monthly ? "CABE" : monthlyPrice <= monthly * 1.2 ? "APERTADO" : "NÃƒO CABE";
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
    relógio: ["relógio", "relogio", "smartwatch", "watch", "pulseira inteligente"],
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
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  if (pathname === "/") {
    send(res, 200, renderHome(), { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  if (pathname === "/api/search") {
    const q = url.searchParams.get("q") || "";
    const mode = (url.searchParams.get("mode") || "monthly").toLowerCase();
    const monthly = Number(url.searchParams.get("monthly") || "50");
    const months = Number(url.searchParams.get("months") || "12");
    const totalBudget = Number(url.searchParams.get("totalBudget") || (monthly * months));
    try {
      const providerResult = await MercadoLivreProvider.searchProducts(q, {
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
      const demoProducts = normalizeDemoProducts(readMercadoLivreDemoProducts(), monthly, months, q, "mercadolivre").map((item) => ({
        ...item,
        dataMode: "demo",
      }));
      const response = buildOqcResponse({
        products: demoProducts,
        query: q,
        mode,
        monthly,
        months,
        totalBudget,
        dataMode: "demo",
      });
      sendJson(res, 200, {
        ok: true,
        ...response,
        warning: `${error.message || "Falha na integração Mercado Livre"}. Mostrando demonstração por enquanto.`,
      });
    }
    return;
  }
  if (pathname === "/api/ml-connector-test") {
    const q = url.searchParams.get("q") || "";
    const mode = (url.searchParams.get("mode") || "monthly").toLowerCase();
    const monthly = Number(url.searchParams.get("monthly") || "50");
    const months = Number(url.searchParams.get("months") || "12");
    const totalBudget = Number(url.searchParams.get("totalBudget") || (monthly * months));
    const result = await MercadoLivreProvider.searchProducts(q, { limit: 20, mode, monthly, months, totalBudget });
    sendJson(res, result.statusHttp || 200, {
      configured: MercadoLivreProvider.getDiagnostics ? MercadoLivreProvider.getDiagnostics().configured : true,
      tokenState: result.tokenState || (MercadoLivreProvider.getDiagnostics ? MercadoLivreProvider.getDiagnostics().tokenState : "available"),
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

  sendJson(res, 404, { status: "not_found" });
}















