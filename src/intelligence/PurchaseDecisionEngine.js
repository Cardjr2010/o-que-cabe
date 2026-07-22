function distinctById(products = []) {
  const seen = new Set();
  const list = [];
  for (const product of Array.isArray(products) ? products : []) {
    const key = String(product.sourceProductId || product.itemId || product.asin || product.id || product.permalink || product.title || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    list.push(product);
  }
  return list;
}

function sortBy(list = [], selector) {
  return [...list].sort((left, right) => selector(right) - selector(left));
}

export class PurchaseDecisionEngine {
  decide(products = [], budget = {}) {
    const distinct = distinctById(products).filter((item) => item.matchClass === "EXACT_MATCH" || item.matchClass === "VALID_VARIANT");
    if (!distinct.length) return [];

    const withinBudget = (product) => {
      const cap = Number(budget.maxTotalBudget || budget.totalBudget || 0);
      if (!cap) return true;
      return Number(product.finalPurchaseCost || product.finalPrice || product.price || 0) <= cap;
    };

    const eligible = distinct.filter(withinBudget);
    const base = eligible.length ? eligible : distinct;

    const bestOverall = sortBy(base, (item) => Number(item.decisionScore || 0))[0] || null;
    const bestOfficial = sortBy(base.filter((item) => item.officialStore?.confidence === "VERIFIED"), (item) => Number(item.decisionScore || 0))[0] || null;
    const bestPrice = [...base].sort((left, right) => Number(left.finalPurchaseCost || left.price || Infinity) - Number(right.finalPurchaseCost || right.price || Infinity))[0] || null;
    const bestInstallment = [...base]
      .filter((item) => item.installments?.available && Number(item.installments?.amount || 0) > 0)
      .sort((left, right) => Number(left.installments.amount || Infinity) - Number(right.installments.amount || Infinity))[0] || null;

    const decisions = [
      bestOverall ? { decision: "BEST_OVERALL", productId: bestOverall.sourceProductId || bestOverall.id || bestOverall.itemId || bestOverall.asin, product: bestOverall } : null,
      bestOfficial ? { decision: "BEST_OFFICIAL_STORE", productId: bestOfficial.sourceProductId || bestOfficial.id || bestOfficial.itemId || bestOfficial.asin, product: bestOfficial } : null,
      bestPrice ? { decision: "BEST_PRICE", productId: bestPrice.sourceProductId || bestPrice.id || bestPrice.itemId || bestPrice.asin, product: bestPrice } : null,
      bestInstallment ? { decision: "BEST_INSTALLMENT", productId: bestInstallment.sourceProductId || bestInstallment.id || bestInstallment.itemId || bestInstallment.asin, product: bestInstallment } : null,
    ].filter(Boolean);

    const unique = [];
    const used = new Set();
    for (const item of decisions) {
      const key = `${item.decision}:${item.productId}`;
      if (used.has(key)) continue;
      used.add(key);
      unique.push(item);
    }
    return unique;
  }
}

export default PurchaseDecisionEngine;
