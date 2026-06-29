function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function median(values = []) {
  const list = values.map((value) => toNumber(value, 0)).filter((value) => value > 0).sort((a, b) => a - b);
  if (!list.length) return 0;
  const middle = Math.floor(list.length / 2);
  return list.length % 2 === 0 ? (list[middle - 1] + list[middle]) / 2 : list[middle];
}

export function evaluateValue(product = {}, siblings = []) {
  const price = toNumber(product.price ?? product.totalPrice, 0);
  const reference = median(siblings.map((item) => item.price ?? item.totalPrice ?? 0)) || toNumber(product.referencePrice ?? product.marketPrice, 0);

  if (price <= 0) {
    return {
      valueScore: 0.2,
      reference,
      price,
      reason: "Preço indisponível para comparação.",
      warnings: ["Preço indisponível para comparação."],
    };
  }

  if (!reference) {
    return {
      valueScore: 0.6,
      reference,
      price,
      reason: "Poucos comparáveis para medir custo-benefício.",
      warnings: [],
    };
  }

  const ratio = price / reference;
  if (ratio <= 0.5) {
    return {
      valueScore: 0.35,
      reference,
      price,
      reason: "Preço muito abaixo dos similares; vale conferir com atenção.",
      warnings: ["Preço muito abaixo dos similares; vale conferir com atenção."],
    };
  }
  if (ratio <= 0.85) {
    return {
      valueScore: 0.92,
      reference,
      price,
      reason: "Boa relação entre preço e referência da busca.",
      warnings: [],
    };
  }
  if (ratio <= 1.05) {
    return {
      valueScore: 1,
      reference,
      price,
      reason: "Preço alinhado com a referência da busca.",
      warnings: [],
    };
  }
  if (ratio <= 1.2) {
    return {
      valueScore: 0.76,
      reference,
      price,
      reason: "Preço um pouco acima da referência, mas ainda competitivo.",
      warnings: [],
    };
  }
  if (ratio <= 1.5) {
    return {
      valueScore: 0.5,
      reference,
      price,
      reason: "Preço acima da referência, porém ainda pode ser justificável.",
      warnings: ["Preço acima da referência da busca."],
    };
  }
  return {
    valueScore: 0.28,
    reference,
    price,
    reason: "Preço muito acima dos similares da busca.",
    warnings: ["Preço muito acima dos similares da busca."],
  };
}

export default { evaluateValue };
