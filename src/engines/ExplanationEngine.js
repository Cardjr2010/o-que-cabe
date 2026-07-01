function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStatus(value = "") {
  const text = String(value || "").toUpperCase();
  if (text.includes("APERT")) return "APERTADO";
  if (text.includes("NAO") || text.includes("NÃO")) return "NÃO CABE";
  return "CABE";
}

export function buildExplanation(product = {}, context = {}) {
  const status = normalizeStatus(product.status || product.budgetStatus || context.status || "CABE");
  const rank = Math.max(0, toNumber(context.rank ?? context.position ?? 0, 0));
  const risk = context.risk || {};
  const budget = context.budget || {};
  const parts = [];

  if (status === "CABE") {
    parts.push(risk.riskLevel === "green"
      ? "Cabe com folga no orçamento informado."
      : "Cabe no orçamento informado.");
  } else if (status === "APERTADO") {
    parts.push("Cabe, mas já usa uma parte importante do limite informado.");
  } else {
    parts.push("Não cabe no orçamento informado.");
  }

  if (risk.riskLevel === "green") {
    parts.push("Risco financeiro baixo.");
  } else if (risk.riskLevel === "yellow") {
    parts.push("Risco financeiro moderado.");
  } else if (risk.riskLevel === "red") {
    parts.push("Risco financeiro alto.");
  }

  if (product.isAccessory) {
    parts.push("É um acessório, então fica abaixo do produto principal.");
  }

  if (rank === 0 && status === "CABE") {
    parts.push("Foi a melhor combinação entre cabimento, confiança e custo-benefício.");
  } else if (rank === 0 && status === "APERTADO") {
    parts.push("Ficou no topo como a melhor alternativa dentro do possível.");
  } else if (rank > 0) {
    parts.push("Ficou atrás porque a decisão anterior entregou mais equilíbrio.");
  }

  if (risk.waitSimulation?.canBuyCashAfterWait) {
    parts.push("Se esperar esse prazo, a compra à vista também fica viável.");
  } else if (budget.mode === "total" && budget.totalBudget > 0) {
    parts.push("Mesmo esperando, ainda fica acima do valor disponível sem parcelar.");
  }

  const bullets = [
    status === "CABE" ? "Cabe" : status === "APERTADO" ? "Cabe apertado" : "Não cabe",
    risk.riskLevel === "green" ? "Risco baixo" : risk.riskLevel === "yellow" ? "Risco moderado" : "Risco alto",
    risk.waitSimulation?.canBuyCashAfterWait ? "Dá para esperar" : "Esperar ainda não resolve",
  ].filter(Boolean);

  const text = parts.filter(Boolean).join(" ");
  return {
    text,
    shortText: parts.slice(0, 2).join(" "),
    bullets,
    reasons: parts,
    status,
  };
}

export default {
  buildExplanation,
};
