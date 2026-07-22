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
const campaignsSection = document.querySelector("#campaignsSection");
const campaignGrid = document.querySelector("#campaignGrid");
const proofSection = document.querySelector("#proofSection");
const proofPublishedProducts = document.querySelector("#proofPublishedProducts");
const proofSummaryText = document.querySelector("#proofSummaryText");
const proofSummaryStats = document.querySelector("#proofSummaryStats");
const proofSourcesCount = document.querySelector("#proofSourcesCount");
const proofSourcesChips = document.querySelector("#proofSourcesChips");
const proofBrandsCount = document.querySelector("#proofBrandsCount");
const proofBrandsChips = document.querySelector("#proofBrandsChips");
const trustTotalCatalog = document.querySelector("#trustTotalCatalog");
const trustDepartments = document.querySelector("#trustDepartments");
const trustSources = document.querySelector("#trustSources");
const trustUpdated = document.querySelector("#trustUpdated");
const trustUpdatedLabel = document.querySelector("#trustUpdatedLabel");
const heroSection = document.querySelector("#heroSection");
const homeSecondarySections = document.querySelectorAll(".home-secondary-section");
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

function setSearchExperienceState(isActive) {
  document.body.classList.toggle("search-active", Boolean(isActive));
  if (heroSection) {
    heroSection.classList.toggle("hero-compact", Boolean(isActive));
  }
  homeSecondarySections.forEach((section) => {
    section.classList.toggle("home-secondary-hidden", Boolean(isActive));
  });
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
  return repairVisibleText(String(value));
}

function repairVisibleText(value = "") {
  const text = String(value || "");
  if (!text) return "";
  const replacements = [
    ["Ã¡", "á"],
    ["Ã ", "à"],
    ["Ã¢", "â"],
    ["Ã£", "ã"],
    ["Ã¤", "ä"],
    ["Ã©", "é"],
    ["Ãª", "ê"],
    ["Ã­", "í"],
    ["Ã³", "ó"],
    ["Ã´", "ô"],
    ["Ãµ", "õ"],
    ["Ã¶", "ö"],
    ["Ãº", "ú"],
    ["Ã§", "ç"],
    ["Ã‰", "É"],
    ["ÃŠ", "Ê"],
    ["Ã“", "Ó"],
    ["Ã”", "Ô"],
    ["Ãš", "Ú"],
    ["Ã‡", "Ç"],
    ["Ã£o", "ão"],
    ["Ãµes", "ões"],
    ["NÃ£o", "Não"],
    ["nÃ£o", "não"],
    ["NÃƒO", "NÃO"],
    ["opÃ§Ã£o", "opção"],
    ["OpÃ§Ã£o", "Opção"],
    ["econÃ´mica", "econômica"],
    ["catÃ¡logo", "catálogo"],
    ["CatÃ¡logo", "Catálogo"],
    ["acessÃ³rio", "acessório"],
    ["acessÃ³rios", "acessórios"],
    ["posiÃ§Ã£o", "posição"],
    ["orÃ§amento", "orçamento"],
    ["vÃ¡lido", "válido"],
    ["estÃ¡", "está"],
    ["mÃ¡x", "máx"],
    ["MÃ¡x", "Máx"],
  ];
  return replacements.reduce((acc, [from, to]) => acc.replaceAll(from, to), text);
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

function formatCampaignDate(value = "") {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "";
  return parsed.toLocaleDateString("pt-BR");
}

function renderCouponPricing(product = {}, storePrice = 0) {
  const finalPrice = Number(product.finalPrice || 0);
  const couponDiscount = Number(product.couponDiscount || 0);
  const cashback = Number(product.verifiedCashback || 0);
  const coupon = product?.coupon || {};
  const hasVerifiedCoupon = coupon?.status === "verified" && (couponDiscount > 0 || cashback > 0) && finalPrice > 0 && finalPrice < storePrice;

  if (!hasVerifiedCoupon) return "";

  const savings = couponDiscount + cashback;
  const benefitLabel = coupon?.code
    ? `Cupom ${coupon.code}`
    : "Campanha verificada";
  const disclaimer = coupon?.validUntil
    ? `Verificado ate ${formatCampaignDate(coupon.validUntil)}. Confirme a elegibilidade do anuncio na loja.`
    : "Campanha verificada. Confirme a elegibilidade do anuncio na loja.";

  return `
    <div class="price-highlight">
      <div class="small">Preco da loja</div>
      <div class="price-original">${formatPrice(storePrice)}</div>
      <div class="small">Preco final com cupom</div>
      <div class="installment price-final">${formatPrice(finalPrice)}</div>
      <div class="coupon-chip">${escapeHtml(benefitLabel)} · economia de ${escapeHtml(formatPrice(savings))}</div>
      <p class="small warning coupon-note">${escapeHtml(disclaimer)}</p>
    </div>
  `;
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

function resolveBudgetStatus(product = {}) {
  return normalizeStatusLabel(product.status || product.budgetStatus || "CABE");
}

function resolveBudgetBadge(product = {}) {
  const status = resolveBudgetStatus(product);
  if (status === "CABE") return { label: "Cabe no orçamento", tone: "fit" };
  if (status === "APERTADO") return { label: "Cabe apertado", tone: "tight" };
  return { label: "Fora do orçamento", tone: "over" };
}

function resolveSellerName(product = {}) {
  const seller = product.seller;
  if (seller && typeof seller === "object") {
    return safeText(
      seller.official_store_name ||
      seller.officialStoreName ||
      seller.nickname ||
      seller.name,
      "",
    );
  }
  if (typeof seller === "string") return seller.trim();
  return "";
}

function resolveSellerReputation(product = {}) {
  const seller = product.seller;
  const raw = seller && typeof seller === "object"
    ? seller.reputation || seller.level || product.sellerReputation
    : product.sellerReputation;
  return String(raw || "").trim();
}

function resolveShippingSummary(product = {}) {
  const shipping = product.shipping && typeof product.shipping === "object" ? product.shipping : {};
  const freeShipping = Boolean(
    product.freeShipping ??
    shipping.freeShipping ??
    shipping.free_shipping ??
    shipping.free,
  );
  const shippingPrice = Number(
    shipping.price ??
    shipping.cost ??
    product.shippingCost ??
    product.shipping_cost ??
    0,
  );
  if (freeShipping || shippingPrice === 0) {
    return { label: "Frete grátis", tone: "good" };
  }
  if (shippingPrice > 0) {
    return { label: `Frete ${currency.format(shippingPrice)}`, tone: "neutral" };
  }
  return { label: "Frete não informado", tone: "muted" };
}

function resolveStoreTrust(product = {}) {
  const officialStore = Boolean(
    product.officialStore ??
    product.official_store ??
    product.seller?.official_store_name,
  );
  if (officialStore) {
    return {
      label: "Loja oficial confirmada",
      detail: resolveSellerName(product) || resolveSourceLabel(product),
      tone: "verified",
    };
  }
  const sellerName = resolveSellerName(product);
  if (sellerName) {
    return {
      label: "Vendedor",
      detail: sellerName,
      tone: "seller",
    };
  }
  return {
    label: "Origem",
    detail: resolveSourceLabel(product),
    tone: "source",
  };
}

function buildInstallmentSummary(product = {}) {
  const info = resolveInstallmentInfo(product);
  if (!info) {
    return {
      short: "Parcelamento não informado",
      detail: "Consulte a oferta para confirmar parcelamento.",
      estimated: false,
      available: false,
    };
  }
  const short = `${info.count}x de ${currency.format(info.amount)}${info.interestFree === true ? " sem juros" : ""}`;
  const detail = info.estimated
    ? "Parcelamento estimado. Confirme na loja."
    : "Parcelamento real informado pela fonte.";
  return {
    short,
    detail,
    estimated: Boolean(info.estimated),
    available: true,
  };
}

function buildReasonSummary(product = {}) {
  return safeText(
    product.explanationShort ||
    product.explanation ||
    product.reason ||
    product.note,
    "Preço e disponibilidade devem ser confirmados na loja.",
  );
}

function buildReasonList(product = {}) {
  const items = [];
  const budgetBadge = resolveBudgetBadge(product);
  items.push(budgetBadge.label);
  if (product.officialStore || product.seller?.official_store_name) {
    items.push("Origem com identificação oficial");
  } else if (resolveSourceLabel(product) !== "Origem não informada") {
    items.push(`Origem identificada: ${resolveSourceLabel(product)}`);
  }
  const installment = buildInstallmentSummary(product);
  if (installment.available) items.push(installment.detail);
  const shipping = resolveShippingSummary(product);
  if (shipping.label) items.push(shipping.label);
  const reputation = resolveSellerReputation(product);
  if (reputation) items.push(`Reputação informada: ${reputation}`);
  if (product.coupon?.status === "verified" && Number(product.finalPrice || 0) > 0 && Number(product.finalPrice || 0) < Number(product.price || 0)) {
    items.push("Preço final com cupom verificado");
  }
  return items.slice(0, 5);
}

function renderFactPills(product = {}) {
  const budget = resolveBudgetBadge(product);
  const shipping = resolveShippingSummary(product);
  const installment = buildInstallmentSummary(product);
  const trust = resolveStoreTrust(product);
  const pills = [
    `<span class="result-pill result-pill-${budget.tone}">${escapeHtml(budget.label)}</span>`,
    `<span class="result-pill result-pill-neutral">${escapeHtml(shipping.label)}</span>`,
    installment.available ? `<span class="result-pill result-pill-${installment.estimated ? "muted" : "good"}">${escapeHtml(installment.short)}</span>` : "",
    trust.detail ? `<span class="result-pill result-pill-${trust.tone}">${escapeHtml(trust.label)}: ${escapeHtml(trust.detail)}</span>` : "",
  ].filter(Boolean);
  return pills.length ? `<div class="result-pills">${pills.join("")}</div>` : "";
}

function buildResultPriceBlock(product = {}) {
  const storePrice = Number(product.price || 0);
  const couponMarkup = renderCouponPricing(product, storePrice);
  const installment = buildInstallmentSummary(product);
  return `
    <div class="result-price-block">
      ${couponMarkup || `
        <div class="result-price-stack">
          <span class="result-label">Preço</span>
          <strong class="result-price">${formatPrice(storePrice)}</strong>
        </div>
      `}
      <p class="result-installment ${installment.estimated ? "estimated" : ""}">${escapeHtml(installment.short)}</p>
      <p class="result-support">${escapeHtml(installment.detail)}</p>
    </div>
  `;
}

function buildPrimaryDecisionItems(data = {}) {
  const products = Array.isArray(data.products) ? data.products : [];
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
  const principalProducts = products.filter((item) => !item?.isAccessory && !["accessory", "piece", "compatible"].includes(String(item?.productType || "").toLowerCase()));
  const rankedPool = principalProducts.length ? principalProducts : products;
  const bestPurchase = recommendations[0]?.product || rankedPool[0] || null;
  const cheapestReliable = [...rankedPool]
    .filter((item) => Number(item.price || 0) > 0 && hasValidProductLink(item))
    .sort((left, right) => Number(left.finalPrice || left.price || 0) - Number(right.finalPrice || right.price || 0))[0] || null;
  const bestInstallment = [...rankedPool]
    .filter((item) => resolveInstallmentInfo(item)?.available)
    .sort((left, right) => {
      const leftInfo = resolveInstallmentInfo(left);
      const rightInfo = resolveInstallmentInfo(right);
      return Number(leftInfo?.amount || Infinity) - Number(rightInfo?.amount || Infinity);
    })[0] || null;
  const candidates = [
    {
      key: "best-purchase",
      order: 1,
      title: "Melhor compra",
      note: "Equilíbrio entre adequação ao orçamento, origem e contexto da oferta.",
      product: bestPurchase,
    },
    {
      key: "best-price",
      order: 2,
      title: "Menor preço confiável",
      note: "Menor preço entre ofertas com origem e link direto confirmados.",
      product: cheapestReliable,
    },
    {
      key: "best-installment",
      order: 3,
      title: "Melhor parcelamento",
      note: "Menor parcela real disponível entre as opções relevantes.",
      product: bestInstallment,
    },
  ].filter((item) => item.product);

  const seen = new Set();
  const unique = [];
  for (const item of candidates) {
    const product = item.product || {};
    const identity = String(
      product.id ||
      product.externalId ||
      product.sourceProductId ||
      product.permalink ||
      product.productUrl ||
      product.url ||
      product.title ||
      "",
    );
    if (!identity || seen.has(identity)) continue;
    seen.add(identity);
    unique.push(item);
  }
  return unique;
}

function buildDecisionCards(data = {}) {
  const decisions = buildPrimaryDecisionItems(data);
  if (!decisions.length) return "";
  const singleCardMode = decisions.length === 1;
  return `
    <section class="decision-strip ${singleCardMode ? "decision-strip-single" : ""}">
      ${decisions.map((item) => {
        const product = item.product || {};
        const priceValue = Number(product.finalPrice || product.price || 0);
        const installment = buildInstallmentSummary(product);
        return `
          <article class="decision-summary-card">
            <div class="decision-summary-top">
              <span class="decision-summary-order">#${item.order || 1}</span>
              <span class="decision-summary-label">${escapeHtml(singleCardMode ? "Melhor compra encontrada" : item.title)}</span>
              <span class="decision-summary-source">${escapeHtml(resolveSourceLabel(product))}</span>
            </div>
            <h3>${escapeHtml(resolveProductTitle(product))}</h3>
            <strong class="decision-summary-price">${formatPrice(priceValue)}</strong>
            <p class="decision-summary-meta">${escapeHtml(installment.short)}</p>
            <p class="decision-summary-note">${escapeHtml(singleCardMode ? "Única oferta principal confirmada para esta busca no catálogo atual." : item.note)}</p>
          </article>
        `;
      }).join("")}
    </section>
  `;
}

function buildComparisonBlock(data = {}) {
  const products = Array.isArray(data.products) ? data.products : [];
  const official = products.find((item) => Boolean(item?.officialStore ?? item?.official_store ?? item?.seller?.official_store_name));
  const general = products[0] || null;
  if (!official && !general) return "";
  const officialPrice = Number(official?.finalPrice || official?.price || 0);
  const generalPrice = Number(general?.finalPrice || general?.price || 0);
  const diff = officialPrice > 0 && generalPrice > 0 ? officialPrice - generalPrice : 0;
  const officialInstallment = buildInstallmentSummary(official || {});
  const generalInstallment = buildInstallmentSummary(general || {});
  const officialShipping = resolveShippingSummary(official || {});
  const generalShipping = resolveShippingSummary(general || {});
  const officialRep = resolveSellerReputation(official || {}) || "Não informada";
  const generalRep = resolveSellerReputation(general || {}) || "Não informada";
  const finalRecommendation = diff > 0
    ? "A melhor oferta geral entrega economia sem abrir mão de origem identificada."
    : official
      ? "A loja oficial continua como referência de segurança para esta busca."
      : "A melhor oferta geral é a referência mais completa nesta consulta.";
  return `
    <section class="result-comparison">
      <div class="section-head section-head-tight">
        <div>
          <p class="panel-label">Comparativo rápido</p>
          <h3>Loja oficial x melhor oferta geral</h3>
        </div>
        <p class="section-note">Comparação objetiva entre segurança, preço final e condições operacionais.</p>
      </div>
      <div class="comparison-grid">
        <article class="comparison-card">
          <span class="comparison-kicker">Loja oficial</span>
          <h4>${escapeHtml(official ? resolveProductTitle(official) : "Sem loja oficial confirmada")}</h4>
          <p class="comparison-price">${official ? formatPrice(officialPrice) : "—"}</p>
          <ul class="comparison-list">
            <li><strong>Fonte:</strong> ${escapeHtml(official ? resolveSourceLabel(official) : "Não confirmada")}</li>
            <li><strong>Reputação:</strong> ${escapeHtml(officialRep)}</li>
            <li><strong>Frete:</strong> ${escapeHtml(officialShipping.label)}</li>
            <li><strong>Parcelamento:</strong> ${escapeHtml(officialInstallment.short)}</li>
          </ul>
        </article>
        <article class="comparison-card comparison-card-highlight">
          <span class="comparison-kicker">Melhor oferta geral</span>
          <h4>${escapeHtml(general ? resolveProductTitle(general) : "Sem oferta confirmada")}</h4>
          <p class="comparison-price">${general ? formatPrice(generalPrice) : "—"}</p>
          <ul class="comparison-list">
            <li><strong>Fonte:</strong> ${escapeHtml(general ? resolveSourceLabel(general) : "Não confirmada")}</li>
            <li><strong>Reputação:</strong> ${escapeHtml(generalRep)}</li>
            <li><strong>Frete:</strong> ${escapeHtml(generalShipping.label)}</li>
            <li><strong>Parcelamento:</strong> ${escapeHtml(generalInstallment.short)}</li>
          </ul>
        </article>
      </div>
      <div class="comparison-summary">
        <span><strong>Diferença:</strong> ${official && general && diff !== 0 ? `${diff > 0 ? "-" : "+"}${formatPrice(Math.abs(diff))}` : "Sem base suficiente"}</span>
        <span><strong>Segurança:</strong> ${official ? "Loja oficial confirmada disponível" : "Sem loja oficial confirmada nesta busca"}</span>
        <span><strong>Recomendação:</strong> ${escapeHtml(finalRecommendation)}</span>
      </div>
    </section>
  `;
}

function buildProductCardHtml(product) {
  const note = buildReasonSummary(product);
  const buttonLabel = resolveButtonLabel(product);
  const link = resolveProductLink(product);
  const hasLink = hasValidProductLink(product) && !isDemoProduct(product);
  const sourceLabel = resolveSourceLabel(product);
  const hasImage = Boolean(String(product.image || product.thumbnail || "").trim());
  const imageWarning = !hasImage && !isDemoProduct(product)
    ? `<p class="small warning">Imagem indisponível neste produto real.</p>`
    : "";
  const condition = String(product.condition || "").trim();
  const budget = resolveBudgetBadge(product);
  const trust = resolveStoreTrust(product);
  const reputation = resolveSellerReputation(product);
  const reasons = buildReasonList(product);

  return `
    <article class="result-card">
      <div class="result-card-media"><div class="image-box">${productImage(product)}</div></div>
      <div class="result-card-body">
        <div class="result-card-top">
          <div>
            <span class="store">${escapeHtml(sourceLabel)}</span>
            <h2>${escapeHtml(resolveProductTitle(product))}</h2>
          </div>
          <span class="result-budget-badge result-budget-badge-${budget.tone}">${escapeHtml(budget.label)}</span>
        </div>
        <div class="result-meta-grid">
          <div><span class="result-label">${escapeHtml(trust.label)}</span><strong>${escapeHtml(trust.detail || sourceLabel)}</strong></div>
          <div><span class="result-label">Condição</span><strong>${escapeHtml(condition ? normalizeConditionLabel(condition) : "Não informada")}</strong></div>
          <div><span class="result-label">Reputação</span><strong>${escapeHtml(reputation || "Não informada")}</strong></div>
        </div>
        ${renderFactPills(product)}
        ${buildResultPriceBlock(product)}
        <div class="result-card-footer">
          <div class="result-card-actions">
            ${hasLink
              ? `<a class="result-offer-button" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(buttonLabel)}</a>`
              : `<span class="offer-unavailable" aria-disabled="true">${escapeHtml(buttonLabel)}</span>`}
            <details class="result-why result-analysis-panel">
              <summary>Por que recomendamos?</summary>
              <div class="result-why-body">
                <p class="result-reason">${escapeHtml(note)}</p>
                ${renderMarketSignal(product)}
                ${imageWarning}
                <div class="result-analysis-meta">
                  <div><span class="result-label">${escapeHtml(trust.label)}</span><strong>${escapeHtml(trust.detail || sourceLabel)}</strong></div>
                  <div><span class="result-label">Condição</span><strong>${escapeHtml(condition ? normalizeConditionLabel(condition) : "Não informada")}</strong></div>
                  <div><span class="result-label">Reputação</span><strong>${escapeHtml(reputation || "Não informada")}</strong></div>
                </div>
                <ul>
                  ${reasons.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
              </div>
            </details>
          </div>
        </div>
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
      description: "Primeiras opções para decidir sem apertar o orçamento.",
      items: readGroup(normalizedGroups, ["cabe", "CABE"]),
    },
    {
      key: "apertado",
      title: "Cabem apertado",
      description: "Ainda são possíveis, mas pedem mais atenção no valor final.",
      items: readGroup(normalizedGroups, ["apertado", "APERTADO"]),
    },
    {
      key: "naoCabe",
      title: "Fora do orçamento",
      description: "Ficam fora da recomendação principal para esta busca.",
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
          <div class="result-card-grid">
            ${section.items.slice(0, 2).map((product) => buildProductCardHtml(product)).join("")}
          </div>
          ${section.items.length > 2 ? `<details class="oqc-more-results"><summary>Ver mais resultados (${section.items.length - 2})</summary><div class="result-card-grid">${section.items.slice(2, 5).map((product) => buildProductCardHtml(product)).join("")}</div></details>` : ""}
        </section>
      `)
      .join("");

  return markup || "";
}

function renderResultsExperience(data = {}, products = []) {
  const advisor = data.advisor || {};
  const overview = safeText(advisor.overview || data.summary, "Mostramos apenas ofertas confirmadas e alinhadas com a sua busca.");
  const comparison = buildComparisonBlock(data);
  const decisions = buildDecisionCards(data);
  const grouped = renderGroupedProducts(data.groups || null, products);
  return `
    <section class="results-intro">
      <div class="section-head section-head-tight">
        <div>
          <p class="panel-label">Leitura do OQC</p>
          <h3>Três decisões claras para esta busca</h3>
        </div>
        <p class="section-note">${escapeHtml(overview)}</p>
      </div>
      ${decisions}
    </section>
    ${comparison}
    ${grouped}
  `;
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
    if (entries.length >= 6) break;
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
        <span class="home-card-arrow" aria-hidden="true">→</span>
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
    .slice(0, 3);

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

function renderActiveCampaigns(items = []) {
  const section = campaignsSection;
  const grid = campaignGrid;
  if (!section || !grid) return;
  const entries = Array.isArray(items) ? items.slice(0, 3) : [];
  if (!entries.length) {
    section.hidden = true;
    grid.innerHTML = "";
    return;
  }

  section.hidden = false;
  grid.innerHTML = entries.map((item) => `
    <button type="button" class="campaign-card" data-query="${escapeHtml(item.query || "")}" data-mode="${escapeHtml(item.intent?.mode || "total")}" data-monthly="${escapeHtml(String(item.intent?.monthly || 0))}" data-total-budget="${escapeHtml(String(item.intent?.totalBudget || 0))}" data-months="${escapeHtml(String(item.intent?.months || 12))}">
      <div class="campaign-card-top">
        <span class="campaign-badge">${escapeHtml(item.badge || "Campanha")}</span>
        <span class="campaign-source">${escapeHtml(item.sourceLabel || "Fonte parceira")}</span>
      </div>
      <strong>${escapeHtml(item.headline || item.label || "Campanha ativa")}</strong>
      <p>${escapeHtml(item.description || item.label || "")}</p>
      <div class="campaign-meta">
        ${item.code ? `<span>Codigo ${escapeHtml(item.code)}</span>` : `<span>Oferta monitorada</span>`}
        ${item.validUntil ? `<span>Valido ate ${escapeHtml(formatCampaignDate(item.validUntil))}</span>` : `<span>Abra para revisar no OQC</span>`}
      </div>
    </button>
  `).join("");

  grid.querySelectorAll(".campaign-card").forEach((card) => {
    card.addEventListener("click", () => {
      const query = card.dataset.query || "";
      if (query) productInput.value = query;
      searchMode = card.dataset.mode === "monthly" ? "monthly" : "total";
      if (monthlyInput && card.dataset.monthly) monthlyInput.value = card.dataset.monthly;
      if (monthsInput && card.dataset.months) monthsInput.value = card.dataset.months;
      if (totalBudgetInput && card.dataset.totalBudget) totalBudgetInput.value = card.dataset.totalBudget;
      setMode(searchMode);
      form.requestSubmit();
    });
  });
}

function renderProofSection(data = {}) {
  if (!proofSection) return;

  const publishedProducts = Number(data.totalPublishedProducts ?? data.totalCatalogProducts ?? data.totalProducts ?? 0);
  const analyzedProducts = Number(data.totalCatalogProducts ?? data.totalProducts ?? publishedProducts ?? 0);
  const hiddenProducts = Number(data.hiddenProducts ?? Math.max(analyzedProducts - publishedProducts, 0));
  const topSources = Array.isArray(data.topSources) ? data.topSources.filter(Boolean).slice(0, 4) : [];
  const topBrands = Array.isArray(data.topBrands) ? data.topBrands.filter(Boolean).slice(0, 6) : [];

  if (!publishedProducts && !topSources.length && !topBrands.length) {
    proofSection.hidden = true;
    return;
  }

  proofSection.hidden = false;

  if (proofPublishedProducts) {
    proofPublishedProducts.textContent = `${formatCompactNumber(publishedProducts, "0")} produtos publicados`;
  }

  if (proofSummaryText) {
    proofSummaryText.textContent = topSources.length
      ? `O OQC cruza fontes reais e prioriza o que chega com melhor contexto para decisão.`
      : "O OQC organiza produtos reais publicados com filtros de qualidade antes de mostrar qualquer recomendacao.";
  }

  if (proofSummaryStats) {
    proofSummaryStats.innerHTML = [
      `${formatCompactNumber(analyzedProducts, "0")} analisados`,
      `${formatCompactNumber(hiddenProducts, "0")} ocultos`,
      data.catalogUpdatedAt ? "Catalogo com leitura recente" : "Catalogo ativo",
    ].map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  }

  if (proofSourcesCount) {
    proofSourcesCount.textContent = `${formatCompactNumber(topSources.length, "0")} fontes`;
  }

  if (proofSourcesChips) {
    proofSourcesChips.innerHTML = topSources.length
      ? topSources.map((item) => `
        <span class="proof-chip">
          <strong>${escapeHtml(item.source || "Fonte")}</strong>
          <small>${escapeHtml(`${formatCompactNumber(item.count || 0, "0")} produtos`)}</small>
        </span>
      `).join("")
      : '<span class="proof-chip proof-chip-muted"><strong>Sem fontes destacadas</strong><small>O catalogo segue ativo.</small></span>';
  }

  if (proofBrandsCount) {
    proofBrandsCount.textContent = `${formatCompactNumber(topBrands.length, "0")} marcas`;
  }

  if (proofBrandsChips) {
    proofBrandsChips.innerHTML = topBrands.length
      ? topBrands.map((item) => {
        const label = typeof item === "string" ? item : item?.brand || item?.label || "";
        const count = typeof item === "string" ? null : item?.count;
        return `
          <span class="proof-chip">
            <strong>${escapeHtml(label || "Marca")}</strong>
            <small>${escapeHtml(count ? `${formatCompactNumber(count, "0")} produtos` : "Cobertura real")}</small>
          </span>
        `;
      }).join("")
      : '<span class="proof-chip proof-chip-muted"><strong>Sem marcas destacadas</strong><small>Dados publicos seguem disponiveis.</small></span>';
  }
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
  const entries = Array.isArray(items) ? items.slice(0, 3) : [];
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

  renderLoadingSkeletons(intentGrid, "intent", 6);
  renderLoadingSkeletons(decisionHighlightsGrid, "decision", 3);
  renderLoadingSkeletons(campaignGrid, "decision", 3);
  renderLoadingSkeletons(videoGuidesGrid, "card", 3);
  renderLoadingSkeletons(categoryGrid, "card", 6);
  renderLoadingSkeletons(seoHotSearchesGrid, "chip", 6);
  if (searchCategoriesHint) {
    searchCategoriesHint.textContent = "Ex.: celular até R$ 1.500, notebook para estudar, TV 55 ou monitor gamer 144 Hz.";
  }

  try {
    const response = await fetch("/api/home-data");
    const data = await response.json();
    const categories = Array.isArray(data.categories) ? data.categories : [];
    const departments = Array.isArray(data.departmentCategories) ? data.departmentCategories : Array.isArray(data.departments) ? data.departments : categories;
    const decisionHighlights = Array.isArray(data.decisionHighlights) ? data.decisionHighlights : [];
    const pechinchas = Array.isArray(data.shortcuts) ? data.shortcuts : Array.isArray(data.pechinchas) ? data.pechinchas : [];
    const searchCategories = Array.isArray(data.searchCategories) ? data.searchCategories : departments;
    if (searchCategoriesHint) {
      const labels = searchCategories
        .filter((item) => item && item.category)
        .slice(0, 6)
        .map((item) => item.label || normalizeHomeCategoryLabel(item.category));
      searchCategoriesHint.textContent = labels.length
        ? `Busque direto por: ${labels.join(", ")}.`
        : "Busque direto por: Celulares, Notebooks, Monitores, TVs, Tablets e Áudio.";
    }
    renderPurchaseIntentions(Array.isArray(data.homeButtons) && data.homeButtons.length ? data.homeButtons : categories);
    renderDecisionHighlights(
      decisionHighlights.length
        ? decisionHighlights
        : pechinchas.length
          ? pechinchas
          : (Array.isArray(data.homeButtons) && data.homeButtons.length ? data.homeButtons : categories),
    );
    renderActiveCampaigns(Array.isArray(data.activeCampaigns) ? data.activeCampaigns : []);
    renderProofSection(data);
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
            <span class="home-card-arrow" aria-hidden="true">→</span>
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
      homeCatalogState.textContent = `${categories.length} áreas com cobertura suficiente.`;
    }
  } catch {
    if (intentGrid) intentGrid.innerHTML = "";
    if (decisionHighlightsGrid) decisionHighlightsGrid.innerHTML = "";
    if (campaignGrid) campaignGrid.innerHTML = "";
    if (videoGuidesGrid) videoGuidesGrid.innerHTML = "";
    if (categoryGrid) categoryGrid.innerHTML = "";
    if (seoHotSearchesGrid) seoHotSearchesGrid.innerHTML = "";
  }
}

function initSearchFromUrl() {
  if (appView !== "home") return;
  const params = new URLSearchParams(window.location.search);
  const query = (params.get("q") || "").trim();
  if (!query) return;

  const nextMode = (params.get("mode") || "monthly").toLowerCase() === "total" ? "total" : "monthly";
  const monthly = params.get("monthly") || "";
  const months = params.get("months") || "12";
  const totalBudget = params.get("totalBudget") || "";

  if (productInput) productInput.value = query;
  if (monthlyInput && monthly) monthlyInput.value = monthly;
  if (monthsInput && months) monthsInput.value = months;
  if (totalBudgetInput && totalBudget) totalBudgetInput.value = totalBudget;
  setMode(nextMode);

  const readyBudget = nextMode === "total"
    ? Number(totalBudgetInput?.value || 0) > 0
    : Number(monthlyInput?.value || 0) > 0;

  if (!readyBudget) {
    if (nextMode === "total" && totalBudgetInput) totalBudgetInput.value = "5000";
    if (nextMode !== "total" && monthlyInput) monthlyInput.value = "500";
  }

  requestAnimationFrame(() => {
    form?.requestSubmit();
  });
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
    setSearchExperienceState(false);
    return;
  }

  button.disabled = true;
  button.textContent = "Buscando...";
  results.innerHTML = '<div class="skeleton skeleton-card" aria-hidden="true"><span class="skeleton-badge"></span><span class="skeleton-line skeleton-line-lg"></span><span class="skeleton-line skeleton-line-md"></span></div>';
  notice.hidden = true;
  resultsArea.hidden = false;
  resultsArea.classList.add("has-results");
  setSearchExperienceState(true);
  budgetTotal.textContent = currency.format(ceiling);
    if (searchMode === "total") {
      budgetLine.textContent = `Orçamento total: ${currency.format(totalBudget)}`;
      if (marketline) marketline.textContent = `Comparando ofertas com teto total de ${currency.format(totalBudget)}.`;
      if (monthlyLabel) monthlyLabel.textContent = "Máx. mensal";
      if (monthsField) monthsField.hidden = true;
      if (totalField) totalField.hidden = false;
      if (totalBudgetInput) totalBudgetInput.disabled = false;
    } else {
      budgetLine.textContent = `${currency.format(monthly)} por mês em até ${months}x`;
      if (marketline) marketline.textContent = `Comparando ofertas para ${currency.format(monthly)} por mês em até ${months}x.`;
      if (monthlyLabel) monthlyLabel.textContent = "Máx. mensal";
      if (monthsField) monthsField.hidden = false;
      if (totalField) totalField.hidden = true;
      if (totalBudgetInput) totalBudgetInput.disabled = true;
    }
  summaryTitle.textContent = `Buscando ${product}...`;
  resultsArea.scrollIntoView({ behavior: "smooth", block: "start" });

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
    } else {
      const experienceHtml = renderResultsExperience(data, confirmedProducts);
      if (experienceHtml) results.innerHTML = experienceHtml;
      else renderProducts(confirmedProducts);
    }
  } catch {
    notice.hidden = false;
    notice.textContent = "Não foi possível concluir a busca agora. Tente novamente em instantes.";
    summaryTitle.textContent = "Busca temporariamente indisponível";
    renderProducts([]);
  } finally {
    button.disabled = false;
    button.textContent = "Encontrar a melhor compra";
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
  initSearchFromUrl();
}

setMode(searchMode);

if (appView === "mercadolivre") {
  productInput.addEventListener("input", triggerLiveSearch);
  monthlyInput.addEventListener("input", triggerLiveSearch);
  monthsInput.addEventListener("change", triggerLiveSearch);
}










