function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizeMode(context = {}) {
  return String(context.mode || "monthly").toLowerCase() === "total" ? "total" : "monthly";
}

function resolveBudgetCeiling(context = {}) {
  const mode = normalizeMode(context);
  const monthlyBudget = Math.max(0, toNumber(context.monthlyBudget ?? context.monthly ?? context.budgetLivre, 0));
  const months = Math.max(1, toNumber(context.months, 12));
  const totalBudget = Math.max(0, toNumber(context.totalBudget, 0));
  if (mode === "total") return totalBudget > 0 ? totalBudget : monthlyBudget * months;
  return monthlyBudget * months;
}

function resolveMonthlyCapacity(context = {}) {
  const monthlyBudget = Math.max(0, toNumber(context.monthlyBudget ?? context.monthly ?? context.budgetLivre, 0));
  if (monthlyBudget > 0) return monthlyBudget;
  const totalBudget = Math.max(0, toNumber(context.totalBudget, 0));
  const months = Math.max(1, toNumber(context.months, 12));
  return totalBudget > 0 ? totalBudget / months : 0;
}

function buildWaitSimulation(product = {}, context = {}) {
  const price = Math.max(0, toNumber(product.price, 0));
  const months = Math.max(1, toNumber(context.months ?? product.installments ?? 12, 12));
  const monthlySaving = resolveMonthlyCapacity(context) || (price > 0 ? price / months : 0);
  const accumulated = monthlySaving * months;
  return {
    monthsToSave: months,
    monthlySavings: Number(monthlySaving.toFixed(2)),
    accumulatedAmount: Number(accumulated.toFixed(2)),
    canBuyCashAfterWait: accumulated >= price && price > 0,
    differenceNowVsWait: Number((accumulated - price).toFixed(2)),
    recommendation: accumulated >= price
      ? "Se esperar esse prazo, você consegue comprar à vista."
      : "Esperar esse prazo ainda não cobre o valor à vista.",
  };
}

export function evaluateRisk(product = {}, context = {}) {
  const price = Math.max(0, toNumber(product.price, 0));
  const ceiling = resolveBudgetCeiling(context);
  const mode = normalizeMode(context);
  const monthlyCapacity = resolveMonthlyCapacity(context);
  const monthlyPrice = mode === "total"
    ? (Math.max(1, toNumber(context.months, 12)) > 0 ? price / Math.max(1, toNumber(context.months, 12)) : price)
    : (price / Math.max(1, toNumber(context.months, 12)));
  const usageRatio = ceiling > 0
    ? (mode === "total" ? price / ceiling : monthlyPrice / monthlyCapacity)
    : null;

  let riskLevel = "yellow";
  let riskScore = 55;
  const reasons = [];
  const warnings = [];

  if (price <= 0) {
    riskLevel = "red";
    riskScore = 15;
    reasons.push("Preço indisponível impede uma decisão segura.");
  } else if (usageRatio == null) {
    riskLevel = "yellow";
    riskScore = 50;
    reasons.push("Sem orçamento suficiente para medir o risco com precisão.");
  } else if (usageRatio <= 0.7) {
    riskLevel = "green";
    riskScore = Math.round(100 - usageRatio * 35);
    reasons.push("Cabe com folga no orçamento informado.");
  } else if (usageRatio <= 0.95) {
    riskLevel = "yellow";
    riskScore = Math.round(85 - usageRatio * 20);
    reasons.push("Cabe, mas usa boa parte do limite informado.");
  } else {
    riskLevel = "red";
    riskScore = Math.round(60 - Math.min(50, usageRatio * 25));
    reasons.push("Ultrapassa ou quase esgota o orçamento informado.");
  }

  if (String(product.dataMode || product.mode || "").toLowerCase() === "demo") {
    warnings.push("Modo demonstrativo: confirme preço e disponibilidade na loja.");
    riskScore = Math.max(0, riskScore - 10);
  }
  if (product.isAccessory) {
    warnings.push("É um acessório, não o produto principal.");
    riskScore = Math.max(0, riskScore - 8);
  }
  if (!String(product.affiliateUrl || product.productUrl || product.permalink || "").trim()) {
    warnings.push("Sem link válido para abrir a oferta.");
    riskScore = Math.max(0, riskScore - 10);
  }

  const waitSimulation = buildWaitSimulation(product, context);
  if (waitSimulation.canBuyCashAfterWait) {
    reasons.push("Esperando esse prazo, a compra à vista fica viável.");
  } else {
    warnings.push("Mesmo esperando esse prazo, ainda não atinge o valor à vista.");
  }

  return {
    riskLevel,
    riskScore: clamp(Math.round(riskScore), 0, 100),
    reasons,
    warnings,
    waitSimulation,
    usageRatio: usageRatio == null ? null : Number((usageRatio * 100).toFixed(2)),
  };
}

export function simulateWait(product = {}, context = {}) {
  return buildWaitSimulation(product, context);
}

export default {
  evaluateRisk,
  simulateWait,
};
