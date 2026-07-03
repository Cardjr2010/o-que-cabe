function toNumber(value, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toTimestamp(value) {
  const parsed = new Date(value || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeHistoryEntry(entry = {}) {
  if (!entry || typeof entry !== "object") return null;
  const price = toNumber(entry.price, NaN);
  if (!Number.isFinite(price) || price <= 0) return null;
  const date = String(entry.date || entry.at || entry.updatedAt || new Date().toISOString());
  return { date, price };
}

function normalizeHistory(product = {}) {
  const history = Array.isArray(product.priceHistory) ? product.priceHistory.map(normalizeHistoryEntry).filter(Boolean) : [];
  const currentPrice = toNumber(product.price, 0);
  if (currentPrice > 0 && !history.some((item) => item.price === currentPrice)) {
    history.push({ date: String(product.updatedAt || product.lastCheckedAt || product.importedAt || new Date().toISOString()), price: currentPrice });
  }
  return history.sort((a, b) => toTimestamp(a.date) - toTimestamp(b.date) || a.price - b.price);
}

function formatTrend(direction) {
  if (direction === "down") return "Preço caindo";
  if (direction === "up") return "Preço subindo";
  return "Preço estável";
}

function formatIndicator(indicator) {
  if (indicator === "excellent") return "Excelente preço";
  if (indicator === "high") return "Preço alto";
  return "Preço normal";
}

function formatAdvice(indicator, trend, hasHistory) {
  if (indicator === "excellent" && trend !== "up") return "Vale comprar hoje.";
  if (indicator === "high" || trend === "up") return "Pode valer esperar alguns dias.";
  if (!hasHistory) return "Sem histórico suficiente. Vale acompanhar.";
  return "Preço está em uma faixa normal. Vale monitorar.";
}

function buildPriceBounds(history = []) {
  const prices = history.map((entry) => toNumber(entry.price, 0)).filter((price) => Number.isFinite(price) && price > 0);
  if (!prices.length) {
    return { minPrice: 0, maxPrice: 0, averagePrice: 0 };
  }
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  return { minPrice, maxPrice, averagePrice };
}

function compareHistory(history = []) {
  if (history.length < 2) {
    return {
      trend: "stable",
      trendLabel: formatTrend("stable"),
      delta: 0,
      deltaPercent: 0,
      previousPrice: 0,
      currentPrice: history.at(-1)?.price || 0,
    };
  }
  const previous = history.at(-2);
  const current = history.at(-1);
  const delta = toNumber(current.price, 0) - toNumber(previous.price, 0);
  const deltaPercent = previous.price > 0 ? (delta / previous.price) * 100 : 0;
  const trend = Math.abs(deltaPercent) <= 1 ? "stable" : delta < 0 ? "down" : "up";
  return {
    trend,
    trendLabel: formatTrend(trend),
    delta,
    deltaPercent,
    previousPrice: previous.price,
    currentPrice: current.price,
  };
}

function buildPromotion(history = []) {
  if (history.length < 2) {
    return {
      previousPrice: 0,
      currentPrice: history.at(-1)?.price || 0,
      discountValue: 0,
      discountPercent: 0,
      isRealPromotion: false,
      label: "Sem promoção real detectada",
    };
  }

  const previous = history.at(-2);
  const current = history.at(-1);
  const discountValue = toNumber(previous.price, 0) - toNumber(current.price, 0);
  const discountPercent = previous.price > 0 ? (discountValue / previous.price) * 100 : 0;
  const isRealPromotion = discountValue > 0;
  return {
    previousPrice: previous.price,
    currentPrice: current.price,
    discountValue: Math.max(0, discountValue),
    discountPercent: Math.max(0, discountPercent),
    isRealPromotion,
    label: isRealPromotion
      ? `Preço anterior ${previous.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} → atual ${current.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
      : "Sem promoção real detectada",
  };
}

function buildIndicator(product = {}, history = []) {
  const currentPrice = toNumber(product.price, 0);
  const { minPrice, maxPrice, averagePrice } = buildPriceBounds(history);
  if (!currentPrice || !Number.isFinite(currentPrice)) {
    return {
      indicator: "normal",
      indicatorLabel: formatIndicator("normal"),
      confidence: 0,
    };
  }

  const spread = Math.max(0, maxPrice - minPrice);
  if (!history.length || spread === 0) {
    return {
      indicator: "normal",
      indicatorLabel: formatIndicator("normal"),
      confidence: 0.25,
    };
  }

  if (currentPrice <= minPrice * 1.05 || currentPrice <= averagePrice * 0.92) {
    return {
      indicator: "excellent",
      indicatorLabel: formatIndicator("excellent"),
      confidence: 0.9,
    };
  }

  if (currentPrice >= maxPrice * 0.95 || currentPrice >= averagePrice * 1.08) {
    return {
      indicator: "high",
      indicatorLabel: formatIndicator("high"),
      confidence: 0.8,
    };
  }

  return {
    indicator: "normal",
    indicatorLabel: formatIndicator("normal"),
    confidence: 0.65,
  };
}

function buildAlertArchitecture(product = {}, history = []) {
  const currentPrice = toNumber(product.price, 0);
  const { minPrice } = buildPriceBounds(history);
  const targetPrice = minPrice > 0 ? minPrice : currentPrice;
  return {
    enabled: true,
    futureOnly: true,
    targetPrice,
    targetPriceLabel: targetPrice > 0 ? targetPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "",
    message: targetPrice > 0 ? `Avise-me quando chegar a ${targetPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.` : "Avise-me quando o preço cair.",
  };
}

function buildCategoryPriceSummary(items = []) {
  const categoryMap = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    const category = String(item.category || item.department || "Sem categoria").trim() || "Sem categoria";
    const price = toNumber(item.price, 0);
    if (!price) continue;
    const entry = categoryMap.get(category) || { category, count: 0, minPrice: price, maxPrice: price, totalPrice: 0 };
    entry.count += 1;
    entry.minPrice = Math.min(entry.minPrice, price);
    entry.maxPrice = Math.max(entry.maxPrice, price);
    entry.totalPrice += price;
    categoryMap.set(category, entry);
  }

  return [...categoryMap.values()]
    .map((entry) => ({
      category: entry.category,
      count: entry.count,
      minPrice: entry.minPrice,
      maxPrice: entry.maxPrice,
      averagePrice: entry.count ? entry.totalPrice / entry.count : 0,
    }))
    .sort((a, b) => a.minPrice - b.minPrice || b.count - a.count || a.category.localeCompare(b.category, "pt-BR"));
}

export default class MarketIntelligenceEngine {
  buildProductSnapshot(product = {}) {
    const history = normalizeHistory(product);
    const { minPrice, maxPrice, averagePrice } = buildPriceBounds(history);
    const trend = compareHistory(history);
    const promotion = buildPromotion(history);
    const indicator = buildIndicator(product, history);
    const hasHistory = history.length > 1;
    const advice = formatAdvice(indicator.indicator, trend.trend, hasHistory);
    const lastCollectedAt = history.at(-1)?.date || product.lastCheckedAt || product.updatedAt || product.importedAt || "";

    return {
      currentPrice: toNumber(product.price, 0),
      minPrice,
      maxPrice,
      averagePrice,
      lastCollectedAt,
      historyCount: history.length,
      priceHistory: history,
      historySummary: minPrice > 0
        ? `O menor preço registrado foi ${minPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`
        : "Sem histórico suficiente para comparar preços.",
      priceIndicator: indicator.indicator,
      priceIndicatorLabel: indicator.indicatorLabel,
      priceIndicatorConfidence: indicator.confidence,
      trend: trend.trend,
      trendLabel: trend.trendLabel,
      trendDelta: trend.delta,
      trendDeltaPercent: trend.deltaPercent,
      promotion,
      lowestPriceMessage: minPrice > 0 ? `O menor preço registrado foi ${minPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.` : "",
      highestPriceMessage: maxPrice > 0 ? `O maior preço registrado foi ${maxPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.` : "",
      advice,
      advisoryLabel: advice,
      marketAdvice: advice,
      alert: buildAlertArchitecture(product, history),
      alertable: true,
      marketSnapshot: {
        currentPrice: toNumber(product.price, 0),
        minPrice,
        maxPrice,
        averagePrice,
        trend: trend.trend,
        promotion,
        indicator: indicator.indicator,
        advice,
      },
    };
  }

  enrichProduct(product = {}) {
    const market = this.buildProductSnapshot(product);
    return {
      ...product,
      market,
      marketSnapshot: market,
    };
  }

  buildCatalogStats(items = []) {
    const products = Array.isArray(items) ? items : [];
    const monitoredProducts = products.length;
    const withHistory = products.filter((item) => normalizeHistory(item).length > 1);
    const productSnapshots = products.map((item) => ({
      product: item,
      snapshot: this.buildProductSnapshot(item),
    }));

    const realPromotions = productSnapshots.filter(({ snapshot }) => snapshot.promotion.isRealPromotion);
    const drops = [...realPromotions]
      .sort((a, b) => b.snapshot.promotion.discountValue - a.snapshot.promotion.discountValue || b.snapshot.promotion.discountPercent - a.snapshot.promotion.discountPercent)
      .slice(0, 10)
      .map(({ product, snapshot }) => ({
        id: product.id || product.externalId || "",
        title: product.title || product.displayTitle || "",
        category: product.category || product.department || "",
        source: product.marketplace || product.source || product.seller || "",
        currentPrice: snapshot.currentPrice,
        previousPrice: snapshot.promotion.previousPrice,
        discountValue: snapshot.promotion.discountValue,
        discountPercent: snapshot.promotion.discountPercent,
        label: snapshot.promotion.label,
      }));

    const rises = [...productSnapshots]
      .filter(({ snapshot }) => snapshot.historyCount > 1 && snapshot.trend === "up")
      .sort((a, b) => b.snapshot.trendDeltaPercent - a.snapshot.trendDeltaPercent || b.snapshot.trendDelta - a.snapshot.trendDelta)
      .slice(0, 10)
      .map(({ product, snapshot }) => ({
        id: product.id || product.externalId || "",
        title: product.title || product.displayTitle || "",
        category: product.category || product.department || "",
        source: product.marketplace || product.source || product.seller || "",
        currentPrice: snapshot.currentPrice,
        previousPrice: snapshot.previousPrice || snapshot.promotion.previousPrice,
        delta: snapshot.trendDelta,
        deltaPercent: snapshot.trendDeltaPercent,
        label: snapshot.trendLabel,
      }));

    const categorySummary = buildCategoryPriceSummary(products).slice(0, 10);
    const cheapestCategories = categorySummary.slice(0, 10);

    return {
      ok: true,
      monitoredProducts,
      productsWithHistory: withHistory.length,
      historyCoverage: monitoredProducts ? withHistory.length / monitoredProducts : 0,
      realPromotions: realPromotions.length,
      biggestDrops: drops,
      biggestRises: rises,
      cheapestCategories,
      alertArchitecture: {
        enabled: true,
        futureOnly: true,
        message: "Estrutura preparada para alertas futuros: 'Avise-me quando chegar a R$ XXX'.",
      },
    };
  }

  buildCatalogSnapshot(items = []) {
    return this.buildCatalogStats(items);
  }
}

export { normalizeHistory, buildPriceBounds };
