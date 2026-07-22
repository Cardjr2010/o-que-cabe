function normalizeEvidence(evidence = []) {
  return [...new Set((Array.isArray(evidence) ? evidence : []).filter(Boolean).map((item) => String(item).trim()))];
}

export class OfficialStoreResolver {
  resolve(product = {}) {
    const evidence = [];
    const raw = product.raw || {};
    const seller = product.seller || {};

    if (raw.official_store_id || raw.officialStoreId) evidence.push("official_store_id");
    if (raw.official_store_name || raw.officialStoreName || seller.official_store_name) evidence.push("official_store_name");
    if (raw.official_store || raw.isOfficialStore || product.officialStore === true) evidence.push("official_flag");
    if ((Array.isArray(product.providerConfirmations) ? product.providerConfirmations : []).length >= 2) evidence.push("multi_provider_confirmation");

    const normalizedEvidence = normalizeEvidence(evidence);
    if (normalizedEvidence.includes("official_store_id") || normalizedEvidence.includes("official_flag")) {
      return {
        isOfficial: true,
        confidence: "VERIFIED",
        storeId: raw.official_store_id || raw.officialStoreId || null,
        storeName: raw.official_store_name || raw.officialStoreName || seller.official_store_name || seller.name || null,
        evidence: normalizedEvidence,
      };
    }
    if (normalizedEvidence.includes("official_store_name")) {
      return {
        isOfficial: false,
        confidence: "LIKELY",
        storeId: raw.official_store_id || raw.officialStoreId || null,
        storeName: raw.official_store_name || raw.officialStoreName || seller.official_store_name || seller.name || null,
        evidence: normalizedEvidence,
      };
    }
    return {
      isOfficial: false,
      confidence: "NOT_VERIFIED",
      storeId: null,
      storeName: seller.name || null,
      evidence: normalizedEvidence,
    };
  }
}

export default OfficialStoreResolver;
