import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

import {
  VERIFIED_AFFILIATE_OFFERS,
  isVerifiedAffiliateOfferAutomatedSourceAllowed,
  isVerifiedAffiliateOfferFresh,
} from "../src/data/verified-affiliate-offers.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const seedPaths = [
  path.join(rootDir, "src", "data", "products.seed.json"),
  path.join(rootDir, "data", "products.seed.json"),
  path.join(rootDir, "public", "data", "products.seed.json"),
];
const metadataJsonPaths = [
  path.join(rootDir, "src", "data", "catalog-refresh-metadata.json"),
  path.join(rootDir, "data", "catalog-refresh-metadata.json"),
  path.join(rootDir, "public", "data", "catalog-refresh-metadata.json"),
].filter((filePath) => fs.existsSync(filePath));
const metadataModulePath = path.join(rootDir, "src", "data", "catalog-refresh-metadata.generated.js");
const referenceDate = new Date();
const allowedPartnerSources = new Set(["amazon", "mercado_livre"]);

function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
}

function normalizeSource(offer = {}) {
  const raw = normalizeText(offer.sourceName || offer.sourceLabel || offer.source || offer.marketplace);
  if (raw === "mercadolivre" || raw === "mercado-livre") return "mercado_livre";
  return raw;
}

function sourceDisplayName(source) {
  if (source === "mercado_livre") return "Mercado Livre";
  if (source === "amazon") return "Amazon";
  return source;
}

function firstUrl(offer = {}) {
  return offer.affiliateUrl || offer.permalink || offer.productUrl || offer.url || offer.externalLink || "";
}

function uniqueValues(values = []) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];
}

function productIdForOffer(offer = {}, source = "") {
  const sourceProductId = offer.asin || offer.itemId || offer.sourceProductId || offer.externalId;
  if (sourceProductId) return `partner-${source}-${sourceProductId}`;
  if (offer.id) return `partner-${source}-${offer.id}`;
  return `partner-${source}-${Buffer.from(firstUrl(offer) || offer.title || Math.random().toString()).toString("base64url")}`;
}

function normalizePartnerProduct(offer = {}) {
  const source = normalizeSource(offer);
  const fresh = isVerifiedAffiliateOfferFresh(offer, referenceDate);
  const url = firstUrl(offer);
  const sourceProductId = offer.asin || offer.itemId || offer.sourceProductId || offer.externalId || "";
  const category = offer.normalizedCategory || offer.category || offer.department || "outros";
  const title = offer.displayTitle || offer.title || offer.originalTitle || "Produto parceiro monitorado";

  return {
    ...offer,
    id: productIdForOffer(offer, source),
    title,
    displayTitle: title,
    originalTitle: offer.originalTitle || offer.title || title,
    source,
    sourceName: source,
    sourceLabel: source,
    marketplace: source,
    sourceDisplayName: sourceDisplayName(source),
    sourceType: "partner_catalog_product",
    partnerSourceType: offer.sourceType || "verified_affiliate_offer",
    catalogOrigin: "verified_affiliate_offers",
    sourceProductId,
    externalId: sourceProductId,
    asin: offer.asin || (source === "amazon" ? sourceProductId : offer.asin),
    itemId: offer.itemId || (source === "mercado_livre" ? sourceProductId : offer.itemId),
    category,
    normalizedCategory: category,
    department: offer.department || category,
    productType: offer.productType || (offer.isAccessory ? "accessory" : "principal"),
    isAccessory: Boolean(offer.isAccessory),
    price: Number(offer.price || offer.cashPrice || 0),
    currency: offer.currency || "BRL",
    image: offer.image || offer.thumbnail || "",
    affiliateUrl: url,
    productUrl: offer.productUrl || offer.permalink || url,
    permalink: offer.permalink || offer.productUrl || url,
    url,
    dataMode: "real",
    active: true,
    hidden: false,
    catalogStatus: fresh ? "active" : "monitored",
    freshnessStatus: fresh ? "fresh" : "needs_recheck",
    needsRecheck: !fresh,
    availability: fresh
      ? (offer.availability || "Oferta verificada recentemente")
      : "Produto monitorado; confirme preço e estoque na loja",
    sourceQualityScore: Number(offer.sourceQualityScore || (fresh ? 78 : 58)),
    qualityScore: Number(offer.qualityScore || (fresh ? 78 : 62)),
    classificationMethod: offer.classificationMethod || "partner_feed",
    classificationConfidence: Number(offer.classificationConfidence || 0.82),
    classificationWarnings: uniqueValues([
      ...(Array.isArray(offer.classificationWarnings) ? offer.classificationWarnings : []),
      fresh ? "" : "Oferta precisa de nova validação de preço e estoque.",
    ]),
    searchKeywords: uniqueValues([
      ...(Array.isArray(offer.searchKeywords) ? offer.searchKeywords : []),
      offer.brand,
      offer.model,
      category,
      title,
      sourceDisplayName(source),
    ]),
    importedAt: referenceDate.toISOString(),
    lastCheckedAt: offer.lastCheckedAt || offer.verifiedAt || referenceDate.toISOString(),
    verifiedAt: offer.verifiedAt || offer.lastCheckedAt || null,
  };
}

const partnerProductsById = new Map();
for (const product of VERIFIED_AFFILIATE_OFFERS
  .filter(isVerifiedAffiliateOfferAutomatedSourceAllowed)
  .filter((offer) => allowedPartnerSources.has(normalizeSource(offer)))
  .map(normalizePartnerProduct)
  .filter((product) => product.price > 0 && product.url && product.image)) {
  partnerProductsById.set(product.id, product);
}

const partnerProducts = [...partnerProductsById.values()];

const bySource = partnerProducts.reduce((acc, product) => {
  acc[product.source] = (acc[product.source] || 0) + 1;
  return acc;
}, {});

const byCategory = partnerProducts.reduce((acc, product) => {
  acc[product.normalizedCategory] = (acc[product.normalizedCategory] || 0) + 1;
  return acc;
}, {});

function readSeedProducts(seedPath) {
  try {
    return JSON.parse(fs.readFileSync(seedPath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return [];
  }
}

function readHeadSeedProducts(seedPath) {
  const relativePath = path.relative(rootDir, seedPath).replace(/\\/g, "/");
  try {
    const output = execFileSync("git", ["show", `HEAD:${relativePath}`], {
      cwd: rootDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return JSON.parse(output);
  } catch {
    return [];
  }
}

function isPartnerCatalogProduct(product = {}) {
  return product.catalogOrigin === "verified_affiliate_offers";
}

let baseProducts = [];
for (const seedPath of seedPaths) {
  if (!fs.existsSync(seedPath)) continue;
  for (const candidateProducts of [readSeedProducts(seedPath), readHeadSeedProducts(seedPath)]) {
    const nonPartnerProducts = candidateProducts.filter((product) => !isPartnerCatalogProduct(product));
    if (nonPartnerProducts.length > baseProducts.length) {
      baseProducts = nonPartnerProducts;
    }
  }
}

for (const seedPath of seedPaths) {
  const currentProducts = readSeedProducts(seedPath);
  const nextProducts = [...baseProducts, ...partnerProducts];
  fs.writeFileSync(seedPath, `${JSON.stringify(nextProducts, null, 2)}\n`);
  console.log(JSON.stringify({
    seedPath: path.relative(rootDir, seedPath),
    before: currentProducts.length,
    base: baseProducts.length,
    partnerProducts: partnerProducts.length,
    after: nextProducts.length,
  }, null, 2));
}

console.log(JSON.stringify({
  partnerProducts: partnerProducts.length,
  bySource,
  byCategory,
}, null, 2));

const publishedBySource = [...baseProducts, ...partnerProducts].reduce((acc, product) => {
  const source = normalizeSource(product) || normalizeText(product.source || product.sourceName || product.sourceLabel || "sem_fonte");
  acc[source] = (acc[source] || 0) + 1;
  return acc;
}, {});

const previousMetadata = fs.existsSync(metadataJsonPaths[0])
  ? JSON.parse(fs.readFileSync(metadataJsonPaths[0], "utf8").replace(/^\uFEFF/, ""))
  : {};
const previousHiddenCount = Number(previousMetadata.hiddenCount || 0);
const historicalHiddenBySource = new Map((previousMetadata.sources || []).map((entry) => [
  normalizeText(entry.source),
  Number(entry.hiddenCount || 0),
]));
const historicalAnalyzedBySource = new Map((previousMetadata.sources || []).map((entry) => [
  normalizeText(entry.source),
  Number(entry.analyzedCount || 0),
]));
const historicalRejectedBySource = new Map((previousMetadata.sources || []).map((entry) => [
  normalizeText(entry.source),
  Array.isArray(entry.rejectedReasons) ? entry.rejectedReasons : [],
]));

function metadataLabelForSource(source) {
  if (source === "saldao_informatica") return "Saldão da Informática";
  if (source === "infostore") return "Info Store - Informática";
  if (source === "amazon") return "Amazon";
  if (source === "mercado_livre") return "Mercado Livre";
  return sourceDisplayName(source);
}

const orderedSources = ["saldao_informatica", "infostore", "amazon", "mercado_livre"];
const sources = orderedSources
  .filter((source) => (publishedBySource[source] || 0) > 0 || historicalHiddenBySource.has(source))
  .map((source) => {
    const publishedCount = Number(publishedBySource[source] || 0);
    const hiddenCount = Number(historicalHiddenBySource.get(source) || 0);
    const analyzedCount = Math.max(
      publishedCount + hiddenCount,
      Number(historicalAnalyzedBySource.get(source) || 0),
    );
    return {
      source,
      label: metadataLabelForSource(source),
      analyzedCount,
      publishedCount,
      hiddenCount,
      rejectedReasons: historicalRejectedBySource.get(source) || [],
    };
  });

const publishedCount = baseProducts.length + partnerProducts.length;
const analyzedCount = publishedCount + previousHiddenCount;
const metadata = {
  refreshedAt: referenceDate.toISOString(),
  fresh: true,
  analyzedCount,
  publishedCount,
  hiddenCount: previousHiddenCount,
  activeSourceCounts: sources.map(({ source, label, analyzedCount: sourceAnalyzed, publishedCount: sourcePublished, hiddenCount }) => ({
    source,
    label,
    analyzedCount: sourceAnalyzed,
    publishedCount: sourcePublished,
    hiddenCount,
  })),
  sources,
};

for (const metadataPath of metadataJsonPaths) {
  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
}
fs.writeFileSync(metadataModulePath, `const catalogRefreshMetadata = ${JSON.stringify(metadata, null, 2)};\n\nexport default catalogRefreshMetadata;\n`);

console.log(JSON.stringify({
  metadata: {
    analyzedCount,
    publishedCount,
    hiddenCount: previousHiddenCount,
    sources: sources.map(({ source, publishedCount }) => ({ source, publishedCount })),
  },
}, null, 2));
