import fs from "node:fs";
import path from "node:path";
import { resolveProjectPath } from "../src/runtime/project-root.js";

const AMAZON_TAG = process.env.AMAZON_ASSOCIATE_TAG || "candombledesm-20";
const DEFAULT_SOURCE_URL = "https://www.amazon.com.br/gp/bestsellers?&linkCode=ll2&tag=candombledesm-20&linkId=23c060689b1aed809c2085551d458441&ref_=as_li_ss_tl";
const DEFAULT_HTML_PATH = resolveProjectPath(".tmp-amazon-intake", "bestsellers.html");

function getCliValue(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

const SOURCE_URL = getCliValue("url") || DEFAULT_SOURCE_URL;
const LIMIT = Math.max(1, Number(getCliValue("limit") || 80));

function cleanText(value = "") {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;|\u00a0/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value = "") {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function parseMoney(value = "") {
  const match = cleanText(value).match(/R\$\s*([0-9.]+,\d{2})/);
  if (!match) return 0;
  const parsed = Number(match[1].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function slug(value = "") {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}

function detectBrand(title = "") {
  const text = normalizeText(title);
  const brands = [
    "Apple",
    "Samsung",
    "Motorola",
    "Xiaomi",
    "Lenovo",
    "Dell",
    "Acer",
    "Asus",
    "LG",
    "AOC",
    "Philco",
    "TCL",
    "Sony",
    "TP-Link",
    "Tenda",
    "Bosch",
    "WAP",
    "Philips",
    "JBL",
    "Logitech",
    "GoPro",
    "BIC",
    "Elgin",
    "Mattel",
    "Buba",
    "Insider",
    "Carter",
  ];
  return brands.find((brand) => text.includes(normalizeText(brand))) || "";
}

function inferCategory(title = "") {
  const text = normalizeText(title);
  if (/\b(livro|box|romance|trilogia|edicao|quadrinhos|manga|vade mecum|shakespeare|orwell|duna|hobbit|camus|metamorfose|neuroanatomia|fisiologia)\b/.test(text)) return { category: "livro", department: "Livros" };
  if (/\b(iphone|smartphone|celular|galaxy|redmi|moto g|xiaomi)\b/.test(text)) return { category: "celular", department: "Celulares" };
  if (/\b(notebook|laptop|macbook|chromebook)\b/.test(text)) return { category: "notebook", department: "Notebooks" };
  if (/\b(monitor|144hz|240hz|ultrawide)\b/.test(text)) return { category: "monitor", department: "Monitores" };
  if (/\b(tv|smart tv|televisao|oled|qled)\b/.test(text)) return { category: "tv", department: "TVs" };
  if (/\b(fone|headset|headphone|earbud|earbuds|cancelamento de ruido|caixa de som|soundbar)\b/.test(text)) return { category: "audio", department: "Audio" };
  if (/\b(tablet|ipad|kindle)\b/.test(text)) return { category: "tablet", department: "Tablets" };
  if (/\b(roteador|wifi|wi-fi|switch|mesh)\b/.test(text)) return { category: "rede", department: "Rede" };
  if (/\b(furadeira|parafusadeira|serra|lixadeira|martelete|ferramenta)\b/.test(text)) return { category: "ferramenta", department: "Ferramentas" };
  if (/\b(cadeira|banqueta|cama|mesa portatil|tomada|extensao|fita dupla face|lanterna|air fryer|fritadeira|aspirador|mop|panela|liquidificador|cafeteira|cozinha|copo|garrafa|lavadora|desobstruidora)\b/.test(text)) return { category: "casa", department: "Casa" };
  if (/\b(camisa|camiseta|camisetas|body|meia|meias|chinelo|tenis|sapato|calca|bermuda|vestido|mochila|moda)\b/.test(text)) return { category: "moda", department: "Moda" };
  if (/\b(bike|bicicleta|bola|faixa elastica|pilates|yoga|academia|fitness|capacete)\b/.test(text)) return { category: "esporte", department: "Esporte" };
  if (/\b(uno|jogo|brinquedo|massa para modelar|bicicleta de equilibrio|lapis de cor|chocalho|mordedor)\b/.test(text)) return { category: "presente", department: "Presentes" };
  return { category: "achadinho", department: "Achadinhos" };
}

function detectCampaignHook(title = "") {
  const text = normalizeText(title);
  if (/\b(air fryer|fritadeira)\b/.test(text)) {
    return { segment: "air_fryer", storyHook: "3 coisas que me fizeram usar menos oleo." };
  }
  if (/\b(aspirador|robo aspirador|aspirador robo)\b/.test(text)) {
    return { segment: "aspirador", storyHook: "Como parei de varrer a casa todos os dias." };
  }
  if (/\b(mop|mop spray|spray mop)\b/.test(text)) {
    return { segment: "mop", storyHook: "O item que me fez limpar a casa em menos de 15 minutos." };
  }
  if (/\b(fone|headphone|headset|earbud|earbuds|cancelamento de ruido|anc)\b/.test(text)) {
    return { segment: "fone", storyHook: "O acessorio que mudou meu jeito de trabalhar em casa." };
  }
  return null;
}

function offerPriority(offer) {
  const text = normalizeText(`${offer.title} ${offer.category} ${offer.department}`);
  let score = 0;
  if (/\b(air fryer|fritadeira)\b/.test(text)) score += 120;
  if (/\b(aspirador|robo aspirador|aspirador robo)\b/.test(text)) score += 115;
  if (/\b(mop|mop spray|spray mop)\b/.test(text)) score += 110;
  if (/\b(fone|headphone|headset|earbud|earbuds|cancelamento de ruido|anc)\b/.test(text)) score += 105;
  if (/\b(iphone|smartphone|celular|galaxy|redmi|moto g|xiaomi)\b/.test(text)) score += 95;
  if (/\b(notebook|laptop|macbook|monitor|144hz|240hz|tv|smart tv|oled|qled)\b/.test(text)) score += 85;
  if (/\b(roteador|wifi|wi-fi|mesh|switch)\b/.test(text)) score += 80;
  if (/\b(cozinha|casa|panela|cafeteira|liquidificador|lavadora|organizador)\b/.test(text)) score += 70;
  if (offer.category === "livro") score -= 80;
  if (offer.category === "moda") score -= 30;
  if (offer.category === "achadinho") score -= 20;
  if (offer.price >= 80 && offer.price <= 5000) score += 10;
  return score;
}

function isAccessoryOrPart(title = "") {
  const text = normalizeText(title);
  if (/\b(capa|case|pelicula|vidro|carregador|cabo|adaptador|refil|peca|peça|bateria cr|cr2032|tela reposicao|controle remoto)\b/.test(text)) return true;
  if (/\b(mochila|bolsa|suporte|base|cooler)\b/.test(text) && /\b(notebook|macbook|celular|smartphone|monitor)\b/.test(text)) return true;
  return /\bsuporte para (notebook|macbook|celular|smartphone|monitor)\b/.test(text)
    || /\bmesa portatil para notebook\b/.test(text);
}

function extractChunks(html = "") {
  const bestsellerChunks = [...html.matchAll(/<div data-asin="([A-Z0-9]{10})">([\s\S]*?)(?=<\/li>|<li aria-roledescription="slide"|<div data-asin="[A-Z0-9]{10}")/g)]
    .map((match) => ({ asin: match[1], html: match[0] }));
  if (bestsellerChunks.length) return bestsellerChunks;

  return [...html.matchAll(/<li[^>]*class="[^"]*dcl-carousel-element[^"]*"[\s\S]*?(?=<li[^>]*class="[^"]*dcl-carousel-element|<\/ol>)/g)]
    .map((match) => {
      const chunkHtml = match[0];
      const asin =
        chunkHtml.match(/data-csa-c-item-id="amzn1\.asin\.([A-Z0-9]{10})/i)?.[1]
        || chunkHtml.match(/\/(?:[^/\s"]+\/)?dp\/([A-Z0-9]{10})/i)?.[1]
        || "";
      return asin ? { asin, html: chunkHtml } : null;
    })
    .filter(Boolean);
}

function normalizeUrl(href = "", asin = "") {
  const decoded = cleanText(href).replace(/&amp;/g, "&");
  const directPath = decoded.match(/\/(?:[^/\s"]+\/)?dp\/([A-Z0-9]{10})/i)?.[0] || `/dp/${asin}`;
  const url = new URL(directPath, "https://www.amazon.com.br");
  url.searchParams.set("tag", AMAZON_TAG);
  return url.toString();
}

function extractOffer(chunk, checkedAt) {
  const asin = chunk.asin;
  const href = chunk.html.match(/href="([^"]*\/dp\/[A-Z0-9]{10}[^"]*)"/i)?.[1] || `/dp/${asin}`;
  const title = cleanText(
    chunk.html.match(/p13n-sc-line-clamp-4"[^>]*>([\s\S]*?)<\/div>/)?.[1]
    || chunk.html.match(/dcl-product-label[^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/)?.[1]
    || chunk.html.match(/aria-label="([^"]+)"/)?.[1]
    || "",
  );
  const priceText = cleanText(
    chunk.html.match(/<span[^>]*class="[^"]*p13n-sc-price[^"]*"[^>]*>([\s\S]*?)<\/span>/)?.[1]
    || chunk.html.match(/<span class="a-offscreen">\s*(R\$[^<]+)<\/span>/)?.[1]
    || "",
  );
  const price = parseMoney(priceText);
  const image = cleanText(chunk.html.match(/<img[^>]+src="([^"]+)"/)?.[1] || "");
  const rating = cleanText(chunk.html.match(/aria-label="([^"]*de 5 estrelas[^"]*)"/)?.[1] || "");
  const rank = cleanText(chunk.html.match(/<span class="zg-bdg-text">([^<]+)<\/span>/)?.[1] || "");
  const { category, department } = inferCategory(title);
  const brand = detectBrand(title);
  const campaignHook = detectCampaignHook(title);

  return {
    id: `amazon-bestseller-${asin}`,
    asin,
    itemId: asin,
    source: "verified_partner_offers",
    sourceLabel: "amazon",
    sourceName: "amazon",
    sourceType: "amazon_bestsellers_page",
    marketplace: "verified_partner_offers",
    title,
    displayTitle: title,
    brand,
    model: "",
    category,
    normalizedCategory: category,
    department,
    productType: "principal",
    isAccessory: false,
    dataMode: "real",
    condition: "new",
    seller: { name: "Amazon.com.br" },
    availability: "Ranking Amazon - confirme estoque na loja",
    officialStore: false,
    price,
    currency: "BRL",
    image,
    affiliateUrl: normalizeUrl(href, asin),
    productUrl: normalizeUrl(href, asin),
    permalink: normalizeUrl(href, asin),
    installments: { available: false, source: "not_provided", confidence: 0 },
    searchKeywords: [
      title,
      brand,
      category,
      department,
      asin,
      "amazon",
      "mais vendidos",
      "amazon 8.8",
      campaignHook?.segment || "",
      campaignHook?.storyHook || "",
      rank ? `ranking amazon ${rank.replace("#", "")}` : "",
    ].filter(Boolean),
    sourceContext: {
      sourcePage: SOURCE_URL,
      campaign: "Amazon 8.8",
      segment: campaignHook?.segment || "",
      storyHook: campaignHook?.storyHook || "",
      rank,
      rating,
    },
    verifiedAt: checkedAt,
    lastCheckedAt: checkedAt,
    linkValidation: {
      status: "direct_product",
      checkedAt,
      finalUrl: normalizeUrl(href, asin),
      method: "amazon_bestsellers_page",
      evidenceUrl: SOURCE_URL,
    },
  };
}

function writeGeneratedFile(offers, diagnostics) {
  const outputPath = resolveProjectPath("src", "data", "amazon-bestsellers-offers.generated.js");
  const content = [
    "// Generated by scripts/intake-amazon-bestsellers-page.mjs. Do not edit manually.",
    `export const AMAZON_BESTSELLERS_OFFERS_GENERATED_AT = ${JSON.stringify(new Date().toISOString())};`,
    `export const AMAZON_BESTSELLERS_OFFERS_DIAGNOSTICS = ${JSON.stringify(diagnostics, null, 2)};`,
    `export const AMAZON_BESTSELLERS_OFFERS = ${JSON.stringify(offers, null, 2)};`,
    "",
  ].join("\n");
  fs.writeFileSync(outputPath, content, "utf8");
}

function writeReport(offers, diagnostics, rejected) {
  const byCategory = Map.groupBy(offers, (offer) => offer.category);
  const lines = [
    "# Relatorio intake Amazon mais vendidos",
    "",
    `Gerado em: ${new Date().toISOString()}`,
    `Pagina: ${SOURCE_URL}`,
    "",
    "## Resumo",
    "",
    `- ASINs recebidos: ${diagnostics.received}`,
    `- Ofertas aceitas: ${offers.length}`,
    `- Rejeitadas: ${rejected.length}`,
    "",
    "## Categorias aceitas",
    "",
    ...[...byCategory.entries()].map(([category, list]) => `- ${category}: ${list.length}`),
    "",
    "## Exemplos aceitos",
    "",
    ...offers.slice(0, 20).map((offer) => `- ${offer.title} | R$ ${offer.price.toFixed(2)} | ${offer.affiliateUrl}`),
    "",
    "## Rejeicoes",
    "",
    ...rejected.slice(0, 30).map((item) => `- ${item.asin || "sem ASIN"} | ${item.reason} | ${item.title || ""}`),
    "",
  ];
  fs.writeFileSync(resolveProjectPath("RELATORIO_INTAKE_AMAZON_MAIS_VENDIDOS.md"), lines.join("\n"), "utf8");
}

const htmlPaths = process.argv
  .filter((arg) => arg.startsWith("--html="))
  .map((arg) => arg.slice("--html=".length))
  .filter(Boolean);
if (!htmlPaths.length) htmlPaths.push(DEFAULT_HTML_PATH);
const checkedAt = new Date().toISOString();
const chunks = htmlPaths.flatMap((htmlPath) => extractChunks(fs.readFileSync(path.resolve(htmlPath), "utf8")));
const byAsin = new Map();
const rejected = [];

for (const chunk of chunks) {
  if (byAsin.has(chunk.asin)) continue;
  const offer = extractOffer(chunk, checkedAt);
  if (!offer.asin) rejected.push({ asin: chunk.asin, reason: "sem_asin" });
  else if (!offer.title || offer.title.length < 8) rejected.push({ asin: offer.asin, reason: "sem_titulo" });
  else if (!offer.price || offer.price <= 0) rejected.push({ asin: offer.asin, title: offer.title, reason: "sem_preco" });
  else if (!offer.image) rejected.push({ asin: offer.asin, title: offer.title, reason: "sem_imagem" });
  else if (isAccessoryOrPart(offer.title)) rejected.push({ asin: offer.asin, title: offer.title, reason: "acessorio_ou_peca" });
  else byAsin.set(offer.asin, offer);
}

const offers = [...byAsin.values()]
  .sort((a, b) => offerPriority(b) - offerPriority(a) || a.price - b.price)
  .slice(0, LIMIT);
const diagnostics = {
  source: "amazon",
  sourcePage: SOURCE_URL,
  htmlFiles: htmlPaths,
  received: chunks.length,
  accepted: offers.length,
  rejected: rejected.length,
  affiliateTag: AMAZON_TAG,
};

writeGeneratedFile(offers, diagnostics);
writeReport(offers, diagnostics, rejected);

console.log(JSON.stringify({
  received: chunks.length,
  accepted: offers.length,
  rejected: rejected.length,
  categories: Object.fromEntries([...Map.groupBy(offers, (offer) => offer.category).entries()].map(([key, list]) => [key, list.length])),
  sample: offers.slice(0, 8).map((offer) => ({
    title: offer.title,
    price: offer.price,
    category: offer.category,
    asin: offer.asin,
    affiliateUrl: offer.affiliateUrl,
  })),
}, null, 2));
