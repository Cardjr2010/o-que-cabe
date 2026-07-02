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
const homeCatalogState = document.querySelector("#homeCatalogState");
const appView = document.body.dataset.view || "home";
const apiEndpoint = document.body.dataset.endpoint || "/api/search";
let searchTimer = null;
let searchMode = form?.dataset.mode || "monthly";

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
  if (text.includes("NAO") || text.includes("NÃO") || text.includes("NÃ") || text.includes("FORA")) return "NÃO CABE";
  if (text.includes("CABE")) return "CABE";
  return String(value);
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

function resolveSourceLabel(product) {
  if (isDemoProduct(product)) {
    return "Demonstração — sem anúncio real";
  }

  const source = String(product?.marketplace || product?.source || product?.store || "").trim().toLowerCase();
  const seller = String(product?.seller?.name || product?.seller || "").trim().toLowerCase();
  const sourceType = String(product?.sourceType || "").trim().toLowerCase();
  const sourceText = `${source} ${seller} ${sourceType}`;
  if (sourceText.includes("saldao")) return "Saldão da Informática";
  if (String(product?.sourceLabel || "").toLowerCase().includes("saldao")) return "Saldão da Informática";
  return "Origem não informada";
}

function productImage(product) {
  const image = product.image || product.thumbnail || "";
  if (image) {
    return `
      <img src="${image}" alt="" onerror="this.style.display='none'; const fallback=this.parentElement.querySelector('.image-fallback'); if (fallback) fallback.style.display='grid';">
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

function buildProductCardHtml(product) {
  const installment = Number.isFinite(product.installmentValue) && product.installmentValue > 0
    ? currency.format(product.installmentValue)
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

  return `
    <article class="card">
      <div class="image-box">${productImage(product)}</div>
      <div class="card-body">
        <span class="store">${escapeHtml(sourceLabel)}</span>
        <h2>${escapeHtml(resolveProductTitle(product))}</h2>
        ${product.status ? `<p class="small"><strong>Status:</strong> ${escapeHtml(normalizeStatusLabel(product.status))}</p>` : ""}
        ${Number.isFinite(product.score) ? `<p class="small"><strong>Score O Que Cabe:</strong> ${Number(product.score).toFixed(0)}/100</p>` : ""}
        <p class="small">${escapeHtml(note)}</p>
        ${imageWarning}
        <div class="price">
          <div class="small">Preço total</div>
          <div class="installment">${total}</div>
          <div class="small">${installment ? `${product.installments || "?"}x de ${installment} · ${currency.format(product.monthlyPrice || product.installmentValue)}/mês` : "Parcelamento não informado."}</div>
        </div>
        ${hasLink
          ? `<a href="${link}" target="_blank" rel="noopener">${escapeHtml(buttonLabel)}</a>`
          : `<a class="disabled" href="javascript:void(0)" role="button" aria-disabled="true">${escapeHtml(buttonLabel)}</a>`}
      </div>
    </article>
  `;
}

function renderProducts(products) {
  if (!products.length) {
    const emptyMessage = appView === "products"
      ? "Nenhum produto encontrado dentro desse orçamento. Tente aumentar o valor mensal ou o número de parcelas."
      : appView === "mercadolivre"
        ? "Nenhum produto encontrado dentro desse orçamento. Tente outra categoria ou cadastre outra URL manual."
        : "Tente aumentar a parcela, trocar o prazo ou buscar outro produto.";
    results.innerHTML = `
      <article class="empty-state">
        <strong>Nenhum produto coube nesse filtro</strong>
        <span>${emptyMessage}</span>
      </article>
    `;
    return;
  }

  results.innerHTML = products.map((product) => buildProductCardHtml(product)).join("");
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
        ${renderBreakdown(product.scoreBreakdown)}
        ${hasLink
          ? `<a href="${link}" target="_blank" rel="noopener">${buttonLabel}</a>`
          : `<a class="disabled" href="javascript:void(0)" role="button" aria-disabled="true">${buttonLabel}</a>`}
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
          ${section.items.map((product) => buildProductCardHtml(product)).join("")}
        </div>
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

async function loadHomeCatalogData() {
  if (appView !== "home") return;

  if (pechinchaGrid) pechinchaGrid.innerHTML = '<div class="catalog-loading">Carregando atalhos reais do catálogo...</div>';
  if (categoryGrid) categoryGrid.innerHTML = '<div class="catalog-loading">Carregando categorias reais do catálogo...</div>';

  try {
    const response = await fetch("/api/home-data");
    const data = await response.json();
    const categories = Array.isArray(data.categories) ? data.categories : [];
    const pechinchas = Array.isArray(data.shortcuts) ? data.shortcuts : Array.isArray(data.pechinchas) ? data.pechinchas : [];
    if (data.ok === false && homeCatalogState) {
      homeCatalogState.textContent = "O catálogo está sendo carregado aos poucos.";
    }

    if (categoryGrid) {
      const cards = categories
        .filter((item) => item && item.category && String(item.category).toLowerCase() !== "outros")
        .slice(0, 6)
        .map((item) => `
          <article data-category="${escapeHtml(item.category)}">
            <div class="category-icon">${categoryIconSvg(item.category)}</div>
            <h3>${escapeHtml(item.label || normalizeHomeCategoryLabel(item.category))}</h3>
            <p>${escapeHtml(`${Number(item.count || 0)} itens reais`)}</p>
          </article>
        `)
        .join("");
      categoryGrid.innerHTML = cards || '<div class="catalog-loading">Nenhuma categoria forte o suficiente foi encontrada ainda.</div>';

      categoryGrid.querySelectorAll("article[data-category]").forEach((card) => {
        card.addEventListener("click", () => {
          const category = card.dataset.category || "";
          const preset = presetForCategory(category);
          productInput.value = category;
          searchMode = preset.mode === "total" ? "total" : "monthly";
          monthlyInput.value = preset.monthly || monthlyInput.value || "100";
          monthsInput.value = preset.months || monthsInput.value || "12";
          if (totalBudgetInput) totalBudgetInput.value = preset.totalBudget || totalBudgetInput.value || "500";
          modeButtons.forEach((item) => item.classList.toggle("active", item.dataset.mode === searchMode));
          setMode(searchMode);
          form.requestSubmit();
        });
      });
    }

    if (pechinchaGrid) {
      const chips = pechinchas
        .slice(0, 5)
        .map((item) => `
          <button type="button" class="pechincha-card" data-query="${escapeHtml(item.query || item.category || "")}" data-mode="${escapeHtml(item.mode || "total")}" data-total-budget="${escapeHtml(String(item.totalBudget || item.monthly || 0))}" data-monthly="${escapeHtml(String(item.monthly || item.totalBudget || 0))}" data-months="${escapeHtml(String(item.months || 12))}">
            <strong>${escapeHtml(item.label || "Oferta")}</strong>
            <span>${escapeHtml(item.subtitle || `${Number(item.count || 0)} itens reais`)}</span>
          </button>
        `)
        .join("");
      pechinchaGrid.innerHTML = chips || '<div class="catalog-loading">Nenhuma pechincha real disponível no catálogo.</div>';

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
    }

    if (homeCatalogState) {
      const focusLabel = data.focusLabel || "Balcão de Informática";
      homeCatalogState.textContent = `${focusLabel}: ${categories.length} categorias reais e ${pechinchas.length} atalhos do catálogo`;
    }
  } catch {
    if (categoryGrid && !categoryGrid.children.length) {
      categoryGrid.innerHTML = '<div class="catalog-loading">Não foi possível carregar o catálogo real.</div>';
    }
    if (pechinchaGrid && !pechinchaGrid.children.length) {
      pechinchaGrid.innerHTML = '<div class="catalog-loading">Não foi possível carregar atalhos reais.</div>';
    }
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

  button.disabled = true;
  button.textContent = "Buscando...";
  results.innerHTML = "";
  notice.hidden = true;
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
    const data = await response.json();

    if (apiStatus) {
      apiStatus.textContent = "Base do O Que Cabe";
      apiStatus.style.color = "#12805c";
    }
    if (appView === "home") {
      if (sourceBadge) {
        sourceBadge.textContent = "BASE DO O QUE CABE";
      }
      if (notice) {
        notice.hidden = false;
        notice.textContent = "Resultados carregados a partir da base atual do O Que Cabe.";
      }
    } else if (appView === "products") {
      if (sourceBadge) sourceBadge.textContent = "DummyJSON";
    } else if (appView === "travel") {
      if (sourceBadge) sourceBadge.textContent = "Viagem mock";
    }

    summaryTitle.textContent = `Ofertas para ${product}`;

    if (data.warning) {
      notice.hidden = false;
      notice.textContent = data.warning;
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
      renderProducts(data.products || []);
    }
  } catch (error) {
    notice.hidden = false;
    notice.textContent = `Erro ao buscar: ${error.message}`;
  } finally {
    button.disabled = false;
    button.textContent = "Descobrir";
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


