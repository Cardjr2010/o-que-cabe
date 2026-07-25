import fs from "node:fs";
import path from "node:path";
import { resolveProjectPath } from "../src/runtime/project-root.js";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36";
const AMAZON_TAG = process.env.AMAZON_ASSOCIATE_TAG || "candombledesm-20";

const MERCADO_LIVRE_TARGETS = [
  {
    label: "Celulares",
    category: "celular",
    department: "Celulares",
    url: "https://www.mercadolivre.com.br/ofertas?domain_id=MLB-CELLPHONES&container_id=MLB779535-1",
  },
  {
    label: "Notebooks",
    category: "notebook",
    department: "Notebooks",
    url: "https://www.mercadolivre.com.br/ofertas?domain_id=MLB-NOTEBOOKS&container_id=MLB779536-1",
  },
  {
    label: "Fones",
    category: "audio",
    department: "Áudio",
    url: "https://www.mercadolivre.com.br/ofertas?domain_id=MLB-HEADPHONES&container_id=MLB779538-1",
  },
  {
    label: "TVs",
    category: "tv",
    department: "TVs",
    url: "https://www.mercadolivre.com.br/ofertas?domain_id=MLB-TELEVISIONS&container_id=MLB779539-1",
  },
  {
    label: "Ferramentas",
    category: "ferramenta",
    department: "Ferramentas",
    url: "https://www.mercadolivre.com.br/ofertas?domain_id=MLB-TOOLS&container_id=MLB779540-1",
  },
  {
    label: "Smartwatches",
    category: "relogio",
    department: "Relógios",
    url: "https://www.mercadolivre.com.br/ofertas?domain_id=MLB-SMARTWATCHES&container_id=MLB779541-1",
  },
];

const AMAZON_QUERIES = [
  { query: "iphone", category: "celular", department: "Celulares" },
  { query: "samsung galaxy", category: "celular", department: "Celulares" },
  { query: "xiaomi smartphone", category: "celular", department: "Celulares" },
  { query: "notebook i5 16gb", category: "notebook", department: "Notebooks" },
  { query: "notebook lenovo", category: "notebook", department: "Notebooks" },
  { query: "notebook gamer", category: "notebook", department: "Notebooks" },
  { query: "monitor gamer 144hz", category: "monitor", department: "Monitores" },
  { query: "monitor gamer curvo", category: "monitor", department: "Monitores" },
  { query: "smart tv 55", category: "tv", department: "TVs" },
  { query: "tv samsung 50", category: "tv", department: "TVs" },
  { query: "fone bluetooth", category: "audio", department: "Áudio" },
  { query: "headset gamer", category: "audio", department: "Áudio" },
  { query: "roteador wifi 6", category: "rede", department: "Rede" },
  { query: "xiaomi be6500", category: "rede", department: "Rede" },
  { query: "tablet samsung", category: "tablet", department: "Tablets" },
  { query: "ipad", category: "tablet", department: "Tablets" },
  { query: "air fryer", category: "casa", department: "Casa" },
  { query: "aspirador wap", category: "casa", department: "Casa" },
  { query: "furadeira bosch", category: "ferramenta", department: "Ferramentas" },
  { query: "parafusadeira", category: "ferramenta", department: "Ferramentas" },
];

function cleanText(value = "") {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value = "") {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function parseMoney(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const text = cleanText(value).replace(/[^\d.,-]/g, "");
  if (!text) return 0;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function slug(value = "") {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function detectBrand(title = "") {
  const text = normalizeText(title);
  const brands = ["Apple", "Samsung", "Motorola", "Xiaomi", "Lenovo", "Dell", "Acer", "Asus", "LG", "AOC", "Philco", "TCL", "Sony", "TP-Link", "Tenda", "Bosch", "WAP", "Philips", "JBL", "Logitech", "GoPro"];
  return brands.find((brand) => text.includes(normalizeText(brand))) || "";
}

function inferProductType(category = "", title = "") {
  const text = normalizeText(`${category} ${title}`);
  if (/\b(furadeira|parafusadeira|serra|esmerilhadeira|martelete|solda|lixadeira|aspirador|roteador|notebook|monitor|smartphone|iphone|galaxy|tv)\b/.test(text)) return "principal";
  if (/\b(capa|case|pelicula|cabo|carregador|suporte|adaptador|refil|peca|peça|bateria|tela)\b/.test(text)) return "accessory";
  return "principal";
}

function parseJsonAfter(html, marker) {
  const start = html.indexOf(marker);
  if (start < 0) return null;
  const objStart = html.indexOf("{", start + marker.length);
  if (objStart < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = objStart; index < html.length; index += 1) {
    const char = html[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === "\"") inString = false;
      continue;
    }
    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(html.slice(objStart, index + 1));
      }
    }
  }
  return null;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": USER_AGENT,
      "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  const html = await response.text();
  return { status: response.status, url: response.url, html };
}

function extractMercadoLivrePrice(card) {
  const priceComponent = card.components?.find((component) => component.type === "price")?.price;
  return Number(priceComponent?.current_price?.value || 0) || 0;
}

function extractMercadoLivreOriginalPrice(card) {
  const priceComponent = card.components?.find((component) => component.type === "price")?.price;
  const values = priceComponent?.price_labels?.flatMap((label) => label.values || []) || [];
  const previous = values.find((value) => value?.price?.previous);
  return Number(previous?.price?.value || 0) || null;
}

function extractMercadoLivreInstallments(card) {
  const priceComponent = card.components?.find((component) => component.type === "price")?.price;
  const installments = priceComponent?.installments;
  if (!installments) return { available: false, source: "not_provided", confidence: 0 };
  const amount = installments.values?.find((value) => value.key === "price")?.price?.value || null;
  const countMatch = String(installments.text || "").match(/(\d+)x/i);
  const count = countMatch ? Number(countMatch[1]) : null;
  return {
    available: Boolean(count && amount),
    count,
    amount,
    total: count && amount ? Number((count * amount).toFixed(2)) : null,
    interestFree: Boolean(installments.no_interest),
    source: "public_offer_screener",
    confidence: 0.82,
  };
}

function normalizeMercadoLivreCard(item, target, checkedAt) {
  const card = item.card || {};
  const metadata = card.metadata || {};
  const title = cleanText(card.components?.find((component) => component.type === "title")?.title?.text || "");
  const price = extractMercadoLivrePrice(card);
  const productUrl = `https://${metadata.url || ""}${metadata.url_params || ""}${metadata.url_fragments || ""}`;
  const imageId = card.pictures?.pictures?.[0]?.id || "";
  const image = imageId ? `https://http2.mlstatic.com/D_NQ_NP_${imageId}-O.webp` : "";
  const itemId = String(metadata.id || "").trim();
  const productId = String(metadata.product_id || itemId).trim();
  const official = JSON.stringify(card.components || []).toLowerCase().includes("loja oficial");
  const productType = inferProductType(target.category, title);
  return {
    id: `screened-ml-${itemId}`,
    itemId,
    source: "verified_partner_offers",
    sourceLabel: "mercado_livre",
    sourceName: "mercado_livre",
    sourceType: "public_offer_screener",
    marketplace: "verified_partner_offers",
    title,
    displayTitle: title,
    brand: detectBrand(title),
    model: "",
    category: target.category,
    normalizedCategory: target.category,
    department: target.department,
    productType,
    isAccessory: productType === "accessory",
    dataMode: "real",
    condition: "new",
    seller: { name: "Mercado Livre" },
    availability: "Oferta rastreada",
    officialStore: official,
    price,
    originalPrice: extractMercadoLivreOriginalPrice(card),
    currency: "BRL",
    image,
    affiliateUrl: productUrl,
    productUrl,
    permalink: productUrl,
    installments: extractMercadoLivreInstallments(card),
    searchKeywords: [target.label, target.category, title, detectBrand(title)].filter(Boolean),
    verifiedAt: checkedAt,
    lastCheckedAt: checkedAt,
    linkValidation: {
      status: "direct_product",
      checkedAt,
      finalUrl: productUrl,
      method: "public_offer_screener",
      evidenceUrl: productUrl,
    },
  };
}

async function screenMercadoLivre(limit = 200) {
  const byId = new Map();
  const diagnostics = [];
  for (const target of MERCADO_LIVRE_TARGETS) {
    const checkedAt = new Date().toISOString();
    const { status, url, html } = await fetchHtml(target.url);
    const app = parseJsonAfter(html, "\"appProps\":");
    const items = app?.pageProps?.data?.items || [];
    let accepted = 0;
    for (const item of items) {
      const offer = normalizeMercadoLivreCard(item, target, checkedAt);
      if (!offer.itemId || !offer.title || !offer.price || !offer.permalink || !offer.image) continue;
      if (!byId.has(offer.itemId)) {
        byId.set(offer.itemId, offer);
        accepted += 1;
      }
      if (byId.size >= limit) break;
    }
    diagnostics.push({ source: "mercado_livre", label: target.label, status, url, received: items.length, accepted });
    if (byId.size >= limit) break;
  }
  return { products: [...byId.values()].slice(0, limit), diagnostics };
}

function extractAmazonCards(html) {
  return [...html.matchAll(/<div[^>]+data-component-type="s-search-result"[\s\S]*?(?=<div[^>]+data-component-type="s-search-result"|<\/body>)/g)].map((match) => match[0]);
}

function normalizeAmazonUrl(href = "", asin = "") {
  let decoded = cleanText(href).replace(/&amp;/g, "&");
  if (decoded.includes("/sspa/click")) {
    try {
      const parsed = new URL(decoded, "https://www.amazon.com.br");
      decoded = decodeURIComponent(parsed.searchParams.get("url") || decoded);
    } catch {
      decoded = `/dp/${asin}`;
    }
  }
  const direct = decoded.match(/\/(?:[^/\s]+\/)?dp\/([A-Z0-9]{10})/i)?.[0] || `/dp/${asin}`;
  const url = new URL(direct, "https://www.amazon.com.br");
  if (AMAZON_TAG && !url.searchParams.has("tag")) url.searchParams.set("tag", AMAZON_TAG);
  return url.toString();
}

function normalizeAmazonCard(card, target, checkedAt) {
  const asin = card.match(/data-asin="([A-Z0-9]{10})"/)?.[1] || "";
  const title = cleanText(card.match(/<h2[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/)?.[1] || card.match(/aria-label="([^"]+)"/)?.[1] || "");
  const price = parseMoney(card.match(/<span class="a-offscreen">\s*(R\$[^<]+)<\/span>/)?.[1] || "");
  const image = cleanText(card.match(/<img[^>]+class="[^"]*s-image[^"]*"[^>]+src="([^"]+)"/)?.[1] || "");
  const href = card.match(/href="([^"]*(?:\/dp\/|\/sspa\/click)[^"]*)"/)?.[1] || "";
  const productUrl = normalizeAmazonUrl(href, asin);
  const productType = inferProductType(target.category, title);
  return {
    id: `screened-amazon-${asin}`,
    asin,
    itemId: asin,
    source: "verified_partner_offers",
    sourceLabel: "amazon",
    sourceName: "amazon",
    sourceType: "public_search_screener",
    marketplace: "verified_partner_offers",
    title,
    displayTitle: title,
    brand: detectBrand(title),
    model: "",
    category: target.category,
    normalizedCategory: target.category,
    department: target.department,
    productType,
    isAccessory: productType === "accessory",
    dataMode: "real",
    condition: "new",
    seller: { name: "Amazon.com.br" },
    availability: "Oferta rastreada",
    officialStore: false,
    price,
    currency: "BRL",
    image,
    affiliateUrl: productUrl,
    productUrl,
    permalink: productUrl,
    installments: { available: false, source: "not_provided", confidence: 0 },
    searchKeywords: [target.query, target.category, title, detectBrand(title)].filter(Boolean),
    verifiedAt: checkedAt,
    lastCheckedAt: checkedAt,
    linkValidation: {
      status: "direct_product",
      checkedAt,
      finalUrl: productUrl,
      method: "public_search_screener",
      evidenceUrl: productUrl,
    },
  };
}

async function screenAmazon(limit = 200) {
  const byAsin = new Map();
  const diagnostics = [];
  const maxAcceptedPerQuery = Math.max(8, Math.ceil(limit / AMAZON_QUERIES.length) + 3);
  for (const target of AMAZON_QUERIES) {
    const checkedAt = new Date().toISOString();
    const searchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(target.query)}`;
    const { status, url, html } = await fetchHtml(searchUrl);
    const cards = extractAmazonCards(html);
    let accepted = 0;
    for (const card of cards) {
      const offer = normalizeAmazonCard(card, target, checkedAt);
      if (!offer.asin || !offer.title || !offer.price || !offer.permalink || !offer.image) continue;
      if (!byAsin.has(offer.asin)) {
        byAsin.set(offer.asin, offer);
        accepted += 1;
      }
      if (accepted >= maxAcceptedPerQuery) break;
    }
    diagnostics.push({ source: "amazon", label: target.query, status, url, received: cards.length, accepted });
  }
  return { products: [...byAsin.values()].slice(0, limit), diagnostics };
}

function writeGeneratedFile(products, diagnostics) {
  const outputPath = resolveProjectPath("src", "data", "screened-marketplace-products.generated.js");
  const content = [
    "// Generated by scripts/screen-marketplace-products.mjs. Do not edit manually.",
    `export const SCREENED_MARKETPLACE_PRODUCTS_GENERATED_AT = ${JSON.stringify(new Date().toISOString())};`,
    `export const SCREENED_MARKETPLACE_PRODUCTS_DIAGNOSTICS = ${JSON.stringify(diagnostics, null, 2)};`,
    `export const SCREENED_MARKETPLACE_PRODUCTS = ${JSON.stringify(products, null, 2)};`,
    "",
  ].join("\n");
  fs.writeFileSync(outputPath, content, "utf8");
}

function writeReport(products, diagnostics) {
  const bySource = Object.groupBy(products, (item) => item.sourceName);
  const byCategory = Object.groupBy(products, (item) => item.category);
  const lines = [
    "# Relatorio de inclusao screened Amazon e Mercado Livre",
    "",
    `Gerado em: ${new Date().toISOString()}`,
    "",
    `Total aceito: ${products.length}`,
    "",
    "## Por parceiro",
    "",
    ...Object.entries(bySource).map(([source, items]) => `- ${source}: ${items.length}`),
    "",
    "## Por categoria",
    "",
    ...Object.entries(byCategory).map(([category, items]) => `- ${category}: ${items.length}`),
    "",
    "## Diagnostico por alvo",
    "",
    ...diagnostics.map((item) => `- ${item.source} / ${item.label}: HTTP ${item.status}; recebidos ${item.received}; aceitos ${item.accepted}`),
    "",
    "## Observacao",
    "",
    "Produtos Amazon e Mercado Livre foram coletados por screener publico e marcados como sourceType public_search_screener/public_offer_screener. Isso nao torna as APIs oficiais operacionais.",
    "",
  ];
  fs.writeFileSync(resolveProjectPath("RELATORIO_INCLUSAO_SCREENED_AMAZON_MERCADO_LIVRE.md"), lines.join("\n"), "utf8");
}

const amazonLimit = Number(process.env.SCREEN_AMAZON_LIMIT || process.argv.find((arg) => arg.startsWith("--amazon="))?.split("=")[1] || 400);
const mercadoLivreLimit = Number(process.env.SCREEN_ML_LIMIT || process.argv.find((arg) => arg.startsWith("--ml="))?.split("=")[1] || 300);

const [amazon, mercadoLivre] = await Promise.all([
  screenAmazon(amazonLimit),
  screenMercadoLivre(mercadoLivreLimit),
]);

const products = [...amazon.products, ...mercadoLivre.products];
const diagnostics = [...amazon.diagnostics, ...mercadoLivre.diagnostics];

writeGeneratedFile(products, diagnostics);
writeReport(products, diagnostics);

console.log(JSON.stringify({
  ok: true,
  total: products.length,
  amazon: amazon.products.length,
  mercadoLivre: mercadoLivre.products.length,
  byCategory: Object.fromEntries(Object.entries(Object.groupBy(products, (item) => item.category)).map(([key, value]) => [key, value.length])),
}, null, 2));
