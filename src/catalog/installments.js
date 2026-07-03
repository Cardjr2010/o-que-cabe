function toNumber(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  const normalized = text
    .replace(/[^\d,.\-xX ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return fallback;
  const parsed = Number(normalized.replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".").replace(/\s+/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function extractFromObject(source = {}) {
  const count = toNumber(source.count ?? source.months ?? source.installments ?? source.times, 0);
  const amount = toNumber(source.amount ?? source.value ?? source.installmentAmount ?? source.installmentValue ?? source.monthlyPrice, 0);
  const total = toNumber(source.total ?? source.price ?? source.installmentTotal, 0);
  const interestFree = source.interestFree ?? source.semJuros ?? source.sem_juros ?? source.interest_free;
  const confidence = toNumber(source.confidence ?? source.score ?? source.reliability, 0);
  if (!count || !amount) return null;
  return {
    available: true,
    count,
    amount,
    total: total > 0 ? total : Number((count * amount).toFixed(2)),
    interestFree: typeof interestFree === "boolean" ? interestFree : null,
    source: String(source.source || source.origin || "feed").trim() || "feed",
    confidence: confidence > 0 ? confidence : 0.9,
  };
}

function extractFromText(value = "") {
  const text = String(value || "").trim();
  if (!text) return null;
  const normalized = text
    .replace(/\s+/g, " ")
    .replace(/R\$\s*/gi, "R$")
    .replace(/às?/gi, "a")
    .trim();
  const match = normalized.match(/(\d{1,2})\s*x(?:\s+de)?\s*(?:R\$)?\s*([\d.,]+)/i)
    || normalized.match(/(?:parcelas?|installments?)\s*[:=]?\s*(\d{1,2}).*?(?:R\$)?\s*([\d.,]+)/i);
  if (!match) return null;
  const count = toNumber(match[1], 0);
  const amount = toNumber(match[2], 0);
  if (!count || !amount) return null;
  const interestFree = /sem juros/i.test(normalized) || /without interest/i.test(normalized);
  return {
    available: true,
    count,
    amount: Number(amount.toFixed(2)),
    total: Number((count * amount).toFixed(2)),
    interestFree,
    source: "parsed",
    confidence: 0.75,
  };
}

export function normalizeInstallmentData(raw = {}, budget = {}) {
  const source = raw && typeof raw === "object"
    ? (raw.installments ?? raw.installment ?? raw.paymentPlan ?? raw.payment ?? raw)
    : raw;

  let installments = null;
  if (source && typeof source === "object" && !Array.isArray(source)) {
    installments = extractFromObject(source);
  } else if (typeof source === "string" || typeof source === "number") {
    installments = extractFromText(source);
  }

  if (installments) {
    return {
      installments: {
        available: true,
        count: installments.count,
        amount: installments.amount,
        total: installments.total,
        interestFree: installments.interestFree,
        source: installments.source,
        confidence: installments.confidence,
      },
      estimatedInstallment: null,
      installmentConfidence: installments.confidence,
      installmentSource: installments.source,
      installmentWarning: null,
    };
  }

  const price = toNumber(raw.price ?? raw.salePrice ?? raw.regularPrice ?? budget.price, 0);
  const months = Math.max(1, toNumber(raw.installmentMonths ?? raw.months ?? budget.months, budget.months || 12));
  const amount = price > 0 ? Number((price / months).toFixed(2)) : 0;
  const estimatedInstallment = amount > 0
    ? {
        available: true,
        count: months,
        amount,
        total: Number((amount * months).toFixed(2)),
        interestFree: null,
        source: "estimated",
        confidence: 0.25,
      }
    : null;

  return {
    installments: {
      available: false,
      count: null,
      amount: null,
      total: null,
      interestFree: null,
      source: "unavailable",
      confidence: 0,
    },
    estimatedInstallment,
    installmentConfidence: estimatedInstallment?.confidence || 0,
    installmentSource: estimatedInstallment?.source || "unavailable",
    installmentWarning: "Parcelamento estimado. Confirme na loja.",
  };
}

export function buildInstallmentBudgetContext(product = {}, baseBudget = {}) {
  const normalized = normalizeInstallmentData(product, baseBudget);
  const effectiveInstallment = normalized.installments.available
    ? normalized.installments
    : normalized.estimatedInstallment;

  if (!effectiveInstallment) {
    return {
      ...baseBudget,
      installments: undefined,
      installmentConfidence: normalized.installmentConfidence,
      installmentSource: normalized.installmentSource,
      installmentWarning: normalized.installmentWarning,
    };
  }

  return {
    ...baseBudget,
    installments: {
      months: effectiveInstallment.count,
      amount: effectiveInstallment.amount,
      total: effectiveInstallment.total,
      interestFree: effectiveInstallment.interestFree,
      source: effectiveInstallment.source,
      confidence: effectiveInstallment.confidence,
    },
    installmentMonths: effectiveInstallment.count,
    installmentAmount: effectiveInstallment.amount,
    monthlyPrice: effectiveInstallment.amount,
    installmentConfidence: effectiveInstallment.confidence,
    installmentSource: effectiveInstallment.source,
    installmentWarning: normalized.installmentWarning,
  };
}

