import CatalogManager from "../catalog/CatalogManager.js";
import ProductIntentParser from "../search/ProductIntentParser.js";
import SourcePlanner from "../search/SourcePlanner.js";
import ProductMatchEngine from "../intelligence/ProductMatchEngine.js";
import OfficialStoreResolver from "../intelligence/OfficialStoreResolver.js";
import SourceQualityEngine from "../intelligence/SourceQualityEngine.js";
import SellerTrustEngine from "../intelligence/SellerTrustEngine.js";
import FinalPurchaseCostEngine from "../pricing/FinalPurchaseCostEngine.js";
import PurchaseDecisionEngine from "../intelligence/PurchaseDecisionEngine.js";
import DecisionExplanationEngine from "../intelligence/DecisionExplanationEngine.js";
import GeckoApiClient from "../providers/gecko/GeckoApiClient.js";

function nowIso() {
  return new Date().toISOString();
}

function dedupeByCanonical(products = []) {
  const map = new Map();
  for (const product of Array.isArray(products) ? products : []) {
    const canonicalUrl = String(product.canonicalUrl || product.permalink || product.productUrl || "").trim();
    const id = String(product.sourceProductId || product.itemId || product.asin || product.id || "").trim();
    const key = canonicalUrl || `${product.source}:${id}:${String(product.title || "").trim()}`;
    if (!key) continue;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...product });
      continue;
    }
    const confirmations = [
      ...(Array.isArray(existing.providerConfirmations) ? existing.providerConfirmations : []),
      ...(Array.isArray(product.providerConfirmations) ? product.providerConfirmations : []),
    ];
    map.set(key, {
      ...existing,
      providerConfirmations: confirmations,
      rawSourceConfidence: Math.max(Number(existing.rawSourceConfidence || 0), Number(product.rawSourceConfidence || 0)),
    });
  }
  return [...map.values()];
}

function buildCatalogProducts(catalogManager, intent) {
  if (!catalogManager?.search) return [];
  const list = catalogManager.search({
    q: intent.query,
    brand: intent.brand || "",
  });
  return (Array.isArray(list) ? list : []).map((item) => ({
    source: "catalog",
    provider: "catalog",
    sourceProductId: String(item.externalId || item.id || item.title || "").trim(),
    canonicalUrl: item.affiliateUrl || item.productUrl || item.permalink || "",
    title: item.displayTitle || item.title || "",
    brand: item.brand || "",
    model: item.model || "",
    variant: item.variant || "",
    category: item.category || item.normalizedCategory || "",
    price: Number(item.price || 0),
    originalPrice: Number(item.originalPrice || 0) || null,
    currency: item.currency || "BRL",
    condition: item.condition || "",
    image: item.image || item.thumbnail || "",
    seller: typeof item.seller === "object" ? item.seller : { name: item.seller || item.sourceName || item.marketplace || null },
    officialStore: false,
    shipping: item.shipping || { price: 0, free: true },
    installments: item.installments || null,
    availability: item.availability || "",
    rating: item.rating || null,
    reviewCount: item.reviewCount || null,
    coupon: item.coupon || null,
    permalink: item.affiliateUrl || item.productUrl || item.permalink || "",
    lastCheckedAt: item.lastCheckedAt || nowIso(),
    rawSourceConfidence: 0.9,
    raw: item,
  }));
}

function normalizeProviderProduct(product = {}, source = "", provider = "") {
  return {
    source,
    provider,
    sourceProductId: String(product.sourceProductId || product.itemId || product.asin || product.id || "").trim(),
    canonicalUrl: product.canonicalUrl || product.permalink || product.productUrl || product.url || "",
    title: product.title || product.displayTitle || "",
    brand: product.brand || "",
    model: product.model || "",
    variant: product.variant || "",
    category: product.category || "",
    price: Number(product.price || 0),
    originalPrice: Number(product.originalPrice || 0) || null,
    currency: product.currency || "BRL",
    condition: product.condition || "",
    image: product.image || product.thumbnail || "",
    seller: product.seller || { name: product.sourceName || product.marketplace || null },
    officialStore: product.officialStore || false,
    shipping: product.shipping || { price: 0, free: false },
    installments: product.installments || null,
    availability: product.availability || "",
    rating: product.rating || null,
    reviewCount: product.reviewCount || null,
    coupon: product.coupon || null,
    permalink: product.permalink || product.productUrl || product.url || "",
    lastCheckedAt: product.lastCheckedAt || nowIso(),
    rawSourceConfidence: Number(product.rawSourceConfidence || 0.7),
    providerConfirmations: [
      {
        provider,
        checkedAt: nowIso(),
        price: Number(product.price || 0),
      },
    ],
    raw: product.raw || product,
  };
}

function extractGeckoItems(body = {}) {
  const candidates = [
    body?.data?.products,
    body?.data?.results,
    body?.products,
    body?.results,
    body?.items,
    body?.data?.items,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function normalizeGeckoProduct(item = {}, source = "", provider = "") {
  const url = item.product_url || item.url || item.link || item.permalink || "";
  const price = Number(item.product_price || item.price || item.current_price || item.price?.amount || 0) || 0;
  return normalizeProviderProduct({
    ...item,
    id: item.product_id || item.id || item.asin || item.itemId,
    title: item.product_title || item.title || item.name || "",
    price,
    originalPrice: Number(item.original_price || item.was_price || 0) || null,
    image: item.product_photo || item.image || item.thumbnail || "",
    permalink: url,
    productUrl: url,
    seller: { name: item.seller_name || item.seller || item.store_name || source },
    shipping: {
      price: Number(item.shipping_price || item.shipping?.price || 0) || 0,
      free: Boolean(item.free_shipping || item.shipping?.free),
    },
    installments: item.installments || null,
    availability: item.availability || item.stock_status || "",
    condition: item.condition || item.product_condition || "",
  }, source, provider);
}

export class SourceIntelligenceLayer {
  constructor({
    catalogManager = null,
    mercadoLivreProvider = null,
    amazonProvider = null,
    geckoClient = null,
    intentParser = null,
    sourcePlanner = null,
    productMatchEngine = null,
    officialStoreResolver = null,
    sourceQualityEngine = null,
    sellerTrustEngine = null,
    finalPurchaseCostEngine = null,
    purchaseDecisionEngine = null,
    decisionExplanationEngine = null,
  } = {}) {
    this.catalogManager = catalogManager || new CatalogManager();
    this.mercadoLivreProvider = mercadoLivreProvider;
    this.amazonProvider = amazonProvider;
    this.geckoClient = geckoClient || new GeckoApiClient();
    this.intentParser = intentParser || new ProductIntentParser();
    this.sourcePlanner = sourcePlanner || new SourcePlanner();
    this.productMatchEngine = productMatchEngine || new ProductMatchEngine();
    this.officialStoreResolver = officialStoreResolver || new OfficialStoreResolver();
    this.sourceQualityEngine = sourceQualityEngine || new SourceQualityEngine();
    this.sellerTrustEngine = sellerTrustEngine || new SellerTrustEngine();
    this.finalPurchaseCostEngine = finalPurchaseCostEngine || new FinalPurchaseCostEngine();
    this.purchaseDecisionEngine = purchaseDecisionEngine || new PurchaseDecisionEngine();
    this.decisionExplanationEngine = decisionExplanationEngine || new DecisionExplanationEngine();
  }

  getAvailableSources() {
    return [
      "catalog",
      this.mercadoLivreProvider ? "mercado_livre_direct" : null,
      this.amazonProvider ? "amazon_direct" : null,
      this.geckoClient?.isConfigured?.() ? "gecko_mercado_livre" : null,
      this.geckoClient?.isConfigured?.() ? "gecko_amazon" : null,
      this.geckoClient?.isConfigured?.() ? "gecko_magalu" : null,
      this.geckoClient?.isConfigured?.() ? "gecko_casas_bahia" : null,
      this.geckoClient?.isConfigured?.() ? "gecko_shopee" : null,
    ].filter(Boolean);
  }

  async search({ query = "", intent = null, budget = {}, sources = null, limitPerSource = 10 } = {}) {
    const startedAt = Date.now();
    const parsedIntent = intent || this.intentParser.parse({
      query,
      maxTotalBudget: budget.maxTotalBudget || budget.totalBudget || 0,
      maxMonthlyBudget: budget.maxMonthlyBudget || budget.monthly || 0,
      installments: budget.installments || 0,
    });

    const plan = this.sourcePlanner.plan(parsedIntent, sources || this.getAvailableSources());
    const diagnostics = {
      plan,
      sources: {},
    };

    if (parsedIntent.refinementRequired) {
      return {
        query,
        intent: parsedIntent,
        sourceResults: [],
        products: [],
        diagnostics: {
          ...diagnostics,
          refinementRequired: true,
        },
        elapsedMs: Date.now() - startedAt,
      };
    }

    const tasks = plan.selectedSources.map(async (source) => {
      if (source === "catalog") {
        const items = buildCatalogProducts(this.catalogManager, parsedIntent).slice(0, limitPerSource);
        return { source, called: true, configured: true, httpStatus: 200, received: items.length, accepted: items.length, products: items, failureReason: null };
      }
      if (source === "mercado_livre_direct" && this.mercadoLivreProvider) {
        const result = await this.mercadoLivreProvider.searchProducts(query, { limit: limitPerSource, maxPrice: parsedIntent.maxTotalBudget || 0, brand: parsedIntent.brand || "", model: parsedIntent.model || "" });
        const products = (Array.isArray(result.products) ? result.products : []).map((item) => normalizeProviderProduct(item, "mercado_livre", "direct_api"));
        return { source, called: true, configured: true, httpStatus: result.statusHttp || 0, received: Number(result.rawCount || products.length), accepted: products.length, products, failureReason: result.error || null };
      }
      if (source === "amazon_direct" && this.amazonProvider) {
        const result = await this.amazonProvider.searchProducts(query, { limit: limitPerSource, maxPrice: parsedIntent.maxTotalBudget || 0, brand: parsedIntent.brand || "", model: parsedIntent.model || "", marketplace: "BR" });
        const products = (Array.isArray(result.products) ? result.products : []).map((item) => normalizeProviderProduct(item, "amazon", this.amazonProvider.providerName?.() || "direct_api"));
        return { source, called: true, configured: true, httpStatus: result.statusHttp || 0, received: Number(result.rawCount || products.length), accepted: products.length, products, failureReason: result.error || null };
      }
      if (source.startsWith("gecko_")) {
        const marketplace = source.replace("gecko_", "");
        const probe = await this.geckoClient.probeMarketplace({ source: marketplace, query });
        const items = extractGeckoItems(probe.body).map((item) => normalizeGeckoProduct(item, marketplace, "gecko_api"));
        return {
          source,
          called: true,
          configured: this.geckoClient.isConfigured(),
          httpStatus: probe.status || 0,
          received: items.length,
          accepted: items.length,
          products: items,
          failureReason: probe.errorType,
          request: probe.request,
        };
      }
      return { source, called: false, configured: false, httpStatus: 0, received: 0, accepted: 0, products: [], failureReason: "NOT_AVAILABLE" };
    });

    const settled = await Promise.allSettled(tasks);
    const sourceResults = [];
    let products = [];

    for (const result of settled) {
      if (result.status !== "fulfilled") continue;
      sourceResults.push(result.value);
      diagnostics.sources[result.value.source] = {
        called: result.value.called,
        configured: result.value.configured,
        httpStatus: result.value.httpStatus,
        received: result.value.received,
        accepted: result.value.accepted,
        failureReason: result.value.failureReason,
      };
      products.push(...(result.value.products || []));
    }

    products = dedupeByCanonical(products).map((product) => {
      const match = this.productMatchEngine.classify(product, parsedIntent);
      const officialStore = this.officialStoreResolver.resolve(product);
      const sourceQuality = this.sourceQualityEngine.evaluate(product);
      const trust = this.sellerTrustEngine.evaluate(product, officialStore);
      const finalCost = this.finalPurchaseCostEngine.calculate(product);
      const decisionScore = Math.max(0, Number(match.matchScore || 0))
        + (officialStore.confidence === "VERIFIED" ? 20 : officialStore.confidence === "LIKELY" ? 8 : 0)
        + Number(sourceQuality.sourceQualityScore || 0) * 0.2
        + Number(trust.trustScore || 0) * 0.2
        - (Number(finalCost.finalPurchaseCost || product.price || 0) / 10000);
      const explanation = this.decisionExplanationEngine.explain(product, { matchClass: match.className, officialStore, trust, finalCost });
      return {
        ...product,
        matchClass: match.className,
        matchReasons: match.reasons,
        matchScore: match.matchScore,
        officialStore,
        sourceQuality,
        trust,
        finalPurchaseCost: finalCost.finalPurchaseCost,
        finalCost,
        decisionScore,
        explanation,
      };
    });

    const accepted = products.filter((product) => ["EXACT_MATCH", "VALID_VARIANT"].includes(product.matchClass));
    const rejected = {
      accessories: products.filter((product) => product.matchClass === "ACCESSORY").length,
      wrongModel: products.filter((product) => product.matchClass === "WRONG_PRODUCT").length,
      insufficientData: products.filter((product) => product.matchClass === "INSUFFICIENT_DATA").length,
      relatedModel: products.filter((product) => product.matchClass === "RELATED_MODEL").length,
    };

    const decisions = this.purchaseDecisionEngine.decide(accepted, {
      maxTotalBudget: parsedIntent.maxTotalBudget,
      totalBudget: parsedIntent.maxTotalBudget,
    }).map((entry) => ({
      ...entry,
      explanation: entry.product?.explanation || "",
    }));

    return {
      query,
      intent: parsedIntent,
      sourceResults,
      products: accepted.sort((left, right) => Number(right.decisionScore || 0) - Number(left.decisionScore || 0)),
      diagnostics: {
        ...diagnostics,
        rejected,
        totalReceived: products.length,
        accepted: accepted.length,
        decisions,
      },
      elapsedMs: Date.now() - startedAt,
    };
  }
}

export default SourceIntelligenceLayer;
