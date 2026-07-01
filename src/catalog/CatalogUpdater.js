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

function normalizeHistory(history = []) {
  return Array.isArray(history)
    ? history
        .filter((item) => item && Number.isFinite(Number(item.price)))
        .map((item) => ({
          date: String(item.date || item.at || item.updatedAt || new Date().toISOString()),
          price: Number(item.price),
        }))
    : [];
}

function todayStamp() {
  return new Date().toISOString();
}

export default class CatalogUpdater {
  merge(existing = [], incoming = []) {
    const merged = [...existing];
    for (const product of incoming) {
      const index = merged.findIndex((item) =>
        sameString(item.id, product.id) ||
        sameString(item.externalId, product.externalId) ||
        sameString(item.gtin, product.gtin) ||
        sameString(item.productUrl, product.productUrl) ||
        sameString(item.affiliateUrl, product.affiliateUrl) ||
        (normalizeText(item.title) === normalizeText(product.title) &&
         normalizeText(item.brand) === normalizeText(product.brand) &&
         normalizeText(item.model) === normalizeText(product.model))
      );

      if (index >= 0) {
        const current = merged[index];
        const currentHistory = normalizeHistory(current.priceHistory);
        const incomingHistory = normalizeHistory(product.priceHistory);
        const nextPrice = Number(product.price);
        const previousPrice = Number(current.price);
        const priceChanged = Number.isFinite(nextPrice) && Number.isFinite(previousPrice) && nextPrice > 0 && nextPrice !== previousPrice;
        const priceHistory = [...currentHistory];
        for (const entry of incomingHistory) {
          if (!priceHistory.some((item) => item.date === entry.date && item.price === entry.price)) {
            priceHistory.push(entry);
          }
        }
        if (priceChanged) {
          priceHistory.push({ date: todayStamp(), price: nextPrice });
        }
        merged[index] = {
          ...current,
          ...product,
          id: current.id,
          priceHistory,
          updatedAt: product.updatedAt || todayStamp(),
          importedAt: current.importedAt || product.importedAt || todayStamp(),
        };
      } else {
        merged.push({
          ...product,
          priceHistory: normalizeHistory(product.priceHistory),
          importedAt: product.importedAt || todayStamp(),
          updatedAt: product.updatedAt || todayStamp(),
        });
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
