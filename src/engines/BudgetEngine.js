function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function buildBudgetContext({ mode = "monthly", monthly = 0, months = 12, totalBudget = 0 } = {}) {
  const normalizedMode = String(mode || "monthly").toLowerCase() === "total" ? "total" : "monthly";
  const monthlyBudget = toNumber(monthly, 0);
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
    months: installmentMonths,
    totalBudget: ceiling,
    installmentLimit: monthlyBudget,
    monthlyCeiling: calculatedTotalBudget,
    apertadoFactor: 1.2,
  };
}

export function calculateMonthlyPrice(price, months = 12) {
  const value = toNumber(price, 0);
  const installmentMonths = Math.max(1, toNumber(months, 12));
  return value / installmentMonths;
}

export function classifyBudgetFit(price, context = {}) {
  const budget = buildBudgetContext(context);
  const value = toNumber(price, 0);

  if (budget.mode === "total") {
    if (value <= budget.totalBudget) return "CABE";
    if (value <= budget.totalBudget * budget.apertadoFactor) return "APERTADO";
    return "NÃO CABE";
  }

  const monthlyPrice = calculateMonthlyPrice(value, budget.months);
  if (monthlyPrice <= budget.monthlyBudget) return "CABE";
  if (monthlyPrice <= budget.monthlyBudget * budget.apertadoFactor) return "APERTADO";
  return "NÃO CABE";
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
  calculateMonthlyPrice,
  classifyBudgetFit,
  sortByBudgetPriority,
  groupBudgetPriority,
  limitBudgetResults,
};
