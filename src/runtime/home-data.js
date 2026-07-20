import fs from "node:fs";
import CatalogManager from "../catalog/CatalogManager.js";
import ProductIntelligenceEngine from "../catalog/ProductIntelligenceEngine.js";
import SEOIntelligenceEngine from "../seo/SEOIntelligenceEngine.js";
import { resolveCatalogSeedPath } from "./catalog-path.js";
import { resolveProjectPath } from "./project-root.js";
import { VERIFIED_AFFILIATE_OFFERS } from "../data/verified-affiliate-offers.js";
import { OFFER_RADAR_TARGETS, findOfferRadarTarget, normalizeRadarText } from "../data/offer-radar-targets.js";
import { buildCampaignCards } from "../data/offer-campaigns.js";

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
];

const HOME_CATEGORY_MATCH_ORDER = [
  "monitores",
  "notebooks",
  "tvs",
  "tablets",
  "audio",
  "celulares",
];

const HOME_CATEGORY_COPY = new Map([
  ["monitores", { label: "Monitores", query: "monitor gamer", sourceHint: "monitores" }],
  ["celulares", { label: "Celulares", query: "celular", sourceHint: "celulares" }],
  ["notebooks", { label: "Notebooks", query: "notebook", sourceHint: "notebooks" }],
  ["tvs", { label: "TVs", query: "tv", sourceHint: "tvs" }],
  ["tablets", { label: "Tablets", query: "tablet", sourceHint: "tablets" }],
  ["audio", { label: "Áudio", query: "fone bluetooth", sourceHint: "audio" }],
]);

const PUBLIC_HOME_CATEGORY_RULES = new Map([
  ["monitores", {
    include: [/\bmonitor\b/, /\b144hz\b/, /\b165hz\b/, /\b240hz\b/, /\bultrawide\b/, /\bips\b/],
    exclude: [/\bnotebook\b/, /\blaptop\b/, /\bsmart tv\b/, /televis/, /\bcapa\b/, /\bpelicula\b/, /\bcabo\b/, /\bcarregador\b/],
  }],
  ["celulares", {
    include: [/\bcelular\b/, /\bsmartphone\b/, /\biphone\b/, /\bgalaxy\b/, /\bredmi\b/, /\bpoco\b/, /\bmotorola\b/, /\bmoto\b/, /\bxiaomi\b/],
    exclude: [/\bcapa\b/, /\bcase\b/, /\bpelicula\b/, /\bcabo\b/, /\bcarregador\b/, /\bsuporte\b/, /\bfone\b/, /\bheadset\b/, /\btablet\b/],
  }],
  ["notebooks", {
    include: [/\bnotebook\b/, /\blaptop\b/, /\bchromebook\b/, /\bmacbook\b/, /\bideapad\b/, /\bthinkpad\b/, /\bvivobook\b/, /\baspire\b/, /\binspiron\b/, /\bswift\b/, /\bloq\b/],
    exclude: [/\bcapa\b/, /\bcase\b/, /\bmochila\b/, /\bbase\b/, /\bsuporte\b/, /\bcooler\b/, /\bmouse\b/, /\bteclado\b/],
  }],
  ["tvs", {
    include: [/\bsmart tv\b/, /\btv\b/, /televis/, /\boled\b/, /\bqled\b/, /\broku\b/, /\bmini led\b/, /\b4k\b/],
    exclude: [/\bnotebook\b/, /\blaptop\b/, /\bmonitor\b/, /\bcapa\b/, /\bcontrole\b/, /\bsuporte\b/],
  }],
  ["tablets", {
    include: [/\btablet\b/, /\bipad\b/, /\bgalaxy tab\b/, /\bredmi pad\b/, /\bxiaomi pad\b/, /\blenovo tab\b/],
    exclude: [/\bcapa\b/, /\bcase\b/, /\bpelicula\b/, /\bcabo\b/, /\bcarregador\b/, /\bsuporte\b/],
  }],
  ["audio", {
    include: [/\bfone\b/, /\bheadphone\b/, /\bheadset\b/, /\bearbud\b/, /\bbuds\b/, /\bairpods\b/, /caixa de som/, /\bsoundbar\b/, /\bbluetooth\b/],
    exclude: [/\bcapa\b/, /\bcase\b/, /\bcabo\b/, /\bcarregador\b/, /\bsuporte\b/],
  }],
]);

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
    product: "Samsung Galaxy S26 Ultra",
    query: "galaxy s26 ultra",
    category: "celulares",
    channel: "Review recomendado",
    title: "Testei o Galaxy S26 Ultra",
    url: "https://www.youtube.com/watch?v=YoWI6yXU20Y",
    reason: "Ajuda a entender se o Ultra atual entrega valor real antes de cair em oferta antiga ou modelo fora do foco.",
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

function buildOfferRadarHighlights() {
  return OFFER_RADAR_TARGETS.map((target) => {
    const matchingOffers = VERIFIED_AFFILIATE_OFFERS
      .filter((offer) => {
        const match = findOfferRadarTarget([
          target.query,
          offer.displayTitle,
          offer.title,
          offer.brand,
          offer.model,
          Array.isArray(offer.searchKeywords) ? offer.searchKeywords.join(" ") : "",
        ].filter(Boolean).join(" "));
        return match?.id === target.id;
      })
      .sort((left, right) => Number(left.price || 0) - Number(right.price || 0));

    if (!matchingOffers.length) return null;

    const bestOffer = matchingOffers[0];
    const sources = [...new Set(matchingOffers.map((offer) => labelHomeSource(offer.sourceName || offer.sourceLabel || offer.source || offer.seller?.name || "")))];
    return {
      category: target.category,
      label: target.label,
      query: target.query,
      count: matchingOffers.length,
      subtitle: `${matchingOffers.length} oferta${matchingOffers.length > 1 ? "s" : ""} verificada${matchingOffers.length > 1 ? "s" : ""} · a partir de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(bestOffer.cashPrice || bestOffer.price || 0))}`,
      sources,
      intent: {
        category: target.category,
        query: target.query,
        mode: target.budgets?.mode || "total",
        monthly: target.budgets?.monthly || 0,
        totalBudget: target.budgets?.totalBudget || 0,
        months: target.budgets?.months || 12,
      },
    };
  }).filter(Boolean).slice(0, 6);
}

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

function normalizeHomeMatchText(item = {}) {
  return normalizedCatalogCategoryKey([
    item?.title,
    item?.displayTitle,
    item?.originalTitle,
    item?.brand,
    item?.model,
  ].filter(Boolean).join(" "));
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

function resolvePublicHomeCategory(item = {}) {
  const text = normalizeHomeMatchText(item);

  for (const categoryKey of HOME_CATEGORY_MATCH_ORDER) {
    const rule = PUBLIC_HOME_CATEGORY_RULES.get(categoryKey);
    if (!rule) continue;
    const includeMatches = rule.include.some((pattern) => pattern.test(text));
    const excludeMatches = rule.exclude.some((pattern) => pattern.test(text));
    if (!excludeMatches && includeMatches) {
      return categoryKey;
    }
  }

  return null;
}

function getRealHomeCatalog(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => isVisibleHomeProduct(item))
    .map((item) => {
      const publicCategory = resolvePublicHomeCategory(item);
      if (!publicCategory) return null;
      return {
        ...item,
        category: publicCategory,
        normalizedCategory: publicCategory,
      };
    })
    .filter(Boolean);
}

function labelHomeSource(value = "") {
  const source = normalizedCatalogCategoryKey(value);
  if (source === "saldao_informatica" || source === "actionpay_saldao" || source.includes("saldao")) return "Saldão da Informática";
  if (source === "infostore" || source === "info store" || source === "info_store" || source === "infostore_feed") return "Info Store - Informática";
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

function buildPublicHomeCollections(items = []) {
  const groups = new Map();

  for (const categoryKey of HOME_CATEGORY_PRIORITY) {
    groups.set(categoryKey, []);
  }

  for (const item of Array.isArray(items) ? items : []) {
    const categoryKey = normalizedCatalogCategoryKey(item?.normalizedCategory || item?.category || "");
    if (!groups.has(categoryKey)) continue;
    groups.get(categoryKey).push(item);
  }

  const entries = HOME_CATEGORY_PRIORITY.map((categoryKey) => {
    const group = groups.get(categoryKey) || [];
    const copy = HOME_CATEGORY_COPY.get(categoryKey) || {
      label: categoryKey,
      query: categoryKey,
      sourceHint: categoryKey,
    };

    const sources = [...new Set(group
      .map((item) => normalizedCatalogCategoryKey(item?.source || item?.marketplace || item?.seller || ""))
      .filter(Boolean))]
      .slice(0, 6);

    return {
      category: categoryKey,
      label: copy.label,
      query: copy.query,
      sourceHint: copy.sourceHint,
      count: group.length,
      sampleTitles: group.slice(0, 3).map((item) => item?.displayTitle || item?.title || "").filter(Boolean),
      sources,
      intent: { category: categoryKey, query: copy.query },
    };
  }).filter((entry) => entry.count > 0);

  return entries;
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
    const decisionHighlights = buildOfferRadarHighlights();
    const activeCampaigns = buildCampaignCards();
    const menu = [
      { label: "Início", href: "/", active: true },
      { label: "Departamentos", href: "#departments", active: true },
      { label: "Blog", href: "", future: true, active: false },
      { label: "Minha Conta", href: "", future: true, active: false },
    ];

    const publicCollections = buildPublicHomeCollections(catalogForHome);
    const categories = buildCuratedHomeItems(publicCollections, publicCollections);
    const homeButtons = categories.length ? categories : seoHomeButtons;
    const curatedDepartments = buildCuratedHomeItems(publicCollections, publicCollections);
    const topCategories = categories;
    const shortcuts = Array.isArray(analysis.shortcuts) ? analysis.shortcuts : [];
    const activeSources = [...new Map(
      catalogForHome
        .map((item) => normalizedCatalogCategoryKey(item?.source || item?.marketplace || item?.seller || ""))
        .filter(Boolean)
        .map((source) => [source, {
          source: labelHomeSource(source),
          count: catalogForHome.filter((item) => normalizedCatalogCategoryKey(item?.source || item?.marketplace || item?.seller || "") === source).length,
        }]),
    ).values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

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
      decisionHighlights,
      activeCampaigns,
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
      departmentSummary: curatedDepartments,
      categorySummary: categories,
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
      decisionHighlights: buildOfferRadarHighlights(),
      activeCampaigns: buildCampaignCards(),
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

