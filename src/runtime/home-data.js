import fs from "node:fs";
import CatalogManager from "../catalog/CatalogManager.js";
import ProductIntelligenceEngine from "../catalog/ProductIntelligenceEngine.js";
import SEOIntelligenceEngine from "../seo/SEOIntelligenceEngine.js";
import { resolveCatalogSeedPath } from "./catalog-path.js";
import { resolveProjectPath } from "./project-root.js";
import { readCatalogRefreshMetadata } from "./catalog-refresh-metadata.js";
import { listFreshVerifiedAffiliateOffers } from "../data/verified-affiliate-offers.js";
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

const BUYING_GUIDE_CARDS = [
  {
    category: "celulares",
    label: "Celulares",
    title: "Como escolher celular sem se enrolar no orçamento",
    description: "Um guia direto para comparar preço, parcela, geração e uso real antes de trocar de celular.",
    href: "/blog/como-escolher-celular-sem-se-enrolar-no-orcamento.html",
    query: "celular ate 1500",
  },
  {
    category: "notebooks",
    label: "Notebooks",
    title: "Como escolher notebook sem cair em ficha técnica inflada",
    description: "O que observar em processador, RAM, SSD e tela para não pagar por força que não aparece no uso.",
    href: "/blog/como-escolher-notebook-sem-cair-em-ficha-tecnica-inflada.html",
    query: "notebook i5 16gb",
  },
  {
    category: "celulares",
    label: "Comparativo",
    title: "iPhone 17 Pro Max vs Galaxy S26 Ultra",
    description: "Comparação prática entre os dois topos de linha, com foco em dinheiro, parcela e decisão.",
    href: "/blog/iphone-17-pro-max-vs-galaxy-s26-ultra.html",
    query: "iphone 17 pro max",
  },
];

const VERIFIED_OFFER_CATEGORY_COPY = new Map([
  ["celular", { label: "Celulares", query: "celular", category: "celulares" }],
  ["notebook", { label: "Notebooks", query: "notebook", category: "notebooks" }],
  ["monitor", { label: "Monitores gamer", query: "monitor gamer 144hz", category: "monitores" }],
  ["tv", { label: "TVs", query: "tv samsung 50", category: "tvs" }],
  ["rede", { label: "Rede e Wi-Fi", query: "roteador wifi", category: "rede" }],
  ["ferramenta", { label: "Ferramentas", query: "furadeira", category: "ferramentas" }],
  ["audio", { label: "Áudio e fones", query: "fone bluetooth", category: "audio" }],
  ["tablet", { label: "Tablets", query: "tablet", category: "tablets" }],
  ["casa", { label: "Casa", query: "casa", category: "casa" }],
]);

const VERIFIED_OFFER_CATEGORY_ALIASES = new Map([
  ["celulares", "celular"],
  ["smartphones", "celular"],
  ["notebooks", "notebook"],
  ["monitores", "monitor"],
  ["tvs", "tv"],
  ["televisores", "tv"],
  ["ferramentas", "ferramenta"],
  ["fones", "audio"],
  ["tablets", "tablet"],
  ["informatica", "rede"],
]);

const VERIFIED_OFFER_CATEGORY_PRIORITY = [
  "celular",
  "notebook",
  "monitor",
  "tv",
  "rede",
  "ferramenta",
  "audio",
  "tablet",
  "casa",
];

const VERIFIED_OFFER_CATEGORY_RULES = new Map([
  ["celular", {
    include: [/\biphone\b/, /\bgalaxy\b/, /\bsmartphone\b/, /\bcelular\b/, /\bredmi\b/, /\bpoco\b/, /\bmotorola\b/, /\bmoto g\b/, /\bxiaomi\b/],
    exclude: [/\bsmartwatch\b/, /\bwatch\b/, /\brelogio\b/, /\brelógio\b/, /\bfit3\b/, /\bcapa\b/, /\bcase\b/, /\bpelicula\b/, /\bpelícula\b/, /\bcabo\b/, /\bcarregador\b/, /\bsuporte\b/, /\bfone\b/, /\bheadset\b/, /\bcompativel\b/, /\bcompatível\b/],
  }],
  ["notebook", {
    include: [/\bnotebook\b/, /\blaptop\b/, /\bmacbook\b/, /\bchromebook\b/, /\bideapad\b/, /\bthinkpad\b/, /\bvivobook\b/, /\baspire\b/, /\binspiron\b/, /\bloq\b/],
    exclude: [/\bsoftware\b/, /\blicenca\b/, /\blicença\b/, /\bcapa\b/, /\bcase\b/, /\bmochila\b/, /\bbase\b/, /\bsuporte\b/, /\bcooler\b/, /\bmouse\b/, /\bteclado\b/],
  }],
  ["monitor", {
    include: [/\bmonitor\b/, /\b144hz\b/, /\b165hz\b/, /\b240hz\b/, /\bultrawide\b/, /\bips\b/, /\bqhd\b/],
    exclude: [/\bsmartwatch\b/, /\bwatch\b/, /\brelogio\b/, /\brelógio\b/, /\bmonitor atividades\b/, /\bsuporte\b/, /\bcabo\b/, /\badaptador\b/, /\bnotebook\b/, /\btv box\b/, /\bcontrole\b/],
  }],
  ["tv", {
    include: [/\bsmart tv\b/, /\btv\b/, /\btelevisao\b/, /\btelevisão\b/, /\boled\b/, /\bqled\b/, /\bmini led\b/, /\b4k\b/],
    exclude: [/\bsuporte\b/, /\bcontrole\b/, /\bcabo\b/, /\bmonitor\b/, /\btv box\b/, /\bstick\b/],
  }],
  ["rede", {
    include: [/\broteador\b/, /\brouter\b/, /\bmesh\b/, /\bwi-fi\b/, /\bwifi\b/, /\bax3000\b/, /\bbe550\b/, /\bbe6500\b/, /\btp-link\b/, /\btenda\b/],
    exclude: [/\bsuporte\b/, /\bparede\b/, /\bcabo\b/, /\badaptador\b/, /\bfonte\b/],
  }],
  ["ferramenta", {
    include: [/\bfuradeira\b/, /\bparafusadeira\b/, /\bserra\b/, /\blixadeira\b/, /\besmerilhadeira\b/, /\bmartelete\b/, /\balicate\b/],
    exclude: [/\bserra copo\b/, /\bescova de carvao\b/, /\bescova de carvão\b/, /\bpeca\b/, /\bpeça\b/, /\brefil\b/, /\breposicao\b/, /\breposição\b/],
  }],
  ["audio", {
    include: [/\bfone\b/, /\bheadphone\b/, /\bheadset\b/, /\bearbud\b/, /\bbuds\b/, /\bairpods\b/, /\bcaixa de som\b/, /\bsoundbar\b/, /\bbluetooth\b/],
    exclude: [/\bcapa\b/, /\bcase\b/, /\bcabo\b/, /\bcarregador\b/, /\bsuporte\b/],
  }],
  ["tablet", {
    include: [/\btablet\b/, /\bipad\b/, /\bgalaxy tab\b/, /\bredmi pad\b/, /\bxiaomi pad\b/, /\blenovo tab\b/],
    exclude: [/\bcapa\b/, /\bcase\b/, /\bpelicula\b/, /\bpelícula\b/, /\bcabo\b/, /\bcarregador\b/, /\bsuporte\b/],
  }],
  ["casa", {
    include: [/\bair fryer\b/, /\baspirador\b/, /\bcozinha\b/, /\biluminacao\b/, /\biluminação\b/, /\borganizador\b/],
    exclude: [/\bpeca\b/, /\bpeça\b/, /\brefil\b/, /\bescova de carvao\b/, /\bescova de carvão\b/],
  }],
]);

function resolveVerifiedOfferCategory(offer = {}) {
  const key = normalizedCatalogCategoryKey(offer.normalizedCategory || offer.category || offer.department || "");
  if (VERIFIED_OFFER_CATEGORY_ALIASES.has(key)) return VERIFIED_OFFER_CATEGORY_ALIASES.get(key);
  if (VERIFIED_OFFER_CATEGORY_COPY.has(key)) return key;
  const text = normalizedCatalogCategoryKey([
    offer.title,
    offer.displayTitle,
    offer.brand,
    offer.model,
    Array.isArray(offer.searchKeywords) ? offer.searchKeywords.join(" ") : "",
  ].filter(Boolean).join(" "));
  if (/iphone|galaxy|samsung|celular|smartphone/.test(text)) return "celular";
  if (/notebook|laptop|macbook|chromebook|ideapad|thinkpad|vivobook|aspire|inspiron/.test(text)) return "notebook";
  if (/monitor|144hz|165hz|240hz|ultrawide/.test(text)) return "monitor";
  if (/smart tv|\btv\b|televisao|televisão|oled|qled|mini led/.test(text)) return "tv";
  if (/roteador|router|wifi|wi-fi|mesh|tenda|tp-link|be6500|ax3000/.test(text)) return "rede";
  if (/furadeira|parafusadeira|serra|lixadeira|esmerilhadeira|martelete|alicate/.test(text)) return "ferramenta";
  if (/fone|headphone|headset|earbud|buds|airpods|caixa de som|soundbar|bluetooth/.test(text)) return "audio";
  if (/tablet|ipad|galaxy tab|redmi pad|xiaomi pad|lenovo tab/.test(text)) return "tablet";
  if (/air fryer|aspirador|cozinha|iluminacao|iluminação|organizador/.test(text)) return "casa";
  if (/gopro|camera|c[âa]mera/.test(text)) return "camera";
  if (/magic mouse|mouse|teclado|acessorio|acessorios/.test(text)) return "acessorios";
  return key || "ofertas";
}

function hasVerifiedOfferRequiredPublicData(offer = {}) {
  const price = Number(offer.cashPrice || offer.finalPrice || offer.price || 0);
  const link = String(offer.permalink || offer.productUrl || offer.affiliateUrl || "").trim();
  const image = String(offer.image || offer.thumbnail || "").trim();
  return Number.isFinite(price) && price > 0 && Boolean(link) && Boolean(image);
}

function isPrincipalVerifiedOffer(offer = {}) {
  const type = normalizedCatalogCategoryKey(offer.productType || "");
  if (offer.isAccessory === true) return false;
  if (["accessory", "acessorio", "piece", "peca", "compatible", "compativel"].includes(type)) return false;
  return true;
}

function verifiedOfferMatchesCategory(offer = {}, categoryKey = "") {
  const rule = VERIFIED_OFFER_CATEGORY_RULES.get(categoryKey);
  if (!rule) return false;
  const text = normalizedCatalogCategoryKey([
    offer.title,
    offer.displayTitle,
    offer.brand,
    offer.model,
  ].filter(Boolean).join(" "));
  const hasInclude = rule.include.some((pattern) => pattern.test(text));
  const hasExclude = rule.exclude.some((pattern) => pattern.test(text));
  return hasInclude && !hasExclude;
}

function buildVerifiedOfferCategoryCards() {
  const groups = new Map();
  for (const offer of listFreshVerifiedAffiliateOffers()) {
    const categoryKey = resolveVerifiedOfferCategory(offer);
    if (!VERIFIED_OFFER_CATEGORY_COPY.has(categoryKey)) continue;
    if (!hasVerifiedOfferRequiredPublicData(offer)) continue;
    if (!isPrincipalVerifiedOffer(offer)) continue;
    if (!verifiedOfferMatchesCategory(offer, categoryKey)) continue;
    if (!groups.has(categoryKey)) groups.set(categoryKey, []);
    groups.get(categoryKey).push(offer);
  }

  return [...groups.entries()]
    .map(([categoryKey, offers]) => {
      const sorted = [...offers].sort((left, right) => Number(left.price || 0) - Number(right.price || 0));
      const bestOffer = sorted[0] || {};
      const copy = VERIFIED_OFFER_CATEGORY_COPY.get(categoryKey) || {
        label: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
        query: bestOffer.query || bestOffer.searchKeywords?.[0] || bestOffer.title || categoryKey,
        category: categoryKey,
      };
      const sources = [...new Set(sorted
        .map((offer) => labelHomeSource(offer.sourceName || offer.sourceLabel || offer.source || ""))
        .filter(Boolean))];
      return {
        categoryKey,
        category: copy.category || categoryKey,
        label: copy.label,
        query: copy.query || bestOffer.title || categoryKey,
        count: sorted.length,
        minPrice: Number(bestOffer.cashPrice || bestOffer.price || 0),
        subtitle: `${sorted.length} oferta${sorted.length > 1 ? "s" : ""} verificada${sorted.length > 1 ? "s" : ""}`,
        sources,
        sampleTitles: sorted.slice(0, 2).map((offer) => offer.displayTitle || offer.title || "").filter(Boolean),
        intent: {
          mode: "total",
          totalBudget: Math.max(300, Math.ceil(Number(bestOffer.price || 0) * 1.2)),
          months: 12,
          query: copy.query || bestOffer.title || categoryKey,
        },
      };
    })
    .filter((entry) => entry.count > 0)
    .sort((left, right) => {
      const leftPriority = VERIFIED_OFFER_CATEGORY_PRIORITY.indexOf(left.categoryKey);
      const rightPriority = VERIFIED_OFFER_CATEGORY_PRIORITY.indexOf(right.categoryKey);
      const normalizedLeft = leftPriority === -1 ? 999 : leftPriority;
      const normalizedRight = rightPriority === -1 ? 999 : rightPriority;
      return normalizedLeft - normalizedRight || right.count - left.count || left.label.localeCompare(right.label, "pt-BR");
    })
    .slice(0, 6);
}

function buildOfferRadarHighlights() {
  const freshOffers = listFreshVerifiedAffiliateOffers();
  return OFFER_RADAR_TARGETS.map((target) => {
    const matchingOffers = freshOffers
      .filter((offer) => {
        const match = findOfferRadarTarget([
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
  const productType = normalizedCatalogCategoryKey(item?.productType || "");
  const itemCategory = normalizedCatalogCategoryKey(item?.category || item?.normalizedCategory || "");
  if (
    item?.isAccessory === true
    || ["accessory", "acessorio", "piece", "peca", "compatible", "compativel"].includes(productType)
    || ["capa", "pelicula", "cabo", "carregador", "acessorio", "peca", "compativel"].includes(itemCategory)
  ) {
    return null;
  }

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
  if (source === "amazon" || source === "amazon.com.br") return "Amazon";
  if (source === "mercado_livre" || source === "mercado livre" || source === "mercadolivre") return "Mercado Livre";
  if (source === "mi_shop" || source === "mi shop" || source === "mishop") return "Mi Shop";
  if (source === "actionpay") return "Actionpay";
  if (source === "awin") return "Awin";
  if (source === "google_merchant") return "Google Merchant";
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildRefreshSourceSummary(refreshMetadata = null) {
  const entries = Array.isArray(refreshMetadata?.activeSourceCounts) ? refreshMetadata.activeSourceCounts : [];
  return entries
    .map((entry) => ({
      source: labelHomeSource(entry?.label || entry?.source || ""),
      count: Number(entry?.publishedCount || 0),
      analyzedCount: Number(entry?.analyzedCount || 0),
      hiddenCount: Number(entry?.hiddenCount || 0),
    }))
    .filter((entry) => entry.count > 0 || entry.analyzedCount > 0)
    .sort((a, b) => b.count - a.count || b.analyzedCount - a.analyzedCount || a.source.localeCompare(b.source, "pt-BR"));
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

function isCatalogFreshEnough(updatedAt, maxAgeDays = 7) {
  const timestamp = Date.parse(updatedAt || "");
  if (!Number.isFinite(timestamp)) return false;
  const ageMs = Date.now() - timestamp;
  return ageMs >= 0 && ageMs <= maxAgeDays * 24 * 60 * 60 * 1000;
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
    const refreshMetadata = readCatalogRefreshMetadata();
    const catalogForHome = getRealHomeCatalog(items);
    const analysis = getProductIntelligenceEngine().buildHomeData(catalogForHome);
    const seoEngine = getSEOIntelligenceEngine();
    const seoHotSearches = seoEngine.buildSeoHotSearches(6);
    const seoHomeButtons = seoEngine.buildHomeButtons(catalogForHome);
    const decisionHighlights = buildOfferRadarHighlights();
    const offerCategories = buildVerifiedOfferCategoryCards();
    const catalogUpdatedAt = refreshMetadata?.refreshedAt || resolveCatalogUpdatedAt(catalogForHome);
    const catalogFresh = refreshMetadata?.fresh === true || isCatalogFreshEnough(catalogUpdatedAt, 7);
    const totalCatalogProducts = Number(refreshMetadata?.analyzedCount ?? catalogDiagnostics.rawCount ?? items.length);
    const totalPublishedProducts = Number(refreshMetadata?.publishedCount ?? catalogDiagnostics.publishedCount ?? items.length);
    const hiddenProducts = Number(refreshMetadata?.hiddenCount ?? catalogDiagnostics.hiddenProducts ?? 0);
    const activeCampaigns = buildCampaignCards();
    const visibleCampaigns = catalogFresh ? activeCampaigns : [];
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
    const visibleShortcuts = catalogFresh ? shortcuts : [];
    const activeSourcesFromCatalog = [...new Map(
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
    const activeSources = buildRefreshSourceSummary(refreshMetadata).length
      ? buildRefreshSourceSummary(refreshMetadata).slice(0, 8)
      : activeSourcesFromCatalog;
    const visibleActiveSources = catalogFresh ? activeSources : [];
    const visibleBrandSummary = catalogFresh && Array.isArray(analysis.brandSummary) ? analysis.brandSummary.slice(0, 8) : [];
    const visibleTopBrands = catalogFresh && Array.isArray(analysis.topBrands) ? analysis.topBrands.slice(0, 8) : [];
    const visibleMarketplaceSummary = catalogFresh && Array.isArray(analysis.marketplaceSummary)
      ? analysis.marketplaceSummary.map((item) => ({
          marketplace: item.source || item.marketplace || "",
          count: item.count,
          categories: item.categories || [],
          sellers: item.sellers || [],
        })).slice(0, 8)
      : [];
    const visibleSellerSummary = catalogFresh && Array.isArray(analysis.sellerSummary) ? analysis.sellerSummary.slice(0, 8) : [];

    return {
      ok: true,
      totalProducts: items.length,
      totalCatalogProducts,
      totalPublishedProducts,
      hiddenProducts,
      analyzedProducts: analysis.analyzedProducts || catalogForHome.length,
      catalogUpdatedAt,
      catalogFresh,
      focusLabel: analysis.focusLabel || "Consultor de compras",
      menu,
      categories,
      homeButtons,
      departments: curatedDepartments,
      topDepartments: curatedDepartments,
      topCategories,
      topSources: visibleActiveSources,
      searchCategories: homeButtons.length ? homeButtons : curatedDepartments,
      departmentCategories: curatedDepartments,
      decisionHighlights,
      offerCategories,
      activeCampaigns: visibleCampaigns,
      pechinchas: visibleShortcuts,
      shortcuts: visibleShortcuts,
      seoHotSearches,
      featuredVideos: FEATURED_VIDEO_GUIDES,
      guideCards: BUYING_GUIDE_CARDS,
      activeSources: visibleActiveSources,
      marketplaceSummary: visibleMarketplaceSummary,
      sellerSummary: visibleSellerSummary,
      brandSummary: visibleBrandSummary,
      topBrands: visibleTopBrands,
      departmentSummary: curatedDepartments,
      categorySummary: categories,
      beforeOutros: analysis.beforeOutros ?? 0,
      afterOutros: analysis.afterOutros ?? 0,
      catalogSummary: {
        seedUsed: catalogDiagnostics.seedPath || "",
        rawCount: totalCatalogProducts,
        publishedCount: totalPublishedProducts,
        hiddenProducts,
        filteredCount: catalogDiagnostics.filteredCount ?? 0,
        filterReasons: Array.isArray(catalogDiagnostics.filterReasons) ? catalogDiagnostics.filterReasons : [],
        sourceCounts: Array.isArray(catalogDiagnostics.sourceCounts) ? catalogDiagnostics.sourceCounts : [],
        refreshMetadata,
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
      catalogFresh: false,
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
      offerCategories: buildVerifiedOfferCategoryCards(),
      activeCampaigns: buildCampaignCards(),
      pechinchas: [],
      shortcuts: [],
      seoHotSearches: [],
      featuredVideos: FEATURED_VIDEO_GUIDES,
      guideCards: BUYING_GUIDE_CARDS,
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

