import CatalogManager from "../catalog/CatalogManager.js";
import ProductIntelligenceEngine from "../catalog/ProductIntelligenceEngine.js";
import SEOIntelligenceEngine from "../seo/SEOIntelligenceEngine.js";
import { resolveCatalogSeedPath } from "./catalog-path.js";
import { resolveProjectPath } from "./project-root.js";

let catalogManagerInstance = null;
let productIntelligenceEngineInstance = null;
let seoIntelligenceEngineInstance = null;

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
    const catalogManager = getCatalogManager();
    const items = catalogManager.list();
    const catalogDiagnostics = catalogManager.diagnostics();
    const catalogForHome = getRealHomeCatalog(items);
    const analysis = getProductIntelligenceEngine().buildHomeData(catalogForHome);
    const seoEngine = getSEOIntelligenceEngine();
    const seoHotSearches = seoEngine.buildSeoHotSearches(6);
    const homeButtons = seoEngine.buildHomeButtons(catalogForHome);
    const menu = seoEngine.buildMenu();

    const departments = Array.isArray(analysis.departments) ? analysis.departments : [];
    const categories = homeButtons;
    const topCategories = Array.isArray(analysis.categories) ? analysis.categories : [];
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
      totalCatalogProducts: catalogDiagnostics.rawCount ?? items.length,
      totalPublishedProducts: catalogDiagnostics.publishedCount ?? items.length,
      hiddenProducts: catalogDiagnostics.hiddenProducts ?? 0,
      analyzedProducts: analysis.analyzedProducts || catalogForHome.length,
      focusLabel: analysis.focusLabel || "Cat??logo real",
      menu,
      categories,
      homeButtons,
      departments,
      topDepartments: departments,
      topCategories,
      topSources: activeSources,
      searchCategories: homeButtons.length ? homeButtons : departments,
      departmentCategories: departments,
      pechinchas: shortcuts,
      shortcuts,
      seoHotSearches,
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
      catalogSummary: {
        seedUsed: catalogDiagnostics.seedPath || "",
        rawCount: catalogDiagnostics.rawCount ?? 0,
        publishedCount: catalogDiagnostics.publishedCount ?? items.length,
        hiddenProducts: catalogDiagnostics.hiddenProducts ?? 0,
        filteredCount: catalogDiagnostics.filteredCount ?? 0,
        filterReasons: Array.isArray(catalogDiagnostics.filterReasons) ? catalogDiagnostics.filterReasons : [],
        sourceCounts: Array.isArray(catalogDiagnostics.sourceCounts) ? catalogDiagnostics.sourceCounts : [],
      },
    };
  } catch (error) {
    return {
      ok: false,
      totalProducts: 0,
      totalCatalogProducts: 0,
      totalPublishedProducts: 0,
      hiddenProducts: 0,
      analyzedProducts: 0,
      focusLabel: "Cat??logo real",
      menu: getSEOIntelligenceEngine().buildMenu(),
      categories: [],
      homeButtons: [],
      departments: [],
      topDepartments: [],
      topCategories: [],
      topSources: [],
      searchCategories: [],
      departmentCategories: [],
      pechinchas: [],
      shortcuts: [],
      seoHotSearches: [],
      activeSources: [],
      marketplaceSummary: [],
      sellerSummary: [],
      brandSummary: [],
      topBrands: [],
      departmentSummary: [],
      categorySummary: [],
      beforeOutros: 0,
      afterOutros: 0,
      catalogSummary: {
        seedUsed: "",
        rawCount: 0,
        publishedCount: 0,
        hiddenProducts: 0,
        filteredCount: 0,
        filterReasons: [],
        sourceCounts: [],
      },
      error: error?.message || "HOME_CATALOG_ERROR",
    };
  }
}

export function primarySourceLabel() {
  return "Catálogo real";
}
