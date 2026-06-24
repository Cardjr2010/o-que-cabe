const form = document.querySelector("#searchForm");
const productInput = document.querySelector("#productInput");
const monthlyInput = document.querySelector("#monthlyInput");
const monthsInput = document.querySelector("#monthsInput");
const sourceInput = document.querySelector("#sourceInput");
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

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function productImage(product) {
  const image = product.image || product.thumbnail || "";
  if (image) {
    return `<img src="${image}" alt="">`;
  }
  return "<span>Imagem em breve</span>";
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
        <div class="image-box">${trip.image ? `<img src="${trip.image}" alt="">` : "<span>Imagem em breve</span>"}</div>
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
  return product.affiliateUrl || product.productUrl || product.url || "#";
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
      return `
        <article class="card">
          <div class="image-box">${productImage(product)}</div>
          <div class="card-body">
            <span class="store">${product.store}</span>
            <h2>${product.title}</h2>
            <p class="small"><strong>Status:</strong> ${status}</p>
            <p class="small"><strong>Score O Que Cabe:</strong> ${score}/100</p>
            <p class="small">${product.condition ? `Condição: ${product.condition}` : ""}</p>
            <p class="small">${product.availableQuantity != null ? `Estoque: ${product.availableQuantity}` : ""}</p>
            <p class="small">Produto real do Mercado Livre. Link afiliado aplicado apenas quando cadastrado.</p>
            <div class="price">
              <div class="small">Preço total</div>
              <div class="installment">${total}</div>
              <div class="small">${installment} · ${currency.format(product.monthlyPrice || 0)}/mês</div>
            </div>
            <a href="${link}" target="_blank" rel="noopener">Ver produto</a>
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
  const monthly = document.querySelector("#monthlyInput").value;
  const months = document.querySelector("#monthsInput").value;
  const ceiling = Number(monthly) * Number(months);

  button.disabled = true;
  button.textContent = "Buscando...";
  results.innerHTML = "";
  notice.hidden = true;
  resultsArea.classList.add("has-results");
  budgetTotal.textContent = currency.format(ceiling);
  budgetLine.textContent = `${currency.format(Number(monthly))} por mês em até ${months}x`;
  summaryTitle.textContent = `Buscando ${product}...`;

  try {
    let endpoint = apiEndpoint;
    const params = new URLSearchParams();
    const source = sourceInput ? sourceInput.value : "mercadolivre";
    params.set("source", source);
    if (appView === "mercadolivre") {
      if (isMercadoLivreUrl(product)) {
        endpoint = "/api/mercadolivre-item";
        params.set("url", product);
      } else {
        endpoint = "/api/mercadolivre-manual";
        params.set("category", product);
      }
    } else {
      params.set("q", product);
    }
    params.set("monthly", monthly);
    params.set("months", months);
    const response = await fetch(`${endpoint}?${params.toString()}`);
    const data = await response.json();

    if (apiStatus) {
      apiStatus.textContent = data.mode === "amazon" ? "Amazon API conectada" : "Modo demonstração";
      apiStatus.style.color = data.mode === "amazon" ? "#12805c" : "#a15c00";
    }
    if (appView === "home") {
      sourceBadge.textContent = data.mode === "mercadolivre" ? "Mercado Livre" : data.mode === "amazon" ? "Amazon" : data.mode === "magalu" ? "Magalu" : "Demo";
    } else if (appView === "products") {
      sourceBadge.textContent = "DummyJSON";
    } else if (appView === "travel") {
      sourceBadge.textContent = "Viagem mock";
    }

    summaryTitle.textContent = appView === "mercadolivre" ? `Ofertas para ${product}` : `Ofertas para ${product}`;

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
    monthlyInput.value = button.dataset.monthly || "";
    monthsInput.value = button.dataset.months || "12";
    form.requestSubmit();
  });
});

if (appView === "mercadolivre") {
  productInput.addEventListener("input", triggerLiveSearch);
  monthlyInput.addEventListener("input", triggerLiveSearch);
  monthsInput.addEventListener("change", triggerLiveSearch);
}

if (sourceInput) {
  sourceInput.addEventListener("change", () => {
    form.requestSubmit();
  });
}


