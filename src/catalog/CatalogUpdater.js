function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function sameString(a, b) {
  return normalizeText(a) && normalizeText(a) === normalizeText(b);
}

export default class CatalogUpdater {
  merge(existing = [], incoming = []) {
    const merged = [...existing];
    for (const product of incoming) {
      const index = merged.findIndex((item) =>
        sameString(item.id, product.id) ||
        sameString(item.externalId, product.externalId) ||
        sameString(item.productUrl, product.productUrl) ||
        sameString(item.affiliateUrl, product.affiliateUrl) ||
        (normalizeText(item.title) === normalizeText(product.title) &&
         normalizeText(item.brand) === normalizeText(product.brand) &&
         normalizeText(item.model) === normalizeText(product.model))
      );

      if (index >= 0) {
        merged[index] = {
          ...merged[index],
          ...product,
          id: merged[index].id,
          updatedAt: product.updatedAt || new Date().toISOString(),
          importedAt: merged[index].importedAt || product.importedAt || new Date().toISOString(),
        };
      } else {
        merged.push(product);
      }
    }
    return merged;
  }

  remove(existing = [], id) {
    return existing.filter((item) => item.id !== id);
  }

  disable(existing = [], id) {
    return existing.map((item) => item.id === id ? { ...item, status: "DISABLED", updatedAt: new Date().toISOString() } : item);
  }
}
