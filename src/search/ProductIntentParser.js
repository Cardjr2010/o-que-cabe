import { normalizeText } from "../catalog/ProductNormalizer.js";

const ACCESSORY_TERMS = [
  "capa",
  "case",
  "pelicula",
  "película",
  "cabo",
  "carregador",
  "adaptador",
  "suporte",
  "fone",
  "headset",
  "earbud",
  "replacement",
  "protetor",
];

const PRODUCT_TYPE_RULES = [
  { productType: "smartphone", category: "celulares", terms: ["iphone", "smartphone", "celular", "galaxy", "redmi", "poco", "motorola"] },
  { productType: "notebook", category: "notebooks", terms: ["notebook", "laptop", "macbook", "chromebook", "ideapad", "thinkpad", "vivobook"] },
  { productType: "monitor", category: "monitores", terms: ["monitor", "ultrawide", "144hz", "165hz", "240hz"] },
  { productType: "tv", category: "tvs", terms: ["tv", "smart tv", "oled", "qled", "mini led"] },
  { productType: "router", category: "roteadores", terms: ["roteador", "router", "wi-fi", "wifi", "mesh", "archer", "deco", "be6500"] },
  { productType: "audio", category: "audio", terms: ["fone", "headphone", "headset", "earbud", "airpods", "caixa de som", "soundbar"] },
  { productType: "console", category: "games", terms: ["playstation", "ps5", "xbox", "nintendo switch"] },
  { productType: "tool", category: "ferramentas", terms: ["furadeira", "parafusadeira", "serra", "martelo", "martelete", "alicate"] },
  { productType: "home_appliance", category: "casa", terms: ["air fryer", "aspirador", "cafeteira", "liquidificador", "fritadeira"] },
];

const BRAND_RULES = [
  { brand: "Apple", terms: ["apple", "iphone", "ipad", "macbook", "airpods", "apple watch"] },
  { brand: "Samsung", terms: ["samsung", "galaxy"] },
  { brand: "Xiaomi", terms: ["xiaomi"] },
  { brand: "Redmi", terms: ["redmi"] },
  { brand: "POCO", terms: ["poco"] },
  { brand: "Motorola", terms: ["motorola", "moto"] },
  { brand: "Lenovo", terms: ["lenovo", "ideapad", "thinkpad", "loq"] },
  { brand: "Dell", terms: ["dell", "inspiron", "latitude", "alienware"] },
  { brand: "LG", terms: ["lg"] },
  { brand: "AOC", terms: ["aoc"] },
  { brand: "TP-Link", terms: ["tp-link", "tplink", "archer", "deco"] },
  { brand: "Bosch", terms: ["bosch"] },
  { brand: "WAP", terms: ["wap"] },
  { brand: "Philips Walita", terms: ["philips walita"] },
];

const BROAD_CATEGORY_RULES = [
  { token: "casa", suggestions: ["organizacao", "cozinha", "decoracao", "iluminacao", "utilidades", "limpeza"] },
  { token: "presente", suggestions: ["presente ate 100", "flores", "kit presente", "eletronico barato"] },
];

function toNumber(value, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBudget(text = "") {
  const source = String(text || "");
  const monthlyMatch = source.match(/(?:ate|até)?\s*r?\$?\s*([\d.]+(?:,\d+)?)\s*(?:por mes|por mês|\/mes|\/mês)/i);
  if (monthlyMatch) {
    return {
      mode: "monthly",
      maxMonthlyBudget: toNumber(monthlyMatch[1], 0),
    };
  }
  const totalMatch = source.match(/(?:ate|até)\s*r?\$?\s*([\d.]+(?:,\d+)?)/i);
  if (totalMatch) {
    return {
      mode: "total",
      maxTotalBudget: toNumber(totalMatch[1], 0),
    };
  }
  return { mode: "total", maxTotalBudget: 0, maxMonthlyBudget: 0 };
}

function extractStorage(text = "") {
  const match = String(text || "").match(/\b(\d{2,4})\s?gb\b/i);
  return match ? `${match[1]}GB` : null;
}

function extractMemory(text = "") {
  const match = String(text || "").match(/\b(\d{1,3})\s?gb\s?(?:ram|de ram)?\b/i);
  return match ? `${match[1]}GB` : null;
}

function extractRefreshRate(text = "") {
  const match = String(text || "").match(/\b(\d{2,3})\s?hz\b/i);
  return match ? `${match[1]}Hz` : null;
}

function extractScreenSize(text = "") {
  const match = String(text || "").match(/\b(\d{1,2})(?:[.,](\d))?\s?(?:pol|polegadas|")\b/i);
  if (!match) return null;
  return `${match[1]}${match[2] ? `.${match[2]}` : ""}"`;
}

function extractProcessor(text = "") {
  const source = String(text || "");
  const patterns = [
    /\bintel core i[3579]\b/i,
    /\bi[3579]\b/i,
    /\bryzen\s?[3579]\b/i,
    /\bcore ultra \d+\b/i,
    /\bm\d\b/i,
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) return match[0].replace(/\s+/g, " ").trim();
  }
  return null;
}

function detectBrand(text = "") {
  const normalized = normalizeText(text);
  for (const rule of BRAND_RULES) {
    if (rule.terms.some((term) => normalized.includes(normalizeText(term)))) return rule.brand;
  }
  return null;
}

function detectProductRule(text = "") {
  const normalized = normalizeText(text);
  for (const rule of PRODUCT_TYPE_RULES) {
    if (rule.terms.some((term) => normalized.includes(normalizeText(term)))) return rule;
  }
  return null;
}

function buildModel(text = "", brand = "", productRule = null) {
  const source = String(text || "").trim();
  const normalized = normalizeText(source);

  if (brand === "Apple" && normalized.includes("iphone")) {
    const match = source.match(/iphone\s+(\d{1,2})(?:\s+(pro(?:\s+max)?))?/i);
    if (match) {
      const family = `iPhone ${match[1]}`;
      const variant = match[2] ? ` ${match[2].replace(/\s+/g, " ").trim()}` : "";
      return `${family}${variant}`.trim().replace(/\bpro\b/i, "Pro").replace(/\bmax\b/i, "Max");
    }
  }

  if (brand === "Samsung" && normalized.includes("galaxy")) {
    const match = source.match(/galaxy\s+([aszm]\d{1,2}(?:\s+ultra)?)/i);
    if (match) return `Galaxy ${match[1].replace(/\s+/g, " ").trim()}`.replace(/\bultra\b/i, "Ultra");
  }

  if (brand === "Xiaomi" || brand === "Redmi" || brand === "POCO") {
    const match = source.match(/\b(be\d{3,5}|redmi\s+[a-z0-9 ]+|poco\s+[a-z0-9 ]+)\b/i);
    if (match) return match[1].replace(/\s+/g, " ").trim();
  }

  if (productRule?.productType === "router") {
    const match = source.match(/\b(be\d{3,5}|ax\d{3,5}|ac\d{3,5})\b/i);
    if (match) return match[1].toUpperCase();
  }

  return null;
}

function detectBroadCategory(text = "") {
  const normalized = normalizeText(text);
  for (const rule of BROAD_CATEGORY_RULES) {
    if (normalized.includes(normalizeText(rule.token))) {
      return {
        intentType: "broad_category",
        refinementRequired: true,
        refinementSuggestions: rule.suggestions.map((query) => ({ label: query, query })),
      };
    }
  }
  return null;
}

export class ProductIntentParser {
  parse({ query = "", maxTotalBudget = 0, maxMonthlyBudget = 0, installments = 0 } = {}) {
    const originalQuery = String(query || "").trim();
    const normalized = normalizeText(originalQuery);
    const broad = detectBroadCategory(originalQuery);
    const budget = parseBudget(originalQuery);
    const productRule = detectProductRule(originalQuery);
    const brand = detectBrand(originalQuery);
    const includeAccessories = ACCESSORY_TERMS.some((term) => normalized.includes(normalizeText(term)));
    const model = buildModel(originalQuery, brand, productRule);
    const storage = extractStorage(originalQuery);
    const memory = extractMemory(originalQuery);
    const refreshRate = extractRefreshRate(originalQuery);
    const screenSize = extractScreenSize(originalQuery);
    const processor = extractProcessor(originalQuery);

    if (broad && !productRule) {
      return {
        query: originalQuery,
        normalizedQuery: normalized,
        intentType: broad.intentType,
        refinementRequired: true,
        refinementSuggestions: broad.refinementSuggestions,
        productType: null,
        category: null,
        brand,
        model,
        storage,
        memory,
        processor,
        screenSize,
        refreshRate,
        maxTotalBudget: toNumber(maxTotalBudget || budget.maxTotalBudget, 0),
        maxMonthlyBudget: toNumber(maxMonthlyBudget || budget.maxMonthlyBudget, 0),
        installments: toNumber(installments, 0),
        includeAccessories,
      };
    }

    return {
      query: originalQuery,
      normalizedQuery: normalized,
      intentType: "product_search",
      refinementRequired: false,
      refinementSuggestions: [],
      productType: productRule?.productType || null,
      category: productRule?.category || null,
      brand,
      family: brand === "Apple" && model?.startsWith("iPhone") ? "iPhone" : brand === "Samsung" && model?.startsWith("Galaxy") ? "Galaxy" : null,
      model,
      edition: /\bultra\b/i.test(originalQuery) ? "Ultra" : /\bpro\b/i.test(originalQuery) ? "Pro" : null,
      storage,
      memory,
      processor,
      screenSize,
      refreshRate,
      condition: /\busado\b/i.test(originalQuery) ? "used" : /\brecondicionado\b/i.test(originalQuery) ? "refurbished" : "new",
      maxTotalBudget: toNumber(maxTotalBudget || budget.maxTotalBudget, 0),
      maxMonthlyBudget: toNumber(maxMonthlyBudget || budget.maxMonthlyBudget, 0),
      installments: toNumber(installments, 0),
      includeAccessories,
    };
  }
}

export default ProductIntentParser;
