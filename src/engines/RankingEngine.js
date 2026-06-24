function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hasValidLink(product = {}) {
  return Boolean(
    String(product.affiliateUrl || product.productUrl || product.permalink || "").trim()
  );
}

function isDemo(product = {}) {
  return String(product.dataMode || product.mode || "").toLowerCase() === "demo";
}

function isReal(product = {}) {
  const mode = String(product.dataMode || product.mode || "").toLowerCase();
  return mode === "real" || mode === "real-authenticated" || mode === "real-public";
}

function groupLabel(status) {
  if (status === "CABE") return "Melhor escolha";
  if (status === "APERTADO") return "Boa alternativa";
  return "Opção econômica";
}

function rankGroup(status) {
  if (status === "CABE") return 0;
  if (status === "APERTADO") return 1;
  return 2;
}

function sortWithinGroup(products = []) {
  return [...products].sort((a, b) => {
    const aHasLink = hasValidLink(a) ? 1 : 0;
    const bHasLink = hasValidLink(b) ? 1 : 0;
    if (bHasLink !== aHasLink) return bHasLink - aHasLink;

    const byScore = toNumber(b.score, 0) - toNumber(a.score, 0);
    if (byScore !== 0) return byScore;

    const byPrice = toNumber(a.price, Infinity) - toNumber(b.price, Infinity);
    if (byPrice !== 0) return byPrice;

    return String(a.title || "").localeCompare(String(b.title || ""), "pt-BR");
  });
}

function buildReason(product, rank, group, hasAnyReal, hasAnyDemo) {
  const parts = [];

  if (group === "CABE") {
    parts.push("Cabe no orçamento.");
  } else if (group === "APERTADO") {
    parts.push("Cabe com menos folga.");
  } else {
    parts.push("Fica acima do orçamento ideal.");
  }

  if (hasValidLink(product)) {
    parts.push("Link válido ajudou no desempate.");
  } else {
    parts.push("Sem link válido no desempate.");
  }

  if (isDemo(product)) {
    parts.push("Exemplo demonstrativo.");
  } else if (isReal(product)) {
    parts.push("Dados reais disponíveis.");
  }

  if (!hasAnyReal && hasAnyDemo && rank === 1) {
    return "Exemplo demonstrativo";
  }

  return parts.join(" ");
}

function labelForProduct(product, rank, hasAnyReal) {
  const group = product.budgetStatus || product.status || "NÃO CABE";
  if (isDemo(product)) {
    if (rank === 1) return "Exemplo demonstrativo";
    return "Exemplo demonstrativo";
  }

  if (rank === 1) return "Melhor escolha";
  if (rank === 2) return "Boa alternativa";
  if (rank === 3) return "Opção econômica";
  return groupLabel(group);
}

function buildGroups(products = []) {
  const normalized = products.map((product) => ({
    ...product,
    budgetStatus: product.budgetStatus || product.status || "NÃO CABE",
  }));

  const cabe = sortWithinGroup(normalized.filter((item) => item.budgetStatus === "CABE"));
  const apertado = sortWithinGroup(normalized.filter((item) => item.budgetStatus === "APERTADO"));
  const naoCabe = sortWithinGroup(normalized.filter((item) => item.budgetStatus === "NÃO CABE"));

  return { cabe, apertado, naoCabe };
}

export function rankProducts(products = []) {
  const groups = buildGroups(products);
  const ordered = [
    ...groups.cabe,
    ...groups.apertado,
    ...groups.naoCabe,
  ];

  const hasAnyReal = ordered.some(isReal);
  const hasAnyDemo = ordered.some(isDemo);

  const recommended = ordered.slice(0, 3).map((product, index) => {
    const rank = index + 1;
    const group = product.budgetStatus || product.status || "NÃO CABE";
    return {
      rank,
      label: labelForProduct(product, rank, hasAnyReal),
      reason: buildReason(product, rank, group, hasAnyReal, hasAnyDemo),
      product,
    };
  });

  const summary = hasAnyDemo && !hasAnyReal
    ? "Os resultados exibem apenas exemplos demonstrativos, ordenados pelo que melhor cabe no orçamento."
    : "Os resultados priorizam produtos que cabem no orçamento, depois alternativas apertadas e por fim opções fora do limite.";

  return {
    recommended,
    groups,
    summary,
  };
}

export default {
  rankProducts,
};
