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

function isDemoProduct(product) {
  return String(product?.dataMode || product?.mode || "").toLowerCase() === "demo";
}

function resolveSourceLabel(product) {
  if (isDemoProduct(product)) {
    return "Demonstração — sem anúncio real";
  }

  if (product?.sourceLabel) return String(product.sourceLabel);

  const source = String(product?.marketplace || product?.source || product?.store || "").trim().toLowerCase();
  if (!source) return "Loja parceira";
  if (source === "awin") return "Awin";
  if (source === "actionpay") return "Actionpay";
  if (source === "mi_shop" || source === "mishop" || source === "mi shop") return "Mi Shop";
  if (source === "google_merchant") return "Google Merchant";
  if (source === "mercadolivre" || source === "mercado livre") return "Loja parceira";
  return String(product?.store || product?.marketplace || product?.source || "Loja parceira");
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
    <div class="image-fallback">
      <img src="/logo-oqc.png" alt="" class="image-fallback-logo">
      <span>Imagem indisponível</span>
    </div>
  `;
}

function formatPrice(value) {
  return Number.isFinite(value) && value > 0 ? currency.format(value) : "Conferir na loja";
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

  results.innerHTML = products
    .map((product) => {
      const installment = Number.isFinite(product.installmentValue) && product.installmentValue > 0
        ? currency.format(product.installmentValue)
        : "";
      const total = formatPrice(product.price);
      const note = safeText(
        product.note,
        isDemoProduct(product)
          ? "Demonstração — sem anúncio real."
          : "Preço e disponibilidade devem ser confirmados na loja.",
      );
      const buttonLabel = resolveButtonLabel(product);
      const link = resolveProductLink(product);
      const hasLink = hasProductLink(product) && !isDemoProduct(product);
      const sourceLabel = resolveSourceLabel(product);

      return `
        <article class="card">
          <div class="image-box">${productImage(product)}</div>
          <div class="card-body">
            <span class="store">${sourceLabel}</span>
            <h2>${product.title}</h2>
            ${product.status ? `<p class="small"><strong>Status:</strong> ${product.status}</p>` : ""}
            ${Number.isFinite(product.score) ? `<p class="small"><strong>Score O Que Cabe:</strong> ${product.score}/100</p>` : ""}
            <p class="small">${note}</p>
            <div class="price">
              <div class="small">Preço total</div>
              <div class="installment">${total}</div>
              <div class="small">${installment ? `${product.installments || "?"}x de ${installment} · ${currency.format(product.monthlyPrice || product.installmentValue)}/mês` : "Parcelamento não informado."}</div>
            </div>
            ${hasLink
              ? `<a href="${link}" target="_blank" rel="noopener">${buttonLabel}</a>`
              : `<a class="disabled" href="javascript:void(0)" role="button" aria-disabled="true">${buttonLabel}</a>`}
          </div>
        </article>
      `;
    })
    .join("");
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
  if (hasProductLink(product)) return "Abrir oferta";
  return "Link indisponível";
}

function renderRecommendationBlock(recommendations = []) {
  if (!Array.isArray(recommendations) || !recommendations.length) return "";
  const items = recommendations.slice(0, 3).map((item) => {
    const product = item.product || {};
    const link = resolveProductLink(product);
    const hasLink = hasProductLink(product) && !isDemoProduct(product);
    const sourceLabel = resolveSourceLabel(product);
    const buttonLabel = resolveButtonLabel(product);
    return `
      <article class="oqc-recommendation">
        <div class="oqc-recommendation-head">
          <span class="oqc-rank">${item.rank}º</span>
          <div>
            <strong>${item.label}</strong>
            <p>${safeText(item.reason, "Preço e disponibilidade devem ser confirmados na loja.")}</p>
          </div>
        </div>
        <span class="store">${sourceLabel}</span>
        <h3>${product.title || "Produto"}</h3>
        <p class="small">${product.status || product.budgetStatus || "CABE"} · Score ${Number.isFinite(product.score) ? product.score : 0}/100</p>
        <p class="small">${formatPrice(product.price)}</p>
        <p class="small">Base do O Que Cabe. ${product.status || product.budgetStatus || "CABE"} no orçamento.</p>
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
  if (product.affiliateUrl || product.productUrl || product.permalink || product.url) {
    return product.affiliateUrl || product.productUrl || product.permalink || product.url;
  }
  return "";
}

function hasProductLink(product) {
  return Boolean(resolveProductLink(product));
}

function renderMercadoLivre(products) {
  return renderProducts(products);
}

function isMercadoLivreUrl(value) {
  return /mercadolivre\.com\.br/i.test(value || "");
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
      const list = renderMercadoLivre(data.products || []);
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

  document.querySelectorAll(".category-grid article").forEach((card) => {
    const title = (card.querySelector("h3")?.textContent || "").toLowerCase();
    card.addEventListener("click", () => {
      if (title.includes("celular")) {
        productInput.value = "celular";
        monthlyInput.value = "80";
        monthsInput.value = "12";
        setMode("monthly");
      } else if (title.includes("notebook")) {
        productInput.value = "notebook";
        monthlyInput.value = "250";
        monthsInput.value = "10";
        setMode("monthly");
      } else if (title.includes("presente")) {
        productInput.value = "presente";
        totalBudgetInput.value = "50";
        setMode("total");
      } else if (title.includes("casa")) {
        productInput.value = "casa";
        totalBudgetInput.value = "100";
        setMode("total");
      } else if (title.includes("tele") || title.includes("tv")) {
        productInput.value = "tv";
        monthlyInput.value = "200";
        monthsInput.value = "12";
        setMode("monthly");
      } else if (title.includes("relóg") || title.includes("relog")) {
        productInput.value = "relogio";
        totalBudgetInput.value = "300";
        setMode("total");
      }
      form.requestSubmit();
    });
  });
}

setMode(searchMode);

if (appView === "mercadolivre") {
  productInput.addEventListener("input", triggerLiveSearch);
  monthlyInput.addEventListener("input", triggerLiveSearch);
  monthsInput.addEventListener("change", triggerLiveSearch);
}


