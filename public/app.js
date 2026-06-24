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
    if (monthlyLabel) monthlyLabel.textContent = "Orçamento total";
  } else {
    if (monthsField) monthsField.hidden = false;
    if (totalField) totalField.hidden = true;
    if (monthlyLabel) monthlyLabel.textContent = "Máx. mensal";
  }
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function productImage(product) {
  const image = product.image || product.thumbnail || "";
  if (image) {
    return `<img src="${image}" alt="">`;
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
        : "parcela na loja";
      const total = formatPrice(product.price);

      return `
        <article class="card">
          <div class="image-box">${productImage(product)}</div>
          <div class="card-body">
            <span class="store">${product.source === "mercadolivre" ? "MERCADO LIVRE" : product.source === "amazon" ? "AMAZON" : product.source === "magalu" ? "MAGALU" : (product.store || "LOJA DE TESTE")}</span>
            <h2>${product.title}</h2>
            ${product.status ? `<p class="small"><strong>Status:</strong> ${product.status}</p>` : ""}
            ${Number.isFinite(product.score) ? `<p class="small"><strong>Score O Que Cabe:</strong> ${product.score}/100</p>` : ""}
            <p class="small">${product.note}</p>
            <div class="price">
              <div class="small">${product.installments || "?"}x de</div>
              <div class="installment">${installment}</div>
              <div class="small">Total: ${total}</div>
            </div>
            <a href="${product.url}" target="_blank" rel="noopener">${product.source === "mercadolivre" ? "Ver no Mercado Livre" : product.source === "amazon" ? "Ver na Amazon" : product.source === "magalu" ? "Ver na Magalu" : "Ver oferta"}</a>
          </div>
        </article>
      `;
    })
    .join("");
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
  return product.affiliateUrl || product.productUrl || product.permalink || product.url || "#";
}

function renderMercadoLivre(products) {
  if (!products.length) {
    results.innerHTML = `
      <article class="empty-state">
        <strong>Nenhum produto encontrado</strong>
        <span>Tente outra categoria ou ajuste o orçamento.</span>
      </article>
    `;
    return;
  }

  results.innerHTML = products
    .map((product) => {
      const total = formatPrice(product.price);
      const installment = Number.isFinite(product.installmentValue) && product.installmentValue > 0
        ? currency.format(product.installmentValue)
        : "parcela na loja";
      const status = product.status || "CABE";
      const score = Number.isFinite(product.score) ? product.score : 0;
      const link = resolveProductLink(product);
      const dataMode = product.dataMode || "demo";
      const sourceLabel = dataMode === "real" ? "DADOS REAIS DO MERCADO LIVRE" : "DEMONSTRAÇÃO MERCADO LIVRE";
      return `
        <article class="card">
          <div class="image-box">${productImage(product)}</div>
          <div class="card-body">
            <span class="store">${sourceLabel}</span>
            <h2>${product.title}</h2>
            <p class="small"><strong>Status:</strong> ${status}</p>
            <p class="small"><strong>Score O Que Cabe:</strong> ${score}/100</p>
            <p class="small">${product.condition ? `Condição: ${product.condition}` : ""}</p>
            <p class="small">${product.availableQuantity != null ? `Estoque: ${product.availableQuantity}` : ""}</p>
            <p class="small">Preço total: vindo do Mercado Livre. Parcela OQC: estimativa calculada pelo site.</p>
            <p class="small">Parcela estimada pelo O Que Cabe. Confira frete, juros e parcelamento real na loja.</p>
            <div class="price">
              <div class="small">Preço total</div>
              <div class="installment">${total}</div>
              <div class="small">${installment} · ${currency.format(product.monthlyPrice || 0)}/mês</div>
            </div>
            <a href="${link}" target="_blank" rel="noopener">Ver no Mercado Livre</a>
          </div>
        </article>
      `;
    })
    .join("");
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
  const totalBudget = Number(document.querySelector("#totalBudgetInput")?.value || monthly * months);
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
    if (monthlyLabel) monthlyLabel.textContent = "Orçamento total";
    if (monthsField) monthsField.hidden = true;
    if (totalField) totalField.hidden = false;
  } else {
    budgetLine.textContent = `${currency.format(monthly)} por mês em até ${months}x`;
    if (marketline) marketline.textContent = `Seu teto estimado: ${currency.format(ceiling)}, considerando ${currency.format(monthly)} por mês em até ${months}x.`;
    if (monthlyLabel) monthlyLabel.textContent = "Máx. mensal";
    if (monthsField) monthsField.hidden = false;
    if (totalField) totalField.hidden = true;
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
      apiStatus.textContent = data.dataMode === "real" ? "Dados reais do Mercado Livre" : "Demonstração Mercado Livre";
      apiStatus.style.color = data.dataMode === "real" ? "#12805c" : "#a15c00";
    }
    if (appView === "home") {
      sourceBadge.textContent = data.dataMode === "real" ? "DADOS REAIS DO MERCADO LIVRE" : "DEMONSTRAÇÃO MERCADO LIVRE";
      if (notice) {
        notice.hidden = false;
        notice.textContent = data.dataMode === "real"
          ? "Produtos reais encontrados no Mercado Livre. Parcelas estimadas pelo O Que Cabe."
          : "Modo demonstração: ofertas simuladas para testar a experiência.";
      }
    } else if (appView === "products") {
      sourceBadge.textContent = "DummyJSON";
    } else if (appView === "travel") {
      sourceBadge.textContent = "Viagem mock";
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
      renderMercadoLivre(data.products || []);
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
      totalBudgetInput.value = button.dataset.totalBudget || button.dataset.monthly || "500";
      monthlyInput.value = button.dataset.monthly || "100";
      monthsInput.value = button.dataset.months || "12";
      modeButtons.forEach((item) => item.classList.toggle("active", item.dataset.mode === "total"));
    } else {
      searchMode = button.dataset.mode || "monthly";
      monthlyInput.value = button.dataset.monthly || "";
      monthsInput.value = button.dataset.months || "12";
      if (totalBudgetInput) totalBudgetInput.value = button.dataset.totalBudget || totalBudgetInput.value || "500";
      modeButtons.forEach((item) => item.classList.toggle("active", item.dataset.mode === searchMode));
    }
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


