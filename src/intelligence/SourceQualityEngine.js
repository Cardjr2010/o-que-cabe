function ratio(value, max) {
  if (!max) return 0;
  return Math.max(0, Math.min(1, Number(value || 0) / Number(max)));
}

export class SourceQualityEngine {
  evaluate(product = {}) {
    const completenessParts = [
      Boolean(product.price),
      Boolean(product.image || product.thumbnail),
      Boolean(product.permalink || product.productUrl || product.url),
      Boolean(product.seller?.name || product.seller),
      Boolean(product.shipping),
      Boolean(product.installments),
    ];
    const completenessScore = ratio(completenessParts.filter(Boolean).length, completenessParts.length) * 100;
    const confirmationCount = Array.isArray(product.providerConfirmations) ? product.providerConfirmations.length : 0;
    const freshnessScore = product.lastCheckedAt ? 90 : 60;
    const sourceQualityScore = Math.round((completenessScore * 0.6) + (freshnessScore * 0.2) + (Math.min(confirmationCount, 2) * 10));
    const trustLevel = sourceQualityScore >= 80 ? "HIGH" : sourceQualityScore >= 60 ? "MODERATE" : "LOW";
    return {
      sourceQualityScore,
      completenessScore: Math.round(completenessScore),
      freshnessScore,
      trustLevel,
    };
  }
}

export default SourceQualityEngine;
