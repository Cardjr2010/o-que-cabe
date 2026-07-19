const form = document.querySelector("#searchForm");
const productInput = document.querySelector("#productInput");
const monthlyInput = document.querySelector("#monthlyInput");
const monthsInput = document.querySelector("#monthsInput");
const totalBudgetInput = document.querySelector("#totalBudgetInput");
const totalField = document.querySelector("#totalField");
const monthsField = document.querySelector("#monthsField");
const monthlyLabel = document.querySelector("#monthlyLabel");
const marketline = document.querySelector("#marketline");
const modeButtons = document.querySelectorAll(".mode-tabs button[data-mode]");
const results = document.querySelector("#results");
const notice = document.querySelector("#notice");
const apiStatus = document.querySelector("#apiStatus");
const budgetTotal = document.querySelector("#budgetTotal");
const budgetLine = document.querySelector("#budgetLine");
const summaryTitle = document.querySelector("#summaryTitle");
const sourceBadge = document.querySelector("#sourceBadge");
const resultsArea = document.querySelector(".results-area");
const pechinchaGrid = document.querySelector("#pechinchaGrid");
const categoryGrid = document.querySelector("#categoryGrid");
const seoHotSearchesGrid = document.querySelector("#seoHotSearchesGrid");
const videoGuidesSection = document.querySelector("#videoGuidesSection");
const videoGuidesGrid = document.querySelector("#videoGuidesGrid");
const homeCatalogState = document.querySelector("#homeCatalogState");
const searchCategoriesHint = document.querySelector("#searchCategoriesHint");
const intentGrid = document.querySelector("#intentGrid");
const departmentsMenu = document.querySelector("#departmentsMenu");
const decisionHighlightsSection = document.querySelector("#decisions");
const decisionHighlightsGrid = document.querySelector("#decisionHighlightsGrid");
const trustTotalCatalog = document.querySelector("#trustTotalCatalog");
const trustDepartments = document.querySelector("#trustDepartments");
const trustSources = document.querySelector("#trustSources");
const trustUpdated = document.querySelector("#trustUpdated");
const trustUpdatedLabel = document.querySelector("#trustUpdatedLabel");
const appView = document.body.dataset.view || "home";
const apiEndpoint = document.body.dataset.endpoint || "/api/search";
let searchTimer = null;
let searchMode = form?.dataset.mode || "monthly";

function submitWithDeclaredBudget() {
  const budgetInput = searchMode === "total" ? totalBudgetInput : monthlyInput;
  if (Number(budgetInput?.value || 0) <= 0) {
    form?.scrollIntoView({ behavior: "smooth", block: "center" });
    budgetInput?.focus();
    return false;
  }
  form.requestSubmit();
  return true;
}

function setMode(nextMode) {
  searchMode = nextMode === "total" ? "total" : "monthly";
  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === searchMode);
  });
  if (searchMode === "total") {
    if (monthsField) monthsField.hidden = true;
    if (totalField) totalField.hidden = false;
    if (monthlyLabel) monthlyLabel.textContent = "Máx. mensal";
    if (monthlyInput) monthlyInput.disabled = true;
    if (monthsInput) monthsInput.disabled = true;
    if (totalBudgetInput) totalBudgetInput.disabled = false;
  } else {
    if (monthsField) monthsField.hidden = false;
    if (totalField) totalField.hidden = true;
    if (monthlyLabel) monthlyLabel.textContent = "Máx. mensal";
    if (monthlyInput) monthlyInput.disabled = false;
    if (monthsInput) monthsInput.disabled = false;
    if (totalBudgetInput) totalBudgetInput.disabled = true;
  }
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function safeText(value, fallback = "") {
  if (value == null || value === "") return fallback;
  return String(value);
}

function resolveProductTitle(product) {
  return safeText(
    product?.displayTitle || product?.originalTitle || product?.title,
    "Produto",
  );
}

function normalizeStatusLabel(value = "") {
  const text = String(value || "").trim().toUpperCase();
  if (!text) return "CABE";
  if (text.includes("APERT")) return "APERTADO";
  if (text.includes("NÃO") || text.includes("NAO") || text.includes("FORA")) return "NÃO CABE";
  if (text.includes("CABE")) return "CABE";
  return String(value);
}

function normalizeConditionLabel(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  const labels = {
    new: "Novo",
    used: "Usado",
    refurbished: "Recondicionado",
    reconditioned: "Recondicionado",
  };
  return labels[normalized] || String(value || "").trim();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isDemoProduct(product) {
  return String(product?.dataMode || product?.mode || "").toLowerCase() === "demo";
}

function normalizeSourceKey(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, " ")
    .replaceAll(/[_-]+/g, "_");
}

function formatSourceName(value = "") {
  const normalized = normalizeSourceKey(value);
  const sourceMap = {
    flores_online: "Flores Online",
    isabela_flores: "Isabela Flores",
    saldao_informatica: "Saldão da Informática",
    info_store: "Info Store",
    infostore: "Info Store",
    ccp: "CCP",
    authentical: "Authentical",
    mi_shop: "Mi Shop",
    mishop: "Mi Shop",
    actionpay: "Actionpay",
    actionpay_saldao: "Saldão da Informática",
    awin: "Awin",
    mercadolivre: "Mercado Livre",
    mercado_livre: "Mercado Livre",
    amazon: "Amazon",
    magalu: "Magalu",
    magazine_voce: "Magazine Você",
  };
  return sourceMap[normalized] || "";
}

function resolveSourceLabel(product) {
  if (isDemoProduct(product)) {
    return "Demonstração — sem anúncio real";
  }

  const candidates = [
    product?.sourceLabel,
    product?.sourceName,
    product?.sourceDisplayName,
    product?.marketplace,
    product?.source,
    product?.provider,
    product?.seller?.name,
    product?.seller,
    product?.store,
    product?.sourceType,
  ];

  for (const candidate of candidates) {
    const label = formatSourceName(candidate);
    if (label) return label;
  }

  const sourceText = candidates
    .map((item) => normalizeSourceKey(item))
    .filter(Boolean)
    .join(" ");
  if (sourceText.includes("saldao")) return "Saldão da Informática";
  if (sourceText.includes("flores")) return "Flores Online";
  if (sourceText.includes("isabela")) return "Isabela Flores";
  if (sourceText.includes("info store") || sourceText.includes("infostore")) return "Info Store";
  if (sourceText.includes("ccp")) return "CCP";
  if (sourceText.includes("authentical")) return "Authentical";
  if (sourceText.includes("mi_shop") || sourceText.includes("mishop")) return "Mi Shop";
  if (sourceText.includes("awin")) return "Awin";
  return "Origem não informada";
}

function resolveInstallmentInfo(product = {}) {
  const rawInstallments = product?.installments;
  const estimatedInstallment = product?.estimatedInstallment;
  const legacyCount = Number(product?.installmentMonths || product?.installmentsCount || product?.installmentCount || 0);
  const legacyAmount = Number(product?.installmentValue || product?.monthlyPrice || product?.installmentAmount || 0);
  const legacyTotal = Number(product?.installmentTotal || 0);

  if (rawInstallments && typeof rawInstallments === "object" && !Array.isArray(rawInstallments)) {
    const count = Number(rawInstallments.count || rawInstallments.months || 0);
    const amount = Number(rawInstallments.amount || rawInstallments.value || 0);
    const total = Number(rawInstallments.total || (count && amount ? Number((count * amount).toFixed(2)) : 0));
    const source = String(rawInstallments.source || "feed");
    const estimated = rawInstallments.estimated === true || source.toLowerCase() === "estimated";
    if (count > 0 && amount > 0) {
      return {
        count,
        amount,
        total,
        interestFree: rawInstallments.interestFree ?? null,
        source,
        confidence: Number(rawInstallments.confidence || 0),
        estimated,
        available: rawInstallments.available !== false,
      };
    }
  }

  if (legacyCount > 0 && legacyAmount > 0) {
    return {
      count: legacyCount,
      amount: legacyAmount,
      total: legacyTotal > 0 ? legacyTotal : Number((legacyCount * legacyAmount).toFixed(2)),
      interestFree: null,
      source: "legacy",
      confidence: 0,
      estimated: false,
      available: true,
    };
  }

  if (estimatedInstallment && typeof estimatedInstallment === "object") {
    const count = Number(estimatedInstallment.count || estimatedInstallment.months || 0);
    const amount = Number(estimatedInstallment.amount || estimatedInstallment.value || 0);
    if (count > 0 && amount > 0) {
      return {
        count,
        amount,
        total: Number((count * amount).toFixed(2)),
        interestFree: estimatedInstallment.interestFree ?? null,
        source: estimatedInstallment.source || "estimated",
        confidence: Number(estimatedInstallment.confidence || 0),
        estimated: true,
        available: true,
      };
    }
  }

  return null;
}
function productImage(product) {
  const image = product.image || product.thumbnail || "";
  if (image) {
    return `
      <img src="${escapeHtml(image)}" alt="" onerror="this.style.display='none'; const fallback=this.parentElement.querySelector('.image-fallback'); if (fallback) fallback.style.display='grid';">
      <div class="image-fallback" style="display:none">
        <img src="/logo-oqc.png" alt="" class="image-fallback-logo">
        <span>Imagem indisponível</span>
      </div>
    `;
  }
  return `
    <div class="image-fallback image-fallback-compact">
      <img src="/logo-oqc.png" alt="" class="image-fallback-logo">
      <span>Imagem indisponível</span>
    </div>
  `;
}

function formatPrice(value) {
  return Number.isFinite(value) && value > 0 ? currency.format(value) : "Conferir na loja";
}

function renderMarketSignal(product = {}) {
  const market = product.market || product.marketSnapshot;
  if (!market || typeof market !== "object") return "";
  const history = Array.isArray(market.priceHistory) ? market.priceHistory : [];
  const historyCount = Number(market.historyCount || history.length || 0);
  const historyPrices = history.map((item) => Number(item?.price || 0)).filter((price) => Number.isFinite(price) && price > 0);
  const currentPrice = Number(product.price || market.currentPrice || 0);
  const allPrices = [...historyPrices, currentPrice].filter((price) => Number.isFinite(price) && price > 0);
  const plausibleHistory = allPrices.length >= 2 && Math.max(...allPrices) / Math.min(...allPrices) <= 5;

  if (historyCount < 2 || !plausibleHistory) {
    return '<p class="small market-insufficient">Histórico de preço ainda insuficiente.</p>';
  }

  const details = [];
  if (historyCount >= 2 && market.trend && market.trend !== "insufficient") {
    details.push(escapeHtml(market.trendLabel || "Tendência calculada com o histórico disponível."));
  }
  if (historyCount >= 3 && market.priceIndicator && market.priceIndicator !== "insufficient") {
    details.push(escapeHtml(market.priceIndicatorLabel || "Faixa de preço calculada com o histórico disponível."));
  }
  if (historyCount >= 3 && market.marketAdvice && !/insuficiente/i.test(String(market.marketAdvice))) {
    details.push(escapeHtml(market.marketAdvice));
  }
  return details.length ? `<div class="market-signal">${details.map((item) => `<span>${item}</span>`).join("")}</div>` : "";
}

function buildProductCardHtml(product) {
  const installmentInfo = resolveInstallmentInfo(product);
  const installment = installmentInfo && Number.isFinite(installmentInfo.amount) && installmentInfo.amount > 0
    ? currency.format(installmentInfo.amount)
    : "";
  const total = formatPrice(product.price);
  const note = safeText(
    product.explanation || product.note,
    isDemoProduct(product)
      ? "Demonstração — sem anúncio real."
      : "Preço e disponibilidade devem ser confirmados na loja.",
  );
  const buttonLabel = resolveButtonLabel(product);
  const link = resolveProductLink(product);
  const hasLink = hasValidProductLink(product) && !isDemoProduct(product);
  const sourceLabel = resolveSourceLabel(product);
  const hasImage = Boolean(String(product.image || product.thumbnail || "").trim());
  const imageWarning = !hasImage && !isDemoProduct(product)
    ? `<p class="small warning">Imagem indisponível neste produto real.</p>`
    : "";
  const condition = String(product.condition || "").trim();

  return `
    <article class="card">
      <div class="image-box">${productImage(product)}</div>
      <div class="card-body">
        <span class="store">${escapeHtml(sourceLabel)}</span>
        <h2>${escapeHtml(resolveProductTitle(product))}</h2>
        ${condition ? `<p class="small"><strong>Condição:</strong> ${escapeHtml(normalizeConditionLabel(condition))}</p>` : ""}
        ${product.status ? `<p class="small"><strong>Status:</strong> ${escapeHtml(normalizeStatusLabel(product.status))}</p>` : ""}
        ${Number.isFinite(product.score) ? `<p class="small"><strong>Score O Que Cabe:</strong> ${Number(product.score).toFixed(0)}/100</p>` : ""}
        <p class="small">${escapeHtml(note)}</p>
        ${imageWarning}
        <div class="price">
          <div class="small">Preço total</div>
          <div class="installment">${total}</div>
          <div class="small">${
            installmentInfo
              ? `${installmentInfo.count}x de ${installment}${installmentInfo.interestFree === true ? " sem juros" : ""} · ${installmentInfo.estimated ? "Parcelamento estimado" : "Parcelamento informado pela fonte"}`
              : "Parcelamento não informado."
          }</div>
          ${installmentInfo?.estimated ? `<p class="small warning">Parcelamento estimado. Confirme na loja.</p>` : ""}
          ${renderMarketSignal(product)}
        </div>
        ${hasLink
          ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(buttonLabel)}</a>`
          : `<span class="offer-unavailable" aria-disabled="true">${escapeHtml(buttonLabel)}</span>`}
      </div>
    </article>
  `;
}
function renderProducts(products) {
  const confirmedProducts = appView === "home"
    ? (Array.isArray(products) ? products : []).filter((product) => !isDemoProduct(product))
    : (Array.isArray(products) ? products : []);
  if (!confirmedProducts.length) {
    const emptyMessage = appView === "products"
      ? "Nenhum produto encontrado dentro desse orçamento. Tente aumentar o valor mensal ou o número de parcelas."
      : appView === "mercadolivre"
        ? "Nenhum produto encontrado dentro desse orçamento. Tente outra categoria ou cadastre outra URL manual."
        : "Não encontramos uma oferta confirmada para esta busca.";
    results.innerHTML = `
      <article class="empty-state">
        <strong>Não encontramos uma oferta confirmada</strong>
        <span>${emptyMessage}</span>
      </article>
    `;
    return;
  }

  const visibleProducts = confirmedProducts.slice(0, 9).map((product) => buildProductCardHtml(product)).join("");
  const moreProducts = confirmedProducts.length > 9
    ? `<details class="oqc-more-results"><summary>Ver mais resultados (${confirmedProducts.length - 9})</summary><div class="grid">${confirmedProducts.slice(9, 18).map((product) => buildProductCardHtml(product)).join("")}</div></details>`
    : "";
  results.innerHTML = visibleProducts + moreProducts;
}

function renderBreakdown(breakdown = []) {
  if (!Array.isArray(breakdown) || !breakdown.length) return "";
  return `
    <details class="oqc-breakdown">
      <summary>Por que o OQC escolheu?</summary>
      <ul>
        ${breakdown.map((item) => `<li><strong>${safeText(item.factor, "Fator")}:</strong> ${safeText(item.earned, 0)}/${safeText(item.weight, 0)} - ${safeText(item.reason, "Preço e disponibilidade devem ser confirmados na loja.")}</li>`).join("")}
      </ul>
    </details>
  `;
}

function resolveButtonLabel(product) {
  if (isDemoProduct(product)) return "Demo — sem anúncio real";
  // Compatibilidade com testes legados: "Abrir anúncio"
  if (hasValidProductLink(product)) return "Abrir oferta";
  return "Link indisponível";
}

function renderRecommendationBlock(recommendations = []) {
  if (!Array.isArray(recommendations) || !recommendations.length) return "";
  const preferred = recommendations.filter((item) => normalizeStatusLabel(item?.product?.status || item?.product?.budgetStatus || "") !== "NÃO CABE");
  const itemsSource = preferred.length ? preferred : recommendations;
  const items = itemsSource.slice(0, 3).map((item) => {
    const product = item.product || {};
    const link = resolveProductLink(product);
    const hasLink = hasValidProductLink(product) && !isDemoProduct(product);
    const sourceLabel = resolveSourceLabel(product);
    const buttonLabel = resolveButtonLabel(product);
    const statusLabel = normalizeStatusLabel(product.status || product.budgetStatus || "CABE");
    const installmentInfo = resolveInstallmentInfo(product);
    return `
      <article class="oqc-recommendation">
        <div class="oqc-recommendation-head">
          <span class="oqc-rank">${item.rank}º</span>
          <div>
            <strong>${escapeHtml(item.label || "")}</strong>
            <p>${escapeHtml(safeText(item.reason, "Preço e disponibilidade devem ser confirmados na loja."))}</p>
          </div>
        </div>
        <span class="store">${escapeHtml(sourceLabel)}</span>
        <h3>${escapeHtml(resolveProductTitle(product))}</h3>
        <p class="small">${escapeHtml(statusLabel)} · Score ${Number.isFinite(product.score) ? product.score : 0}/100</p>
        <p class="small">${formatPrice(product.price)}</p>
        <p class="small">Base do O Que Cabe. ${escapeHtml(statusLabel)} no orçamento.</p>
        <p class="small">${
          installmentInfo
            ? `${installmentInfo.count}x de ${currency.format(installmentInfo.amount)}${installmentInfo.interestFree === true ? " sem juros" : ""}${installmentInfo.estimated ? " · Parcelamento estimado" : ""}`
            : "Parcelamento não informado."
        }</p>
        ${installmentInfo?.estimated ? `<p class="small warning">Parcelamento estimado. Confirme na loja.</p>` : ""}
        ${renderBreakdown(product.scoreBreakdown)}
        ${hasLink
          ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${buttonLabel}</a>`
          : `<span class="offer-unavailable" aria-disabled="true">${buttonLabel}</span>`}
      </article>
    `;
  }).join("");
  return `
    <section class="oqc-recommendations">
      <div class="oqc-recommendations-title">
        <span>Recomendação OQC</span>
        <strong>Top 3 escolhas para comparar rápido</strong>
      </div>
      <div class="oqc-recommendation-grid">${items}</div>
    </section>
  `;
}
function renderGroupedProducts(groups = null, products = []) {
  const readGroup = (bag, keys = []) => {
    if (!bag || typeof bag !== "object") return [];
    for (const key of keys) {
      if (Array.isArray(bag[key])) return bag[key];
    }
    return [];
  };
  const normalizedGroups = groups && typeof groups === "object"
    ? groups
    : {
        cabe: products.filter((item) => normalizeStatusLabel(item.status || item.budgetStatus || "") === "CABE"),
        apertado: products.filter((item) => normalizeStatusLabel(item.status || item.budgetStatus || "") === "APERTADO"),
        naoCabe: products.filter((item) => normalizeStatusLabel(item.status || item.budgetStatus || "") === "NÃO CABE"),
      };

  const sections = [
    {
      key: "cabe",
      title: "Melhores dentro do orçamento",
      description: "Prioridade para o que cabe sem aperto.",
      items: readGroup(normalizedGroups, ["cabe", "CABE"]),
    },
    {
      key: "apertado",
      title: "Cabem apertado",
      description: "Ainda funcionam, mas já exigem mais cuidado no bolso.",
      items: readGroup(normalizedGroups, ["apertado", "APERTADO"]),
    },
    {
      key: "naoCabe",
      title: "Fora do orçamento",
      description: "Não entram como recomendação principal.",
      items: readGroup(normalizedGroups, ["naoCabe", "nao_cabe", "NÃO CABE", "NÃO_CABE", "NAO_CABE"]),
    },
  ];

  const markup = sections
    .filter((section) => Array.isArray(section.items) && section.items.length)
    .map((section) => `
        <section class="oqc-product-group oqc-product-group-${section.key}">
          <div class="oqc-product-group-head">
          <div>
            <strong>${section.title}</strong>
            <p>${section.description}</p>
          </div>
          <span>${section.items.length} itens</span>
          </div>
          <div class="grid">
            ${section.items.slice(0, 3).map((product) => buildProductCardHtml(product)).join("")}
          </div>
          ${section.items.length > 3 ? `<details class="oqc-more-results"><summary>Ver mais resultados (${section.items.length - 3})</summary><div class="grid">${section.items.slice(3, 6).map((product) => buildProductCardHtml(product)).join("")}</div></details>` : ""}
        </section>
      `)
      .join("");

  return markup || "";
}

function renderTrips(trips) {
  if (!trips.length) {
    results.innerHTML = `
      <article class="empty-state">
        <strong>Nenhuma viagem encontrada</strong>
        <span>Tente outro destino ou deixe o campo em branco.</span>
      </article>
    `;
    return;
  }

  results.innerHTML = trips
    .map((trip) => `
      <article class="card">
        <div class="image-box">${trip.image ? `<img src="${trip.image}" alt="">` : "<div class='image-fallback'><img src='/logo-oqc.png' alt='' class='image-fallback-logo'><span>Imagem indisponível</span></div>"}</div>
        <div class="card-body">
            <span class="store">${trip.provider}</span>
          <h2>${trip.destination}</h2>
          <p class="small">${trip.duration}</p>
          <div class="price">
            <div class="small">Total</div>
            <div class="installment">${currency.format(trip.price)}</div>
            <div class="small">Simulação de viagem</div>
          </div>
          <a href="javascript:void(0)" role="button" aria-disabled="true">Ver pacote</a>
        </div>
      </article>
    `)
    .join("");
}

function resolveProductLink(product) {
  const candidates = [product?.affiliateUrl, product?.productUrl, product?.permalink, product?.url];
  for (const candidate of candidates) {
    if (isValidExternalUrl(candidate)) {
      return String(candidate).trim();
    }
  }
  return "";
}

function hasProductLink(product) {
  return hasValidProductLink(product);
}

function hasValidProductLink(product) {
  return Boolean(resolveProductLink(product));
}

function isValidExternalUrl(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return false;
  if (!/^https?:\/\//i.test(normalized)) return false;
  return !isGenericMarketplaceUrl(normalized);
}

function isGenericMarketplaceUrl(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return true;
  try {
    const parsed = new URL(normalized);
    if (/mercadolivre\.com\.br$/i.test(parsed.hostname) || /\.mercadolivre\.com\.br$/i.test(parsed.hostname)) {
      return !/\/MLB[\w-]+/i.test(parsed.pathname);
    }
  } catch {
    return true;
  }
  const genericPatterns = [
    "https://www.mercadolivre.com.br",
    "https://mercadolivre.com.br",
    "https://www.mercadolivre.com.br/",
    "https://mercadolivre.com.br/",
    "https://www.amazon.com",
    "https://amazon.com",
    "https://www.awin.com",
    "https://awin.com",
    "https://www.google.com",
    "https://google.com",
  ];
  return genericPatterns.some((item) => normalized === item || normalized.startsWith(`${item}?`));
}

function renderMercadoLivre(products, groups = null) {
  if (groups) {
    const html = renderGroupedProducts(groups, products);
    if (html) return html;
  }
  return renderProducts(products);
}

function isMercadoLivreUrl(value) {
  return /mercadolivre\.com\.br/i.test(value || "");
}

function normalizeHomeCategoryLabel(label = "") {
  const raw = String(label || "").trim();
  if (!raw) return "";
  const normalized = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const map = {
    celular: "Celulares",
    celulares: "Celulares",
    smartphone: "Smartphones",
    notebook: "Notebooks",
    notebooks: "Notebooks",
    tablet: "Tablets",
    tablets: "Tablets",
    tv: "TVs",
    tvs: "TVs",
    relogio: "Relógios",
    relogios: "Relógios",
    fone: "Fones",
    fones: "Fones",
    carregador: "Carregadores",
    carregadores: "Carregadores",
    cabo: "Cabos",
    cabos: "Cabos",
    pelicula: "Películas",
    peliculas: "Películas",
    capa: "Capas",
    capas: "Capas",
    monitor: "Monitores",
    monitores: "Monitores",
    ferramenta: "Ferramentas",
    ferramentas: "Ferramentas",
    ferragem: "Ferragens",
    ferragens: "Ferragens",
    construcao: "Casa e Construção",
    acessorio: "Acessórios",
    acessorios: "Acessórios",
    peca: "Peças",
    pecas: "Peças",
    casa: "Casa",
    presente: "Presentes",
    outros: "Outros",
  };
  return map[normalized] || raw;
}

function categoryIconSvg(category = "") {
  const normalized = String(category || "").toLowerCase();
  if (normalized.includes("celular")) return '<svg viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M12 18h.01"/></svg>';
  if (normalized.includes("notebook")) return '<svg viewBox="0 0 24 24"><path d="M4 5h16v10H4z"/><path d="M2 19h20"/></svg>';
  if (normalized.includes("tablet")) return '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 18h.01"/></svg>';
  if (normalized.includes("tv")) return '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>';
  if (normalized.includes("fone")) return '<svg viewBox="0 0 24 24"><path d="M4 13a8 8 0 0 1 16 0"/><path d="M6 13v4"/><path d="M18 13v4"/><path d="M6 17h2"/><path d="M16 17h2"/></svg>';
  if (normalized.includes("relog")) return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>';
  if (normalized.includes("carreg")) return '<svg viewBox="0 0 24 24"><path d="M7 3h10v6H7z"/><path d="M9 9h6v12H9z"/><path d="M12 12v4"/></svg>';
  if (normalized.includes("cabo")) return '<svg viewBox="0 0 24 24"><path d="M7 7h4v10H7z"/><path d="M13 7h4v10h-4z"/><path d="M11 12h2"/></svg>';
  if (normalized.includes("pelic")) return '<svg viewBox="0 0 24 24"><path d="M4 6h16v12H4z"/><path d="M8 10h8"/><path d="M8 14h5"/></svg>';
  if (normalized.includes("capa")) return '<svg viewBox="0 0 24 24"><path d="M6 4h12v16H6z"/><path d="M8 8h8"/><path d="M8 12h5"/></svg>';
  if (normalized.includes("casa")) return '<svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>';
  return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>';
}

function presetForCategory(category = "") {
  const normalized = String(category || "").toLowerCase();
  if (normalized.includes("celular")) return { mode: "monthly", monthly: "500", months: "12" };
  if (normalized.includes("notebook")) return { mode: "monthly", monthly: "1500", months: "10" };
  if (normalized.includes("tablet")) return { mode: "monthly", monthly: "500", months: "12" };
  if (normalized.includes("tv")) return { mode: "monthly", monthly: "500", months: "12" };
  if (normalized.includes("relog")) return { mode: "monthly", monthly: "300", months: "12" };
  if (normalized.includes("fone")) return { mode: "monthly", monthly: "100", months: "12" };
  if (normalized.includes("carreg")) return { mode: "total", totalBudget: "100", monthly: "100", months: "12" };
  if (normalized.includes("cabo")) return { mode: "total", totalBudget: "100", monthly: "100", months: "12" };
  if (normalized.includes("pelic")) return { mode: "total", totalBudget: "100", monthly: "100", months: "12" };
  if (normalized.includes("capa")) return { mode: "total", totalBudget: "100", monthly: "100", months: "12" };
  if (normalized.includes("monitor")) return { mode: "monthly", monthly: "250", months: "12" };
  if (normalized.includes("casa")) return { mode: "total", totalBudget: "250", monthly: "250", months: "12" };
  if (normalized.includes("presente")) return { mode: "total", totalBudget: "50", monthly: "50", months: "12" };
  return { mode: "monthly", monthly: "500", months: "12" };
}

const DEFAULT_HOME_DEPARTMENTS = [
  { category: "celular", label: "Celulares", count: 90 },
  { category: "notebook", label: "Notebooks", count: 77 },
  { category: "monitor", label: "Monitores", count: 121 },
  { category: "tv", label: "TVs", count: 42 },
  { category: "tablet", label: "Tablets", count: 18 },
  { category: "fone", label: "Fones", count: 16 },
];

const HOME_INTENTIONS = [
  { category: "celular", label: "Quero um celular", query: "celular", mode: "monthly" },
  { category: "notebook", label: "Quero um notebook", query: "notebook", mode: "monthly" },
  { category: "monitor", label: "Quero um monitor gamer", query: "monitor gamer", mode: "monthly" },
  { category: "tv", label: "Quero uma TV", query: "tv", mode: "monthly" },
  { category: "fone", label: "Quero um fone", query: "fone bluetooth", mode: "total" },
  { category: "presente", label: "Quero um presente", query: "presente", mode: "total" },
  { category: "casa", label: "Quero melhorar minha casa", query: "casa", mode: "total" },
  { category: "flores", label: "Quero flores", query: "flores", mode: "total" },
];

function normalizedCategoryTokens(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);
}

function normalizedCategoryString(value = "") {
  return normalizedCategoryTokens(value).join(" ");
}

function matchesCategoryIntent(item = {}, intent = {}) {
  const haystack = [
    item?.category,
    item?.label,
    item?.query,
  ]
    .map(normalizedCategoryString)
    .filter(Boolean)
    .join(" ");

  if (!haystack) return false;

  const needles = [intent.category, intent.query, intent.label]
    .map(normalizedCategoryString)
    .filter(Boolean);

  return needles.some((needle) => haystack.includes(needle) || needle.includes(haystack));
}

function buildIntentCardItems(items = []) {
  const pool = Array.isArray(items) ? items : [];
  const used = new Set();
  const entries = [];

  for (const intent of HOME_INTENTIONS) {
    const match = pool.find((item) => !used.has(item) && matchesCategoryIntent(item, intent));
    if (!match) continue;
    used.add(match);
    entries.push({
      ...match,
      category: match.category || intent.category,
      label: intent.label || match.label || normalizeHomeCategoryLabel(match.category),
      query: intent.query || match.query || match.category || intent.category,
      intent: {
        mode: intent.mode || match.intent?.mode || "monthly",
        monthly: match.intent?.monthly || match.intent?.totalBudget || undefined,
        totalBudget: match.intent?.totalBudget || match.intent?.monthly || undefined,
        months: match.intent?.months || 12,
      },
    });
    if (entries.length >= 8) break;
  }

  return entries;
}

function renderPurchaseIntentions(items = []) {
  if (!intentGrid) return;
  const entries = buildIntentCardItems(items);
  intentGrid.innerHTML = entries.length
    ? entries.map((item) => `
      <button type="button" class="intent-card" data-category="${escapeHtml(item.category)}" data-query="${escapeHtml(item.query || item.category || "")}" data-mode="${escapeHtml(item.intent?.mode || "monthly")}" data-monthly="${escapeHtml(String(item.intent?.monthly || item.intent?.totalBudget || 0))}" data-total-budget="${escapeHtml(String(item.intent?.totalBudget || item.intent?.monthly || 0))}" data-months="${escapeHtml(String(item.intent?.months || 12))}">
        <div class="intent-card-icon">${categoryIconSvg(item.category)}</div>
        <div class="intent-card-copy">
          <strong>${escapeHtml(item.label || `Quero ${normalizeHomeCategoryLabel(item.category).toLowerCase()}`)}</strong>
          <span>${escapeHtml(`${Number(item.count || 0)} itens reais`)}</span>
        </div>
      </button>
    `).join("")
    : "";

  intentGrid.querySelectorAll(".intent-card").forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.category || "";
      productInput.value = button.dataset.query || category || productInput.value || "";
      setMode(searchMode);
      submitWithDeclaredBudget();
    });
  });
}

function renderDepartmentMenu(items = [], placeholder = false) {
  if (!departmentsMenu) return;
  const entries = (Array.isArray(items) ? items : []).filter((item) => {
    const category = String(item?.category || "").toLowerCase();
    return category && !category.includes("outros") && !category.includes("pecas");
  }).slice(0, 6);
  departmentsMenu.innerHTML = entries.length
    ? entries.map((item) => `
      <button type="button" class="department-link" data-category="${escapeHtml(item.category || "")}">
        <strong>${escapeHtml(item.label || normalizeHomeCategoryLabel(item.category))}</strong>
        ${placeholder ? "" : `<span>${escapeHtml(`${Number(item.count || 0)} itens reais`)}</span>`}
      </button>
    `).join("")
    : "";

  departmentsMenu.querySelectorAll(".department-link").forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.category || "";
      productInput.value = category;
      setMode(searchMode);
      submitWithDeclaredBudget();
    });
  });
}

function renderDecisionHighlights(items = []) {
  if (!decisionHighlightsSection || !decisionHighlightsGrid) return;
  const entries = (Array.isArray(items) ? items : [])
    .filter((item) => item && item.category && !String(item.category).toLowerCase().includes("outros") && !String(item.category).toLowerCase().includes("pecas"))
    .slice(0, 4);

  if (!entries.length) {
    decisionHighlightsSection.hidden = true;
    decisionHighlightsGrid.innerHTML = "";
    return;
  }

  decisionHighlightsSection.hidden = false;
  decisionHighlightsGrid.innerHTML = entries.map((item) => `
    <button type="button" class="decision-card" data-category="${escapeHtml(item.category)}" data-query="${escapeHtml(item.query || item.category || "")}" data-mode="${escapeHtml(item.intent?.mode || item.mode || "monthly")}" data-monthly="${escapeHtml(String(item.intent?.monthly || item.monthly || item.intent?.totalBudget || item.totalBudget || 0))}" data-total-budget="${escapeHtml(String(item.intent?.totalBudget || item.totalBudget || item.intent?.monthly || item.monthly || 0))}" data-months="${escapeHtml(String(item.intent?.months || item.months || 12))}">
      <div class="decision-card-icon">${categoryIconSvg(item.category)}</div>
      <strong>${escapeHtml(item.label || normalizeHomeCategoryLabel(item.category))}</strong>
      <span>${escapeHtml(item.subtitle || `${Number(item.count || 0)} itens publicados`)}</span>
    </button>
  `).join("");

  decisionHighlightsGrid.querySelectorAll(".decision-card").forEach((card) => {
    card.addEventListener("click", () => {
      const category = card.dataset.category || "";
      const preset = presetForCategory(category);
      productInput.value = card.dataset.query || category;
      searchMode = card.dataset.mode === "total" ? "total" : (preset.mode === "total" ? "total" : "monthly");
      monthlyInput.value = card.dataset.monthly || preset.monthly || monthlyInput.value || "100";
      monthsInput.value = card.dataset.months || preset.months || monthsInput.value || "12";
      if (totalBudgetInput) totalBudgetInput.value = card.dataset.totalBudget || preset.totalBudget || totalBudgetInput.value || "500";
      modeButtons.forEach((item) => item.classList.toggle("active", item.dataset.mode === searchMode));
      setMode(searchMode);
      form.requestSubmit();
    });
  });
}

function renderSeoHotSearches(items = []) {
  if (!seoHotSearchesGrid) return;
  const entries = Array.isArray(items) ? items : [];
  seoHotSearchesGrid.innerHTML = entries.length
    ? entries.slice(0, 6).map((item) => `
      <button type="button" class="seo-hot-chip" data-query="${escapeHtml(item.query || item.label || "")}" data-category="${escapeHtml(item.category || "")}" data-mode="${escapeHtml(item.intent?.mode || "monthly")}" data-monthly="${escapeHtml(String(item.intent?.monthly || item.intent?.totalBudget || 0))}" data-total-budget="${escapeHtml(String(item.intent?.totalBudget || item.intent?.monthly || 0))}" data-months="${escapeHtml(String(item.intent?.months || 12))}">
      <strong>${escapeHtml(item.label || item.query || "Busca")}</strong>
      <span>${escapeHtml(`${Number(item.volume || 0)} buscas`)}</span>
    </button>
  `).join("")
    : "";

  seoHotSearchesGrid.querySelectorAll(".seo-hot-chip").forEach((button) => {
    button.addEventListener("click", () => {
      productInput.value = button.dataset.query || productInput.value || "celular";
      searchMode = button.dataset.mode === "total" ? "total" : "monthly";
      monthlyInput.value = button.dataset.monthly || monthlyInput.value || "500";
      monthsInput.value = button.dataset.months || monthsInput.value || "12";
      totalBudgetInput.value = button.dataset.totalBudget || button.dataset.monthly || totalBudgetInput.value || "500";
      modeButtons.forEach((item) => item.classList.toggle("active", item.dataset.mode === searchMode));
      setMode(searchMode);
      form.requestSubmit();
    });
  });
}

function renderFeaturedVideos(items = []) {
  if (!videoGuidesSection || !videoGuidesGrid) return;
  const entries = Array.isArray(items) ? items.slice(0, 5) : [];
  if (!entries.length) {
    videoGuidesSection.hidden = true;
    videoGuidesGrid.innerHTML = "";
    return;
  }

  videoGuidesSection.hidden = false;
  videoGuidesGrid.innerHTML = entries.map((item) => `
    <article class="video-guide-card">
      <div class="video-guide-top">
        <span class="video-guide-channel">${escapeHtml(item.channel || "Canal recomendado")}</span>
        <span class="video-guide-category">${escapeHtml(normalizeHomeCategoryLabel(item.category || "Produtos"))}</span>
      </div>
      <h3>${escapeHtml(item.product || item.title || "Video recomendado")}</h3>
      <p class="video-guide-title">${escapeHtml(item.title || "")}</p>
      <p class="video-guide-reason">${escapeHtml(item.reason || "Video para entender melhor o produto antes de comprar.")}</p>
      <div class="video-guide-actions">
        <a class="video-guide-link" href="${escapeHtml(item.url || "#")}" target="_blank" rel="noopener noreferrer">Ver video</a>
        <button type="button" class="video-guide-search" data-query="${escapeHtml(item.query || item.product || "")}" data-category="${escapeHtml(item.category || "")}">
          Buscar esse produto
        </button>
      </div>
    </article>
  `).join("");

  videoGuidesGrid.querySelectorAll(".video-guide-search").forEach((button) => {
    button.addEventListener("click", () => {
      const query = button.dataset.query || button.dataset.category || "";
      if (query) productInput.value = query;
      setMode("total");
      if (totalBudgetInput && !Number(totalBudgetInput.value || 0)) totalBudgetInput.value = "1500";
      form.requestSubmit();
    });
  });
}

function formatCompactNumber(value, fallback = "0") {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return fallback;
  return new Intl.NumberFormat("pt-BR").format(number);
}

function renderLoadingSkeletons(container, variant = "card", count = 3) {
  if (!container) return;
  const items = Array.from({ length: count }, () => {
    if (variant === "chip") {
      return `
        <div class="skeleton skeleton-chip" aria-hidden="true">
          <span class="skeleton-line skeleton-line-lg"></span>
          <span class="skeleton-line skeleton-line-sm"></span>
        </div>
      `;
    }
    if (variant === "intent") {
      return `
        <div class="skeleton skeleton-intent" aria-hidden="true">
          <span class="skeleton-badge"></span>
          <div>
            <span class="skeleton-line skeleton-line-lg"></span>
            <span class="skeleton-line skeleton-line-sm"></span>
          </div>
        </div>
      `;
    }
    if (variant === "decision") {
      return `
        <div class="skeleton skeleton-decision" aria-hidden="true">
          <span class="skeleton-badge"></span>
          <span class="skeleton-line skeleton-line-lg"></span>
          <span class="skeleton-line skeleton-line-sm"></span>
        </div>
      `;
    }
    return `
      <div class="skeleton skeleton-card" aria-hidden="true">
        <span class="skeleton-badge"></span>
        <span class="skeleton-line skeleton-line-lg"></span>
        <span class="skeleton-line skeleton-line-md"></span>
      </div>
    `;
  }).join("");
  container.innerHTML = items;
}

function renderTrustBand(data = {}) {
  const publishedProducts = Number(data.totalPublishedProducts ?? data.totalCatalogProducts ?? data.totalProducts ?? 0);
  const analyzedProducts = Number(data.totalCatalogProducts ?? data.totalProducts ?? publishedProducts ?? 0);
  const hiddenProducts = Number(data.hiddenProducts ?? Math.max(analyzedProducts - publishedProducts, 0));
  if (trustTotalCatalog) {
    trustTotalCatalog.textContent = publishedProducts ? formatCompactNumber(publishedProducts, "0") : "0";
  }
  if (trustDepartments) {
    trustDepartments.textContent = analyzedProducts ? formatCompactNumber(analyzedProducts, "0") : "0";
  }
  if (trustSources) {
    trustSources.textContent = hiddenProducts ? formatCompactNumber(hiddenProducts, "0") : "0";
  }
  if (trustUpdated) {
    const updatedAt = data.catalogUpdatedAt ? new Date(data.catalogUpdatedAt) : null;
    const validTimestamp = updatedAt && Number.isFinite(updatedAt.getTime());
    trustUpdated.textContent = validTimestamp ? "Catálogo atualizado" : "Catálogo ativo";
    if (trustUpdatedLabel) {
      trustUpdatedLabel.textContent = validTimestamp
        ? `em ${updatedAt.toLocaleDateString("pt-BR")} às ${updatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
        : "status da base";
    }
  }
}

async function loadHomeCatalogData() {
  if (appView !== "home") return;

  renderLoadingSkeletons(intentGrid, "intent", 8);
  renderLoadingSkeletons(decisionHighlightsGrid, "decision", 3);
  renderLoadingSkeletons(videoGuidesGrid, "card", 3);
  renderLoadingSkeletons(categoryGrid, "card", 6);
  renderLoadingSkeletons(seoHotSearchesGrid, "chip", 6);
  if (searchCategoriesHint) {
    searchCategoriesHint.textContent = "Intenções de compra: celular, notebook, monitor gamer, TV, fone, presente, casa e flores.";
  }

  try {
    const response = await fetch("/api/home-data");
    const data = await response.json();
    const categories = Array.isArray(data.categories) ? data.categories : [];
    const departments = Array.isArray(data.departmentCategories) ? data.departmentCategories : Array.isArray(data.departments) ? data.departments : categories;
    const pechinchas = Array.isArray(data.shortcuts) ? data.shortcuts : Array.isArray(data.pechinchas) ? data.pechinchas : [];
    const searchCategories = Array.isArray(data.searchCategories) ? data.searchCategories : departments;
    if (searchCategoriesHint) {
      const labels = searchCategories
        .filter((item) => item && item.category)
        .slice(0, 6)
        .map((item) => item.label || normalizeHomeCategoryLabel(item.category));
      searchCategoriesHint.textContent = labels.length
        ? `Intenções de compra: ${labels.join(", ")}.`
        : "Intenções de compra: Celulares, Notebooks, Monitores, TVs, Tablets e Fones.";
    }
    renderPurchaseIntentions(Array.isArray(data.homeButtons) && data.homeButtons.length ? data.homeButtons : categories);
    renderDecisionHighlights(pechinchas.length ? pechinchas : (Array.isArray(data.homeButtons) && data.homeButtons.length ? data.homeButtons : categories));
    renderFeaturedVideos(Array.isArray(data.featuredVideos) ? data.featuredVideos : []);
    renderSeoHotSearches(Array.isArray(data.seoHotSearches) ? data.seoHotSearches : []);
    renderTrustBand(data);

    if (categoryGrid) {
      const cardsSource = Array.isArray(data.homeButtons) && data.homeButtons.length ? data.homeButtons : categories;
      const cards = cardsSource
        .filter((item) => item && item.category && !String(item.category).toLowerCase().includes("outros") && !String(item.category).toLowerCase().includes("pecas"))
        .slice(0, 6)
        .map((item) => `
          <article data-category="${escapeHtml(item.category)}" data-query="${escapeHtml(item.query || item.category || "")}" data-mode="${escapeHtml(item.intent?.mode || "monthly")}" data-monthly="${escapeHtml(String(item.intent?.monthly || item.intent?.totalBudget || 0))}" data-total-budget="${escapeHtml(String(item.intent?.totalBudget || item.intent?.monthly || 0))}" data-months="${escapeHtml(String(item.intent?.months || 12))}">
          <div class="category-icon">${categoryIconSvg(item.category)}</div>
          <h3>${escapeHtml(item.label || normalizeHomeCategoryLabel(item.category))}</h3>
          <p>${escapeHtml(`${Number(item.count || 0)} itens reais`)}</p>
        </article>
      `)
        .join("");
      categoryGrid.innerHTML = cards || "";

      categoryGrid.querySelectorAll("article[data-category]").forEach((card) => {
        card.addEventListener("click", () => {
          const category = card.dataset.category || "";
          productInput.value = card.dataset.query || category;
          setMode(searchMode);
          submitWithDeclaredBudget();
        });
      });
    }

    if (homeCatalogState) {
      homeCatalogState.textContent = `${categories.length} categorias com produtos publicados no catálogo.`;
    }
  } catch {
    if (intentGrid) intentGrid.innerHTML = "";
    if (decisionHighlightsGrid) decisionHighlightsGrid.innerHTML = "";
    if (videoGuidesGrid) videoGuidesGrid.innerHTML = "";
    if (categoryGrid) categoryGrid.innerHTML = "";
    if (seoHotSearchesGrid) seoHotSearchesGrid.innerHTML = "";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector(".submit-button");
  const product = document.querySelector("#productInput").value.trim();
  const monthly = Number(document.querySelector("#monthlyInput").value || 0);
  const months = Number(document.querySelector("#monthsInput").value || 12);
  const totalBudgetInputValue = Number(document.querySelector("#totalBudgetInput")?.value || 0);
  const totalBudget = searchMode === "total" ? totalBudgetInputValue : monthly * months;
  const ceiling = searchMode === "total" ? totalBudget : monthly * months;

  if (!product || ceiling <= 0) {
    if (resultsArea) resultsArea.hidden = true;
    return;
  }

  button.disabled = true;
  button.textContent = "Buscando...";
  results.innerHTML = '<div class="skeleton skeleton-card" aria-hidden="true"><span class="skeleton-badge"></span><span class="skeleton-line skeleton-line-lg"></span><span class="skeleton-line skeleton-line-md"></span></div>';
  notice.hidden = true;
  resultsArea.hidden = false;
  resultsArea.classList.add("has-results");
  budgetTotal.textContent = currency.format(ceiling);
    if (searchMode === "total") {
      budgetLine.textContent = `Orçamento total: ${currency.format(totalBudget)}`;
      if (marketline) marketline.textContent = `Seu orçamento total: ${currency.format(totalBudget)}.`;
      if (monthlyLabel) monthlyLabel.textContent = "Máx. mensal";
      if (monthsField) monthsField.hidden = true;
      if (totalField) totalField.hidden = false;
      if (totalBudgetInput) totalBudgetInput.disabled = false;
    } else {
      budgetLine.textContent = `${currency.format(monthly)} por mês em até ${months}x`;
      if (marketline) marketline.textContent = `Seu teto estimado: ${currency.format(ceiling)}, considerando ${currency.format(monthly)} por mês em até ${months}x.`;
      if (monthlyLabel) monthlyLabel.textContent = "Máx. mensal";
      if (monthsField) monthsField.hidden = false;
      if (totalField) totalField.hidden = true;
      if (totalBudgetInput) totalBudgetInput.disabled = true;
    }
  summaryTitle.textContent = `Buscando ${product}...`;

  try {
    const params = new URLSearchParams();
    params.set("q", product);
    params.set("mode", searchMode);
    params.set("monthly", monthly);
    params.set("months", months);
    params.set("totalBudget", totalBudget);
    params.set("source", "mercadolivre");
    const endpoint = apiEndpoint;
    const response = await fetch(`${endpoint}?${params.toString()}`);
    if (!response.ok) throw new Error("SEARCH_UNAVAILABLE");
    const data = await response.json();
    const confirmedProducts = (Array.isArray(data.products) ? data.products : []).filter((item) => !isDemoProduct(item));

    if (apiStatus) {
      apiStatus.textContent = "Base do O Que Cabe";
      apiStatus.style.color = "#12805c";
    }
    if (appView === "home") {
      if (sourceBadge) {
        sourceBadge.textContent = "BASE DO O QUE CABE";
      }
      if (notice) notice.hidden = true;
    } else if (appView === "products") {
      if (sourceBadge) sourceBadge.textContent = "DummyJSON";
    } else if (appView === "travel") {
      if (sourceBadge) sourceBadge.textContent = "Viagem mock";
    }

    summaryTitle.textContent = confirmedProducts.length ? `Opções para ${product}` : `Nenhuma oferta confirmada para ${product}`;

    if (data.fallbackUsed && Number(data.fallbackCount || 0) > 0) {
      notice.hidden = false;
      notice.textContent = "Também encontramos anúncios diretos em fontes externas.";
    } else if (data.fallbackAttempted) {
      notice.hidden = false;
      notice.textContent = "Não encontramos opções adicionais nesta fonte.";
    } else if (confirmedProducts.length > 0 && confirmedProducts.length < 3) {
      notice.hidden = false;
      notice.textContent = "Encontramos poucas opções no catálogo atual.";
    }
    if (data.errors && data.errors.length && appView === "mercadolivre") {
      notice.hidden = false;
      notice.textContent = data.errors.map((item) => `${item.title || item.id}: ${item.error}`).join(" | ");
    }

    if (appView === "travel") {
      renderTrips(data.trips || []);
    } else if (appView === "mercadolivre") {
      const recommendations = renderRecommendationBlock(data.recommendations || []);
      const list = renderMercadoLivre(data.products || [], data.groups || null);
      results.innerHTML = `${recommendations}${list}`;
    } else {
      const groupedHtml = renderGroupedProducts(data.groups || null, confirmedProducts);
      if (groupedHtml) results.innerHTML = groupedHtml;
      else renderProducts(confirmedProducts);
    }
  } catch {
    notice.hidden = false;
    notice.textContent = "Não foi possível concluir a busca agora. Tente novamente em instantes.";
    summaryTitle.textContent = "Busca temporariamente indisponível";
    renderProducts([]);
  } finally {
    button.disabled = false;
    button.textContent = "Descobrir o que cabe";
  }
});

function triggerLiveSearch() {
  if (appView !== "mercadolivre") return;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const value = productInput.value.trim();
    if (value.length < 3) return;
    form.requestSubmit();
  }, 550);
}

document.querySelectorAll(".quick-row button").forEach((button) => {
  button.addEventListener("click", () => {
    productInput.value = button.dataset.query || button.dataset.product || "";
    if (button.dataset.mode === "total") {
      searchMode = "total";
      totalBudgetInput.value = button.dataset.totalBudget || button.dataset.monthly || totalBudgetInput.value || "500";
      monthlyInput.value = button.dataset.monthly || "100";
      monthsInput.value = button.dataset.months || "12";
      modeButtons.forEach((item) => item.classList.toggle("active", item.dataset.mode === "total"));
      if (totalBudgetInput) totalBudgetInput.disabled = false;
    } else {
      searchMode = button.dataset.mode || "monthly";
      monthlyInput.value = button.dataset.monthly || "";
      monthsInput.value = button.dataset.months || "12";
      if (totalBudgetInput) totalBudgetInput.value = button.dataset.totalBudget || totalBudgetInput.value || "500";
      modeButtons.forEach((item) => item.classList.toggle("active", item.dataset.mode === searchMode));
      if (totalBudgetInput) totalBudgetInput.disabled = true;
    }
    form.requestSubmit();
  });
});

document.querySelectorAll(".pechincha-card").forEach((button) => {
  button.addEventListener("click", () => {
    productInput.value = button.dataset.query || productInput.value || "celular";
    searchMode = button.dataset.mode === "total" ? "total" : "monthly";
    monthlyInput.value = button.dataset.monthly || monthlyInput.value || "50";
    monthsInput.value = button.dataset.months || monthsInput.value || "12";
    totalBudgetInput.value = button.dataset.totalBudget || button.dataset.monthly || totalBudgetInput.value || "500";
    modeButtons.forEach((item) => item.classList.toggle("active", item.dataset.mode === searchMode));
    setMode(searchMode);
    form.requestSubmit();
  });
});

if (appView === "home") {
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setMode(button.dataset.mode || "monthly");
    });
  });
  loadHomeCatalogData();
}

setMode(searchMode);

if (appView === "mercadolivre") {
  productInput.addEventListener("input", triggerLiveSearch);
  monthlyInput.addEventListener("input", triggerLiveSearch);
  monthsInput.addEventListener("change", triggerLiveSearch);
}










