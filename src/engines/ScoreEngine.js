const FACTOR_WEIGHTS = {
  price: 20,
  shipping: 12,
  reputation: 16,
  delivery: 10,
  warranty: 8,
  brand: 8,
  reviews: 14,
  soldQuantity: 12,
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function round(value) {
  return Math.round(Number(value) || 0);
}

function formatNumber(value, digits = 0) {
  return Number(value).toLocaleString("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function factor(factor, weight, earned, reason) {
  return {
    factor,
    weight,
    earned: clamp(round(earned), 0, weight),
    reason,
  };
}

function describePrice(product = {}) {
  const price = toNumber(product.price ?? product.totalPrice ?? product.value, 0);
  const referencePrice = toNumber(product.referencePrice ?? product.marketPrice ?? product.priceReference, 0);

  if (price <= 0) {
    return factor("Preço", FACTOR_WEIGHTS.price, 0, "Preço indisponível.");
  }

  if (referencePrice > 0) {
    const ratio = price / referencePrice;
    if (ratio <= 0.85) {
      return factor("Preço", FACTOR_WEIGHTS.price, 20, "Preço muito competitivo em relação à referência da categoria.");
    }
    if (ratio <= 1.0) {
      return factor("Preço", FACTOR_WEIGHTS.price, 18, "Preço competitivo para a categoria.");
    }
    if (ratio <= 1.1) {
      return factor("Preço", FACTOR_WEIGHTS.price, 15, "Preço um pouco acima da referência, mas ainda forte.");
    }
    if (ratio <= 1.25) {
      return factor("Preço", FACTOR_WEIGHTS.price, 10, "Preço acima da referência, porém ainda aceitável.");
    }
    return factor("Preço", FACTOR_WEIGHTS.price, 4, "Preço acima da referência da categoria.");
  }

  if (price <= 100) {
    return factor("Preço", FACTOR_WEIGHTS.price, 18, "Preço muito acessível.");
  }
  if (price <= 500) {
    return factor("Preço", FACTOR_WEIGHTS.price, 16, "Preço atrativo.");
  }
  if (price <= 1000) {
    return factor("Preço", FACTOR_WEIGHTS.price, 13, "Preço razoável.");
  }
  if (price <= 2000) {
    return factor("Preço", FACTOR_WEIGHTS.price, 10, "Preço intermediário.");
  }
  return factor("Preço", FACTOR_WEIGHTS.price, 7, "Preço acima da faixa de entrada.");
}

function describeShipping(product = {}) {
  const shipping = product.shipping || {};
  const freeShipping = Boolean(
    product.freeShipping ??
    product.free_shipping ??
    shipping.free_shipping ??
    shipping.freeShipping
  );
  const cost = toNumber(product.shippingCost ?? product.shipping_cost ?? shipping.cost, NaN);

  if (freeShipping || cost === 0) {
    return factor("Frete", FACTOR_WEIGHTS.shipping, 12, "Frete grátis.");
  }
  if (!Number.isFinite(cost)) {
    return factor("Frete", FACTOR_WEIGHTS.shipping, 6, "Frete não informado com clareza.");
  }
  if (cost <= 20) {
    return factor("Frete", FACTOR_WEIGHTS.shipping, 10, "Frete baixo.");
  }
  if (cost <= 50) {
    return factor("Frete", FACTOR_WEIGHTS.shipping, 7, "Frete moderado.");
  }
  return factor("Frete", FACTOR_WEIGHTS.shipping, 2, "Frete caro.");
}

function describeReputation(product = {}) {
  const seller = product.seller || product.store || {};
  const reputation = String(seller.reputation || seller.sellerReputation || seller.level || "").toLowerCase();
  const rating = toNumber(seller.rating ?? seller.score ?? seller.rate, NaN);
  const sales = toNumber(seller.sales ?? seller.transactions ?? seller.sold, 0);

  if (reputation.includes("platinum") || rating >= 95 || sales >= 5000) {
    return factor("Vendedor", FACTOR_WEIGHTS.reputation, 16, "MercadoLíder Platinum ou vendedor de altíssima confiança.");
  }
  if (reputation.includes("gold") || rating >= 85 || sales >= 1000) {
    return factor("Vendedor", FACTOR_WEIGHTS.reputation, 13, "Vendedor confiável com boa reputação.");
  }
  if (reputation.includes("silver") || rating >= 70 || sales >= 200) {
    return factor("Vendedor", FACTOR_WEIGHTS.reputation, 9, "Reputação intermediária.");
  }
  if (reputation.includes("poor") || rating > 0 && rating < 60) {
    return factor("Vendedor", FACTOR_WEIGHTS.reputation, 3, "Vendedor com confiança baixa.");
  }
  return factor("Vendedor", FACTOR_WEIGHTS.reputation, 5, "Reputação pouco documentada.");
}

function describeDelivery(product = {}) {
  const days = toNumber(
    product.deliveryDays ??
    product.delivery_days ??
    product.delivery?.days ??
    product.shipping?.delivery_days,
    NaN
  );

  if (!Number.isFinite(days)) {
    return factor("Entrega", FACTOR_WEIGHTS.delivery, 5, "Prazo não informado com clareza.");
  }
  if (days <= 2) {
    return factor("Entrega", FACTOR_WEIGHTS.delivery, 10, `Entrega prevista em ${days} dias.`);
  }
  if (days <= 4) {
    return factor("Entrega", FACTOR_WEIGHTS.delivery, 8, `Entrega prevista em ${days} dias.`);
  }
  if (days <= 7) {
    return factor("Entrega", FACTOR_WEIGHTS.delivery, 6, `Entrega prevista em ${days} dias.`);
  }
  if (days <= 10) {
    return factor("Entrega", FACTOR_WEIGHTS.delivery, 3, `Entrega prevista em ${days} dias.`);
  }
  return factor("Entrega", FACTOR_WEIGHTS.delivery, 1, `Entrega prevista em ${days} dias.`);
}

function describeWarranty(product = {}) {
  const warrantyMonths = toNumber(product.warrantyMonths ?? product.warranty_months, NaN);
  const warranty = String(product.warranty || product.guarantee || "").toLowerCase();

  if (warranty.includes("fabricante") || warranty.includes("official")) {
    return factor("Garantia", FACTOR_WEIGHTS.warranty, 8, "Garantia oficial do fabricante.");
  }
  if (Number.isFinite(warrantyMonths) && warrantyMonths >= 12) {
    return factor("Garantia", FACTOR_WEIGHTS.warranty, 8, "Garantia de 12 meses ou mais.");
  }
  if (Number.isFinite(warrantyMonths) && warrantyMonths >= 6) {
    return factor("Garantia", FACTOR_WEIGHTS.warranty, 6, "Garantia razoável.");
  }
  if (warranty) {
    return factor("Garantia", FACTOR_WEIGHTS.warranty, 4, "Garantia informada, mas sem destaque oficial.");
  }
  return factor("Garantia", FACTOR_WEIGHTS.warranty, 2, "Garantia pouco clara ou ausente.");
}

function describeBrand(product = {}) {
  const brand = String(product.brand || product.marca || "").trim();
  if (!brand) {
    return factor("Marca", FACTOR_WEIGHTS.brand, 3, "Marca não informada.");
  }

  const strong = ["samsung", "motorola", "apple", "xiaomi", "lg", "lenovo", "asus", "philips", "sony", "intel"];
  const generic = ["genérico", "generico", "sem marca", "unknown", "básico", "basico"];
  const lower = brand.toLowerCase();

  if (generic.some((item) => lower.includes(item))) {
    return factor("Marca", FACTOR_WEIGHTS.brand, 2, `Marca ${brand} com confiança limitada.`);
  }
  if (strong.some((item) => lower.includes(item))) {
    return factor("Marca", FACTOR_WEIGHTS.brand, 8, `Marca forte (${brand}).`);
  }
  return factor("Marca", FACTOR_WEIGHTS.brand, 6, `Marca ${brand} conhecida.`);
}

function describeReviews(product = {}) {
  const rating = toNumber(product.rating ?? product.reviewRating ?? product.averageRating, NaN);
  const count = toNumber(product.reviewCount ?? product.reviewsCount ?? product.reviews ?? product.quantityReviews, 0);

  if (Number.isFinite(rating)) {
    if (rating >= 4.8 && count >= 1000) {
      return factor("Avaliações", FACTOR_WEIGHTS.reviews, 14, `${rating.toFixed(1)} estrelas em mais de ${formatNumber(count)} avaliações.`);
    }
    if (rating >= 4.7) {
      return factor("Avaliações", FACTOR_WEIGHTS.reviews, 13, `${rating.toFixed(1)} estrelas em ${formatNumber(count)} avaliações.`);
    }
    if (rating >= 4.5) {
      return factor("Avaliações", FACTOR_WEIGHTS.reviews, 11, `${rating.toFixed(1)} estrelas com boa aceitação.`);
    }
    if (rating >= 4.0) {
      return factor("Avaliações", FACTOR_WEIGHTS.reviews, 8, `${rating.toFixed(1)} estrelas.`);
    }
    if (rating >= 3.5) {
      return factor("Avaliações", FACTOR_WEIGHTS.reviews, 4, `${rating.toFixed(1)} estrelas, avaliações medianas.`);
    }
    return factor("Avaliações", FACTOR_WEIGHTS.reviews, 1, `${rating.toFixed(1)} estrelas, avaliações fracas.`);
  }

  if (count >= 5000) {
    return factor("Avaliações", FACTOR_WEIGHTS.reviews, 12, `${formatNumber(count)} avaliações sem nota média informada.`);
  }
  if (count >= 1000) {
    return factor("Avaliações", FACTOR_WEIGHTS.reviews, 10, `${formatNumber(count)} avaliações.`);
  }
  if (count >= 100) {
    return factor("Avaliações", FACTOR_WEIGHTS.reviews, 6, `${formatNumber(count)} avaliações.`);
  }
  if (count > 0) {
    return factor("Avaliações", FACTOR_WEIGHTS.reviews, 3, `${formatNumber(count)} avaliações.`);
  }
  return factor("Avaliações", FACTOR_WEIGHTS.reviews, 1, "Poucas avaliações disponíveis.");
}

function describeSoldQuantity(product = {}) {
  const quantity = toNumber(product.soldQuantity ?? product.sold_quantity ?? product.sales ?? product.unitsSold, NaN);

  if (!Number.isFinite(quantity)) {
    return factor("Quantidade vendida", FACTOR_WEIGHTS.soldQuantity, 4, "Quantidade vendida não informada.");
  }
  if (quantity >= 5000) {
    return factor("Quantidade vendida", FACTOR_WEIGHTS.soldQuantity, 12, "Quantidade vendida muito alta.");
  }
  if (quantity >= 1000) {
    return factor("Quantidade vendida", FACTOR_WEIGHTS.soldQuantity, 10, "Quantidade vendida alta.");
  }
  if (quantity >= 200) {
    return factor("Quantidade vendida", FACTOR_WEIGHTS.soldQuantity, 8, "Quantidade vendida consistente.");
  }
  if (quantity >= 50) {
    return factor("Quantidade vendida", FACTOR_WEIGHTS.soldQuantity, 5, "Quantidade vendida moderada.");
  }
  if (quantity > 0) {
    return factor("Quantidade vendida", FACTOR_WEIGHTS.soldQuantity, 3, "Poucas vendas registradas.");
  }
  return factor("Quantidade vendida", FACTOR_WEIGHTS.soldQuantity, 1, "Quantidade vendida muito baixa ou ausente.");
}

function buildBreakdown(product = {}) {
  return [
    describePrice(product),
    describeShipping(product),
    describeReputation(product),
    describeDelivery(product),
    describeWarranty(product),
    describeBrand(product),
    describeReviews(product),
    describeSoldQuantity(product),
  ];
}

function buildExplanation(product = {}, score = 0, breakdown = []) {
  const title = product.title || "este produto";
  const strongest = breakdown
    .slice()
    .sort((a, b) => b.earned - a.earned)
    .slice(0, 4)
    .map((item) => item.factor.toLowerCase())
    .join(", ");

  if (score >= 90) {
    return `O ${title} ficou em primeiro porque apresentou a melhor combinação entre ${strongest || "preço, reputação e confiança"}.`;
  }

  if (score >= 75) {
    return `O ${title} ficou bem posicionado por equilibrar ${strongest || "preço e confiança"} de forma sólida.`;
  }

  if (score >= 60) {
    return `O ${title} é viável, mas ainda há pontos a melhorar em ${strongest || "alguns fatores-chave"}.`;
  }

  return `O ${title} perdeu força no ranking por sinais fracos em fatores importantes como preço, frete, vendedor ou avaliações.`;
}

export function evaluateProduct(product = {}) {
  const breakdown = buildBreakdown(product);
  const totalEarned = breakdown.reduce((sum, item) => sum + item.earned, 0);
  const totalPossible = breakdown.reduce((sum, item) => sum + item.weight, 0) || 1;
  const score = clamp(Math.round((totalEarned / totalPossible) * 100));
  const trustScore = clamp(Number((score / 100).toFixed(2)), 0, 1);
  const warnings = [];

  if (!product.title) warnings.push("Nome do produto não informado.");
  if (!product.price || Number(product.price) <= 0) warnings.push("Preço indisponível.");
  if (!product.brand) warnings.push("Marca não informada.");
  if (!product.seller?.reputation && !product.seller?.rating) warnings.push("Dados de vendedor limitados.");
  if (!product.reviewCount && !product.reviewsCount) warnings.push("Poucas avaliações documentadas.");

  return {
    score,
    trustScore,
    breakdown,
    explanation: buildExplanation(product, score, breakdown),
    warnings,
  };
}

export default {
  evaluateProduct,
};
