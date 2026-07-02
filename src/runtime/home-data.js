import CategoryBuilder from "../catalog/CategoryBuilder.js";
import CatalogManager from "../catalog/CatalogManager.js";
import { projectRoot, resolveProjectPath } from "./project-root.js";
import { resolveCatalogSeedPath } from "./catalog-path.js";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

let catalogManagerInstance = null;
let categoryBuilderInstance = null;

function getCatalogManager() {
  if (!catalogManagerInstance) {
    catalogManagerInstance = new CatalogManager({
      seedPath: process.env.ACTIONPAY_CATALOG_SEED_PATH
        || process.env.AWIN_CATALOG_SEED_PATH
        || process.env.CATALOG_SEED_PATH
        || resolveCatalogSeedPath(resolveProjectPath("data", "products.seed.json")),
    });
  }
  return catalogManagerInstance;
}

function getCategoryBuilder() {
  if (!categoryBuilderInstance) {
    categoryBuilderInstance = new CategoryBuilder({ minCount: 20, maxButtons: 6 });
  }
  return categoryBuilderInstance;
}

function normalizedCatalogCategoryKey(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const HOME_TECH_CATEGORIES = new Set([
  "celular",
  "notebook",
  "tablet",
  "tv",
  "relogio",
  "fone",
  "monitor",
]);

const HOME_ALLOWED_CATEGORY_LABELS = new Set([
  "celular",
  "notebook",
  "tablet",
  "tv",
  "relogio",
  "fone",
]);

const HOME_ACCESSORY_CATEGORIES = new Set([
  "carregador",
  "cabo",
  "pelicula",
  "capa",
  "acessorio",
  "peca",
  "compativel",
]);

const HOME_PRIMARY_SOURCE_MARKETPLACES = new Set([
  "saldao_informatica",
  "actionpay_saldao",
  "infostore",
]);

const REAL_HOME_MARKETPLACES = new Set([
  "mi_shop",
  "mi shop",
  "awin",
  "actionpay",
  "saldao_informatica",
  "actionpay_saldao",
  "infostore",
  "google_merchant",
  "csv_feed",
  "feed",
]);

const REAL_HOME_SOURCE_TYPES = new Set([
  "csv_feed",
  "awin_feed",
  "actionpay_yml",
  "infostore_feed",
  "google_merchant_api",
  "manual",
  "feed",
]);

function normalizeProductType(value = "") {
  return normalizedCatalogCategoryKey(value || "");
}

function isPrimaryHomeProduct(item = {}) {
  const source = normalizedCatalogCategoryKey(item?.marketplace || item?.source || "");
  const seller = normalizedCatalogCategoryKey(item?.seller || item?.store || "");
  const sourceType = normalizedCatalogCategoryKey(item?.sourceType || "");
  return HOME_PRIMARY_SOURCE_MARKETPLACES.has(source)
    || HOME_PRIMARY_SOURCE_MARKETPLACES.has(seller)
    || HOME_PRIMARY_SOURCE_MARKETPLACES.has(sourceType)
    || seller.includes("saldao")
    || seller.includes("info store")
    || source.includes("saldao")
    || source.includes("info store")
    || sourceType.includes("saldao")
    || sourceType.includes("infostore");
}

function isHomeTechProduct(item = {}) {
  const category = normalizedCatalogCategoryKey(item?.normalizedCategory || item?.category || "");
  const productType = normalizeProductType(item?.productType || "");
  const source = normalizedCatalogCategoryKey(item?.marketplace || item?.source || "");
  const sourceType = normalizedCatalogCategoryKey(item?.sourceType || "");
  const text = normalizedCatalogCategoryKey([
    item?.displayTitle,
    item?.originalTitle,
    item?.title,
    item?.description,
    item?.compatibility,
  ].filter(Boolean).join(" "));
  const isAccessory = Boolean(item?.isAccessory)
    || HOME_ACCESSORY_CATEGORIES.has(category)
    || ["accessory", "piece", "compatible"].includes(productType)
    || [
      "capa",
      "case",
      "cover",
      "pelicula",
      "screen protector",
      "carregador",
      "charger",
      "cabo",
      "cable",
      "fonte",
      "adapter",
      "adaptador",
      "strap",
      "pulseira",
      "holder",
      "power bank",
      "powerbank",
      "audio glasses",
      "smart audio glasses",
      "bamper",
      "bumper",
      "watch band",
      "smart band",
      "suporte",
      "acessorio",
      "accessory",
      "peca",
      "piece",
      "compatible",
    ].some((term) => text.includes(term));
  const isRealSource = REAL_HOME_MARKETPLACES.has(source) || REAL_HOME_SOURCE_TYPES.has(sourceType) || item?.dataMode === "real";
  if (!isRealSource) return false;
  if (isAccessory) return false;
  return HOME_TECH_CATEGORIES.has(category);
}

function buildCatalogCategoryStats(items = []) {
  const stats = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    const key = normalizedCatalogCategoryKey(item?.normalizedCategory || item?.category || "outros") || "outros";
    const price = Number(item?.price || 0);
    const entry = stats.get(key) || {
      category: key,
      count: 0,
      minPrice: Number.POSITIVE_INFINITY,
      sampleTitles: [],
    };
    entry.count += 1;
    if (Number.isFinite(price) && price > 0 && price < entry.minPrice) entry.minPrice = price;
    const title = item?.displayTitle || item?.title || "";
    if (title && entry.sampleTitles.length < 3) entry.sampleTitles.push(title);
    stats.set(key, entry);
  }
  return stats;
}

function buildHomePechinchas(items = [], categories = []) {
  const stats = buildCatalogCategoryStats(items);
  const prioritized = [...categories]
    .filter((entry) => entry && entry.category && entry.category !== "outros")
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));

  const shortcutBudgets = {
    celular: [500, 1500],
    notebook: [1500, 2500],
    tablet: [500, 1000],
    tv: [500, 1000, 2000],
    relogio: [150, 300, 500],
    fone: [100, 250],
    casa: [100, 250, 500],
    presente: [50, 100, 250],
  };

  return prioritized.slice(0, 5).map((pick) => {
    const stat = stats.get(pick.category);
    const allowedBudgets = shortcutBudgets[pick.category] || [500, 1000, 1500];
    const minPrice = Number(stat?.minPrice || 0);
    const threshold = allowedBudgets.find((value) => Number.isFinite(minPrice) && minPrice <= value)
      || allowedBudgets[allowedBudgets.length - 1];
    return {
      label: `${pick.label} até ${currency.format(threshold)}`,
      subtitle: `${pick.count} itens reais · menor preço ${currency.format(stat?.minPrice || threshold)}`,
      query: pick.category,
      category: pick.category,
      count: pick.count,
      mode: "total",
      totalBudget: threshold,
      monthly: threshold,
      months: 12,
    };
  }).filter(Boolean);
}

function getRealHomeCatalog(items = []) {
  const primaryItems = items.filter((item) => isPrimaryHomeProduct(item) && isHomeTechProduct(item));
  if (primaryItems.length) return primaryItems;
  return items.filter((item) => isPrimaryHomeProduct(item));
}

function labelHomeSource(value = "") {
  const source = normalizedCatalogCategoryKey(value);
  if (source === "saldao_informatica" || source === "actionpay_saldao" || source.includes("saldao")) return "Saldão da Informática";
  if (source === "infostore" || source === "info store" || source === "info_store") return "Info Store - Informática";
  if (source === "mi_shop" || source === "mi shop" || source === "mishop") return "Mi Shop";
  if (source === "actionpay") return "Actionpay";
  if (source === "awin") return "Awin";
  if (source === "google_merchant") return "Google Merchant";
  return cleanLabel(value);
}

function cleanLabel(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function buildHomeCatalogData() {
  try {
    const items = getCatalogManager().list();
    const catalogForHome = getRealHomeCatalog(items);
    const builder = getCategoryBuilder();
    const categories = builder
      .build(catalogForHome)
      .filter((entry) => entry.category !== "outros"
        && HOME_ALLOWED_CATEGORY_LABELS.has(String(entry.category || "").toLowerCase())
        && Number(entry.count || 0) >= 20)
      .sort((a, b) => {
        const preferred = [
          "celular",
          "notebook",
          "tablet",
          "tv",
          "relogio",
          "fone",
          "monitor",
          "cabo",
          "capa",
        ];
        const aIndex = preferred.indexOf(String(a.category || "").toLowerCase());
        const bIndex = preferred.indexOf(String(b.category || "").toLowerCase());
        if (aIndex !== -1 || bIndex !== -1) {
          const safeA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
          const safeB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
          return safeA - safeB || b.count - a.count || a.label.localeCompare(b.label, "pt-BR");
        }
        return b.count - a.count || a.label.localeCompare(b.label, "pt-BR");
      })
      .slice(0, 6);
    const shortcuts = buildHomePechinchas(catalogForHome, categories)
      .filter((entry) => HOME_ALLOWED_CATEGORY_LABELS.has(String(entry.category || "").toLowerCase()));
    const activeSources = builder.buildMarketplaceSummary(catalogForHome)
      .map((item) => ({
        source: labelHomeSource(item.marketplace),
        count: item.count,
      }));
    return {
      ok: true,
      totalProducts: items.length,
      focusLabel: activeSources[0]?.source || primarySourceLabel(catalogForHome) || "Balcão de Informática",
      categories,
      pechinchas: shortcuts,
      shortcuts,
      activeSources,
      marketplaceSummary: builder.buildMarketplaceSummary(catalogForHome).slice(0, 8),
      sellerSummary: builder.buildSellerSummary(catalogForHome).slice(0, 8),
      brandSummary: builder.buildBrandSummary(catalogForHome).slice(0, 8),
    };
  } catch (error) {
    return {
      ok: false,
      totalProducts: 0,
      focusLabel: "Balcão de Informática",
      categories: [],
      pechinchas: [],
      shortcuts: [],
      activeSources: [],
      marketplaceSummary: [],
      sellerSummary: [],
      brandSummary: [],
      error: error?.message || "HOME_CATALOG_ERROR",
    };
  }
}

function primarySourceLabel(items = []) {
  for (const item of Array.isArray(items) ? items : []) {
    const source = normalizedCatalogCategoryKey(item?.marketplace || item?.source || "");
    const seller = normalizedCatalogCategoryKey(item?.seller || item?.store || "");
    if (source.includes("saldao") || seller.includes("saldao")) return "Saldão da Informática";
    if (source.includes("infostore") || seller.includes("info store")) return "Info Store - Informática";
  }
  return "";
}

