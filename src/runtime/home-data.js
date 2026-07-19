import fs from "node:fs";
import CatalogManager from "../catalog/CatalogManager.js";
import ProductIntelligenceEngine from "../catalog/ProductIntelligenceEngine.js";
import SEOIntelligenceEngine from "../seo/SEOIntelligenceEngine.js";
import { resolveCatalogSeedPath } from "./catalog-path.js";
import { resolveProjectPath } from "./project-root.js";

let catalogManagerInstance = null;
let productIntelligenceEngineInstance = null;
let seoIntelligenceEngineInstance = null;

function resolveOfficialCatalogSeedPath() {
  const officialSeedPath = resolveProjectPath("src", "data", "products.seed.json");
  if (fs.existsSync(officialSeedPath)) return officialSeedPath;
  return resolveCatalogSeedPath(officialSeedPath);
}

function getCatalogManager() {
  if (!catalogManagerInstance) {
    catalogManagerInstance = new CatalogManager({
      seedPath: process.env.ACTIONPAY_CATALOG_SEED_PATH
        || process.env.AWIN_CATALOG_SEED_PATH
        || process.env.CATALOG_SEED_PATH
        || resolveOfficialCatalogSeedPath(),
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
      focusLabel: "Consultor de compras",
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

const HOME_CATEGORY_PRIORITY = [
  "monitores",
  "celulares",
  "notebooks",
  "tvs",
  "tablets",
  "audio",
  "ferramentas",
  "casa e construcao",
  "flores",
];

const FEATURED_VIDEO_GUIDES = [
  {
    product: "iPhone 17 Pro Max",
    query: "iphone 17 pro max",
    category: "celulares",
    channel: "Loop Infinito",
    title: "iPhone 17 Pro Max: primeiras impressões",
    url: "https://www.youtube.com/watch?v=_4TdbbKHKyk",
    reason: "Bom para entender se faz sentido pagar mais no topo da Apple antes de buscar oferta.",
  },
  {
    product: "Samsung Galaxy S24 Ultra",
    query: "galaxy s24 ultra",
    category: "celulares",
    channel: "Canaltech",
    title: "S24 Ultra vs S23 Ultra: alguma coisa realmente mudou?",
    url: "https://www.youtube.com/watch?v=kyaqnxZT7sQ",
    reason: "Ajuda a separar hype de melhoria real antes de comparar Galaxy mais caro com opcoes parecidas.",
  },
  {
    product: "Notebook i5 com 16 GB",
    query: "notebook i5 16gb",
    category: "notebooks",
    channel: "EscolhaSegura",
    title: "Qual notebook Core i5 ou Ryzen 5 vale mais a pena?",
    url: "https://www.youtube.com/watch?v=IWPGF7_iWm4",
    reason: "Boa referencia para quem quer estudar, trabalhar e nao cair em notebook fraco com cara de oferta.",
  },
  {
    product: "Monitor gamer 144Hz",
    query: "monitor gamer 144hz",
    category: "monitores",
    channel: "EscolhaSegura",
    title: "Qual melhor monitor de 144Hz para jogar?",
    url: "https://www.youtube.com/watch?v=Blp4SugpKOM",
    reason: "Explica o que muda de verdade entre monitor barato, custo-beneficio e modelo melhor acabado.",
  },
  {
    product: "Roteador Wi-Fi 7",
    query: "roteador wi-fi 7",
    category: "casa e construcao",
    channel: "Max Dicas",
    title: "Testei o novo roteador Wi-Fi 7 da TP-Link Archer BE550",
    url: "https://www.youtube.com/watch?v=uERfkxZIrIM",
    reason: "Entra bem no OQC porque mistura oferta real com explicacao pratica do produto antes da compra.",
  },
];

function buildCuratedHomeItems(primaryItems = [], fallbackItems = []) {
  const combined = new Map();
  for (const item of Array.isArray(primaryItems) ? primaryItems : []) {
    const key = normalizedCatalogCategoryKey(item?.category || "");
    if (key) combined.set(key, item);
  }
  for (const item of Array.isArray(fallbackItems) ? fallbackItems : []) {
    const key = normalizedCatalogCategoryKey(item?.category || "");
    if (key && !combined.has(key)) combined.set(key, item);
  }

  const selected = [];
  for (const key of HOME_CATEGORY_PRIORITY) {
    const item = combined.get(key);
    if (item) {
      selected.push({
        ...item,
        category: item.category || key,
        label: item.label || item.name || item.title || key,
        query: item.query || item.intent?.query || item.category || key,
        intent: item.intent || { category: item.category || key },
      });
    }
  }

  for (const item of combined.values()) {
    const key = normalizedCatalogCategoryKey(item?.category || "");
    if (!selected.find((entry) => normalizedCatalogCategoryKey(entry.category || "") === key)) {
      selected.push({
        ...item,
        category: item.category || key,
        label: item.label || item.name || item.title || item.category || key,
        query: item.query || item.intent?.query || item.category || key,
        intent: item.intent || { category: item.category || key },
      });
    }
    if (selected.length >= 6) break;
  }

  return selected.slice(0, 6);
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
  if (source === "flores_online" || source === "flores online") return "Flores Online";
  if (source === "isabela_flores" || source === "isabela flores") return "Isabela Flores";
  if (source === "ccp") return "CCP";
  if (source === "authentical") return "Authentical";
  if (source === "mi_shop" || source === "mi shop" || source === "mishop") return "Mi Shop";
  if (source === "actionpay") return "Actionpay";
  if (source === "awin") return "Awin";
  if (source === "google_merchant") return "Google Merchant";
  return String(value || "").replace(/\s+/g, " ").trim();
}

function resolveCatalogUpdatedAt(items = []) {
  const now = Date.now();
  let latest = 0;
  for (const item of Array.isArray(items) ? items : []) {
    for (const value of [item?.lastCheckedAt, item?.updatedAt, item?.importedAt]) {
      const timestamp = Date.parse(value || "");
      if (!Number.isFinite(timestamp) || timestamp <= 0 || timestamp > now + 86_400_000) continue;
      latest = Math.max(latest, timestamp);
    }
  }
  return latest ? new Date(latest).toISOString() : null;
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
    const seoHomeButtons = seoEngine.buildHomeButtons(catalogForHome);
    const menu = [
      { label: "Início", href: "/", active: true },
      { label: "Departamentos", href: "#departments", active: true },
      { label: "Blog", href: "", future: true, active: false },
      { label: "Minha Conta", href: "", future: true, active: false },
    ];

    const departments = Array.isArray(analysis.departments) ? analysis.departments : [];
    const curatedHomeButtons = buildCuratedHomeItems(analysis.categories, departments);
    const curatedDepartments = buildCuratedHomeItems(departments, analysis.categories);
    const categories = curatedHomeButtons;
    const homeButtons = curatedHomeButtons.length ? curatedHomeButtons : seoHomeButtons;
    const topCategories = curatedHomeButtons;
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
      catalogUpdatedAt: resolveCatalogUpdatedAt(catalogForHome),
      focusLabel: analysis.focusLabel || "Consultor de compras",
      menu,
      categories,
      homeButtons,
      departments: curatedDepartments,
      topDepartments: curatedDepartments,
      topCategories,
      topSources: activeSources,
      searchCategories: homeButtons.length ? homeButtons : curatedDepartments,
      departmentCategories: curatedDepartments,
      pechinchas: shortcuts,
      shortcuts,
      seoHotSearches,
      featuredVideos: FEATURED_VIDEO_GUIDES,
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
      catalogUpdatedAt: null,
      focusLabel: "Consultor de compras",
      menu: [
        { label: "Início", href: "/", active: true },
        { label: "Departamentos", href: "#departments", active: true },
        { label: "Blog", href: "", future: true, active: false },
        { label: "Minha Conta", href: "", future: true, active: false },
      ],
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
      featuredVideos: FEATURED_VIDEO_GUIDES,
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

