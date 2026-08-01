import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
const publicImageDir = path.join(rootDir, "public", "data", "telegram-affiliate-images");

function parseArgs(argv = []) {
  const args = { input: "", date: "", max: 80, dryRun: false };
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
    .trim()
    .toLowerCase();
}

function slugify(value = "") {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
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
  return String(html || "")
    .split(/(?=<div class="message default clearfix(?: joined)?")/g)
    .filter((chunk) => chunk.includes("pull_right date details"));
}

function extractTextBlock(rawMessage = "") {
  const match = rawMessage.match(/<div class="text">([\s\S]*?)<\/div>/);
  return cleanText(match?.[1] || rawMessage);
}

function extractMessageDate(rawMessage = "") {
  return decodeHtml(rawMessage.match(/<div class="pull_right date details" title="([^"]+)"/)?.[1] || "");
}

function extractLocalPhoto(rawMessage = "") {
  return rawMessage.match(/href="(photos\/[^"]+?\.jpg)"/)?.[1] || "";
}

function extractAffiliateLink(text = "") {
  const links = [...String(text || "").matchAll(/https?:\/\/(?:meli\.la|link\.amazon)\/[A-Za-z0-9_-]+/g)].map((match) => match[0]);
  return links.find((link) => !/B09yS44hb/i.test(link)) || "";
}

function sourceFromLink(link = "") {
  if (/meli\.la/i.test(link)) return ["mercado_livre", "Mercado Livre"];
  if (/link\.amazon/i.test(link)) return ["amazon", "Amazon"];
  return ["affiliate", "Afiliado"];
}

function extractTitle(text = "") {
  const lines = String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(âœ…|âž¡ï¸|ðŸ¤‘|ðŸ“Œ|ðŸŽ¥|ðŸ‘‰|ðŸŽŸ|âœï¸|âš ï¸|An[Ãºu]ncio|Pre[Ã§c]os sujeitos|Cupom|Assine|Cupons Ativos|ðŸ”¥\s*Cupons Ativos|ðŸ”¥\s*Saiu Cupom)/i.test(line))
    .filter((line) => !/(^De R\$|^R\$|sem juros|Ative aqui|An[Ã¡a]lise:|Prime 30 DIAS)/i.test(line));
  return (lines[0] || "")
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPrices(text = "") {
  const checked = [...String(text || "").matchAll(/âœ…\s*R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?|âœ…\s*R\$\s*\d+(?:,\d{2})?/g)]
    .map((match) => parseBrazilianPrice(match[0]))
    .filter((price) => price > 0);
  const all = [...String(text || "").matchAll(/R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?|R\$\s*\d+(?:,\d{2})?/g)]
    .map((match) => parseBrazilianPrice(match[0]))
    .filter((price) => price > 0);
  const original = parseBrazilianPrice(String(text || "").match(/De\s+R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?|De\s+R\$\s*\d+(?:,\d{2})?/i)?.[0] || "");
  return {
    price: checked[0] || all.find((price) => price !== original) || all[0] || 0,
    originalPrice: original || null,
    all,
  };
}

function extractCoupon(text = "") {
  const code = String(text || "").match(/Cupom:\s*([A-Z0-9_-]{3,})/i)?.[1]
    || String(text || "").match(/<code>\s*([A-Z0-9_-]{3,})\s*<\/code>/i)?.[1]
    || null;
  if (!code) return null;
  return code.toUpperCase();
}

function extractInstallments(text = "", price = 0) {
  const explicit = String(text || "").match(/(\d{1,2})x\s+de\s+R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/i);
  if (explicit) {
    const amount = parseBrazilianPrice(`R$ ${explicit[2]}`);
    return {
      available: true,
      count: Number(explicit[1]),
      amount,
      total: amount * Number(explicit[1]),
      interestFree: /sem juros/i.test(text),
      source: "telegram_affiliate_export",
      confidence: 0.7,
    };
  }
  const totalStyle = String(text || "").match(/R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)\s*(?:\(\+Frete\)\s*)?em\s+(\d{1,2})x\s+sem juros/i);
  if (totalStyle) {
    const total = parseBrazilianPrice(`R$ ${totalStyle[1]}`);
    const count = Number(totalStyle[2]);
    return {
      available: true,
      count,
      amount: Number((total / count).toFixed(2)),
      total,
      interestFree: true,
      source: "telegram_affiliate_export",
      confidence: 0.72,
    };
  }
  if (!price) return { available: false, source: "not_provided", confidence: 0 };
  return { available: false, source: "not_provided", confidence: 0 };
}

function guessCategory(title = "") {
  const text = normalizeText(title);
  if (/\b(carregador|power bank|cabo|adaptador|filtro de linha)\b/.test(text)) return ["acessorios", "Acessórios"];
  if (/\b(relogio|smartwatch|polar pacer)\b/.test(text)) return ["relogios", "Relógios"];
  if (/\b(playstation|dualsense|controle gamer|controle de celular|controle sem fio|nintendo|xbox|game)\b/.test(text)) return ["games", "Games"];
  if (/\b(smartphone|celular|iphone|galaxy|moto g|xiaomi|motorola)\b/.test(text)) return ["celular", "Celulares"];
  if (/\b(tv|qled|oled|televisao|smart tv|aiwa|hisense)\b/.test(text)) return ["tv", "TVs"];
  if (/\b(monitor|agon|hz|full hd|curvo)\b/.test(text)) return ["monitor", "Monitores"];
  if (/\b(mouse|teclado|webcam|fonte|gabinete|water cooler|cooler|ssd|memoria|impressora 3d|impressora)\b/.test(text)) return ["informatica", "Informática"];
  if (/\b(notebook|laptop|chromebook|macbook)\b/.test(text)) return ["notebook", "Notebooks"];
  if (/\b(roteador|wifi|wi-fi|mesh|tp-link|huawei|mercusys|deco|starlink)\b/.test(text)) return ["roteador", "Rede"];
  if (/\b(cadeira|fechadura|camera seguranca|camera de seguranca|projetor|air fryer|fritadeira|aspirador|ar condicionado|ar-condicionado|cooktop)\b/.test(text)) return ["casa", "Casa"];
  if (/\b(fone|soundcore|headset|caixa de som)\b/.test(text)) return ["audio", "Áudio"];
  return ["ofertas", "Ofertas"];
}

function isAccessoryTitle(title = "") {
  const normalized = normalizeText(title);
  if (/\b(cadeira|poltrona|banco)\b/.test(normalized) && /\b(suporte lombar|apoio para pes|apoio de braco|encosto)\b/.test(normalized)) {
    return false;
  }
  return /\b(capa|pelicula|película|cabo|carregador|adaptador|suporte|controle sem fio|controle de celular|dualsense|mouse|teclado|webcam|gabinete|fonte|water cooler)\b/i.test(title);
}
function buildCandidates(html = "", dateKey = "") {
  const mapped = extractMessages(html)
    .map((rawMessage) => {
      const messageDateTitle = extractMessageDate(rawMessage);
      const text = extractTextBlock(rawMessage);
      const link = extractAffiliateLink(text);
      const title = extractTitle(text);
      const prices = extractPrices(text);
      const couponCode = extractCoupon(text);
      return {
        rawMessage,
        messageDateTitle,
        dateKey: dateKeyFromTitle(messageDateTitle),
        checkedAt: formatIsoFromTelegramTitle(messageDateTitle),
        title,
        text,
        link,
        ...prices,
        couponCode,
        installments: extractInstallments(text, prices.price),
        localPhoto: extractLocalPhoto(rawMessage),
      };
    });
  if (process.env.DEBUG_TELEGRAM_IMPORT === "1") {
    const sameDate = mapped.filter((entry) => entry.dateKey === dateKey);
    console.error(JSON.stringify({
      messages: mapped.length,
      sameDate: sameDate.length,
      withLink: sameDate.filter((entry) => entry.link).length,
      withPrice: sameDate.filter((entry) => entry.price > 0).length,
      withTitle: sameDate.filter((entry) => entry.title).length,
      sample: sameDate.find((entry) => entry.link || entry.price > 0 || entry.title),
      productLikeSample: sameDate.find((entry) => entry.link && entry.price > 0),
    }, null, 2));
  }
  return mapped
    .filter((entry) => entry.dateKey === dateKey)
    .filter((entry) => entry.link && entry.price > 0 && entry.title)
    .filter((entry) => !/^cupons ativos|^saiu cupom/i.test(entry.title))
    .filter((entry) => /An[Ãºu]ncio|AnÃƒÂºncio|Pre[Ã§c]os sujeitos|PreÃƒÂ§os sujeitos|sem juros|Pix/i.test(entry.text));
}

function copyProductImage(candidate = {}, source = "", sourceProductId = "", inputDir = "") {
  if (!candidate.localPhoto) return "";
  const sourcePath = path.join(inputDir, candidate.localPhoto);
  if (!fs.existsSync(sourcePath)) return "";
  fs.mkdirSync(publicImageDir, { recursive: true });
  const extension = path.extname(sourcePath) || ".jpg";
  const fileName = `${source}-${sourceProductId}${extension}`.replace(/[^a-zA-Z0-9_.-]/g, "-");
  const targetPath = path.join(publicImageDir, fileName);
  fs.copyFileSync(sourcePath, targetPath);
  return `/data/telegram-affiliate-images/${fileName}`;
}

function normalizeProduct(candidate = {}, inputDir = "") {
  const [source, sourceDisplayName] = sourceFromLink(candidate.link);
  const sourceProductId = candidate.link.split("/").pop();
  const [category, department] = guessCategory(candidate.title);
  const image = copyProductImage(candidate, source, sourceProductId, inputDir);
  const now = new Date().toISOString();
  const accessory = isAccessoryTitle(candidate.title);
  return {
    id: `telegram-${source}-${sourceProductId}`,
    externalId: sourceProductId,
    sourceProductId,
    sku: sourceProductId,
    title: candidate.title,
    displayTitle: candidate.title,
    originalTitle: candidate.title,
    category,
    normalizedCategory: category,
    department,
    brand: "",
    model: candidate.title,
    productType: accessory ? "accessory" : "principal",
    isAccessory: accessory,
    price: candidate.price,
    cashPrice: candidate.price,
    originalPrice: candidate.originalPrice,
    currency: "BRL",
    image,
    thumbnail: image,
    affiliateUrl: candidate.link,
    productUrl: candidate.link,
    permalink: candidate.link,
    url: candidate.link,
    source,
    sourceName: source,
    sourceLabel: source,
    sourceDisplayName,
    marketplace: source,
    sourceType: "telegram_affiliate_offer",
    catalogOrigin: "telegram_affiliate_export",
    dataMode: "real",
    active: true,
    hidden: false,
    availability: "Oferta capturada do canal de afiliados; confirme preço e estoque na loja.",
    condition: "new",
    coupon: candidate.couponCode ? {
      code: candidate.couponCode,
      source: "telegram_affiliate_export",
      status: "unverified",
      verifiedAt: null,
    } : null,
    installments: candidate.installments,
    frete: /\(\+Frete\)|\+Frete/i.test(candidate.text) ? "Frete não incluso" : null,
    shipping: {
      free: /frete gr[aÃ¡]tis/i.test(candidate.text),
      price: null,
      source: "telegram_affiliate_export",
    },
    qualityScore: image ? 66 : 58,
    sourceQualityScore: 60,
    classificationMethod: "telegram_affiliate_export",
    classificationConfidence: 0.7,
    classificationWarnings: [
      "Preço veio do Telegram; confirme na loja antes de comprar.",
      ...(candidate.couponCode ? ["Cupom capturado, mas não aplicado ao preço principal sem revalidação."] : []),
      ...(!image ? ["Imagem nao encontrada no export do Telegram."] : []),
    ],
    searchKeywords: [
      candidate.title,
      category,
      department,
      sourceDisplayName,
      sourceProductId,
      candidate.couponCode,
    ].filter(Boolean),
    importedAt: now,
    verifiedAt: candidate.checkedAt || now,
    lastCheckedAt: now,
    intelligence: {
      department,
      category,
      subcategory: category,
      brand: "",
      model: candidate.title,
      productType: accessory ? "accessory" : "principal",
      isAccessory: accessory,
      searchKeywords: [
        candidate.title,
        category,
        department,
        sourceDisplayName,
        sourceProductId,
        candidate.couponCode,
      ].filter(Boolean),
      compatibility: [],
      qualityScore: image ? 66 : 58,
      classificationMethod: "telegram_affiliate_export",
      classificationConfidence: 0.7,
      classificationWarnings: [
        "Preço veio do Telegram; confirme na loja antes de comprar.",
        ...(candidate.couponCode ? ["Cupom capturado, mas não aplicado ao preço principal sem revalidação."] : []),
        ...(!image ? ["Imagem nao encontrada no export do Telegram."] : []),
      ],
    },
    linkValidation: {
      status: "affiliate_shortlink",
      checkedAt: now,
      finalUrl: candidate.link,
      method: "telegram_affiliate_export",
      evidenceUrl: candidate.link,
    },
    sourceEvidence: {
      telegramDate: candidate.messageDateTitle,
      telegramPhoto: candidate.localPhoto || null,
      titleSlug: slugify(candidate.title),
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
  console.error("Uso: node scripts/import-telegram-affiliate-offers.mjs --input <messages.html> [--date DD.MM.YYYY]");
  process.exit(1);
}

const inputPath = path.isAbsolute(args.input) ? args.input : path.resolve(rootDir, args.input);
const inputDir = path.dirname(inputPath);
const html = fs.readFileSync(inputPath, "utf8");
const importDateKey = args.date || todayTelegramDateKey();
const candidates = buildCandidates(html, importDateKey).slice(0, Number.isFinite(args.max) ? args.max : 80);
const uniqueByLink = new Map();
for (const candidate of candidates) {
  const key = candidate.link;
  const previous = uniqueByLink.get(key);
  if (!previous || candidate.price < previous.price) uniqueByLink.set(key, candidate);
}
const uniqueProducts = [...uniqueByLink.values()].map((candidate) => normalizeProduct(candidate, inputDir));

const report = {
  generatedAt: new Date().toISOString(),
  input: inputPath,
  date: importDateKey,
  rawCandidates: candidates.length,
  accepted: uniqueProducts.length,
  bySource: uniqueProducts.reduce((acc, product) => {
    acc[product.source] = (acc[product.source] || 0) + 1;
    return acc;
  }, {}),
  byCategory: uniqueProducts.reduce((acc, product) => {
    acc[product.normalizedCategory] = (acc[product.normalizedCategory] || 0) + 1;
    return acc;
  }, {}),
  products: uniqueProducts.map((product) => ({
    title: product.title,
    source: product.sourceDisplayName,
    price: product.price,
    category: product.normalizedCategory,
    link: product.permalink,
    image: product.image,
  })),
};

if (!args.dryRun && uniqueProducts.length > 0) {
  for (const seedPath of seedPaths) {
    const currentProducts = readSeedProducts(seedPath);
    const baseProducts = currentProducts.filter((product) => product.catalogOrigin !== "telegram_affiliate_export");
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
      removedPreviousTelegramAffiliate: currentProducts.length - baseProducts.length,
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
} else if (!args.dryRun) {
  report.noop = true;
  report.reason = "Nenhum produto com preco, link afiliado e titulo foi confirmado; seeds preservadas.";
}

const reportPath = path.join(rootDir, "RELATORIO_IMPORT_TELEGRAM_AFILIADOS.md");
fs.writeFileSync(reportPath, [
  "# Importação Telegram Afiliados",
  "",
  `Gerado em: ${report.generatedAt}`,
  `Arquivo: ${report.input}`,
  `Data importada: ${report.date}`,
  "",
  `Candidatos: ${report.rawCandidates}`,
  `Produtos aceitos: ${report.accepted}`,
  "",
  "## Por fonte",
  "",
  ...Object.entries(report.bySource).map(([source, count]) => `- ${source}: ${count}`),
  "",
  "## Por categoria",
  "",
  ...Object.entries(report.byCategory).map(([category, count]) => `- ${category}: ${count}`),
  "",
  "## Produtos",
  "",
  ...report.products.map((product) => `- ${product.source} | R$ ${product.price.toFixed(2)} | ${product.title} | ${product.link}`),
  "",
  "## Observações",
  "",
  "- Preços vieram do Telegram e devem ser confirmados na loja.",
  "- Cupons capturados não foram aplicados ao preço principal sem validação por produto.",
  "- Links de campanha sem produto individual foram ignorados.",
].join("\n"));

console.log(JSON.stringify(report, null, 2));


