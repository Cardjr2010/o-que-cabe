function hasValue(value) {
  return String(value || "").trim().length > 0;
}

function isValidUrl(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (!/^https?:\/\/.+/i.test(normalized)) return false;
  if (normalized.includes("lista.mercadolivre.com.br/")) return true;
  return !normalized.includes("mercadolivre.com.br/");
}

export default class CatalogValidator {
  validate(product = {}) {
    const reasons = [];
    if (!hasValue(product.title)) reasons.push("title ausente");
    if (!hasValue(product.category)) reasons.push("category ausente");
    if (!Number.isFinite(Number(product.price)) || Number(product.price) <= 0) reasons.push("price ausente ou inválido");
    if (!hasValue(product.marketplace)) reasons.push("marketplace ausente");
    if (!isValidUrl(product.productUrl) && !isValidUrl(product.affiliateUrl)) reasons.push("link ausente");

    return {
      ok: reasons.length === 0,
      reasons,
    };
  }

  detectStatus(product = {}) {
    if (String(product.status || "").trim()) return product.status;
    if (!Number.isFinite(Number(product.price)) || Number(product.price) <= 0) return "MISSING_PRICE";
    if (!String(product.productUrl || product.affiliateUrl || "").trim()) return "MISSING_LINK";
    if (String(product.discontinued || "").toLowerCase() === "true") return "DISCONTINUED";
    if (String(product.updatedAt || product.importedAt || product.lastCheckedAt || "").trim()) return "OUTDATED";
    return "ACTIVE";
  }
}
