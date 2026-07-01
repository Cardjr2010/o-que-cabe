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
    categoryBuilderInstance = new CategoryBuilder({ minCount: 5, maxButtons: 12 });
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

const HOME_ACCESSORY_CATEGORIES = new Set([
  "carregador",
  "cabo",
  "pelicula",
  "capa",
  "acessorio",
  "peca",
  "compativel",
]);

function normalizeProductType(value = "") {
  return normalizedCatalogCategoryKey(value || "");
}

function isHomeTechProduct(item = {}) {
  const category = normalizedCatalogCategoryKey(item?.normalizedCategory || item?.category || "");
  const productType = normalizeProductType(item?.productType || "");
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
  const chosen = new Set();
  const thresholds = [50, 100, 250, 500];
  const prioritized = [...categories]
    .filter((entry) => entry && entry.category && entry.category !== "outros")
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));

  return thresholds.map((threshold) => {
    const eligible = prioritized.filter((entry) => {
      const stat = stats.get(entry.category);
      return stat && Number.isFinite(stat.minPrice) && stat.minPrice <= threshold;
    });
    const pool = (eligible.filter((entry) => !chosen.has(entry.category))).length ? eligible.filter((entry) => !chosen.has(entry.category)) : eligible;
    if (!pool.length) return null;
    pool.sort((a, b) => {
      const aStat = stats.get(a.category);
      const bStat = stats.get(b.category);
      const byCount = (b.count || 0) - (a.count || 0);
      if (byCount !== 0) return byCount;
      const byMin = (aStat?.minPrice || Infinity) - (bStat?.minPrice || Infinity);
      if (byMin !== 0) return byMin;
      return a.label.localeCompare(b.label, "pt-BR");
    });
    const pick = pool[0];
    chosen.add(pick.category);
    const stat = stats.get(pick.category);
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

export function buildHomeCatalogData() {
  try {
    const items = getCatalogManager().list();
    const homeItems = items.filter(isHomeTechProduct);
    const builder = getCategoryBuilder();
    const catalogForHome = homeItems.length ? homeItems : items;
    const categories = builder.build(catalogForHome).filter((entry) => entry.category !== "outros");
    const shortcuts = buildHomePechinchas(catalogForHome, categories);
    const activeSources = builder.buildMarketplaceSummary(catalogForHome)
      .map((item) => ({
        source: item.marketplace,
        count: item.count,
      }));
    return {
      ok: true,
      totalProducts: items.length,
      focusLabel: "Balcão de Informática",
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
