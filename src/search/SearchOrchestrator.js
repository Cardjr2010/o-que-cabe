import BudgetEngine from "../engines/BudgetEngine.js";
import { scoreProductMatch, normalizeText } from "../catalog/ProductNormalizer.js";
import { buildInstallmentBudgetContext, normalizeInstallmentData } from "../catalog/installments.js";
import ProductIntelligenceEngine from "../catalog/ProductIntelligenceEngine.js";
import CatalogManager from "../catalog/CatalogManager.js";
import SEOIntelligenceEngine from "../seo/SEOIntelligenceEngine.js";
import MercadoLivreSearchProvider from "../providers/MercadoLivreSearchProvider.js";
import { resolveProjectPath } from "../runtime/project-root.js";

function toNumber(value, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function uniqueValues(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
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

const TOOL_QUERY_MARKERS = [
  "ferramenta",
  "ferramentas",
  "furadeira",
  "parafusadeira",
  "serra",
  "chave",
  "alicate",
  "martelete",
  "martelo",
  "ferragem",
  "ferragens",
  "casa",
  "construcao",
];

const FLOWER_QUERY_MARKERS = [
  "flor",
  "flores",
  "buque",
  "bouquet",
  "rosa",
  "cesta",
  "presente",
  "presentes",
  "aniversario",
];

const PHONE_QUERY_MARKERS = [
  "iphone",
  "apple iphone",
  "samsung",
  "galaxy",
  "galaxy a",
  "galaxy s",
  "redmi",
  "poco",
  "motorola",
  "moto",
];

function matchesAnyMarker(text = "", markers = []) {
  const normalized = normalizeText(text);
  return Array.isArray(markers) && markers.some((marker) => normalized.includes(normalizeText(marker)));
}

function canonicalSearchCategory(rawCategory = "", text = "") {
  const category = normalizeText(rawCategory);
  const query = normalizeText(text);
  const toolLike = matchesAnyMarker(`${category} ${query}`, TOOL_QUERY_MARKERS);
  const flowerLike = matchesAnyMarker(`${category} ${query}`, FLOWER_QUERY_MARKERS);
  if (toolLike) return "ferramenta";
  if (flowerLike) return "flores e presentes";
  return String(rawCategory || "").trim();
}

function buildSearchVariants(intent = {}) {
  const base = uniqueValues([
    intent.searchText,
    intent.query,
  ].map((value) => String(value || "").trim()).filter(Boolean));
  const normalized = `${normalizeText(intent.searchText || "")} ${normalizeText(intent.query || "")} ${normalizeText(intent.category || "")}`;
  const variants = [...base];

  const pushVariants = (items = []) => {
    for (const item of items) {
      const value = String(item || "").trim();
      if (value && !variants.includes(value)) variants.push(value);
    }
  };

  if (matchesAnyMarker(normalized, TOOL_QUERY_MARKERS)) {
    pushVariants([
      "ferramenta",
      "ferramentas",
      "furadeira",
      "parafusadeira",
      "serra",
      "chave",
      "alicate",
      "martelete",
      "martelo",
      "ferragem",
      "ferragens",
    ]);
  }

  if (matchesAnyMarker(normalized, FLOWER_QUERY_MARKERS)) {
    pushVariants([
      "flores",
      "flor",
      "buque",
      "bouquet",
      "rosa",
      "cesta",
      "presente",
      "presentes",
      "aniversario",
      "flores e presentes",
    ]);
  }

  return variants;
}

function buildSupplementalVariants(intent = {}) {
  const normalized = normalizeText([intent.query, intent.searchText, intent.category].filter(Boolean).join(" "));
  const variants = [];
  const push = (items = []) => {
    for (const item of items) {
      const value = String(item || "").trim();
      if (value && !variants.includes(value)) variants.push(value);
    }
  };

  if (matchesAnyMarker(normalized, TOOL_QUERY_MARKERS)) {
    push(["furadeira", "parafusadeira", "martelete", "serra", "alicate", "ferramenta"]);
  }

  if (matchesAnyMarker(normalized, FLOWER_QUERY_MARKERS)) {
    push(["buque", "bouquet", "flores", "flor", "cesta", "presente", "rosa", "aniversario"]);
  }

  push([intent.searchText, intent.query]);
  return variants.slice(0, 6);
}

function buildMercadoLivreFallbackVariants(intent = {}) {
  const query = normalizeText([intent.searchText, intent.query].filter(Boolean).join(" "));
  const variants = [];
  const push = (items = []) => {
    for (const item of items) {
      const value = String(item || "").trim();
      if (value && !variants.includes(value)) variants.push(value);
    }
  };

  if (isPhoneFamilyQuery(query) || Boolean(intent.brand)) {
    const terms = query.split(/\s+/).filter(Boolean);
    const brand = normalizeText(intent.brand || "");
    const coreTerms = terms.filter((term) => !/^\d+$/.test(term) && !/^(pro|max|ultra|plus|mini|lite)$/i.test(term));
    const family = brand || (terms.find((term) => /(iphone|samsung|galaxy|redmi|poco|motorola|moto)/i.test(term)) || "");
    if (query) push([query]);
    if (family) push([family]);
    if (family && coreTerms.length) push([`${family} ${coreTerms.join(" ")}`]);
    if (family && coreTerms.length > 1) push([`${family} ${coreTerms.slice(0, -1).join(" ")}`]);
    if (family && coreTerms.length > 2) push([`${family} ${coreTerms.slice(0, -2).join(" ")}`]);
    if (family && /(iphone)/i.test(family)) {
      push(["iphone", "iphone 17", "iphone 17 pro", "iphone pro max"]);
    }
    if (family && /(samsung|galaxy)/i.test(family)) {
      push(["samsung", "galaxy", "galaxy s25 ultra", "galaxy s25", "galaxy s24", "galaxy a15", "galaxy a25"]);
    }
  }

  if (matchesAnyMarker(query, TOOL_QUERY_MARKERS)) {
    push(["furadeira", "parafusadeira", "serra", "alicate", "ferramenta"]);
  }

  if (matchesAnyMarker(query, FLOWER_QUERY_MARKERS)) {
    push(["flores", "flor", "buque", "bouquet", "rosa", "cesta", "presente"]);
  }

  push([intent.searchText, intent.query]);
  return uniqueValues(variants).slice(0, 8);
}

function shouldUseSupplementalCatalog(intent = {}) {
  const normalized = normalizeText([intent.query, intent.searchText, intent.category].filter(Boolean).join(" "));
  return matchesAnyMarker(normalized, TOOL_QUERY_MARKERS) || matchesAnyMarker(normalized, FLOWER_QUERY_MARKERS);
}

function isPhoneFamilyQuery(text = "") {
  return matchesAnyMarker(text, PHONE_QUERY_MARKERS);
}

function isPhoneFamilyProduct(product = {}, intelligence = {}) {
  const text = normalizeText([
    product.displayTitle,
    product.originalTitle,
    product.title,
    product.description,
    product.brand,
    product.model,
    product.category,
    product.normalizedCategory,
    intelligence.department,
    intelligence.category,
    intelligence.subcategory,
  ].filter(Boolean).join(" "));
  return /(celular|smartphone|iphone|phone|galaxy|redmi|poco|moto|motorola)/.test(text);
}

function isPrincipalProduct(product = {}, intelligence = {}) {
  const productType = normalizeText(intelligence.productType || product.productType || "");
  return !Boolean(intelligence.isAccessory ?? product.isAccessory) && (productType === "principal" || productType === "product");
}

function countPrincipalProducts(products = []) {
  return (Array.isArray(products) ? products : []).reduce((count, product) => {
    const intelligence = product?.intelligence || {};
    return count + (isPrincipalProduct(product, intelligence) ? 1 : 0);
  }, 0);
}

function shouldUseMercadoLivreFallback(intent = {}, products = []) {
  const principalCount = countPrincipalProducts(products);
  if (!Array.isArray(products) || !products.length) return true;
  return principalCount < 3;
}

function looksLikeGenericMercadoLivreUrl(value = "") {
  const url = String(value || "").trim().toLowerCase();
  if (!url) return true;
  if (url === "https://www.mercadolivre.com.br" || url === "https://mercadolivre.com.br") return true;
  if (url === "https://www.mercadolivre.com.br/" || url === "https://mercadolivre.com.br/") return true;
  if (url.includes("lista.mercadolivre.com.br")) return true;
  if (url.includes("/search")) return true;
  if (url.includes("/categoria")) return true;
  if (url.includes("/categories")) return true;
  return !/\/MLB[\w-]+/i.test(url);
}

function isDirectMercadoLivreProduct(product = {}) {
  const itemId = String(product.itemId || product.id || "").trim();
  const permalink = String(product.permalink || product.productUrl || product.url || "").trim();
  return Boolean(itemId && permalink && !looksLikeGenericMercadoLivreUrl(permalink) && String(product.title || "").trim() && Number(product.price || 0) > 0);
}

const SUPPLEMENTAL_CATALOG_PATH = resolveProjectPath("src", "data", "products.seed.json");
let productIntelligenceEngineInstance = null;
let seoIntelligenceEngineInstance = null;
let supplementalCatalogManagerInstance = null;
let mercadoLivreSearchProviderInstance = null;

function getSupplementalCatalogManager() {
  if (!supplementalCatalogManagerInstance) {
    supplementalCatalogManagerInstance = new CatalogManager({ seedPath: SUPPLEMENTAL_CATALOG_PATH });
  }
  return supplementalCatalogManagerInstance;
}


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

function getMercadoLivreSearchProvider() {
  if (!mercadoLivreSearchProviderInstance) {
    mercadoLivreSearchProviderInstance = new MercadoLivreSearchProvider();
  }
  return mercadoLivreSearchProviderInstance;
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
  return /\b(capa|case|pelicula|pel[íi]cula|carregador|cabo|fone|headphone|earbud|airpods|strap|pulseira|acessorio|acess[óo]rio|suporte|power bank|powerbank|protector|protetor|controle remoto|remote control|remote)\b/i.test(String(text || ""));
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
    || /\b(capa|case|pelicula|cabo|carregador|strap|pulseira|suporte|protector|protetor|controle remoto|remote control|remote)\b/i.test(text);

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

function rankPreparedProduct(product = {}, intent = {}) {
  const searchText = normalizeText(intent.searchText || intent.query || "");
  const intelligence = product.intelligence || getProductIntelligenceEngine().enrichProduct(product);
  const titleText = normalizeText([product.displayTitle, product.originalTitle, product.title].filter(Boolean).join(" "));
  const categoryText = normalizeText([intelligence.department, intelligence.category, intelligence.subcategory, product.department, product.category, product.normalizedCategory].filter(Boolean).join(" "));
  const sourceText = normalizeText([product.marketplace, product.source, product.sourceType, product.seller, product.store].filter(Boolean).join(" "));
  const queryTokens = searchText.split(/\s+/).filter(Boolean);
  const titleMatches = queryTokens.filter((token) => titleText.includes(token)).length;
  const categoryMatches = queryTokens.filter((token) => categoryText.includes(token)).length;
  const exactQueryBonus = searchText && titleText.includes(searchText) ? 3 : 0;
  const categoryBonus = intent.category && categoryText.includes(normalizeText(intent.category)) ? 2 : 0;
  const brandBonus = intent.brand && normalizeText([product.brand, product.displayTitle, product.originalTitle, product.title].filter(Boolean).join(" ")).includes(normalizeText(intent.brand)) ? 2 : 0;
  const typeBonus = intelligence.productType === "principal" ? 1 : -1;
  const sourceBonus = sourceText.includes("saldao") || sourceText.includes("info store") || sourceText.includes("actionpay") || sourceText.includes("awin") ? 1 : 0;
  const imageBonus = String(product.image || product.thumbnail || "").trim() ? 0.25 : 0;
  const linkBonus = String(product.affiliateUrl || product.productUrl || product.permalink || product.url || "").trim() ? 0.35 : 0;
  const quality = Number(product.qualityScore || intelligence.qualityScore || 0) / 100;
  const searchMatch = Number(product.oqc?.searchMatchScore || rankSearchMatch(product, searchText) || 0);
  const phoneFamilyQuery = isPhoneFamilyQuery(searchText);
  const phoneFamilyProduct = isPhoneFamilyProduct(product, intelligence);
  const principalProduct = isPrincipalProduct(product, intelligence);
  const cellularText = normalizeText([intelligence.department, intelligence.category, intelligence.subcategory, product.department, product.category, product.normalizedCategory].filter(Boolean).join(" "));
  const cellularProduct = /(celular|smartphone|iphone|phone)/.test(cellularText);
  const brandText = normalizeText([product.brand, product.displayTitle, product.originalTitle, product.title].filter(Boolean).join(" "));
  const accessoryPenalty = Boolean(intelligence.isAccessory ?? product.isAccessory) ? -4 : 0;
  const phoneDeviceBonus = phoneFamilyQuery && cellularProduct ? 16 : 0;
  const phonePrincipalBonus = phoneFamilyQuery && principalProduct && cellularProduct ? 8 : 0;
  const phoneBrandBonus = phoneFamilyQuery && phoneFamilyProduct && cellularProduct ? 6 : 0;
  const iphoneSamsungBonus = /iphone|apple iphone|samsung|galaxy|redmi|poco|motorola|moto/.test(searchText) && phoneFamilyProduct ? 3 : 0;
  const nonPhonePenalty = phoneFamilyQuery && !cellularProduct && phoneFamilyProduct ? -12 : 0;
  const accessoryQueryPenalty = phoneFamilyQuery && /capa|case|pelicula|carregador|cabo|fone|headphone|airpods|earbud|strap|pulseira|suporte|controle remoto|remote control|remote/.test(brandText) ? -4 : 0;
  return (
    (searchMatch * 8)
    + (titleMatches * 2.5)
    + (categoryMatches * 1.5)
    + exactQueryBonus
    + categoryBonus
    + brandBonus
    + typeBonus
    + sourceBonus
    + imageBonus
    + linkBonus
    + quality
    + phoneDeviceBonus
    + phonePrincipalBonus
    + phoneBrandBonus
    + iphoneSamsungBonus
    + accessoryPenalty
    + nonPhonePenalty
    + accessoryQueryPenalty
  );
}

function filterCandidateList(list = [], intent = {}) {
  return (Array.isArray(list) ? list : [])
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

export default class SearchOrchestrator {
  constructor({ catalogManager, marketplaceSearchProvider } = {}) {
    this.catalogManager = catalogManager;
    this.marketplaceSearchProvider = marketplaceSearchProvider || null;
  }

  parseIntent({ query = "", mode = "monthly", monthly = 0, months = 12, totalBudget = 0 } = {}) {
    const text = String(query || "").trim();
    const budgetHints = parseBudgetNumber(text);
    const seoIntent = getSEOIntelligenceEngine().resolveQueryIntent(text) || {};
    const brand = detectBrand(text) || seoIntent.intent?.brand || "";
    const normalizedText = normalizeText(text);
    const brandOnlyQuery = Boolean(brand) && normalizedText === normalizeText(brand);
    const directCategory = detectCategory(text) || "";
    const rawCategory = brandOnlyQuery ? directCategory : (directCategory || seoIntent.category || "");
    const category = canonicalSearchCategory(rawCategory, text);
    const accessoryIntent = detectAccessoryIntent(text) || Boolean(seoIntent.intent?.attributes?.some((attribute) => /capa|pel|cabo|carreg/i.test(String(attribute || ""))));
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
    const baseList = Array.isArray(products) && products.length ? products : [];
    if (baseList.length) {
      return filterCandidateList(baseList, intent);
    }

    const attempts = buildSearchVariants(intent);
    const collected = [];
    const seen = new Set();
    const searchManagers = shouldUseSupplementalCatalog(intent)
      ? [getSupplementalCatalogManager(), this.catalogManager]
      : [this.catalogManager];
    const addUnique = (list = [], attemptIntent = intent) => {
      const filtered = filterCandidateList(list, attemptIntent);
      for (const product of filtered) {
        const key = String(product.id || product.externalId || product.title || product.displayTitle || "").trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        collected.push(product);
        if (collected.length >= 50) return true;
      }
      return false;
    };

    for (const [managerIndex, manager] of searchManagers.entries()) {
      if (!manager?.search) continue;
      const managerAttempts = managerIndex === 0 && shouldUseSupplementalCatalog(intent)
        ? buildSupplementalVariants(intent)
        : attempts;
      for (const queryText of managerAttempts) {
        const list = manager.search({
          q: queryText,
          brand: intent.brand || "",
          marketplace: intent.marketplace || "",
          status: intent.status || "",
        });
        if (addUnique(list, {
          ...intent,
          searchText: queryText,
          query: queryText,
        })) {
          break;
        }
      }
      if (shouldUseSupplementalCatalog(intent) && managerIndex === 0 && collected.length >= 20) {
        break;
      }
    }

    if (!collected.length) {
      addUnique(this.catalogManager?.list?.() || [], intent);
    }

    return collected;
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

    prepared.sort((left, right) => {
      const scoreDelta = rankPreparedProduct(right, intent) - rankPreparedProduct(left, intent);
      if (Math.abs(scoreDelta) > 1e-9) return scoreDelta;
      const titleLeft = normalizeText(left.displayTitle || left.originalTitle || left.title || "");
      const titleRight = normalizeText(right.displayTitle || right.originalTitle || right.title || "");
      if (titleLeft === normalizeText(intent.searchText || intent.query || "")) return -1;
      if (titleRight === normalizeText(intent.searchText || intent.query || "")) return 1;
      return titleLeft.localeCompare(titleRight, "pt-BR");
    });

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

  async search(options = {}) {
    const intent = this.parseIntent(options);
    const candidates = this.listCandidates(intent);
    const prepared = this.prepareProducts(candidates, intent);
    const fallbackNeeded = shouldUseMercadoLivreFallback(intent, prepared.products);

    if (!fallbackNeeded) {
      return {
        ...prepared,
        strategyUsed: "catalog-search",
        tokenState: "n/a",
        statusHttp: 200,
        firstFive: prepared.products.slice(0, 5),
        fallbackUsed: false,
        fallbackAttempted: false,
        fallbackWarning: "",
      };
    }

    const marketplaceProvider = this.marketplaceSearchProvider || getMercadoLivreSearchProvider();
    try {
      const variantQueries = buildMercadoLivreFallbackVariants(intent);
      let marketplaceResult = { products: [], rawCount: 0, returnedCount: 0, statusHttp: 200, fallbackText: "" };
      let marketplaceProducts = [];

      for (const variantQuery of variantQueries) {
        marketplaceResult = await marketplaceProvider.searchProducts(variantQuery, {
          limit: 20,
          mode: intent.mode,
          monthly: intent.monthly,
          months: intent.months,
          totalBudget: intent.totalBudget,
        });
        marketplaceProducts = filterCandidateList(marketplaceResult.products || [], intent)
          .filter((product) => isDirectMercadoLivreProduct(product));
        if (marketplaceProducts.length) break;
      }

      if (marketplaceProducts.length) {
        const combinedProducts = [...candidates, ...marketplaceProducts];
        const combinedPrepared = this.prepareProducts(combinedProducts, intent);
        return {
          ...combinedPrepared,
          strategyUsed: "catalog-search+mercado-livre-fallback",
          tokenState: "n/a",
          statusHttp: 200,
          firstFive: combinedPrepared.products.slice(0, 5),
          fallbackUsed: true,
          fallbackAttempted: true,
          fallbackSource: "mercado_livre",
          fallbackWarning: "Não encontramos opções suficientes no catálogo principal do OQC. Buscamos anúncios diretos no Mercado Livre.",
          fallbackCount: marketplaceProducts.length,
          fallbackRawCount: marketplaceResult.rawCount || 0,
          fallbackStatusHttp: marketplaceResult.statusHttp || 200,
        };
      }
      return {
        ...prepared,
        strategyUsed: "catalog-search",
        tokenState: "n/a",
        statusHttp: 200,
        firstFive: prepared.products.slice(0, 5),
        fallbackUsed: false,
        fallbackAttempted: true,
        fallbackSource: "mercado_livre",
        fallbackWarning: "Não encontramos opções suficientes no catálogo principal do OQC. Buscamos anúncios diretos no Mercado Livre, mas nenhum anúncio direto suficiente foi encontrado.",
        fallbackCount: 0,
        fallbackRawCount: marketplaceResult.rawCount || 0,
        fallbackStatusHttp: marketplaceResult.statusHttp || 200,
      };
    } catch (error) {
      return {
        ...prepared,
        strategyUsed: "catalog-search",
        tokenState: "n/a",
        statusHttp: 200,
        firstFive: prepared.products.slice(0, 5),
        fallbackUsed: false,
        fallbackAttempted: true,
        fallbackSource: "mercado_livre",
        fallbackWarning: "Não encontramos opções suficientes no catálogo principal do OQC. Buscamos anúncios diretos no Mercado Livre, mas a consulta falhou no momento.",
        fallbackCount: 0,
        fallbackRawCount: 0,
        fallbackStatusHttp: 200,
        fallbackError: error?.message || "Erro ao consultar Mercado Livre",
      };
    }
  }
}

