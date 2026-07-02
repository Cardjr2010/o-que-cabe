import CatalogManager from "../catalog/CatalogManager.js";
import ProductIntelligenceEngine from "../catalog/ProductIntelligenceEngine.js";
import { resolveCatalogSeedPath } from "./catalog-path.js";
import { projectRoot, resolveProjectPath } from "./project-root.js";

let catalogManagerInstance = null;
let productIntelligenceEngineInstance = null;

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

function normalizedCatalogCategoryKey(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const HOME_EXCLUDED_SOURCES = new Set([
  "mi_shop",
  "mercadolivre",
  "mercado livre",
]);

function isVisibleHomeProduct(item = {}) {
  const source = normalizedCatalogCategoryKey(item?.marketplace || item?.source || "");
  const seller = normalizedCatalogCategoryKey(item?.seller || item?.store || "");
  const sourceType = normalizedCatalogCategoryKey(item?.sourceType || "");
  return !(
    HOME_EXCLUDED_SOURCES.has(source)
    || HOME_EXCLUDED_SOURCES.has(seller)
    || HOME_EXCLUDED_SOURCES.has(sourceType)
  );
}

function getRealHomeCatalog(items = []) {
  return Array.isArray(items) ? items.filter((item) => isVisibleHomeProduct(item)) : [];
}

function labelHomeSource(value = "") {
  const source = normalizedCatalogCategoryKey(value);
  if (source === "saldao_informatica" || source === "actionpay_saldao" || source.includes("saldao")) return "Saldão da Informática";
  if (source === "infostore" || source === "info store" || source === "info_store") return "Info Store - Informática";
  if (source === "mi_shop" || source === "mi shop" || source === "mishop") return "Mi Shop";
  if (source === "actionpay") return "Actionpay";
  if (source === "awin") return "Awin";
  if (source === "google_merchant") return "Google Merchant";
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function buildHomeCatalogData() {
  try {
    const items = getCatalogManager().list();
    const catalogForHome = getRealHomeCatalog(items);
    const analysis = getProductIntelligenceEngine().buildHomeData(catalogForHome);

    const departments = Array.isArray(analysis.departments) ? analysis.departments : [];
    const categories = Array.isArray(analysis.categories) ? analysis.categories : [];
    const shortcuts = Array.isArray(analysis.shortcuts) ? analysis.shortcuts : [];
    const activeSources = Array.isArray(analysis.activeSources)
      ? analysis.activeSources.map((item) => ({
        source: labelHomeSource(item.source || item.marketplace || ""),
        count: item.count,
      }))
      : [];

    return {
      ok: true,
      totalProducts: items.length,
      analyzedProducts: analysis.analyzedProducts || catalogForHome.length,
      focusLabel: analysis.focusLabel || "Catálogo real",
      categories,
      departments,
      searchCategories: departments,
      departmentCategories: departments,
      pechinchas: shortcuts,
      shortcuts,
      activeSources,
      marketplaceSummary: Array.isArray(analysis.marketplaceSummary)
        ? analysis.marketplaceSummary.map((item) => ({
          marketplace: item.source || item.marketplace || "",
          count: item.count,
          categories: item.categories || [],
          sellers: item.sellers || [],
        })).slice(0, 8)
        : [],
      sellerSummary: Array.isArray(analysis.sellerSummary) ? analysis.sellerSummary.slice(0, 8) : [],
      brandSummary: Array.isArray(analysis.brandSummary) ? analysis.brandSummary.slice(0, 8) : [],
      topBrands: Array.isArray(analysis.topBrands) ? analysis.topBrands.slice(0, 8) : [],
      departmentSummary: Array.isArray(analysis.departmentSummary) ? analysis.departmentSummary.slice(0, 14) : [],
      categorySummary: Array.isArray(analysis.categorySummary) ? analysis.categorySummary.slice(0, 6) : [],
      beforeOutros: analysis.beforeOutros ?? 0,
      afterOutros: analysis.afterOutros ?? 0,
    };
  } catch (error) {
    return {
      ok: false,
      totalProducts: 0,
      analyzedProducts: 0,
      focusLabel: "Catálogo real",
      categories: [],
      departments: [],
      searchCategories: [],
      departmentCategories: [],
      pechinchas: [],
      shortcuts: [],
      activeSources: [],
      marketplaceSummary: [],
      sellerSummary: [],
      brandSummary: [],
      topBrands: [],
      departmentSummary: [],
      categorySummary: [],
      beforeOutros: 0,
      afterOutros: 0,
      error: error?.message || "HOME_CATALOG_ERROR",
    };
  }
}

export function primarySourceLabel() {
  return "Catálogo real";
}

