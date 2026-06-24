import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { URL, pathToFileURL } from "node:url";
import dummyJsonAdapter from "./src/adapters/products.dummyjson.js";
import mercadolivreAdapter from "./src/adapters/products.mercadolivre.js";
import travelMockAdapter from "./src/adapters/travel.mock.js";
import BudgetEngine from "./src/engines/BudgetEngine.js";

const root = process.cwd();
const envPath = path.join(root, ".env");
const productsPath = path.join(root, "data", "products.json");
const mlLinksPath = path.join(root, "data", "mercadolivre-links.json");
const seoPagesPath = path.join(root, "data", "seo-pages.json");
const mlDebugReportPath = path.join(root, "RELATORIO_MERCADOLIVRE_403.md");
const mlOAuthPath = path.join(root, "data", "mercadolivre-oauth.json");
const httpsPfxPath = path.join(root, ".certs", "localhost.pfx");
const httpsPfxPassword = "codex-local";

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const port = Number(process.env.PORT || 4173);
let cachedToken = null;
const dummyQueryCache = new Map();

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readMercadoLivreLinks() {
  return readJson(mlLinksPath, []);
}

function readMercadoLivreOAuth() {
  return readJson(mlOAuthPath, null);
}

function writeMercadoLivreOAuth(payload) {
  fs.writeFileSync(mlOAuthPath, JSON.stringify(payload, null, 2), "utf8");
}

function hasMercadoLivreToken() {
  const data = readMercadoLivreOAuth();
  return Boolean(data && data.access_token);
}

function tokenExpired(data) {
  if (!data) return true;
  const expiresAt = Number(data.expires_at || 0);
  if (!expiresAt) return false;
  return Date.now() >= expiresAt - 60_000;
}

function mercadolivreRedirectUri() {
  return process.env.MELI_REDIRECT_URI || `https://localhost:${port}/auth/mercadolivre/callback`;
}

function mercadolivreClientId() {
  return process.env.MELI_CLIENT_ID || process.env.CLIENT_ID || process.env.MERCADOLIVRE_CLIENT_ID || process.env.MERCADO_LIVRE_CLIENT_ID || "";
}

function mercadolivreClientSecret() {
  return process.env.MELI_CLIENT_SECRET || process.env.CLIENT_SECRET || process.env.MERCADOLIVRE_CLIENT_SECRET || process.env.MERCADO_LIVRE_CLIENT_SECRET || "";
}

function pickMercadoLivreDebugTarget() {
  const links = readMercadoLivreLinks().filter((item) => item && item.active !== false);
  const first = links.find((item) => mercadolivreAdapter.extractMercadoLivreItemId(item.url));
  const itemId = first ? mercadolivreAdapter.extractMercadoLivreItemId(first.url) : "MLB1234567890";
  return {
    itemId,
    url:
      first?.url ||
      `https://produto.mercadolivre.com.br/${itemId}-produto-_JM`,
    title: first?.title || itemId,
  };
}

function buildMercadoLivreAuthUrl() {
  const clientId = mercadolivreClientId();
  const redirectUri = mercadolivreRedirectUri();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
  });
  return `https://auth.mercadolibre.com.br/authorization?${params.toString()}`;
}

async function exchangeMercadoLivreCode(code) {
  const clientId = mercadolivreClientId();
  const clientSecret = mercadolivreClientSecret();
  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: mercadolivreRedirectUri(),
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.message || body.error_description || body.error || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return body;
}

async function refreshMercadoLivreToken(refreshToken) {
  const clientId = mercadolivreClientId();
  const clientSecret = mercadolivreClientSecret();
  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.message || body.error_description || body.error || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return body;
}

async function getMercadoLivreTokenData() {
  const data = readMercadoLivreOAuth();
  if (!data || !data.access_token) return null;
  if (!tokenExpired(data)) return data;
  if (!data.refresh_token) return data;
  try {
    const refreshed = await refreshMercadoLivreToken(data.refresh_token);
    const payload = {
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token || data.refresh_token,
      token_type: refreshed.token_type || "bearer",
      expires_in: refreshed.expires_in,
      expires_at: Date.now() + Number(refreshed.expires_in || 0) * 1000,
      scope: refreshed.scope || null,
      user_id: refreshed.user_id || null,
      created_at: new Date().toISOString(),
    };
    writeMercadoLivreOAuth(payload);
    return payload;
  } catch {
    return data;
  }
}

function manualProducts() {
  return readJson(productsPath, []).map((product) => ({
    title: product.title,
    category: product.category,
    store: product.store,
    image: product.image || "",
    url: product.url,
    price: product.price,
    installments: product.installments,
    installmentValue: product.installmentValue,
    note: product.riskNote || "Conferir preco, frete e parcelamento na loja.",
    source: "manual",
  }));
}

function seoPages() {
  return readJson(seoPagesPath, []);
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function headersToObject(headers) {
  const output = {};
  for (const [key, value] of headers.entries()) {
    output[key] = value;
  }
  return output;
}

async function fetchDebugStep(label, url, init = {}) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "OQueCabe-Debug/1.0",
      ...init.headers,
    },
    ...init,
  });
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
  return {
    label,
    url,
    status: response.status,
    ok: response.ok,
    headers: headersToObject(response.headers),
    body,
  };
}

function stringifyReportValue(value) {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function buildMercadoLivreDebugReport({ target, steps, notes }) {
  const lines = [
    "# RELATÓRIO DE DIAGNÓSTICO MERCADO LIVRE",
    "",
    `Data do teste: ${new Date().toISOString()}`,
    "",
    `Item consultado: ${target.itemId}`,
    `URL base consultada: ${target.url}`,
    "",
    "## Resultado geral",
    "",
    notes.join(" "),
    "",
  ];

  for (const step of steps) {
    lines.push(`## ${step.label}`);
    lines.push("");
    lines.push(`- URL chamada: ${step.url}`);
    lines.push(`- Status HTTP: ${step.status}`);
    lines.push(`- Ok: ${step.ok ? "sim" : "não"}`);
    lines.push("");
    lines.push("### Headers");
    lines.push("");
    lines.push("```json");
    lines.push(stringifyReportValue(step.headers));
    lines.push("```");
    lines.push("");
    lines.push("### Body");
    lines.push("");
    lines.push("```json");
    lines.push(stringifyReportValue(step.body));
    lines.push("```");
    lines.push("");
  }

  lines.push("## Observações");
  lines.push("");
  lines.push("- O endpoint de item do Mercado Livre respondeu com bloqueio de política (`PA_UNAUTHORIZED_RESULT_FROM_POLICIES`) neste ambiente.");
  lines.push("- O teste confirma que o item MLB consultado é extraído corretamente da URL.");
  lines.push("- A documentação oficial do Mercado Livre mostra APIs com autenticação via `Authorization: Bearer $ACCESS_TOKEN`, o que indica exigência de OAuth em vários recursos.");
  lines.push("- A criação/gestão de aplicativos e credenciais é parte do fluxo oficial, então App ID e segredo podem ser necessários para cenários autenticados.");
  lines.push("");

  return lines.join("\n");
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
  }[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("Arquivo não encontrado");
      return;
    }
    res.writeHead(200, { "Content-Type": type });
    res.end(content);
  });
}

async function getAmazonToken() {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.value;

  const response = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.AMAZON_CREATORS_CLIENT_ID,
      client_secret: process.env.AMAZON_CREATORS_CLIENT_SECRET,
      scope: "creatorsapi::default",
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.error_description || body.error || `HTTP ${response.status}`;
    throw new Error(`Token Amazon: ${message}`);
  }

  cachedToken = {
    value: body.access_token,
    expiresAt: now + Number(body.expires_in || 3600) * 1000,
  };
  return cachedToken.value;
}

function moneyToNumber(value) {
  if (!value) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function normalizeAmazonItem(item) {
  const price =
    item?.offersV2?.listings?.[0]?.price?.amount ||
    item?.offers?.listings?.[0]?.price?.amount ||
    null;

  return {
    title: item?.itemInfo?.title?.displayValue || item?.title || "Produto Amazon",
    store: "Amazon",
    image: item?.images?.primary?.medium?.url || item?.images?.primary?.large?.url || "",
    url: item?.detailPageURL || item?.detailPageUrl || "https://www.amazon.com.br/?tag=candombledesm-20",
    price: moneyToNumber(price),
    installments: 10,
    installmentValue: moneyToNumber(price) ? moneyToNumber(price) / 10 : null,
    note: "Resultado vindo da Amazon. Confira preço, frete e parcelamento na loja.",
    source: "amazon",
  };
}

async function searchAmazon({ query, maxMonthly, maxInstallments }) {
  const token = await getAmazonToken();
  const response = await fetch("https://creatorsapi.amazon/catalog/v1/searchItems", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-marketplace": process.env.AMAZON_MARKETPLACE || "www.amazon.com.br",
    },
    body: JSON.stringify({
      partnerTag: process.env.AMAZON_ASSOCIATE_TAG,
      partnerType: "Associates",
      keywords: query,
      itemCount: 10,
      resources: [
        "images.primary.medium",
        "itemInfo.title",
        "offersV2.listings.price",
      ],
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.message || body.error_description || body.error || `HTTP ${response.status}`;
    throw new Error(`Busca Amazon: ${message}`);
  }

  const items = body?.searchResult?.items || body?.items || body?.SearchResult?.Items || [];
  return items
    .map(normalizeAmazonItem)
    .filter((product) => {
      if (!product.installmentValue) return true;
      return product.installmentValue <= maxMonthly && product.installments <= maxInstallments;
    });
}

function searchDemo({ query, maxMonthly, maxInstallments }) {
  const normalized = query.toLowerCase();
  return manualProducts()
    .filter((product) => {
      const text = `${product.title} ${product.category || ""}`.toLowerCase();
      return text.includes(normalized) || normalized.length < 3;
    })
    .filter((product) => product.installmentValue <= maxMonthly && product.installments <= maxInstallments);
}

function makeDummyJsonResults(query) {
  const key = String(query || "").trim().toLowerCase();
  if (dummyQueryCache.has(key)) return dummyQueryCache.get(key);
  return dummyJsonAdapter.searchProducts(query).then((items) => {
    dummyQueryCache.set(key, items);
    return items;
  });
}

function scoreMercadoLivreProduct(product, budgetTotal, monthlyBudget) {
  let score = 100;
  if (!product.image) score -= 10;
  if (!product.price) score -= 30;
  if (!product.availableQuantity || product.availableQuantity <= 0) score -= 20;
  if (String(product.condition || "").toLowerCase() === "used") score -= 10;
  if (!product.affiliateUrl) score -= 5;
  if (product.price && product.price > monthlyBudget * 2) score -= 15;
  return Math.max(0, Math.min(100, score));
}

async function loadMercadoLivreManualProducts(monthlyBudget, months, category) {
  const items = await mercadolivreAdapter.loadManualMercadoLivreProducts();
  const budgetContext = BudgetEngine.buildBudgetContext({ mode: "total", monthly: monthlyBudget, months, totalBudget: monthlyBudget * months });
  const normalized = items
    .filter((item) => item && !item.error)
    .filter((item) => {
      if (!category) return true;
      return String(item.category || "").toLowerCase() === String(category).toLowerCase();
    })
    .map((item) => {
      const price = Number(item.price || 0);
      const monthlyPrice = BudgetEngine.calculateMonthlyPrice(price, months);
      const status = BudgetEngine.classifyBudgetFit(price, budgetContext);
      return {
        ...item,
        price,
        monthlyPrice: Math.round(monthlyPrice * 100) / 100,
        status,
        score: scoreMercadoLivreProduct(item, monthlyBudget * months, monthlyBudget),
        note: item.notes || "Produto real do Mercado Livre. Link afiliado aplicado apenas quando cadastrado.",
      };
    });

  return BudgetEngine.limitBudgetResults(normalized);
}

async function loadMercadoLivreManualProductsDetailed(monthlyBudget, months, category) {
  const items = await mercadolivreAdapter.loadManualMercadoLivreProducts();
  const errors = items.filter((item) => item.error).map((item) => ({ id: item.id, title: item.title, error: item.error }));
  const budgetContext = BudgetEngine.buildBudgetContext({ mode: "total", monthly: monthlyBudget, months, totalBudget: monthlyBudget * months });
  const normalized = items
    .filter((item) => item && !item.error)
    .filter((item) => {
      if (!category) return true;
      return String(item.category || "").toLowerCase() === String(category).toLowerCase();
    })
    .map((item) => {
      const price = Number(item.price || 0);
      const monthlyPrice = BudgetEngine.calculateMonthlyPrice(price, months);
      const status = BudgetEngine.classifyBudgetFit(price, budgetContext);
      return {
        ...item,
        price,
        monthlyPrice: Math.round(monthlyPrice * 100) / 100,
        status,
        score: scoreMercadoLivreProduct(item, monthlyBudget * months, monthlyBudget),
        note: item.notes || "Produto real do Mercado Livre. Link afiliado aplicado apenas quando cadastrado.",
      };
    });

  const products = BudgetEngine.limitBudgetResults(normalized);
  return { products, errors };
}

async function fetchMercadoLivreByUrl(url, monthlyBudget, months) {
  const links = readMercadoLivreLinks().filter((item) => item && item.active !== false);
  const itemId = mercadolivreAdapter.extractMercadoLivreItemId(url);
  const linkMatch = links.find((item) => item.url === url || mercadolivreAdapter.extractMercadoLivreItemId(item.url) === itemId);

  if (!itemId) {
    return {
      ok: false,
      products: [],
      errors: [{ title: url, error: "Não foi possível extrair o ID MLB da URL." }],
    };
  }

  try {
    const item = await mercadolivreAdapter.fetchMercadoLivreItemById(itemId);
    const price = Number(item.price || 0);
    const affiliateUrl = linkMatch?.affiliateUrl || null;
    const budgetContext = BudgetEngine.buildBudgetContext({ mode: "total", monthly: monthlyBudget, months, totalBudget: monthlyBudget * months });
    const product = {
      id: item.id,
      title: item.title,
      category: item.category_id || (linkMatch?.category || ""),
      store: "Mercado Livre",
      price,
      image: item.thumbnail || "",
      rating: null,
      description: item.title || "",
      productUrl: item.permalink || url,
      affiliateUrl,
      source: "mercadolivre",
      availableQuantity: item.available_quantity,
      condition: item.condition,
      lastChecked: new Date().toISOString(),
      monthlyPrice: Math.round(BudgetEngine.calculateMonthlyPrice(price, months) * 100) / 100,
      status: BudgetEngine.classifyBudgetFit(price, budgetContext),
      score: scoreMercadoLivreProduct(
        {
          price,
          image: item.thumbnail || "",
          availableQuantity: item.available_quantity,
          condition: item.condition,
          affiliateUrl,
        },
        monthlyBudget * months,
        monthlyBudget,
      ),
      note: linkMatch?.notes || "Produto real do Mercado Livre. Link afiliado aplicado apenas quando cadastrado.",
    };
    return { ok: true, products: [product], errors: [] };
  } catch (error) {
    if (/Conecte sua conta Mercado Livre/i.test(error.message || "") || /unauthorized/i.test(error.message || "")) {
      return {
        ok: false,
        products: [],
        errors: [{ title: linkMatch?.title || url, error: "Conecte sua conta Mercado Livre para consultar produtos reais." }],
        message: "Conecte sua conta Mercado Livre para consultar produtos reais.",
      };
    }
    return {
      ok: false,
      products: [],
      errors: [{ title: linkMatch?.title || url, error: error.message }],
    };
  }
}

function scoreDummyProduct(product, budgetTotal) {
  let score = 100;
  if (!product.rating) score -= 10;
  if (product.rating && product.rating < 4) score -= 15;
  if (!product.image) score -= 10;
  if (!product.description || product.description.trim().length < 40) score -= 5;
  if (product.price_brl > budgetTotal) score -= 30;
  return Math.max(0, Math.min(100, score));
}

function classifyFit(product, monthlyBudget, months) {
  const installment = product.price_brl / months;
  if (installment <= monthlyBudget) return "CABE";
  if (installment <= monthlyBudget * 1.2) return "APERTADO";
  return "NÃO CABE";
}

function normalizeDummyProducts(products, monthlyBudget, months) {
  const budgetTotal = monthlyBudget * months;
  const normalized = products
    .map((product) => {
      const price_brl = Math.round(product.price * 5.5 * 100) / 100;
      const installmentValue = Math.round((price_brl / months) * 100) / 100;
      const status = classifyFit({ price_brl }, monthlyBudget, months);
      return {
        id: product.id,
        title: product.title,
        category: product.category,
        store: product.store,
        price: price_brl,
        image: product.image,
        rating: product.rating,
        description: product.description,
        note: "Dados de teste — preços simulados.",
        url: `https://dummyjson.com/products/${product.id}`,
        installments: months,
        installmentValue,
        status,
        score: scoreDummyProduct({ ...product, price_brl }, budgetTotal),
        source: "dummyjson",
      };
    })
    .sort((a, b) => {
      const rank = { "CABE": 0, "APERTADO": 1, "NÃO CABE": 2 };
      const byRank = rank[a.status] - rank[b.status];
      if (byRank !== 0) return byRank;
      return b.score - a.score;
    });

  const grouped = { "CABE": [], "APERTADO": [], "NÃO CABE": [] };
  for (const product of normalized) {
    grouped[product.status].push(product);
  }

  return [
    ...grouped["CABE"].slice(0, 8),
    ...grouped["APERTADO"].slice(0, 4),
    ...grouped["NÃO CABE"].slice(0, 3),
  ];
}

function renderExplorerPage({ title, heading, description, view, badge, endpoint, inputLabel, inputPlaceholder, quickLabel, quickButtons }) {
  const buttons = quickButtons
    .map(
      (item) => `<button type="button" data-query="${escapeHtml(item.query)}" data-monthly="${item.monthly || 100}" data-months="${item.months || 12}">${escapeHtml(item.label)}</button>`,
    )
    .join("");

  return `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <link rel="stylesheet" href="/styles.css" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    </head>
    <body data-view="${escapeHtml(view)}" data-endpoint="${escapeHtml(endpoint)}">
      <header class="topbar">
        <a class="brand" href="/"><img class="brand-mark" src="/logo-oqc.svg" alt="OQC" /><strong>O Que Cabe</strong></a>
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

function renderProductExplorerPage() {
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
  }).replace(
    '<div class="notice" id="notice" hidden></div>',
    '<div class="notice" id="notice">Classificamos os produtos em três faixas: Cabe no orçamento, Apertado e Não cabe. Assim você consegue comparar sem perder a noção do limite mensal.</div>'
  );
}

function renderTravelExplorerPage() {
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
  const connected = hasMercadoLivreToken();
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
      : '<div class="notice" id="notice">Conecte sua conta Mercado Livre para consultar produtos reais.</div>'
  );
}

function renderMercadoLivreAuthNotice() {
  return `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Autenticação Mercado Livre | O Que Cabe</title>
      <link rel="stylesheet" href="/styles.css" />
    </head>
    <body>
      <main class="seo-page">
        <h1>Conectando Mercado Livre</h1>
        <p>Abra esta tela depois do login para concluir o fluxo OAuth.</p>
      </main>
    </body>
  </html>`;
}

function renderAdminPage() {
  return `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Admin Ofertas | O Que Cabe</title>
      <link rel="stylesheet" href="/styles.css" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    </head>
    <body>
      <header class="topbar">
        <a class="brand" href="/"><img class="brand-mark" src="/logo-oqc.svg" alt="OQC" /><strong>O Que Cabe</strong></a>
        <div class="trust-pill">Curadoria de Confiança</div>
      </header>
      <main class="seo-page">
        <a class="seo-back" href="/">Voltar para a busca</a>
        <h1>Admin de ofertas</h1>
        <p>Preencha os dados abaixo e copie o JSON gerado para <code>data/mercadolivre-links.json</code>.</p>
        <section class="seo-box">
          <div class="field" style="gap:12px">
            <label>Título</label>
            <input id="admTitle" />
            <label>Categoria</label>
            <input id="admCategory" />
            <label>URL Mercado Livre</label>
            <input id="admUrl" />
            <label>affiliateUrl opcional</label>
            <input id="admAffiliateUrl" />
            <label>Observação</label>
            <input id="admNotes" />
            <button class="submit-button" type="button" id="admGenerate">Gerar JSON</button>
          </div>
        </section>
        <section class="seo-box">
          <h2>Saída</h2>
          <pre id="admOutput" style="white-space:pre-wrap; background:#fbfcff; padding:16px; border-radius:16px; border:1px solid var(--line);"></pre>
        </section>
      </main>
      <script>
        const fields = ['admTitle','admCategory','admUrl','admAffiliateUrl','admNotes'].map(id => document.getElementById(id));
        const output = document.getElementById('admOutput');
        document.getElementById('admGenerate').addEventListener('click', () => {
          const [title, category, url, affiliateUrl, notes] = fields.map(el => el.value.trim());
          const json = {
            id: ('ml-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).slice(0, 60),
            title,
            category,
            store: 'Mercado Livre',
            url,
            affiliateUrl: affiliateUrl || null,
            active: true,
            notes: notes || ''
          };
          output.textContent = JSON.stringify(json, null, 2);
        });
      </script>
    </body>
  </html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderSeoPage(page) {
  const related = manualProducts().filter((product) => product.category === page.category).slice(0, 6);
  const cards = related.length
    ? related
        .map(
          (product) => `
            <article class="seo-product">
              <strong>${escapeHtml(product.title)}</strong>
              <span>${escapeHtml(product.store)} · ${product.installments}x de R$ ${product.installmentValue.toFixed(2).replace(".", ",")}</span>
              <a href="${escapeHtml(product.url)}" target="_blank" rel="noopener">Ver oferta</a>
            </article>
          `,
        )
        .join("")
    : `<p class="seo-muted">Produtos em curadoria. Em breve esta pagina tera ofertas revisadas.</p>`;

  return `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(page.title)} | O Que Cabe</title>
      <meta name="description" content="${escapeHtml(page.description)}" />
      <link rel="stylesheet" href="/styles.css" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    </head>
    <body>
      <header class="topbar">
        <a class="brand" href="/"><img class="brand-mark" src="/logo-oqc.svg" alt="OQC" /><strong>O Que Cabe</strong></a>
        <div class="trust-pill">Curadoria de Confiança</div>
      </header>
      <main class="seo-page">
        <a class="seo-back" href="/">Voltar para a busca</a>
        <h1>${escapeHtml(page.title)}</h1>
        <p>${escapeHtml(page.description)}</p>
        <section class="seo-box">
          <h2>Produtos que cabem no orçamento</h2>
          <div class="seo-products">${cards}</div>
        </section>
        <section class="seo-box">
          <h2>Aviso importante</h2>
          <p>Podemos receber comissao por compras feitas pelos links. Precos, parcelas, frete e disponibilidade podem mudar. Confira tudo na loja antes de comprar.</p>
        </section>
      </main>
    </body>
  </html>`;
}

function renderCollectionPage() {
  return `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Mais vendidos da Amazon | O Que Cabe</title>
      <meta name="description" content="Curadoria dos mais vendidos da Amazon com foco em produtos que cabem no orçamento." />
      <link rel="stylesheet" href="/styles.css" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    </head>
    <body>
      <header class="topbar">
        <a class="brand" href="/"><img class="brand-mark" src="/logo-oqc.svg" alt="OQC" /><strong>O Que Cabe</strong></a>
        <div class="trust-pill">Curadoria de Confiança</div>
      </header>
      <main class="seo-page">
        <a class="seo-back" href="/">Voltar para a busca</a>
        <h1>Mais vendidos da Amazon</h1>
        <p>Esse link funciona como uma vitrine de apoio. O cálculo de parcela acontece quando o produto individual entra na base com preço e prazo definidos.</p>
        <section class="seo-box">
          <h2>Link de apoio</h2>
          <p class="seo-muted">Lista oficial de mais vendidos com tag de afiliado.</p>
          <a class="collection-link" href="https://www.amazon.com.br/gp/bestsellers?&linkCode=ll2&tag=candombledesm-20&linkId=08ea63d5f6b1282d69efba3115b86867&ref_=as_li_ss_tl" target="_blank" rel="noopener">Abrir mais vendidos</a>
        </section>
        <section class="seo-box">
          <h2>Como calcular</h2>
          <p>Para calcular de forma confiável, precisamos do produto individual com preço total ou preço parcelado. A lista por si só não traz esse dado de forma estável para o MVP.</p>
        </section>
      </main>
    </body>
  </html>`;
}

export async function requestHandler(req, res) {
  const requestUrl = new URL(req.url, `http://localhost:${port}`);

  if (requestUrl.pathname === "/api/search") {
    const query = requestUrl.searchParams.get("q") || "";
    const maxMonthly = Number(requestUrl.searchParams.get("monthly") || "0");
    const maxInstallments = Number(requestUrl.searchParams.get("months") || "12");

    if (!query || !maxMonthly) {
      sendJson(res, 400, { ok: false, message: "Informe produto e valor mensal." });
      return;
    }

    try {
      const products = await searchAmazon({ query, maxMonthly, maxInstallments });
      sendJson(res, 200, {
        ok: true,
        mode: "amazon",
        products,
        warning: products.length ? "" : "A Amazon respondeu, mas nenhum produto coube nesse filtro.",
      });
    } catch (error) {
      sendJson(res, 200, {
        ok: true,
        mode: "demo",
        products: searchDemo({ query, maxMonthly, maxInstallments }),
        warning: `${error.message}. Mostrando dados de demonstração por enquanto.`,
      });
    }
    return;
  }

  if (requestUrl.pathname === "/api/teste-produtos") {
    const query = requestUrl.searchParams.get("q") || "";
    const monthly = Number(requestUrl.searchParams.get("monthly") || "0");
    const months = Number(requestUrl.searchParams.get("months") || "12");
    try {
      const raw = query ? await dummyJsonAdapter.searchProducts(query) : await dummyJsonAdapter.searchProducts("");
      const products = normalizeDummyProducts(raw, monthly || 100, months || 12);
      sendJson(res, 200, {
        ok: true,
        products: products.slice(0, 24),
        warning: products.length ? "" : "Nenhum produto encontrado dentro desse orçamento. Tente aumentar o valor mensal ou o número de parcelas.",
      });
    } catch (error) {
      sendJson(res, 500, { ok: false, message: error.message });
    }
    return;
  }

  if (requestUrl.pathname === "/api/teste-viagens") {
    const query = requestUrl.searchParams.get("q") || "";
    try {
      const trips = travelMockAdapter.searchTrips(query);
      sendJson(res, 200, { ok: true, trips });
    } catch (error) {
      sendJson(res, 500, { ok: false, message: error.message });
    }
    return;
  }

  if (requestUrl.pathname === "/api/mercadolivre-manual") {
    const category = requestUrl.searchParams.get("category") || "";
    const monthly = Number(requestUrl.searchParams.get("monthly") || "100");
    const months = Number(requestUrl.searchParams.get("months") || "10");
    try {
      const { products, errors } = await loadMercadoLivreManualProductsDetailed(monthly, months, category);
      sendJson(res, 200, {
        ok: true,
        products,
        errors,
      });
    } catch (error) {
      sendJson(res, 200, {
        ok: false,
        message: error.message,
        products: [],
        errors: [{ error: error.message }],
      });
    }
    return;
  }

  if (requestUrl.pathname === "/api/mercadolivre-item") {
    const url = requestUrl.searchParams.get("url") || "";
    const monthly = Number(requestUrl.searchParams.get("monthly") || "100");
    const months = Number(requestUrl.searchParams.get("months") || "10");
    const result = await fetchMercadoLivreByUrl(url, monthly, months);
    sendJson(res, 200, result);
    return;
  }

  if (requestUrl.pathname === "/api/ml-auth-status") {
    const data = await getMercadoLivreTokenData();
    sendJson(res, 200, {
      configured: Boolean(mercadolivreClientId() && mercadolivreClientSecret() && mercadolivreRedirectUri()),
      authenticated: Boolean(data && data.access_token),
      token_expired: Boolean(data && tokenExpired(data)),
      redirectUri: mercadolivreRedirectUri(),
      hasClientId: Boolean(mercadolivreClientId()),
      hasClientSecret: Boolean(mercadolivreClientSecret()),
    });
    return;
  }

  if (requestUrl.pathname === "/api/ml-test-item") {
    const itemId = requestUrl.searchParams.get("itemId") || "";
    if (!itemId) {
      sendJson(res, 400, { ok: false, message: "Informe itemId." });
      return;
    }
    try {
      const item = await mercadolivreAdapter.fetchMercadoLivreItemById(itemId);
      sendJson(res, 200, {
        ok: true,
        status: 200,
        title: item.title || "",
        price: item.price ?? null,
        image: item.thumbnail || "",
        permalink: item.permalink || "",
      });
    } catch (error) {
      const status = Number(error.status || (/HTTP (\d+)/i.test(String(error.message || "")) ? Number(String(error.message).match(/HTTP (\d+)/i)[1]) : 500));
      const body = error.body || { message: error.message };
      sendJson(res, 200, {
        ok: false,
        status,
        title: "",
        price: null,
        image: "",
        permalink: "",
        body,
        message: error.message,
      });
    }
    return;
  }

  if (requestUrl.pathname === "/auth/mercadolivre") {
    const clientId = mercadolivreClientId();
    if (!clientId) {
      sendJson(res, 400, { ok: false, message: "CLIENT_ID do Mercado Livre não configurado." });
      return;
    }
    res.writeHead(302, { Location: buildMercadoLivreAuthUrl() });
    res.end();
    return;
  }

  if (requestUrl.pathname === "/auth/mercadolivre/callback") {
    const error = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");
    if (error) {
      sendJson(res, 400, { ok: false, message: errorDescription || error });
      return;
    }
    const code = requestUrl.searchParams.get("code") || "";
    if (!code) {
      sendJson(res, 400, { ok: false, message: "Código OAuth ausente." });
      return;
    }
    try {
      const token = await exchangeMercadoLivreCode(code);
      const payload = {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        token_type: token.token_type,
        expires_in: token.expires_in,
        expires_at: Date.now() + Number(token.expires_in || 0) * 1000,
        scope: token.scope || null,
        user_id: token.user_id || null,
        created_at: new Date().toISOString(),
      };
      writeMercadoLivreOAuth(payload);
      res.writeHead(302, { Location: "/mercadolivre-manual?auth=ok" });
      res.end();
    } catch (err) {
      sendJson(res, 400, { ok: false, message: err.message });
    }
    return;
  }

  if (requestUrl.pathname === "/api/mercadolivre-extract") {
    const url = requestUrl.searchParams.get("url") || "";
    sendJson(res, 200, {
      ok: true,
      itemId: mercadolivreAdapter.extractMercadoLivreItemId(url),
    });
    return;
  }

  if (requestUrl.pathname === "/api/ml-debug") {
    const target = pickMercadoLivreDebugTarget();
    const itemId = requestUrl.searchParams.get("itemId") || target.itemId;
    const url = requestUrl.searchParams.get("url") || target.url;
    const searchQuery = requestUrl.searchParams.get("q") || "celular";
    const steps = [];
    const notes = [];

    try {
      const adapterStep = await fetchDebugStep(
        "Endpoint atual do adapter /items",
        `https://api.mercadolibre.com/items/${encodeURIComponent(itemId)}`,
      );
      steps.push(adapterStep);
      if (JSON.stringify(adapterStep.body || "").includes("PA_UNAUTHORIZED_RESULT_FROM_POLICIES")) {
        notes.push("O endpoint atual do adapter falhou com PA_UNAUTHORIZED_RESULT_FROM_POLICIES.");
      }
    } catch (error) {
      steps.push({
        label: "Endpoint atual do adapter /items",
        url: `https://api.mercadolibre.com/items/${encodeURIComponent(itemId)}`,
        status: 0,
        ok: false,
        headers: {},
        body: { error: error.message },
      });
    }

    try {
      const searchStep = await fetchDebugStep(
        "Endpoint de busca /sites/MLB/search",
        `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(searchQuery)}`,
      );
      steps.push(searchStep);
      if (JSON.stringify(searchStep.body || "").includes("PA_UNAUTHORIZED_RESULT_FROM_POLICIES")) {
        notes.push("O endpoint de busca também retornou bloqueio de política.");
      }
    } catch (error) {
      steps.push({
        label: "Endpoint de busca /sites/MLB/search",
        url: `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(searchQuery)}`,
        status: 0,
        ok: false,
        headers: {},
        body: { error: error.message },
      });
    }

    try {
      const altStep = await fetchDebugStep(
        "Endpoint alternativo documentado /currencies/BRL",
        "https://api.mercadolibre.com/currencies/BRL",
      );
      steps.push(altStep);
    } catch (error) {
      steps.push({
        label: "Endpoint alternativo documentado /currencies/BRL",
        url: "https://api.mercadolibre.com/currencies/BRL",
        status: 0,
        ok: false,
        headers: {},
        body: { error: error.message },
      });
    }

    try {
      const itemLookupStep = await fetchDebugStep(
        "Endpoint consultado pela URL do produto",
        `https://api.mercadolibre.com/items/${encodeURIComponent(itemId)}`,
      );
      steps.push(itemLookupStep);
    } catch (error) {
      steps.push({
        label: "Endpoint consultado pela URL do produto",
        url: `https://api.mercadolibre.com/items/${encodeURIComponent(itemId)}`,
        status: 0,
        ok: false,
        headers: {},
        body: { error: error.message },
      });
    }

    const report = buildMercadoLivreDebugReport({
      target: { itemId, url },
      steps,
      notes: notes.length
        ? notes
        : ["Nenhum bloqueio explícito em texto foi detectado no corpo dos testes executados."],
    });

    fs.writeFileSync(mlDebugReportPath, report, "utf8");
    sendJson(res, 200, {
      ok: true,
      saved: mlDebugReportPath,
      target: { itemId, url, searchQuery },
      steps,
      report: "/RELATORIO_MERCADOLIVRE_403.md",
    });
    return;
  }

  const slug = requestUrl.pathname.replace(/^\/+|\/+$/g, "");
  const page = seoPages().find((item) => item.slug === slug);
  if (page) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderSeoPage(page));
    return;
  }

  if (requestUrl.pathname === "/amazon-mais-vendidos") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderCollectionPage());
    return;
  }

  if (requestUrl.pathname === "/teste-produtos") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderProductExplorerPage());
    return;
  }

  if (requestUrl.pathname === "/teste-viagens") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderTravelExplorerPage());
    return;
  }

  if (requestUrl.pathname === "/mercadolivre-manual") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderMercadoLivrePage());
    return;
  }

  if (requestUrl.pathname === "/admin-ofertas") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderAdminPage());
    return;
  }

  const requested = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const safePath = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
  sendFile(res, path.join(root, "public", safePath));
}

const server = http.createServer(requestHandler);

const useHttps = fs.existsSync(httpsPfxPath);
const listener = useHttps
  ? https.createServer(
      {
        pfx: fs.readFileSync(httpsPfxPath),
        passphrase: httpsPfxPassword,
      },
      requestHandler,
    )
  : server;

const isMainModule = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMainModule) {
  listener.listen(port, () => {
    console.log(`Cabe no Bolso rodando em ${useHttps ? "https" : "http"}://localhost:${port}`);
  });
}
