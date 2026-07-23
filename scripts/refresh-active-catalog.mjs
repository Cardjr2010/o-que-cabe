import fs from "node:fs";
import path from "node:path";
import { resolveProjectPath } from "../src/runtime/project-root.js";
import { normalizeImportedProduct } from "../src/importers/ProductImporter.js";

const nowIso = new Date().toISOString();
const seedTargets = [
  resolveProjectPath("src", "data", "products.seed.json"),
  resolveProjectPath("data", "products.seed.json"),
  resolveProjectPath("public", "data", "products.seed.json"),
];
const metadataTargets = [
  resolveProjectPath("src", "data", "catalog-refresh-metadata.json"),
  resolveProjectPath("data", "catalog-refresh-metadata.json"),
  resolveProjectPath("public", "data", "catalog-refresh-metadata.json"),
];
const reportPath = resolveProjectPath("RELATORIO_CATALOGO_REFRESH_REAL.md");
const saldaoFeedPath = resolveProjectPath("data", "saldao-feed.xml");
const infoStoreSitemaps = [
  "https://www.infostore.com.br/sitemap/product-0.xml",
  "https://www.infostore.com.br/sitemap/product-1.xml",
];
const REQUEST_HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};
const pageConcurrency = Number(process.env.OQC_REFRESH_CONCURRENCY || 10);
const pageLimit = Number(process.env.OQC_REFRESH_LIMIT || 0);

function cleanText(value = "") {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function decodeEntities(value = "") {
  return String(value || "")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const text = cleanText(value).replace(/[^\d.,-]/g, "");
  if (!text) return 0;
  const hasComma = text.includes(",");
  const hasDot = text.includes(".");
  let normalized = text;
  if (hasComma && hasDot) {
    normalized = text.lastIndexOf(",") > text.lastIndexOf(".")
      ? text.replace(/\./g, "").replace(",", ".")
      : text.replace(/,/g, "");
  } else if (hasComma) {
    normalized = /,\d{1,2}$/.test(text) ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  } else if (hasDot) {
    normalized = /\.\d{1,2}$/.test(text) ? text : text.replace(/\./g, "");
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseXmlItems(xml = "") {
  return [...String(xml).matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);
}

function extractTag(block = "", tagName = "") {
  const match = String(block).match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return cleanText(match?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") || "");
}

function flattenJsonLd(value) {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (value && typeof value === "object") return [value];
  return [];
}

function extractJsonLdBlocks(html = "") {
  const blocks = [...String(html).matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1]);
  const parsed = [];
  for (const block of blocks) {
    try {
      parsed.push(...flattenJsonLd(JSON.parse(block)));
    } catch {
      // ignore malformed blocks
    }
  }
  return parsed;
}

function pickProductJsonLd(html = "") {
  const blocks = extractJsonLdBlocks(html);
  return blocks.find((entry) => {
    const type = Array.isArray(entry?.["@type"]) ? entry["@type"].join(",") : entry?.["@type"];
    return String(type || "").includes("Product") && entry?.offers;
  }) || null;
}

function availabilityToStatus(value = "") {
  const text = String(value || "").toLowerCase();
  if (text.includes("instock")) return "available";
  if (text.includes("outofstock")) return "unavailable";
  if (text.includes("preorder")) return "preorder";
  return cleanText(value) || "unknown";
}

function conditionToValue(value = "") {
  const text = String(value || "").toLowerCase();
  if (text.includes("new")) return "new";
  if (text.includes("used")) return "used";
  if (text.includes("refurb")) return "refurbished";
  return cleanText(value) || "unknown";
}

function parseInstallmentFromHtml(html = "") {
  const text = decodeEntities(String(html || "").replace(/<[^>]+>/g, " "));
  const match = text.match(/(\d{1,2})\s*x\s*de\s*R\$\s*([\d.,]+)(?:\s*(sem juros|com juros|c\/\s*juros))?/i);
  if (!match) return null;
  const count = Number(match[1] || 0);
  const amount = parseNumber(match[2] || 0);
  if (!count || !amount) return null;
  return {
    available: true,
    count,
    amount,
    total: Number((count * amount).toFixed(2)),
    interestFree: /sem juros/i.test(match[3] || ""),
    source: "page_revalidation",
    confidence: 0.8,
  };
}

function parseShippingFromOffer(offer = {}) {
  const price = parseNumber(offer?.shippingDetails?.shippingRate?.value);
  if (!Number.isFinite(price)) return { price: null, free: null };
  return { price, free: price <= 0 };
}

function normalizePageProduct({ source, sourceLabel, pageUrl, html, fallbackCategory = "", fallbackTitle = "" }) {
  const product = pickProductJsonLd(html);
  if (!product) return { ok: false, reason: "JSON_LD_PRODUCT_MISSING" };

  const offers = product?.offers || {};
  const primaryOffer = Array.isArray(offers?.offers) && offers.offers.length ? offers.offers[0] : offers;
  const availability = availabilityToStatus(primaryOffer?.availability || offers?.availability || "");
  if (availability !== "available") {
    return { ok: false, reason: `UNAVAILABLE_${availability.toUpperCase()}` };
  }

  const price = parseNumber(primaryOffer?.price ?? offers?.lowPrice ?? offers?.price);
  if (!price || price <= 0) {
    return { ok: false, reason: "PRICE_INVALID" };
  }

  const title = decodeEntities(product?.name || fallbackTitle || "");
  const permalink = cleanText(String(primaryOffer?.url || pageUrl).split("#")[0]);
  const shipping = parseShippingFromOffer(primaryOffer);
  const normalized = normalizeImportedProduct({
    id: `${source}-${cleanText(product?.sku || product?.gtin13 || product?.mpn || permalink)}`,
    externalId: cleanText(product?.sku || product?.gtin13 || product?.mpn || permalink),
    sku: cleanText(product?.sku || ""),
    gtin: cleanText(product?.gtin13 || product?.gtin || ""),
    title,
    displayTitle: title,
    category: decodeEntities(product?.category || fallbackCategory || ""),
    brand: decodeEntities(product?.brand?.name || product?.brand || ""),
    price,
    currency: cleanText(primaryOffer?.priceCurrency || offers?.priceCurrency || "BRL") || "BRL",
    image: Array.isArray(product?.image) ? cleanText(product.image[0]) : cleanText(product?.image || primaryOffer?.image || ""),
    productUrl: permalink,
    affiliateUrl: permalink,
    permalink,
    marketplace: source,
    seller: decodeEntities(primaryOffer?.seller?.name || sourceLabel),
    store: sourceLabel,
    source,
    sourceName: sourceLabel,
    sourceLabel,
    sourceType: "live_page_revalidation",
    dataMode: "real",
    condition: conditionToValue(primaryOffer?.itemCondition || ""),
    availability,
    lastCheckedAt: nowIso,
    importedAt: nowIso,
    updatedAt: nowIso,
    description: decodeEntities(product?.description || ""),
    installments: parseInstallmentFromHtml(html),
    shippingPrice: shipping.price,
    freeShipping: shipping.free,
  });

  if (!normalized) return { ok: false, reason: "NORMALIZATION_FAILED" };
  return { ok: true, product: normalized };
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      headers: REQUEST_HEADERS,
      redirect: "follow",
      signal: controller.signal,
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, text, url };
  } catch (error) {
    return { ok: false, status: 0, text: "", url, error: error?.name || error?.message || "FETCH_ERROR" };
  } finally {
    clearTimeout(timeout);
  }
}

async function runPool(items, worker, concurrency = 8) {
  const results = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, () => next()));
  return results;
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readSaldaoCandidates() {
  const xml = fs.readFileSync(saldaoFeedPath, "utf8");
  return parseXmlItems(xml).map((block) => ({
    url: extractTag(block, "link"),
    title: decodeEntities(extractTag(block, "title")),
    category: decodeEntities(extractTag(block, "g:product_type") || ""),
  })).filter((item) => item.url);
}

async function readInfoStoreCandidates() {
  const sitemapTexts = await Promise.all(infoStoreSitemaps.map((url) => fetchText(url)));
  return sitemapTexts
    .filter((entry) => entry.ok)
    .flatMap((entry) => [...entry.text.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => cleanText(match[1])))
    .filter(Boolean);
}

async function refreshSource(sourceConfig) {
  const candidates = await sourceConfig.loadCandidates();
  const boundedCandidates = pageLimit > 0 ? candidates.slice(0, pageLimit) : candidates;
  const rejectedSummary = new Map();

  const pageResults = await runPool(boundedCandidates, async (candidate) => {
    const pageUrl = typeof candidate === "string" ? candidate : candidate.url;
    const fallbackCategory = typeof candidate === "string" ? "" : candidate.category || "";
    const fallbackTitle = typeof candidate === "string" ? "" : candidate.title || "";
    const response = await fetchText(pageUrl);
    if (!response.ok) {
      const reason = response.status ? `HTTP_${response.status}` : String(response.error || "FETCH_FAILED");
      rejectedSummary.set(reason, (rejectedSummary.get(reason) || 0) + 1);
      return null;
    }
    const normalized = normalizePageProduct({
      source: sourceConfig.source,
      sourceLabel: sourceConfig.label,
      pageUrl,
      html: response.text,
      fallbackCategory,
      fallbackTitle,
    });
    if (!normalized.ok) {
      rejectedSummary.set(normalized.reason, (rejectedSummary.get(normalized.reason) || 0) + 1);
      return null;
    }
    return normalized.product;
  }, pageConcurrency);

  return {
    source: sourceConfig.source,
    label: sourceConfig.label,
    analyzedCount: boundedCandidates.length,
    publishedCount: pageResults.filter(Boolean).length,
    hiddenCount: boundedCandidates.length - pageResults.filter(Boolean).length,
    rejectedReasons: [...rejectedSummary.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
    products: pageResults.filter(Boolean),
  };
}

function buildMarkdownReport(summary) {
  const lines = [
    "# RELATORIO_CATALOGO_REFRESH_REAL",
    "",
    `- atualizado em: ${summary.refreshedAt}`,
    `- produtos analisados: ${summary.analyzedCount}`,
    `- produtos publicados: ${summary.publishedCount}`,
    `- produtos rejeitados: ${summary.hiddenCount}`,
    "",
    "## Fontes",
    "",
  ];
  for (const source of summary.sources) {
    lines.push(`### ${source.label}`);
    lines.push(`- analisados: ${source.analyzedCount}`);
    lines.push(`- publicados: ${source.publishedCount}`);
    lines.push(`- rejeitados: ${source.hiddenCount}`);
    if (source.rejectedReasons.length) {
      lines.push("- motivos principais:");
      for (const reason of source.rejectedReasons.slice(0, 10)) {
        lines.push(`  - ${reason.reason}: ${reason.count}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

const sourceRuns = await Promise.all([
  refreshSource({
    source: "saldao_informatica",
    label: "Saldão da Informática",
    loadCandidates: async () => readSaldaoCandidates(),
  }),
  refreshSource({
    source: "infostore",
    label: "Info Store - Informática",
    loadCandidates: async () => readInfoStoreCandidates(),
  }),
]);

const products = sourceRuns.flatMap((entry) => entry.products);
const metadata = {
  refreshedAt: nowIso,
  fresh: true,
  analyzedCount: sourceRuns.reduce((sum, entry) => sum + entry.analyzedCount, 0),
  publishedCount: products.length,
  hiddenCount: sourceRuns.reduce((sum, entry) => sum + entry.hiddenCount, 0),
  activeSourceCounts: sourceRuns.map((entry) => ({
    source: entry.source,
    label: entry.label,
    analyzedCount: entry.analyzedCount,
    publishedCount: entry.publishedCount,
    hiddenCount: entry.hiddenCount,
  })),
  sources: sourceRuns.map((entry) => ({
    source: entry.source,
    label: entry.label,
    analyzedCount: entry.analyzedCount,
    publishedCount: entry.publishedCount,
    hiddenCount: entry.hiddenCount,
    rejectedReasons: entry.rejectedReasons,
  })),
};

for (const filePath of seedTargets) {
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(products, null, 2), "utf8");
}

for (const filePath of metadataTargets) {
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2), "utf8");
}

ensureParentDir(reportPath);
fs.writeFileSync(reportPath, buildMarkdownReport(metadata), "utf8");

console.log(JSON.stringify({
  refreshedAt: nowIso,
  analyzedCount: metadata.analyzedCount,
  publishedCount: metadata.publishedCount,
  hiddenCount: metadata.hiddenCount,
  sources: metadata.activeSourceCounts,
  reportPath,
}, null, 2));
