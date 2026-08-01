import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_STORE_SLUG = process.env.MAGALU_AFFILIATE_STORE_SLUG || "magazineheroisderessaca";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36";
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

function parseArgs(argv = []) {
  const args = {
    input: "",
    date: "",
    max: 60,
    dryRun: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--input") {
      args.input = argv[index + 1] || "";
      index += 1;
    } else if (value === "--date") {
      args.date = argv[index + 1] || "";
      index += 1;
    } else if (value === "--max") {
      args.max = Number(argv[index + 1] || args.max);
      index += 1;
    } else if (value === "--dry-run") {
      args.dryRun = true;
    }
  }
  return args;
}

function decodeHtml(value = "") {
  return String(value || "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(value = "") {
  return decodeHtml(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseBrazilianPrice(value = "") {
  const match = String(value || "").match(/R\$\s*(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{2}))?/i);
  if (!match) return 0;
  const whole = match[1].replace(/\./g, "");
  const cents = match[2] || "00";
  const parsed = Number(`${whole}.${cents}`);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatIsoFromTelegramTitle(value = "") {
  const match = String(value || "").match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, dd, mm, yyyy, hour, minute, second] = match;
  return `${yyyy}-${mm}-${dd}T${hour}:${minute}:${second}-03:00`;
}

function dateKeyFromTitle(value = "") {
  const match = String(value || "").match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return match ? match[0] : "";
}

function todayTelegramDateKey(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return formatter.format(now).replace(/\//g, ".");
}

function extractMessages(html = "") {
  return [...String(html).matchAll(/<div class="message default clearfix"[\s\S]*?(?=<div class="message |<\/div>\s*<\/div>\s*<\/div>\s*<\/body>)/g)]
    .map((match) => match[0]);
}

function extractTextBlock(rawMessage = "") {
  const match = rawMessage.match(/<div class="text">([\s\S]*?)<\/div>/);
  return cleanText(match?.[1] || rawMessage);
}

function extractMessageDate(rawMessage = "") {
  return decodeHtml(rawMessage.match(/<div class="pull_right date details" title="([^"]+)"/)?.[1] || "");
}

function extractLocalPhotos(rawMessage = "") {
  return [...rawMessage.matchAll(/href="(photos\/[^"]+)"/g)].map((match) => match[1]);
}

function extractCodes(text = "") {
  const matches = [...String(text || "").matchAll(/C[oó]digo:\s*([A-Za-z0-9\s]+)/gi)];
  const codes = [];
  for (const match of matches) {
    const raw = String(match[1] || "")
      .split(/\n|🚛|🔍|🏷|Por |A partir|ou |\(/i)[0]
      .trim();
    for (const token of raw.split(/\s+/)) {
      const candidate = token.replace(/[^A-Za-z0-9]/g, "");
      if (candidate.length >= 6 && candidate.length <= 16) codes.push(candidate);
    }
  }
  return [...new Set(codes)];
}

function extractCoupon(text = "") {
  const match = String(text || "").match(/(?:Cupom|Use o cupom):\s*([A-Z0-9_-]{3,})/i);
  return match ? match[1].trim().toUpperCase() : null;
}

function extractInstallments(text = "") {
  const match = String(text || "").match(/(?:ou\s+|em\s+)?(\d{1,2})x\s+de\s+R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/i);
  if (!match) return { available: false, source: "not_provided", confidence: 0 };
  return {
    available: true,
    count: Number(match[1]),
    amount: parseBrazilianPrice(`R$ ${match[2]}`),
    interestFree: /sem juros/i.test(text),
    source: "telegram_magalu_export",
    confidence: 0.78,
  };
}

function guessCategory(title = "") {
  const text = normalizeText(title);
  if (/\b(smartphone|celular|iphone|galaxy|moto g|xiaomi)\b/.test(text)) return ["celular", "Celulares"];
  if (/\b(tv|qled|oled|televisao|televisão)\b/.test(text)) return ["tv", "TVs"];
  if (/\b(notebook|laptop|chromebook)\b/.test(text)) return ["notebook", "Notebooks"];
  if (/\b(impressora|ecotank|epson|hp|canon|brother)\b/.test(text)) return ["informatica", "Informática"];
  if (/\b(secador|escova|chapinha|colonia|colônia|creatina|tenis|tênis|bolsa|camisa|tamanco|perfume|parfum|gaultier|coffret|creme corporal)\b/.test(text)) return ["beleza_moda", "Moda e Beleza"];
  if (/\b(sofa|sofá|mesa|cadeira|cozinha|air fryer|fritadeira|mala|colchao|colchão|mantinha|cobertor|guarda roupa|madesa|balanca|balança)\b/.test(text)) return ["casa", "Casa"];
  if (/\b(nintendo|switch|playstation|xbox|controle)\b/.test(text)) return ["games", "Games"];
  if (/\b(halter|treino|bike|esteira|funcional)\b/.test(text)) return ["esporte", "Esporte"];
  return ["ofertas", "Ofertas"];
}

function extractTitle(text = "") {
  const lines = String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(APROVEIT|OFERTA|💙|🚨|💥|📱|9% de COMISS|CONVITE|BORA|Status:|Mais vendidos:)/i.test(line))
    .filter((line) => !/(Cupom:|Use o cupom:|A partir de R\$|Por apenas R\$|Por R\$|C[oó]digo:|Frete gr[aá]tis|Consulte|sem juros|off para compras)/i.test(line));
  const first = lines[0] || "";
  return first
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildRawCandidates(html = "", dateKey = "") {
  return extractMessages(html)
    .map((rawMessage) => {
      const messageDateTitle = extractMessageDate(rawMessage);
      const text = extractTextBlock(rawMessage);
      const codes = extractCodes(text);
      const prices = [...text.matchAll(/R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?|R\$\s*\d+(?:,\d{2})?/g)].map((match) => match[0]);
      return {
        messageDateTitle,
        dateKey: dateKeyFromTitle(messageDateTitle),
        checkedAt: formatIsoFromTelegramTitle(messageDateTitle),
        title: extractTitle(text),
        text,
        codes,
        price: parseBrazilianPrice(prices.find((price) => parseBrazilianPrice(price) > 0) || ""),
        installments: extractInstallments(text),
        couponCode: extractCoupon(text),
        localPhotos: extractLocalPhotos(rawMessage),
      };
    })
    .filter((entry) => entry.dateKey === dateKey)
    .filter((entry) => entry.price > 0 && entry.title && entry.codes.length > 0)
    .filter((entry) => !/mais vendidos/i.test(entry.text) || entry.codes.length <= 4);
}

async function resolveMagaluProduct(code = "") {
  const inputUrl = `https://www.magazinevoce.com.br/${DEFAULT_STORE_SLUG}/p/${encodeURIComponent(code)}/`;
  const response = await fetch(inputUrl, {
    redirect: "follow",
    headers: { "user-agent": USER_AGENT },
  });
  const html = await response.text();
  const finalUrl = response.url || inputUrl;
  const image = html.match(/property="og:image"\s+content="([^"]+)"/)?.[1]
    || html.match(/content="([^"]+)"\s+property="og:image"/)?.[1]
    || "";
  const title = cleanText(html.match(/property="og:title"\s+content="([^"]+)"/)?.[1]
    || html.match(/content="([^"]+)"\s+property="og:title"/)?.[1]
    || "");
  const isDirectProduct = response.status >= 200
    && response.status < 400
    && /\/p\/[^/]+\/[a-z0-9]+\/[a-z0-9]+\/?/i.test(finalUrl)
    && Boolean(image);
  return {
    ok: isDirectProduct,
    status: response.status,
    inputUrl,
    finalUrl,
    image,
    pageTitle: title,
  };
}

function slugify(value = "") {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function titleFromMagaluUrl(url = "") {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    const productSlug = segments[1] || "";
    return productSlug
      .split("-")
      .filter(Boolean)
      .map((part) => part.length <= 3 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
      .trim();
  } catch {
    return "";
  }
}

function isGenericTelegramTitle(value = "") {
  return /^(black app|isso aqui|aproveite|oferta|bora|status|cupom)/i.test(String(value || "").trim());
}

function normalizeProduct(candidate = {}, code = "", validation = {}) {
  const urlTitle = titleFromMagaluUrl(validation.finalUrl);
  const title = isGenericTelegramTitle(candidate.title)
    ? (urlTitle || validation.pageTitle || candidate.title)
    : (candidate.title || urlTitle || validation.pageTitle || `Produto Magalu ${code}`);
  const [category, department] = guessCategory(title);
  const now = new Date().toISOString();
  return {
    id: `telegram-magalu-${code}`,
    externalId: code,
    sourceProductId: code,
    sku: code,
    title,
    displayTitle: title,
    originalTitle: title,
    category,
    normalizedCategory: category,
    department,
    brand: "",
    model: title,
    productType: "principal",
    isAccessory: false,
    price: candidate.price,
    cashPrice: candidate.price,
    currency: "BRL",
    image: validation.image,
    thumbnail: validation.image,
    affiliateUrl: validation.finalUrl,
    productUrl: validation.finalUrl,
    permalink: validation.finalUrl,
    url: validation.finalUrl,
    source: "magalu",
    sourceName: "magalu",
    sourceLabel: "magalu",
    sourceDisplayName: "Magalu",
    marketplace: "magalu",
    sourceType: "telegram_affiliate_offer",
    catalogOrigin: "telegram_magalu_export",
    dataMode: "real",
    active: true,
    hidden: false,
    availability: "Oferta capturada do canal de afiliados; confirme preço e estoque na loja.",
    condition: "new",
    coupon: candidate.couponCode ? {
      code: candidate.couponCode,
      source: "telegram_magalu_export",
      status: "unverified",
      verifiedAt: null,
    } : null,
    installments: candidate.installments,
    frete: /frete gr[aá]tis/i.test(candidate.text) ? "Frete grátis em regiões selecionadas" : null,
    shipping: {
      free: /frete gr[aá]tis/i.test(candidate.text),
      price: null,
      source: "telegram_magalu_export",
    },
    qualityScore: 66,
    sourceQualityScore: 62,
    classificationMethod: "telegram_magalu_export",
    classificationConfidence: 0.72,
    classificationWarnings: [
      "Preço veio do Telegram; confirme no Magalu antes de comprar.",
      ...(candidate.couponCode ? ["Cupom capturado, mas não aplicado ao preço principal sem revalidação."] : []),
    ],
    searchKeywords: [
      title,
      category,
      department,
      "magalu",
      "magazine voce",
      code,
    ].filter(Boolean),
    importedAt: now,
    verifiedAt: candidate.checkedAt || now,
    lastCheckedAt: now,
    linkValidation: {
      status: "direct_product",
      checkedAt: now,
      finalUrl: validation.finalUrl,
      method: "telegram_magalu_export",
      evidenceUrl: validation.inputUrl,
    },
    sourceEvidence: {
      telegramDate: candidate.messageDateTitle,
      telegramPhoto: candidate.localPhotos?.[0] || null,
      code,
      titleSlug: slugify(title),
    },
  };
}

function readSeedProducts(seedPath) {
  try {
    return JSON.parse(fs.readFileSync(seedPath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return [];
  }
}

function normalizeSourceForMetadata(product = {}) {
  const source = normalizeText(product.sourceName || product.sourceLabel || product.source || product.marketplace || "sem_fonte")
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
  if (source.includes("info_store")) return "infostore";
  if (source.includes("saldao")) return "saldao_informatica";
  if (source.includes("mercado_livre") || source.includes("mercadolivre")) return "mercado_livre";
  if (source.includes("amazon")) return "amazon";
  if (source.includes("magalu") || source.includes("magazine")) return "magalu";
  return source;
}

function metadataLabelForSource(source) {
  if (source === "saldao_informatica") return "Saldão da Informática";
  if (source === "infostore") return "Info Store - Informática";
  if (source === "amazon") return "Amazon";
  if (source === "mercado_livre") return "Mercado Livre";
  if (source === "magalu") return "Magalu";
  return source;
}

function updateMetadata(products = []) {
  const previousMetadata = fs.existsSync(metadataJsonPaths[0])
    ? JSON.parse(fs.readFileSync(metadataJsonPaths[0], "utf8").replace(/^\uFEFF/, ""))
    : {};
  const hiddenCount = Number(previousMetadata.hiddenCount || 0);
  const publishedBySource = products.reduce((acc, product) => {
    const source = normalizeSourceForMetadata(product);
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});
  const historicalHiddenBySource = new Map((previousMetadata.sources || []).map((entry) => [
    normalizeSourceForMetadata(entry),
    Number(entry.hiddenCount || 0),
  ]));
  const orderedSources = ["saldao_informatica", "infostore", "amazon", "mercado_livre", "magalu"];
  const sources = orderedSources
    .filter((source) => (publishedBySource[source] || 0) > 0 || historicalHiddenBySource.has(source))
    .map((source) => {
      const publishedCount = Number(publishedBySource[source] || 0);
      const sourceHidden = Number(historicalHiddenBySource.get(source) || 0);
      return {
        source,
        label: metadataLabelForSource(source),
        analyzedCount: publishedCount + sourceHidden,
        publishedCount,
        hiddenCount: sourceHidden,
        rejectedReasons: [],
      };
    });
  const metadata = {
    ...previousMetadata,
    refreshedAt: new Date().toISOString(),
    fresh: true,
    analyzedCount: products.length + hiddenCount,
    publishedCount: products.length,
    hiddenCount,
    activeSourceCounts: sources.map(({ source, label, analyzedCount, publishedCount, hiddenCount: sourceHidden }) => ({
      source,
      label,
      analyzedCount,
      publishedCount,
      hiddenCount: sourceHidden,
    })),
    sources,
  };
  for (const metadataPath of metadataJsonPaths) {
    fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  }
  fs.writeFileSync(metadataModulePath, `const catalogRefreshMetadata = ${JSON.stringify(metadata, null, 2)};\n\nexport default catalogRefreshMetadata;\n`);
  return metadata;
}

const args = parseArgs(process.argv.slice(2));
if (!args.input) {
  console.error("Uso: node scripts/import-telegram-magalu-export.mjs --input <messages.html> [--date DD.MM.YYYY]");
  process.exit(1);
}

const inputPath = path.isAbsolute(args.input) ? args.input : path.resolve(rootDir, args.input);
const html = fs.readFileSync(inputPath, "utf8");
const importDateKey = args.date || todayTelegramDateKey();
const candidates = buildRawCandidates(html, importDateKey).slice(0, Number.isFinite(args.max) ? args.max : 60);
const acceptedProducts = [];
const rejected = [];

for (const candidate of candidates) {
  for (const code of candidate.codes.slice(0, 3)) {
    try {
      const validation = await resolveMagaluProduct(code);
      if (!validation.ok) {
        rejected.push({ code, title: candidate.title, reason: "link_not_confirmed", status: validation.status });
        continue;
      }
      acceptedProducts.push(normalizeProduct(candidate, code, validation));
    } catch (error) {
      rejected.push({ code, title: candidate.title, reason: error?.message || "validation_failed" });
    }
  }
}

const uniqueProductsByCode = new Map();
for (const product of acceptedProducts) {
  const key = `${slugify(product.title)}|${product.normalizedCategory}`;
  const previous = uniqueProductsByCode.get(key);
  if (!previous || Number(product.price || 0) < Number(previous.price || Infinity)) {
    uniqueProductsByCode.set(key, product);
  }
}
const uniqueProducts = [...uniqueProductsByCode.values()];
const report = {
  generatedAt: new Date().toISOString(),
  input: inputPath,
  date: importDateKey,
  rawCandidates: candidates.length,
  accepted: uniqueProducts.length,
  rejected: rejected.length,
  byCategory: uniqueProducts.reduce((acc, product) => {
    acc[product.normalizedCategory] = (acc[product.normalizedCategory] || 0) + 1;
    return acc;
  }, {}),
  products: uniqueProducts.map((product) => ({
    title: product.title,
    code: product.sourceProductId,
    price: product.price,
    category: product.normalizedCategory,
    link: product.permalink,
  })),
  rejected,
};

if (!args.dryRun && uniqueProducts.length === 0) {
  report.noop = true;
  report.reason = "Nenhum produto Magalu com preco e link direto foi confirmado; seeds preservadas sem alteracao.";
}

if (!args.dryRun) {
  if (uniqueProducts.length > 0) {
    for (const seedPath of seedPaths) {
      const currentProducts = readSeedProducts(seedPath);
      const baseProducts = currentProducts.filter((product) => product.catalogOrigin !== "telegram_magalu_export");
      const existingIds = new Set(baseProducts.map((product, index) => String(product.id || product.externalId || `existing-${index}`)));
      const nextProducts = [...baseProducts];
      for (const product of uniqueProducts) {
        if (existingIds.has(product.id)) continue;
        existingIds.add(product.id);
        nextProducts.push(product);
      }
      fs.writeFileSync(seedPath, `${JSON.stringify(nextProducts, null, 2)}\n`);
      report[seedPath.replace(rootDir + path.sep, "").replace(/\\/g, "/")] = {
        before: currentProducts.length,
        removedPreviousTelegramMagalu: currentProducts.length - baseProducts.length,
        added: uniqueProducts.length,
        after: nextProducts.length,
      };
    }
    const metadata = updateMetadata(readSeedProducts(seedPaths[0]));
    report.metadata = {
      publishedCount: metadata.publishedCount,
      analyzedCount: metadata.analyzedCount,
      sources: metadata.sources.map(({ source, publishedCount }) => ({ source, publishedCount })),
    };
  }
}

const reportPath = path.join(rootDir, "RELATORIO_IMPORT_TELEGRAM_MAGALU.md");
fs.writeFileSync(reportPath, [
  "# Importação Telegram Magalu",
  "",
  `Gerado em: ${report.generatedAt}`,
  `Arquivo: ${report.input}`,
  `Data filtrada: ${report.date}`,
  "",
  `Candidatos com preço e código: ${report.rawCandidates}`,
  `Produtos aceitos com link direto: ${report.accepted}`,
  `Rejeitados: ${report.rejected}`,
  "",
  "## Categorias",
  "",
  ...Object.entries(report.byCategory).map(([category, count]) => `- ${category}: ${count}`),
  "",
  "## Produtos aceitos",
  "",
  ...report.products.map((product) => `- ${product.title} | R$ ${product.price} | ${product.category} | ${product.link}`),
  "",
  "## Rejeitados",
  "",
  ...(report.rejected.length ? report.rejected.map((item) => `- ${item.code} | ${item.title} | ${item.reason}`) : ["Nenhum."]),
  "",
].join("\n"));

console.log(JSON.stringify(report, null, 2));
