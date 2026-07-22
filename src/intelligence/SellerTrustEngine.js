export class SellerTrustEngine {
  evaluate(product = {}, officialStore = {}) {
    const reasons = [];
    const warnings = [];
    let trustScore = 50;

    if (officialStore?.confidence === "VERIFIED") {
      trustScore += 35;
      reasons.push("loja_oficial_verificada");
    } else if (officialStore?.confidence === "LIKELY") {
      trustScore += 15;
      reasons.push("sinais_de_loja_oficial");
    }

    const reputation = product.sellerReputation || product.seller?.reputation || null;
    if (reputation?.level_id || reputation?.power_seller_status) {
      trustScore += 15;
      reasons.push("reputacao_da_fonte");
    } else {
      warnings.push("reputacao_ainda_nao_verificada");
    }

    if (!product.seller?.name && !product.seller) {
      trustScore -= 10;
      warnings.push("seller_ausente");
    }

    if (!product.permalink) {
      trustScore -= 20;
      warnings.push("link_invalido");
    }

    trustScore = Math.max(0, Math.min(100, trustScore));
    const trustLevel = trustScore >= 80 ? "HIGH" : trustScore >= 60 ? "MODERATE" : "LOW";
    return {
      trustLevel,
      trustScore,
      reasons,
      warnings,
    };
  }
}

export default SellerTrustEngine;
