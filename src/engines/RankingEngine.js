import BudgetEngine from "./BudgetEngine.js";
import ScoreEngine from "./ScoreEngine.js";
import ValueEngine from "./ValueEngine.js";

function evaluateBudgetSafe(price, context = {}) {
  if (BudgetEngine && typeof BudgetEngine.evaluateBudget === "function") {
    return BudgetEngine.evaluateBudget(price, context);
  }
  if (BudgetEngine && BudgetEngine.default && typeof BudgetEngine.default.evaluateBudget === "function") {
    return BudgetEngine.default.evaluateBudget(price, context);
  }
  if (typeof BudgetEngine?.classifyBudgetFit === "function") {
    const status = BudgetEngine.classifyBudgetFit(price, context);
    return {
      status,
      budgetScore: status === "CABE" ? 1 : status === "APERTADO" ? 0.55 : 0.05,
      budgetUsage: null,
      remainingBudget: null,
      reasons: [status === "CABE" ? "Cabe no orçamento." : status === "APERTADO" ? "Cabe, mas está apertado." : "Fica acima do orçamento."],
      warnings: [],
    };
  }
  return {
    status: "CABE",
    budgetScore: 1,
    budgetUsage: null,
    remainingBudget: null,
    reasons: ["Cabe no orçamento."],
    warnings: [],
  };
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeComparatorText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasValidLink(product = {}) {
  return Boolean(String(product.affiliateUrl || product.productUrl || product.permalink || product.url || "").trim());
}

function installmentConfidence(product = {}) {
  const oqc = product.oqc || {};
  const installments = product.installments || {};
  const estimated = product.estimatedInstallment || {};
  return Math.max(
    toNumber(oqc.installmentConfidence, 0),
    toNumber(product.installmentConfidence, 0),
    toNumber(installments.confidence, 0),
    toNumber(estimated.confidence, 0),
  );
}

function dataCompletenessScore(product = {}) {
  const oqc = product.oqc || {};
  return [
    hasValidLink(product),
    Boolean(String(product.image || product.thumbnail || "").trim()),
    Boolean(String(product.availability || "").trim()),
    Boolean(String(product.seller?.name || product.seller || product.store || "").trim()),
    Boolean(installmentConfidence(product) >= 0.8),
    Boolean(toNumber(oqc.dataCompletenessScore, 0) >= 0.8),
  ].reduce((score, flag) => score + (flag ? 1 : 0), 0) / 6;
}

function isDemo(product = {}) {
  return String(product.dataMode || product.mode || "").toLowerCase() === "demo";
}

function isReal(product = {}) {
  const mode = String(product.dataMode || product.mode || "").toLowerCase();
  return mode === "real" || mode === "real-authenticated" || mode === "real-public" || mode === "seed";
}

function rankGroup(status) {
  if (status === "CABE") return 0;
  if (status === "APERTADO") return 1;
  return 2;
}

function normalizeStatus(product = {}) {
  return product.budgetStatus || product.status || "NAO CABE";
}

function relevanceScore(product = {}, query = "") {
  const q = String(query || product.searchTerm || "").trim().toLowerCase();
  if (!q) return 0.5;
  const text = `${product.title || ""} ${product.category || ""} ${product.description || ""}`.toLowerCase();
  const categoryTerms = {
    celular: ["celular", "smartphone", "galaxy", "moto", "redmi", "iphone"],
    tv: ["tv", "televisao", "smart tv", "oled", "qled", "roku"],
    notebook: ["notebook", "laptop", "vivobook", "ideapad", "aspire"],
    relogio: ["relogio", "smartwatch", "watch", "pulseira inteligente"],
    tablet: ["tablet", "ipad", "galaxy tab", "tab"],
    casa: ["casa", "air fryer", "fritadeira", "aspirador", "cozinha"],
    presente: ["presente", "kit", "caneca", "bloco", "acessorio"],
  };
  const terms = categoryTerms[q] || q.split(/\s+/).filter(Boolean);
  if (!terms.length) return 0.5;
  const hits = terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
  return Math.max(0.1, Math.min(1, hits / terms.length));
}

function searchIntentStrength(product = {}) {
  const oqc = product.oqc || {};
  const raw = Math.max(
    toNumber(oqc.searchMatchScore, 0),
    toNumber(product.searchMatchScore, 0),
  );
  if (raw <= 0) return 0;
  return Math.max(0.05, Math.min(1, raw / 200));
}

function effectiveFinalPrice(product = {}) {
  return toNumber(product.finalPrice ?? product.cashPrice ?? product.price, Number.POSITIVE_INFINITY);
}

function installmentAmount(product = {}) {
  const installments = product.installments || {};
  const estimated = product.estimatedInstallment || {};
  return toNumber(
    installments.amount
      ?? installments.monthly
      ?? product.installmentValue
      ?? product.monthlyPrice
      ?? estimated.amount,
    Number.POSITIVE_INFINITY,
  );
}

function samePrimaryOffer(a = {}, b = {}) {
  const aType = String(a.productType || "").toLowerCase();
  const bType = String(b.productType || "").toLowerCase();
  if (aType && bType && (aType !== "principal" || bType !== "principal")) {
    return false;
  }

  const aModel = normalizeComparatorText(a.model || "");
  const bModel = normalizeComparatorText(b.model || "");
  if (aModel && bModel && aModel === bModel) return true;

  const aTitle = normalizeComparatorText(a.displayTitle || a.title || "");
  const bTitle = normalizeComparatorText(b.displayTitle || b.title || "");
  if (!aTitle || !bTitle) return false;

  if (aTitle === bTitle) return true;
  if (aModel && bTitle.includes(aModel)) return true;
  if (bModel && aTitle.includes(bModel)) return true;

  return false;
}

function sortWithinGroup(products = []) {
  return [...products].sort((a, b) => {
    if (samePrimaryOffer(a, b)) {
      const byEffectivePrice = effectiveFinalPrice(a) - effectiveFinalPrice(b);
      if (byEffectivePrice !== 0) return byEffectivePrice;

      const byInstallmentAmount = installmentAmount(a) - installmentAmount(b);
      if (byInstallmentAmount !== 0) return byInstallmentAmount;
    }

    const byFinal = toNumber(b.oqc?.finalScore, 0) - toNumber(a.oqc?.finalScore, 0);
    if (byFinal !== 0) return byFinal;

    const byTrust = toNumber(b.oqc?.trustScore, 0) - toNumber(a.oqc?.trustScore, 0);
    if (byTrust !== 0) return byTrust;

    const byValue = toNumber(b.oqc?.valueScore, 0) - toNumber(a.oqc?.valueScore, 0);
    if (byValue !== 0) return byValue;

    const byInstallments = installmentConfidence(b) - installmentConfidence(a);
    if (byInstallments !== 0) return byInstallments;

    const byCompleteness = dataCompletenessScore(b) - dataCompletenessScore(a);
    if (byCompleteness !== 0) return byCompleteness;

    const byScore = toNumber(b.score, 0) - toNumber(a.score, 0);
    if (byScore !== 0) return byScore;

    const aHasLink = hasValidLink(a) ? 1 : 0;
    const bHasLink = hasValidLink(b) ? 1 : 0;
    if (bHasLink !== aHasLink) return bHasLink - aHasLink;

    const byPrice = effectiveFinalPrice(a) - effectiveFinalPrice(b);
    if (byPrice !== 0) return byPrice;

    return String(a.title || "").localeCompare(String(b.title || ""), "pt-BR");
  });
}

function buildReason(product, group, hasAnyReal, hasAnyDemo) {
  const parts = [];
  const oqc = product.oqc || {};
  const reasons = Array.isArray(oqc.reasons) ? oqc.reasons : [];
  const warnings = Array.isArray(oqc.warnings) ? oqc.warnings : [];

  if (group === "CABE") {
    parts.push("Cabe no orçamento.");
  } else if (group === "APERTADO") {
    parts.push("Cabe, mas esta apertado.");
  } else {
    parts.push("Fica acima do orçamento.");
  }

  if (oqc.valueReason) {
    parts.push(oqc.valueReason);
  }

  if (hasValidLink(product)) {
    parts.push("Link valido ajudou no desempate.");
  } else {
    parts.push("Sem link valido no desempate.");
  }

  if (reasons.length) {
    parts.push(reasons.slice(0, 2).join(" "));
  }

  if (warnings.length) {
    parts.push(warnings[0]);
  }

  if (isDemo(product)) {
    parts.push("Exemplo demonstrativo.");
  } else if (isReal(product)) {
    parts.push("Base real do OQC disponivel.");
  }

  if (!hasAnyReal && hasAnyDemo) {
    return "Exemplo demonstrativo";
  }

  return parts.filter(Boolean).join(" ");
}

function labelForProduct(product, index, hasAnyReal, hasAnyDemo, topFitExists) {
  const group = normalizeStatus(product);

  if (isDemo(product)) {
    return "Exemplo demonstrativo";
  }

  if (group === "APERTADO" && !topFitExists && index === 0) {
    return "Melhor alternativa dentro do possível";
  }

  if (index === 0 && group === "CABE") return "Melhor escolha";
  if (index === 0 && group === "APERTADO") return "Melhor alternativa dentro do possível";
  if (index === 0 && group === "NAO CABE") return "Melhor alternativa dentro do possível";
  if (index === 1) return "Boa alternativa";
  if (index === 2) return "Opcao economica";
  return group === "CABE" ? "Melhor escolha" : group === "APERTADO" ? "Boa alternativa" : "Opcao economica";
}

function attachOqc(product, siblings = [], query = "") {
  const budget = product.oqc?.budget || evaluateBudgetSafe(product.price, product.budgetContext || product.context || product);
  const trust = product.oqc?.trustScore != null
    ? toNumber(product.oqc.trustScore, 0)
    : toNumber(ScoreEngine.evaluateProduct(product).trustScore, 0);
  const value = product.oqc?.valueScore != null
    ? toNumber(product.oqc.valueScore, 0)
    : toNumber(ValueEngine.evaluateValue(product, siblings).valueScore, 0);
  const relevance = product.oqc?.relevanceScore != null
    ? toNumber(product.oqc.relevanceScore, 0)
    : relevanceScore(product, query);
  const searchIntent = searchIntentStrength(product);
  const budgetScore = budget?.budgetScore != null ? toNumber(budget.budgetScore, 0) : (normalizeStatus(product) === "CABE" ? 1 : normalizeStatus(product) === "APERTADO" ? 0.55 : 0.05);
  const finalScore = Math.max(0, Math.min(1,
    (budgetScore * 0.35) +
    (trust * 0.25) +
    (value * 0.15) +
    (relevance * 0.1) +
    (searchIntent * 0.15) -
    (normalizeStatus(product) === "NAO CABE" ? 0.35 : 0) -
    (normalizeStatus(product) === "APERTADO" ? 0.08 : 0)
  ));

  const warnings = [
    ...(Array.isArray(product.oqc?.warnings) ? product.oqc.warnings : []),
    ...(Array.isArray(product.warnings) ? product.warnings : []),
    ...(budget?.reasons?.length ? budget.reasons.filter(Boolean) : []),
  ].filter(Boolean);

  const reasons = [
    ...(Array.isArray(product.oqc?.reasons) ? product.oqc.reasons : []),
    budget?.reasons?.[0],
    ValueEngine.evaluateValue(product, siblings).reason,
  ].filter(Boolean);

  return {
    ...product,
    oqc: {
      ...(product.oqc || {}),
      budgetStatus: normalizeStatus(product),
      budgetScore,
      budgetUsage: budget?.budgetUsage ?? null,
      remainingBudget: budget?.remainingBudget ?? null,
      trustScore: trust,
      valueScore: value,
      relevanceScore: relevance,
      finalScore,
      reasons,
      warnings,
      badges: [
        normalizeStatus(product) === "CABE" ? "cabe" : normalizeStatus(product) === "APERTADO" ? "apertado" : "fora-do-orcamento",
        isDemo(product) ? "demo" : "real",
      ],
    },
  };
}

function groupProducts(products = []) {
  const groups = {
    best_choice: [],
    safe_choices: [],
    economy_choices: [],
    tight_choices: [],
    out_of_budget: [],
    cabe: [],
    apertado: [],
    naoCabe: [],
  };

  const initiallyOrdered = products.map((item) => item).sort((a, b) => {
    const byGroup = rankGroup(normalizeStatus(a)) - rankGroup(normalizeStatus(b));
    if (byGroup !== 0) return byGroup;
    const byFinal = toNumber(b.oqc?.finalScore, 0) - toNumber(a.oqc?.finalScore, 0);
    if (byFinal !== 0) return byFinal;
    const byInstallments = installmentConfidence(b) - installmentConfidence(a);
    if (byInstallments !== 0) return byInstallments;
    const byCompleteness = dataCompletenessScore(b) - dataCompletenessScore(a);
    if (byCompleteness !== 0) return byCompleteness;
    return toNumber(b.score, 0) - toNumber(a.score, 0);
  });

  const cabe = sortWithinGroup(initiallyOrdered.filter((item) => normalizeStatus(item) === "CABE"));
  const apertado = sortWithinGroup(initiallyOrdered.filter((item) => normalizeStatus(item) === "APERTADO"));
  const naoCabe = sortWithinGroup(initiallyOrdered.filter((item) => normalizeStatus(item) === "NAO CABE"));
  const ordered = [...cabe, ...apertado, ...naoCabe];

  groups.cabe = cabe;
  groups.apertado = apertado;
  groups.naoCabe = naoCabe;
  groups.best_choice = cabe.slice(0, 1);
  groups.safe_choices = cabe.slice(1);
  groups.economy_choices = apertado.slice(0, 3);
  groups.tight_choices = apertado.slice(3);
  groups.out_of_budget = naoCabe;

  return { ordered, groups };
}

export function rankProducts(products = [], query = "") {
  const enriched = products.map((product, index, list) => attachOqc(product, list, query));
  const { ordered, groups } = groupProducts(enriched);
  const hasAnyReal = ordered.some(isReal);
  const hasAnyDemo = ordered.some(isDemo);
  const hasFit = ordered.some((item) => normalizeStatus(item) === "CABE");

  const recommended = ordered.slice(0, 3).map((product, index) => {
    const group = normalizeStatus(product);
    return {
      rank: index + 1,
      label: labelForProduct(product, index, hasAnyReal, hasAnyDemo, hasFit),
      reason: buildReason(product, group, hasAnyReal, hasAnyDemo),
      product: {
        ...product,
        reason: buildReason(product, group, hasAnyReal, hasAnyDemo),
      },
    };
  });

  const summary = hasAnyDemo && !hasAnyReal
    ? "Os resultados exibem apenas exemplos demonstrativos, ordenados pelo que melhor cabe no orçamento."
    : "Os resultados priorizam produtos que cabem no orçamento, depois alternativas apertadas e por fim opções fora do limite.";

  return {
    recommended,
    groups,
    summary,
    products: ordered,
  };
}

export default {
  rankProducts,
};
