import BudgetEngine from "../engines/BudgetEngine.js";
import { scoreProductMatch, normalizeText } from "../catalog/ProductNormalizer.js";
import { buildInstallmentBudgetContext, normalizeInstallmentData } from "../catalog/installments.js";
import ProductIntelligenceEngine from "../catalog/ProductIntelligenceEngine.js";
import SEOIntelligenceEngine from "../seo/SEOIntelligenceEngine.js";

function toNumber(value, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

const CATEGORY_RULES = [
  { category: "celular", terms: ["celular", "smartphone", "iphone", "galaxy", "redmi", "poco", "motorola", "moto"] },
  { category: "notebook", terms: ["notebook", "laptop", "vivobook", "ideapad", "thinkpad", "aspire", "inspiron", "loq"] },
  { category: "tablet", terms: ["tablet", "ipad", "galaxy tab", "redmi pad", "xiaomi pad"] },
  { category: "tv", terms: ["tv", "televisor", "smart tv", "oled", "qled", "roku"] },
  { category: "monitor", terms: ["monitor"] },
  { category: "fone", terms: ["fone", "headphone", "earbud", "buds", "airpods", "jbl"] },
  { category: "relogio", terms: ["relogio", "relógio", "smartwatch", "watch", "band"] },
  { category: "casa", terms: ["casa", "cozinha", "banheiro", "limpeza", "organizador", "utensilio", "utilidade"] },
  { category: "presente", terms: ["presente", "kit", "lembranca", "lembrança", "brinde", "achadinho"] },
  { category: "ferramenta", terms: ["ferramenta", "furadeira", "parafusadeira", "serra", "martelo", "alicate", "trena"] },
  { category: "ferragem", terms: ["ferragem", "parafuso", "porca", "arruela", "bucha", "prego", "fechadura"] },
  { category: "construcao", terms: ["construcao", "construção", "cimento", "argamassa", "tinta", "selante", "vedante"] },
];

const BRAND_RULES = [
  { brand: "Apple", terms: ["iphone", "ipad", "apple watch", "macbook"] },
  { brand: "Xiaomi", terms: ["xiaomi", "mi ", "mi note", "xiaomi pad"] },
  { brand: "Redmi", terms: ["redmi"] },
  { brand: "POCO", terms: ["poco"] },
  { brand: "Samsung", terms: ["samsung", "galaxy"] },
  { brand: "Motorola", terms: ["motorola", "moto "] },
  { brand: "Lenovo", terms: ["lenovo", "ideapad", "thinkpad", "loq"] },
  { brand: "ASUS", terms: ["asus", "vivobook", "zenbook", "tuf"] },
  { brand: "Acer", terms: ["acer", "aspire"] },
  { brand: "LG", terms: ["lg"] },
  { brand: "TCL", terms: ["tcl"] },
  { brand: "Philips", terms: ["philips"] },
  { brand: "JBL", terms: ["jbl"] },
];

let productIntelligenceEngineInstance = null;
let seoIntelligenceEngineInstance = null;

function getProductIntelligenceEngine() {
  if (!productIntelligenceEngineInstance) {
    productIntelligenceEngineInstance = new ProductIntelligenceEngine({
      minCount: 5,
      maxHomeButtons: 6,
      maxDepartments: 14,
      maxCategories: 6,
      focusLabel: "Catálogo real",
    });
  }
  return productIntelligenceEngineInstance;
}

function getSEOIntelligenceEngine() {
  if (!seoIntelligenceEngineInstance) {
    seoIntelligenceEngineInstance = new SEOIntelligenceEngine({
      maxHotSearches: 6,
      maxHomeButtons: 6,
      minCategoryCount: 5,
    });
  }
  return seoIntelligenceEngineInstance;
}

function stripBudgetLanguage(value = "") {
  return String(value || "")
    .replace(/\b(?:até|ate)\s*\d+(?:[.,]\d+)?\s*(?:por\s*m[eê]s|mensal|mensais|x|parcelas?)?\b/gi, " ")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:por\s*m[eê]s|mensal|mensais)\b/gi, " ")
    .replace(/\b\d{1,2}x\b/gi, " ")
    .replace(/\b(?:por\s*m[eê]s|mensal|mensais|m[eê]s)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseBudgetNumber(text = "") {
  const normalized = String(text || "").replace(/\s+/g, " ");
  const monthlyMatch = normalized.match(/\b(?:até|ate)?\s*(\d+(?:[.,]\d+)?)\s*(?:por\s*m[eê]s|mensal|mensais)\b/i);
  if (monthlyMatch) {
    return { mode: "monthly", monthly: toNumber(monthlyMatch[1], 0), searchText: stripBudgetLanguage(normalized) };
  }
  const explicitTotalMatch = normalized.match(/\b(?:até|ate)\s*(\d+(?:[.,]\d+)?)\b/i);
  if (explicitTotalMatch) {
    return { mode: "total", totalBudget: toNumber(explicitTotalMatch[1], 0), searchText: stripBudgetLanguage(normalized) };
  }
  const monthsMatch = normalized.match(/\b(\d{1,2})x\b/i);
  if (monthsMatch) {
    return { months: Math.max(1, toNumber(monthsMatch[1], 12)), searchText: stripBudgetLanguage(normalized) };
  }
  return { searchText: stripBudgetLanguage(normalized) };
}

function detectCategory(text = "") {
  const normalized = normalizeText(text);
  for (const rule of CATEGORY_RULES) {
    if (rule.terms.some((term) => normalized.includes(normalizeText(term)))) {
      return rule.category;
    }
  }
  return "";
}

function detectBrand(text = "") {
  const normalized = normalizeText(text);
  for (const rule of BRAND_RULES) {
    if (rule.terms.some((term) => normalized.includes(normalizeText(term)))) {
      return rule.brand;
    }
  }
  return "";
}

function detectAccessoryIntent(text = "") {
  return /\b(capa|case|pelicula|pel[íi]cula|carregador|cabo|fone|headphone|earbud|airpods|strap|pulseira|acessorio|acess[óo]rio|suporte|power bank|powerbank|protector|protetor)\b/i.test(String(text || ""));
}

function classifyVisibility(product = {}) {
  const source = normalizeText([product.marketplace, product.source, product.sourceType, product.seller, product.store].filter(Boolean).join(" "));
  return !(source.includes("mi_shop") || source.includes("mi shop") || source.includes("mishop") || source.includes("mercadolivre") || source.includes("mercado livre"));
}

function matchProductType(product = {}, queryCategory = "", accessoryIntent = false) {
  const intelligence = product.intelligence || getProductIntelligenceEngine().enrichProduct(product);
  const productCategory = normalizeText(intelligence.category || product.normalizedCategory || product.category || "");
  const productDepartment = normalizeText(intelligence.department || product.department || "");
  const productSubcategory = normalizeText(intelligence.subcategory || product.subcategory || "");
  const productType = normalizeText(intelligence.productType || product.productType || "");
  const queryKey = normalizeText(queryCategory);
  const text = normalizeText([
    product.displayTitle,
    product.originalTitle,
    product.title,
    product.description,
    product.compatibility,
  ].filter(Boolean).join(" "));

  const isAccessory = Boolean(intelligence.isAccessory ?? product.isAccessory)
    || ["accessory", "piece", "compatible"].includes(productType)
    || ["acessorio", "accessorio", "accessory", "piece", "compatible"].includes(productCategory)
    || ["cabos e carregadores", "acessórios", "peças"].includes(productDepartment)
    || /\b(capa|case|pelicula|cabo|carregador|strap|pulseira|suporte|protector|protetor)\b/i.test(text);

  if (!accessoryIntent && isAccessory) {
    return false;
  }
  if (queryCategory) {
    return [
      productCategory,
      productType,
      productDepartment,
      productSubcategory,
      normalizeText(product.category || ""),
    ].some((value) => value === queryKey || value.includes(queryKey) || queryKey.includes(value));
  }
  return true;
}

function hasQueryRelevance(product = {}, intent = {}) {
  const query = normalizeText([intent.searchText, intent.query].filter(Boolean).join(" "));
  if (!query) return true;
  const intelligence = product.intelligence || getProductIntelligenceEngine().enrichProduct(product);
  const text = normalizeText([
    product.displayTitle,
    product.originalTitle,
    product.title,
    product.description,
    product.category,
    product.normalizedCategory,
    product.brand,
    product.model,
    intelligence.department,
    intelligence.category,
    intelligence.subcategory,
    Array.isArray(intelligence.searchKeywords) ? intelligence.searchKeywords.join(" ") : "",
  ].filter(Boolean).join(" "));

  const queryTokens = query
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token && token.length > 2);

  if (!queryTokens.length) return true;
  return queryTokens.some((token) => text.includes(token));
}

function buildBudgetContext(product = {}, baseContext = {}) {
  const normalized = buildInstallmentBudgetContext(product, baseContext);
  if (normalized.installments?.available) {
    return normalized;
  }
  return normalized;
}

function rankSearchMatch(product = {}, query = "") {
  const intelligence = product.intelligence || getProductIntelligenceEngine().enrichProduct(product);
  const text = `${product.displayTitle || ""} ${product.originalTitle || ""} ${product.title || ""} ${product.category || ""} ${product.normalizedCategory || ""} ${product.brand || ""} ${product.model || ""} ${product.description || ""} ${intelligence.department || ""} ${intelligence.category || ""} ${intelligence.subcategory || ""} ${(Array.isArray(intelligence.searchKeywords) ? intelligence.searchKeywords.join(" ") : "")}`;
  return Math.max(scoreProductMatch(product, query), normalizeText(text).includes(normalizeText(query)) ? 1 : 0);
}

export default class SearchOrchestrator {
  constructor({ catalogManager } = {}) {
    this.catalogManager = catalogManager;
  }

  parseIntent({ query = "", mode = "monthly", monthly = 0, months = 12, totalBudget = 0 } = {}) {
    const text = String(query || "").trim();
    const budgetHints = parseBudgetNumber(text);
    const seoIntent = getSEOIntelligenceEngine().resolveQueryIntent(text) || {};
    const category = seoIntent.category || detectCategory(text) || "";
    const brand = detectBrand(text) || seoIntent.intent?.brand || "";
    const accessoryIntent = detectAccessoryIntent(text) || Boolean(seoIntent.intent?.attributes?.some((attribute) => /capa|pel|cabo|carreg|suporte/i.test(String(attribute || ""))));
    const searchText = budgetHints.searchText || text;
    const normalizedMode = String(mode || budgetHints.mode || "monthly").toLowerCase() === "total" ? "total" : "monthly";
    const normalizedMonths = Math.max(1, toNumber(budgetHints.months || months, 12));
    const inferredMonthly = toNumber(monthly || budgetHints.monthly, 0);
    const inferredTotal = toNumber(totalBudget || budgetHints.totalBudget || (inferredMonthly * normalizedMonths), 0);

    return {
      query: text,
      searchText,
      mode: normalizedMode,
      monthly: inferredMonthly,
      months: normalizedMonths,
      totalBudget: inferredTotal,
      category,
      brand,
      accessoryIntent,
      seoIntent,
      seoKeywords: Array.isArray(seoIntent.intent?.attributes) ? seoIntent.intent.attributes : [],
      marketplace: "",
      status: "ACTIVE",
    };
  }

  listCandidates(intent = {}, products = []) {
    let list = Array.isArray(products) && products.length
      ? products
      : (this.catalogManager?.search
        ? this.catalogManager.search({
            q: intent.searchText || intent.query || "",
            category: intent.category || "",
            brand: intent.brand || "",
            marketplace: intent.marketplace || "",
            status: intent.status || "",
          })
        : this.catalogManager?.list?.() || []);
    if (!Array.isArray(list) || !list.length) {
      list = this.catalogManager?.list?.() || [];
    }

    return list
      .map((product) => (product?.intelligence ? product : getProductIntelligenceEngine().enrichProduct(product)))
      .filter((product) => {
        if (!classifyVisibility(product)) return false;
        if (!matchProductType(product, intent.category || "", intent.accessoryIntent)) return false;
        if (intent.brand) {
          const brandText = normalizeText([product.brand, product.title, product.displayTitle, product.originalTitle].filter(Boolean).join(" "));
          if (!brandText.includes(normalizeText(intent.brand))) return false;
        }
        if (intent.category) {
          const categoryText = normalizeText([product.department, product.subcategory, product.normalizedCategory, product.category, product.productType].filter(Boolean).join(" "));
          if (!categoryText.includes(normalizeText(intent.category))) return false;
        }
        if (!intent.category && !intent.brand && !hasQueryRelevance(product, intent)) return false;
        return true;
      });
  }

  prepareProducts(products = [], intent = {}) {
    const baseBudget = BudgetEngine.buildBudgetContext({
      mode: intent.mode || "monthly",
      monthly: intent.monthly || 0,
      months: intent.months || 12,
      totalBudget: intent.totalBudget || 0,
    });

    const prepared = [];
    const warnings = new Set();

    for (const product of Array.isArray(products) ? products : []) {
      const intelligence = product?.intelligence || getProductIntelligenceEngine().enrichProduct(product);
      const richProduct = {
        ...product,
        ...intelligence,
        intelligence,
      };
      const installmentData = buildBudgetContext(richProduct, baseBudget);
      if (installmentData.installmentWarning) warnings.add(installmentData.installmentWarning);
      const effectiveInstallment = installmentData.installments?.available
        ? installmentData.installments
        : installmentData.estimatedInstallment;
      const searchText = intent.searchText || intent.query || "";
      const matchScore = rankSearchMatch(richProduct, searchText);
      const sourceText = normalizeText([richProduct.marketplace, richProduct.source, richProduct.sourceType, richProduct.seller, richProduct.store].filter(Boolean).join(" "));
      const completenessScore = [
        Boolean(String(richProduct.image || richProduct.thumbnail || "").trim()),
        Boolean(String(richProduct.affiliateUrl || richProduct.productUrl || richProduct.permalink || richProduct.url || "").trim()),
        Boolean(String(richProduct.availability || "").trim()),
        Boolean(effectiveInstallment),
        Boolean(effectiveInstallment?.confidence && effectiveInstallment.confidence >= 0.8),
        Boolean(Number(richProduct.qualityScore || 0) >= 60),
      ].reduce((sum, flag) => sum + (flag ? 1 : 0), 0) / 6;

      prepared.push({
        ...richProduct,
        installments: installmentData.installments,
        estimatedInstallment: installmentData.estimatedInstallment,
        installmentConfidence: installmentData.installmentConfidence,
        installmentSource: installmentData.installmentSource,
        installmentWarning: installmentData.installmentWarning,
        installmentValue: effectiveInstallment?.amount ?? null,
        monthlyPrice: effectiveInstallment?.amount ?? null,
        installmentMonths: effectiveInstallment?.count ?? null,
        budgetContext: {
          ...installmentData,
          ...baseBudget,
          installments: effectiveInstallment
            ? {
                months: effectiveInstallment.count,
                amount: effectiveInstallment.amount,
                total: effectiveInstallment.total,
                interestFree: effectiveInstallment.interestFree,
                source: effectiveInstallment.source,
                confidence: effectiveInstallment.confidence,
              }
            : undefined,
          installmentMonths: effectiveInstallment?.count ?? baseBudget.months,
          installmentAmount: effectiveInstallment?.amount ?? null,
          monthlyPrice: effectiveInstallment?.amount ?? null,
        },
        oqc: {
          ...(richProduct.oqc || {}),
          searchMatchScore: matchScore,
          dataCompletenessScore: completenessScore,
          installmentConfidence: effectiveInstallment?.confidence ?? installmentData.installmentConfidence ?? 0,
          installmentSource: effectiveInstallment?.source || installmentData.installmentSource || "unavailable",
          qualityScore: Number(richProduct.qualityScore || 0) / 100,
        },
        searchIntent: {
          query: intent.query || "",
          searchText,
          category: intent.category || "",
          brand: intent.brand || "",
          mode: intent.mode || "monthly",
          monthly: intent.monthly || 0,
          months: intent.months || 12,
          totalBudget: intent.totalBudget || 0,
          accessoryIntent: Boolean(intent.accessoryIntent),
          source: sourceText,
        },
      });
    }

    const dataMode = prepared.some((item) => String(item.dataMode || item.mode || "").toLowerCase().startsWith("real") || String(item.dataMode || item.mode || "").toLowerCase() === "seed")
      ? "real"
      : "demo";

    return {
      ok: true,
      dataMode,
      intent,
      warnings: [...warnings],
      products: prepared,
      returnedCount: prepared.length,
    };
  }

  search(options = {}) {
    const intent = this.parseIntent(options);
    const candidates = this.listCandidates(intent);
    const prepared = this.prepareProducts(candidates, intent);
    return {
      ...prepared,
      strategyUsed: "catalog-search",
      tokenState: "n/a",
      statusHttp: 200,
      firstFive: prepared.products.slice(0, 5),
    };
  }
}
