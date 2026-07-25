const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36";

export function cleanText(value = "") {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function decodeEntities(value = "") {
  return String(value || "")
    .replace(/&quot;/g, "\"")
    .replace(/&#34;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

export function parseMoney(value) {
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

export function detectOfferSource(url = "") {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "unknown";
  }
  if (host.includes("mercadolivre") || host === "meli.la") return "mercado_livre";
  if (host.includes("amazon") || host === "link.amazon" || host.includes("amzn.to") || host.includes("amzlink.to")) return "amazon";
  if (host.includes("magazineluiza") || host.includes("magazinevoce")) return "magalu";
  if (host.includes("shopee")) return "shopee";
  if (host.includes("casasbahia")) return "casas_bahia";
  return "unknown";
}

export function extractMercadoLivreItemId(value = "") {
  const text = String(value || "");
  const patterns = [
    /(?:item_id|wid)=((?:MLB)?\d+)/i,
    /\b(MLB\d{6,})\b/i,
    /\/p\/(MLB\d{6,})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].toUpperCase().startsWith("MLB") ? match[1].toUpperCase() : `MLB${match[1]}`;
  }
  return "";
}

export function extractAmazonAsin(value = "") {
  const text = String(value || "");
  const match = text.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?#]|$)/i)
    || text.match(/[?&]asin=([A-Z0-9]{10})(?:[&#]|$)/i);
  return match?.[1]?.toUpperCase() || "";
}

function extractMeta(html = "", property = "") {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
  ];
  for (const pattern of patterns) {
    const match = String(html || "").match(pattern);
    if (match?.[1]) return decodeEntities(match[1]);
  }
  return "";
}

function extractTitle(html = "") {
  return decodeEntities(extractMeta(html, "og:title") || String(html || "").match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "");
}

function extractPrice(html = "") {
  const candidates = [
    extractMeta(html, "product:price:amount"),
    extractMeta(html, "og:price:amount"),
    extractMeta(html, "twitter:data1"),
  ].filter(Boolean);
  for (const candidate of candidates) {
    const parsed = parseMoney(candidate);
    if (parsed > 0) return parsed;
  }
  return 0;
}

function extractImage(html = "") {
  return cleanText(extractMeta(html, "og:image") || extractMeta(html, "twitter:image"));
}

function hasUnavailableSignal(html = "") {
  const text = decodeEntities(String(html || "").replace(/<[^>]+>/g, " ")).toLowerCase();
  return [
    "produto indisponivel",
    "produto indisponível",
    "sem estoque",
    "esgotado",
    "out of stock",
    "currently unavailable",
    "produto nao encontrado",
    "produto não encontrado",
  ].some((signal) => text.includes(signal));
}

function hasBlockedSignal(html = "") {
  const text = decodeEntities(String(html || "").replace(/<[^>]+>/g, " ")).toLowerCase();
  return ["captcha", "access denied", "request blocked", "nao e possivel acessar", "não é possível acessar"].some((signal) => text.includes(signal));
}

export function classifyOfferLink({ inputUrl = "", finalUrl = "", status = 0, html = "" } = {}) {
  const source = detectOfferSource(finalUrl || inputUrl);
  const itemId = extractMercadoLivreItemId(finalUrl);
  const asin = extractAmazonAsin(finalUrl);
  const isMercadoLivreProductUrl = /mercadolivre\.com\.br\/.+\/p\/MLB\d+/i.test(finalUrl)
    || /[?&](item_id|wid)=MLB?\d+/i.test(finalUrl);
  const productPatterns = {
    mercado_livre: Boolean(itemId && isMercadoLivreProductUrl && !/\/social\//i.test(finalUrl)),
    amazon: Boolean(asin),
    magalu: /\/p\/[^/\s]+/i.test(finalUrl),
    shopee: /-i\.\d+\.\d+|\/product\/\d+\/\d+/i.test(finalUrl),
    casas_bahia: /\/p\/\d+/i.test(finalUrl),
  };

  if (!status) return { status: "fetch_error", source, itemId, asin };
  if (status === 401 || status === 403 || hasBlockedSignal(html)) return { status: "blocked", source, itemId, asin };
  if (status >= 400) return { status: "http_error", source, itemId, asin };
  if (hasUnavailableSignal(html)) return { status: "unavailable", source, itemId, asin };
  if (productPatterns[source]) return { status: "direct_product", source, itemId, asin };
  if (/\/search|lista|catalog|categoria|departamento/i.test(finalUrl)) return { status: "generic_listing", source, itemId, asin };
  return { status: "needs_review", source, itemId, asin };
}

export async function probeOfferLink(url, {
  fetchImpl = globalThis.fetch,
  now = new Date(),
  timeoutMs = 20000,
} = {}) {
  if (!fetchImpl) throw new Error("fetch indisponivel para probeOfferLink");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": DEFAULT_USER_AGENT,
        "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    const html = await response.text();
    const finalUrl = response.url || url;
    const classification = classifyOfferLink({ inputUrl: url, finalUrl, status: response.status, html });
    const title = extractTitle(html);
    const price = extractPrice(html);
    const image = extractImage(html);
    const checkedAt = now.toISOString();
    return {
      inputUrl: url,
      finalUrl,
      statusHttp: response.status,
      ok: response.ok && classification.status === "direct_product",
      source: classification.source,
      itemId: classification.itemId,
      asin: classification.asin,
      title,
      price,
      currency: price ? "BRL" : "",
      image,
      linkValidation: {
        status: classification.status,
        checkedAt,
        finalUrl,
        method: "offer_link_intake",
        evidenceUrl: finalUrl,
      },
      rejectionReason: classification.status === "direct_product" ? "" : classification.status,
    };
  } catch (error) {
    return {
      inputUrl: url,
      finalUrl: "",
      statusHttp: 0,
      ok: false,
      source: detectOfferSource(url),
      itemId: extractMercadoLivreItemId(url),
      asin: extractAmazonAsin(url),
      title: "",
      price: 0,
      currency: "",
      image: "",
      linkValidation: {
        status: "fetch_error",
        checkedAt: now.toISOString(),
        finalUrl: "",
        method: "offer_link_intake",
        evidenceUrl: url,
      },
      rejectionReason: error?.name || error?.message || "FETCH_ERROR",
    };
  } finally {
    clearTimeout(timeout);
  }
}
