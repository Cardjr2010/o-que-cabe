import fs from "node:fs";
import path from "node:path";

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

function readMercadoLivreToken() {
  return readJson(oauthPath, null);
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

function classifyFit(price, monthlyBudget, months) {
  const installment = price / months;
  if (installment <= monthlyBudget) return "CABE";
  if (installment <= monthlyBudget * 1.2) return "APERTADO";
  return "NÃO CABE";
}

function normalizeDemoProducts(products, monthlyBudget, months, query, source) {
  const q = String(query || "").trim().toLowerCase();
  const categoryRules = {
    celular: {
      include: ["celular", "smartphone", "galaxy", "moto", "redmi", "iphone"],
      exclude: ["air fryer", "câmera", "camera", "notebook", "tablet", "casa"],
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
        url: product.url || "#",
        installments: product.installments || months,
        installmentValue,
        status,
        score: scoreDemoProduct({ ...product, price_brl }, monthlyBudget * months),
        source,
      };
    })
    .sort((a, b) => {
      const rank = { "CABE": 0, "APERTADO": 1, "NÃO CABE": 2 };
      const byRank = rank[a.status] - rank[b.status];
      if (byRank !== 0) return byRank;
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
  return fs.readFileSync(path.join(publicDir, "index.html"), "utf8").replace(
    '<div class="mode-tabs" aria-label="Tipo de orçamento">',
    '<div class="mode-tabs" aria-label="Tipo de orçamento"><select id="sourceInput" name="source" class="source-select"><option value="mercadolivre" selected>Mercado Livre</option><option value="demo">Demo Mercado Livre</option><option value="amazon">Amazon</option><option value="magalu">Magalu</option></select>',
  ).replace(
    '<p>Use essa vitrine como ponto de partida. Quando o produto entra na base, aí sim o site calcula parcela, orçamento e valor total.</p>',
    '<p>Atalho de afiliado Amazon. Não interfere na busca principal.</p>',
  );
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

function buildMercadoLivreManualResult({ item, itemId, monthly, months }) {
  const price = Number(item?.price ?? 0);
  const monthlyPrice = months > 0 ? price / months : price;
  const status = monthlyPrice <= monthly ? "CABE" : monthlyPrice <= monthly * 1.2 ? "APERTADO" : "NÃO CABE";
  return {
    ok: true,
    mode: "mercadolivre",
    products: [{
      id: item?.id || itemId,
      title: item?.title || item?.name || "Produto Mercado Livre",
      category: item?.category || "",
      store: "Mercado Livre",
      source: "mercadolivre",
      price,
      image: item?.image || item?.thumbnail || (Array.isArray(item?.pictures) && item.pictures[0]?.url) || "",
      url: item?.affiliateUrl || item?.url || item?.permalink || "#",
      productUrl: item?.permalink || item?.url || "#",
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

export default function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  if (pathname === "/") {
    send(res, 200, renderHome(), { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  if (pathname === "/api/search") {
    const q = url.searchParams.get("q") || "";
    const monthly = Number(url.searchParams.get("monthly") || "50");
    const months = Number(url.searchParams.get("months") || "12");
    const source = normalizeSource(url.searchParams.get("source") || "mercadolivre");
    const products = source === "amazon"
      ? normalizeDemoProducts(readProducts(), monthly, months, q, "amazon")
      : normalizeDemoProducts(readMercadoLivreDemoProducts(), monthly, months, q, source);
    sendJson(res, 200, {
      ok: true,
      mode: source,
      products,
      warning: products.length ? "" : "Nenhum produto encontrado dentro desse orçamento. Tente aumentar o valor mensal ou o número de parcelas.",
    });
    return;
  }

  if (pathname === "/api/teste-produtos") {
    const q = url.searchParams.get("q") || "";
    const monthly = Number(url.searchParams.get("monthly") || "50");
    const months = Number(url.searchParams.get("months") || "12");
    const source = normalizeSource(url.searchParams.get("source") || "mercadolivre");
    const products = source === "amazon"
      ? normalizeDemoProducts(readProducts(), monthly, months, q, "amazon")
      : normalizeDemoProducts(readMercadoLivreDemoProducts(), monthly, months, q, source);
    sendJson(res, 200, {
      ok: true,
      products,
      warning: products.length ? "" : "Nenhum produto encontrado dentro desse orçamento. Tente aumentar o valor mensal ou o número de parcelas.",
    });
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
    const monthly = Number(url.searchParams.get("monthly") || "100");
    const months = Number(url.searchParams.get("months") || "12");
    const source = normalizeSource(url.searchParams.get("source") || "mercadolivre");
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

    const products = normalizeDemoProducts(readMercadoLivreDemoProducts(), monthly, months, q, source);
    sendJson(res, 200, {
      ok: true,
      mode: "mercadolivre",
      products,
      warning: products.length ? "" : "Nenhum produto encontrado dentro desse orçamento. Tente aumentar o valor mensal ou o número de parcelas.",
    });
    return;
  }

  if (pathname === "/teste-produtos") {
    send(res, 200, renderProductPage().replace(
      '<div class="mode-tabs" aria-label="Tipo de orçamento">',
      '<div class="mode-tabs" aria-label="Tipo de orçamento"><select id="sourceInput" name="source" class="source-select"><option value="mercadolivre" selected>Mercado Livre</option><option value="demo">Demo Mercado Livre</option><option value="amazon">Amazon</option><option value="magalu">Magalu</option></select>',
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

