export class DecisionExplanationEngine {
  explain(product = {}, context = {}) {
    const parts = [];
    if (context.matchClass === "EXACT_MATCH") parts.push("Modelo exato para a busca.");
    if (context.officialStore?.confidence === "VERIFIED") parts.push("Loja oficial confirmada.");
    if (context.trust?.trustLevel === "HIGH") parts.push("Vendedor com confiança alta.");
    if (Number(context.finalCost?.shipping || 0) === 0) parts.push("Frete grátis.");
    if (product.installments?.available && product.installments?.count) {
      parts.push(`${product.installments.count}x de R$ ${Number(product.installments.amount || 0).toFixed(2).replace(".", ",")}.`);
    }
    if (!parts.length && Number(product.price || 0) > 0) parts.push("Oferta válida com preço confirmado.");
    return parts.join(" ").slice(0, 160).trim();
  }
}

export default DecisionExplanationEngine;
