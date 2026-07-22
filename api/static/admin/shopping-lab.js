const form = document.querySelector("#labForm");
const summary = document.querySelector("#summary");
const sources = document.querySelector("#sources");
const decisions = document.querySelector("#decisions");
const products = document.querySelector("#products");

function currency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

function renderSourceList(items = []) {
  if (!items.length) {
    sources.textContent = "Nenhuma fonte respondeu.";
    return;
  }
  sources.innerHTML = `<div class="source-list">${items.map((item) => `
    <div class="source-row">
      <strong>${item.source}</strong><br>
      HTTP ${item.httpStatus || 0} · recebidos ${item.received || 0} · aceitos ${item.accepted || 0}<br>
      <span>${item.failureReason || "sem erro"}</span>
    </div>
  `).join("")}</div>`;
}

function renderDecisions(items = []) {
  if (!items.length) {
    decisions.textContent = "Nenhuma decisão formada.";
    return;
  }
  decisions.innerHTML = `<div class="decision-list">${items.map((item) => `
    <div class="decision-row">
      <span class="badge">${item.decision}</span>
      <p><strong>${item.product?.title || "Sem título"}</strong></p>
      <p>${item.explanation || ""}</p>
    </div>
  `).join("")}</div>`;
}

function renderProducts(items = []) {
  if (!items.length) {
    products.textContent = "Nenhum produto aceito.";
    return;
  }
  products.innerHTML = `<div class="product-list">${items.map((item) => `
    <div class="product-row">
      <strong>${item.title}</strong><br>
      ${item.source} · ${currency(item.finalPurchaseCost || item.price)}<br>
      ${item.officialStore?.confidence || "NOT_VERIFIED"} · ${item.trust?.trustLevel || "LOW"}<br>
      <a href="${item.permalink || "#"}" target="_blank" rel="noopener noreferrer">Abrir oferta</a>
    </div>
  `).join("")}</div>`;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  summary.textContent = "Consultando fontes...";
  sources.textContent = "Carregando...";
  decisions.textContent = "Carregando...";
  products.textContent = "Carregando...";

  const query = document.querySelector("#queryInput")?.value?.trim() || "";
  const budget = Number(document.querySelector("#budgetInput")?.value || 0);
  const adminToken = document.querySelector("#tokenInput")?.value?.trim() || "";
  const search = new URLSearchParams({ query, totalBudget: String(budget) });
  if (adminToken) search.set("adminToken", adminToken);

  const response = await fetch(`/api/admin/shopping-lab/search?${search.toString()}`);
  const body = await response.json();

  if (!response.ok || !body.ok) {
    summary.textContent = body.message || body.error || "Falha ao rodar o laboratório.";
    sources.textContent = "Sem dados.";
    decisions.textContent = "Sem dados.";
    products.textContent = "Sem dados.";
    return;
  }

  summary.innerHTML = `
    <strong>${body.query}</strong><br>
    ${body.elapsedMs} ms · ${body.intent?.productType || "sem tipo"} · ${body.products?.length || 0} produtos aceitos<br>
    Descartados: acessórios ${body.diagnostics?.rejected?.accessories || 0}, modelo errado ${body.diagnostics?.rejected?.wrongModel || 0}
  `;

  renderSourceList(body.sourceResults || []);
  renderDecisions(body.diagnostics?.decisions || []);
  renderProducts(body.products || []);
});
