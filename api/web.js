import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicDir = path.join(root, "public");
const oauthPath = path.join(root, "data", "mercadolivre-oauth.json");

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

export default function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  if (pathname === "/") {
    send(res, 200, renderHome(), { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  if (pathname === "/api/ml-auth-status") {
    sendJson(res, 200, {
      configured: Boolean(process.env.MELI_CLIENT_ID && process.env.MELI_CLIENT_SECRET && process.env.MELI_REDIRECT_URI),
      authenticated: hasToken(),
      token_expired: false,
      redirectUri: process.env.MELI_REDIRECT_URI || "",
      hasClientId: Boolean(process.env.MELI_CLIENT_ID),
      hasClientSecret: Boolean(process.env.MELI_CLIENT_SECRET),
    });
    return;
  }

  if (pathname === "/teste-produtos") {
    send(res, 200, renderProductPage(), { "Content-Type": "text/html; charset=utf-8" });
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
