function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getInstallmentSource(source = {}) {
  if (source && typeof source.installment === "object" && source.installment) {
    return source.installment;
  }
  return source;
}

function normalizeInstallmentPlan(source = {}, budget = {}) {
  const raw = getInstallmentSource(source);
  const price = toNumber(source.price ?? raw.price ?? budget.price, 0);
  const months = Math.max(
    1,
    toNumber(
      raw.months ??
      raw.installments ??
      source.installmentMonths ??
      source.installments ??
      budget.months,
      budget.months || 12,
    ),
  );
  const amount = Math.max(
    0,
    toNumber(
      raw.amount ??
      source.installmentAmount ??
      source.installmentValue ??
      source.monthlyPrice ??
      (price > 0 && months > 0 ? price / months : 0),
      price > 0 && months > 0 ? price / months : 0,
    ),
  );
  const downpayment = Math.max(
    0,
    toNumber(
      raw.downpayment ??
      raw.downPayment ??
      source.installmentDownpayment ??
      source.downpayment ??
      0,
      0,
    ),
  );

  return {
    amount,
    months,
    downpayment,
    price,
  };
}

function calculateTrafficLight(impactPercentage) {
  if (!Number.isFinite(impactPercentage)) {
    return "unknown";
  }
  if (impactPercentage <= 15) return "green";
  if (impactPercentage <= 30) return "yellow";
  return "red";
}

export function buildBudgetContext({ mode = "monthly", monthly = 0, months = 12, totalBudget = 0, budgetLivre = null } = {}) {
  const normalizedMode = String(mode || "monthly").toLowerCase() === "total" ? "total" : "monthly";
  const monthlyBudget = toNumber(monthly || budgetLivre, 0);
  const installmentMonths = Math.max(1, toNumber(months, 12));
  const explicitTotalBudget = toNumber(totalBudget, 0);
  const calculatedTotalBudget = monthlyBudget * installmentMonths;
  const ceiling = normalizedMode === "total"
    ? (explicitTotalBudget > 0 ? explicitTotalBudget : calculatedTotalBudget)
    : calculatedTotalBudget;

  return {
    mode: normalizedMode,
    monthlyBudget,
    monthly: monthlyBudget,
    budgetLivre: monthlyBudget,
    months: installmentMonths,
    totalBudget: ceiling,
    installmentLimit: monthlyBudget,
    monthlyCeiling: calculatedTotalBudget,
    apertadoFactor: 1.2,
  };
}

export function evaluateBudget(price, context = {}) {
  const budget = buildBudgetContext(context);
  const value = toNumber(price ?? context.price, 0);
  const basis = budget.mode === "total"
    ? Math.max(1, budget.totalBudget)
    : Math.max(1, budget.monthlyBudget);
  const installmentPlan = normalizeInstallmentPlan(context, budget);
  const monthlyPrice = installmentPlan.amount > 0
    ? installmentPlan.amount
    : calculateMonthlyPrice(value, budget.months);
  const budgetUsage = budget.mode === "total" ? value / basis : monthlyPrice / basis;
  const remainingBudget = budget.mode === "total"
    ? budget.totalBudget - value
    : budget.monthlyBudget - monthlyPrice;
  const custoTotalPrazo = (monthlyPrice * installmentPlan.months) + installmentPlan.downpayment;
  const jurosEmbutidos = value > 0 ? ((custoTotalPrazo - value) / value) * 100 : null;
  const impactoMensal = budget.monthlyBudget > 0 ? (monthlyPrice / budget.monthlyBudget) * 100 : null;
  const trafficLight = calculateTrafficLight(impactoMensal);

  let status = "NÃO CABE";
  let budgetScore = 0.05;
  const reasons = [];

  if (!Number.isFinite(value) || value <= 0) {
    reasons.push("Preço indisponível.");
  } else if (budgetUsage <= 0.75) {
    status = "CABE";
    budgetScore = 1;
    reasons.push("Cabe com folga no seu orçamento.");
  } else if (budgetUsage <= 1) {
    status = "CABE";
    budgetScore = 0.88;
    reasons.push("Cabe no seu orçamento.");
  } else if (budgetUsage <= budget.apertadoFactor) {
    status = "APERTADO";
    budgetScore = 0.55;
    reasons.push("Cabe, mas fica perto do limite.");
  } else {
    reasons.push("Fica acima do seu orçamento.");
    budgetScore = 0.05;
  }

  const financialMetrics = {
    budgetLivre: budget.monthlyBudget,
    installmentAmount: installmentPlan.amount,
    installmentMonths: installmentPlan.months,
    downpayment: installmentPlan.downpayment,
    impactoMensal: impactoMensal == null ? null : Number(impactoMensal.toFixed(2)),
    custoTotalPrazo: Number.isFinite(custoTotalPrazo) ? Number(custoTotalPrazo.toFixed(2)) : null,
    jurosEmbutidos: jurosEmbutidos == null ? null : Number(jurosEmbutidos.toFixed(2)),
  };

  const warningMessages = {
    green: "Impacto mensal baixo no orçamento livre.",
    yellow: "Impacto mensal moderado no orçamento livre.",
    red: "Impacto mensal alto no orçamento livre.",
    unknown: "Sem dados suficientes para medir o impacto mensal.",
  };

  return {
    ...budget,
    status,
    budgetScore,
    budgetUsage,
    remainingBudget,
    monthlyPrice,
    financialMetrics,
    warningLevel: trafficLight,
    warningMessage: warningMessages[trafficLight],
    decision: {
      riskLevel: trafficLight,
      warning: warningMessages[trafficLight],
      score: budgetScore,
    },
    reasons,
  };
}

export function calculateMonthlyPrice(price, months = 12) {
  const value = toNumber(price, 0);
  const installmentMonths = Math.max(1, toNumber(months, 12));
  return value / installmentMonths;
}

export function classifyBudgetFit(price, context = {}) {
  return evaluateBudget(price, context).status;
}

export function sortByBudgetPriority(products = []) {
  const rank = { "CABE": 0, "APERTADO": 1, "NÃO CABE": 2 };
  return [...products].sort((a, b) => {
    const byRank = (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
    if (byRank !== 0) return byRank;
    const byScore = Number(b.score || 0) - Number(a.score || 0);
    if (byScore !== 0) return byScore;
    return String(a.title || "").localeCompare(String(b.title || ""), "pt-BR");
  });
}

export function groupBudgetPriority(products = []) {
  const grouped = { "CABE": [], "APERTADO": [], "NÃO CABE": [] };
  for (const item of sortByBudgetPriority(products)) {
    const bucket = grouped[item.status] ? item.status : "NÃO CABE";
    grouped[bucket].push(item);
  }
  return grouped;
}

export function limitBudgetResults(products = []) {
  const grouped = groupBudgetPriority(products);
  return [
    ...grouped["CABE"].slice(0, 8),
    ...grouped["APERTADO"].slice(0, 4),
    ...grouped["NÃO CABE"].slice(0, 3),
  ];
}

export default {
  buildBudgetContext,
  evaluateBudget,
  calculateMonthlyPrice,
  classifyBudgetFit,
  sortByBudgetPriority,
  groupBudgetPriority,
  limitBudgetResults,
};
