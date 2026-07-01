import CatalogManager from "../catalog/CatalogManager.js";
import { resolveCatalogSeedPath } from "../runtime/catalog-path.js";
import { projectRoot } from "../runtime/project-root.js";

import actionpayProviderDefault, { ActionpayProvider } from "../providers/ActionpayProvider.js";
import path from "node:path";

const root = projectRoot;

function cleanText(value = "") {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeText(value = "") {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isHttpUrl(value = "") {
  const text = cleanText(value);
  if (!text) return false;
  try {
    const parsed = new URL(text);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
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
    const decimalComma = /,\d{1,2}$/.test(text);
    normalized = decimalComma ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  } else if (hasDot) {
    const decimalDot = /\.\d{1,2}$/.test(text);
    normalized = decimalDot ? text.replace(/,/g, "") : text.replace(/\./g, "");
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function slugify(value = "") {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function categoryFromTerms(text = "") {
  const value = normalizeText(text);
  if (["iphone", "celular", "smartphone"].some((term) => value.includes(term))) return "tecnologia/celulares";
  if (["notebook", "laptop"].some((term) => value.includes(term))) return "tecnologia/notebooks";
  if (["tv", "televis", "smart tv"].some((term) => value.includes(term))) return "tecnologia/tvs";
  if (["monitor"].some((term) => value.includes(term))) return "tecnologia/monitores";
  if (["tablet", "ipad"].some((term) => value.includes(term))) return "tecnologia/tablets";
  if (["impressora"].some((term) => value.includes(term))) return "tecnologia/impressoras";
  return "tecnologia/outros";
}

function normalizeAvailability(value = "") {
  const text = normalizeText(value);
  if (!text || ["true", "1", "yes", "available", "in stock", "in_stock", "available yes"].includes(text)) return "available";
  if (["false", "0", "no", "unavailable", "out of stock", "out_of_stock"].includes(text)) return "unavailable";
  return cleanText(value) || "available";
}

function parseXmlBlocks(text = "", tagName = "offer") {
  const source = String(text || "");
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  return [...source.matchAll(regex)].map((match) => match[0]);
}

function extractTagValue(block, tagNames = []) {
  for (const tagName of tagNames) {
    const pattern = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i");
    const match = String(block || "").match(pattern);
    if (match && match[1] != null) {
      return cleanText(String(match[1]).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
    }
  }
  return "";
}

function extractAttributes(block = "") {
  const attrs = {};
  const start = String(block || "").match(/^<\s*([a-z0-9:_-]+)([^>]*)>/i);
  const attrText = start ? start[2] || "" : "";
  for (const attrMatch of attrText.matchAll(/([a-z0-9:_-]+)\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    attrs[attrMatch[1]] = String(attrMatch[3] ?? attrMatch[4] ?? "").trim();
  }
  return attrs;
}

function extractCategories(text = "") {
  const categories = {};
  const blocks = parseXmlBlocks(text, "category");
  for (const block of blocks) {
    const attrs = extractAttributes(block);
    const id = cleanText(attrs.id || attrs.ID || extractTagValue(block, ["id"]));
    const title = extractTagValue(block, ["category", "title", "name"]);
    if (id && title) categories[id] = title;
  }
  return categories;
}

function extractOffers(text = "") {
  return parseXmlBlocks(text, "offer").map((block) => {
    const attrs = extractAttributes(block);
    return {
      id: cleanText(attrs.id || attrs.offer_id || attrs.offerId || extractTagValue(block, ["id", "offerId", "offer_id"])),
      available: cleanText(attrs.available || attrs.isAvailable || extractTagValue(block, ["available", "isAvailable"])),
      url: extractTagValue(block, ["url", "link", "landingPage", "productUrl"]),
      price: extractTagValue(block, ["price", "salePrice", "regularPrice", "amount"]),
      currencyId: extractTagValue(block, ["currencyId", "currency", "currencyCode"]),
      categoryId: extractTagValue(block, ["categoryId", "category", "category_id"]),
      picture: extractTagValue(block, ["picture", "image", "image_link", "imageLink"]),
      name: extractTagValue(block, ["name", "title", "productName"]),
      vendor: extractTagValue(block, ["vendor", "brand", "manufacturer"]),
      model: extractTagValue(block, ["model", "mpn"]),
      description: extractTagValue(block, ["description", "summary", "shortDescription"]),
      raw: block,
    };
  });
}

export class ActionpayYmlImporter {
  constructor(options = {}) {
    this.provider = options.provider || (actionpayProviderDefault instanceof ActionpayProvider ? actionpayProviderDefault : new ActionpayProvider(options.providerOptions || {}));
    this.catalogManager = options.catalogManager || new CatalogManager({
      ...options.catalogOptions,
      seedPath: options.catalogSeedPath || process.env.ACTIONPAY_CATALOG_SEED_PATH || resolveCatalogSeedPath(path.join(root, "data", "products.seed.json")),
    });
    this.sourceOfferId = cleanText(options.sourceOfferId || process.env.ACTIONPAY_SALDAO_OFFER_ID || "13241") || "13241";
    this.sourceOfferName = cleanText(options.sourceOfferName || "Saldão da Informática - Notebooks, iPhones e TVs.");
  }

  parse(text = "") {
    const source = String(text || "");
    const categories = extractCategories(source);
    const offers = extractOffers(source);
    const warnings = [];
    if (!offers.length) warnings.push("Nenhuma oferta encontrada no YML.");
    return { categories, offers, warnings, raw: source };
  }

  normalizeOffer(raw = {}, context = {}) {
    const title = cleanText(raw.name || raw.title || raw.productName || "");
    const price = parseNumber(raw.price);
    const url = cleanText(raw.url || raw.link || raw.affiliateUrl || raw.productUrl || "");
    const affiliateUrl = isHttpUrl(url) ? url : "";
    const productUrl = affiliateUrl;
    const categoryLookup = context.categories || {};
    const mappedCategory = cleanText(categoryLookup[cleanText(raw.categoryId)] || "");
    const category = categoryFromTerms(`${title} ${mappedCategory || raw.categoryId || ""} ${raw.description || ""}`);
    const currency = cleanText(raw.currencyId || raw.currency || "BRL") || "BRL";
    const warnings = [];

    if (currency !== "BRL") warnings.push(`Moeda diferente de BRL: ${currency}`);

    const reasons = [];
    if (!title) reasons.push("Título ausente");
    if (!Number.isFinite(price) || price <= 0) reasons.push("Preço inválido");
    if (!affiliateUrl && !productUrl) reasons.push("URL ausente");

    if (reasons.length) {
      return { ok: false, reason: reasons.join("; "), reasons, warnings, product: null };
    }

    const brand = cleanText(raw.vendor || raw.brand || "");
    const model = cleanText(raw.model || "");
    const externalId = cleanText(raw.id || raw.offerId || "");
    const id = externalId ? `actionpay-${slugify(externalId)}` : `actionpay-${slugify(title)}`;

    return {
      ok: true,
      warnings,
      product: {
        id,
        externalId,
        title,
        category,
        brand,
        model,
        price,
        currency,
        image: cleanText(raw.picture || raw.image || ""),
        productUrl,
        affiliateUrl: affiliateUrl || productUrl,
        marketplace: "actionpay",
        seller: "Saldão da Informática",
        availability: normalizeAvailability(raw.available),
        condition: "new",
        importedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceType: "actionpay_yml",
        dataMode: "real",
        sourceOfferId: this.sourceOfferId,
        sourceOfferName: this.sourceOfferName,
        description: cleanText(raw.description || ""),
      },
    };
  }

  async importActionpaySaldaoToCatalog(options = {}) {
    const offerId = cleanText(options.offerId || this.sourceOfferId);
    const sourceId = cleanText(options.sourceId || process.env.ACTIONPAY_SOURCE_ID || "");
    const subId1 = cleanText(options.subId1 || process.env.ACTIONPAY_DEFAULT_SUBID || "oqc") || "oqc";
    const configured = this.provider.isConfigured();
    if (!configured) {
      return {
        configured: false,
        offerId,
        offerName: this.sourceOfferName,
        ymlId: "",
        downloaded: 0,
        parsed: 0,
        imported: 0,
        updated: 0,
        rejected: 0,
        errors: ["Actionpay não configurada."],
        warnings: [],
      };
    }

    const ymlResult = await this.provider.getYmls(offerId);
    const ymls = Array.isArray(ymlResult.items) ? ymlResult.items : [];
    const chosen = ymls.find((item) => cleanText(item.offerId) === offerId || cleanText(item.offerName).includes("Saldão")) || ymls[0] || null;
    if (!chosen) {
      return {
        configured: true,
        offerId,
        offerName: this.sourceOfferName,
        ymlId: "",
        downloaded: 0,
        parsed: 0,
        imported: 0,
        updated: 0,
        rejected: 0,
        errors: [`Nenhum YML encontrado para a oferta ${offerId}.`],
        warnings: [],
        ymls: [],
      };
    }

    const deeplinkResult = await this.provider.getDeeplinkYml({
      ymlId: chosen.ymlId || chosen.id,
      sourceId,
      subId1,
    });

    const payload = typeof deeplinkResult.data === "string" ? this.parse(deeplinkResult.data) : deeplinkResult.data;
    const parsed = payload && typeof payload === "object" && Array.isArray(payload.offers) ? payload : this.parse(deeplinkResult.text || deeplinkResult.raw || "");
    const normalized = [];
    const warnings = [...(payload?.warnings || []), ...(deeplinkResult.warnings || [])];
    const errors = [];
    const rejectedItems = [];

    for (const raw of parsed.offers || []) {
      const candidate = this.normalizeOffer(raw, {
        categories: parsed.categories || {},
        offerId,
        offerName: chosen.offerName || this.sourceOfferName,
      });
      if (!candidate.ok) {
        rejectedItems.push({ raw, reason: candidate.reason, reasons: candidate.reasons });
        continue;
      }
      normalized.push(candidate.product);
      if (candidate.warnings.length) warnings.push(...candidate.warnings);
    }

    const catalogResult = typeof this.catalogManager.importProducts === "function"
      ? this.catalogManager.importProducts(normalized, "merge")
      : this.catalogManager.import(normalized, "merge");

    const existing = this.catalogManager.list();
    const updated = normalized.filter((product) =>
      existing.some((item) =>
        String(item.id || "") === String(product.id || "") ||
        String(item.externalId || "") === String(product.externalId || "") ||
        String(item.productUrl || "") === String(product.productUrl || "") ||
        String(item.affiliateUrl || "") === String(product.affiliateUrl || ""),
      ),
    ).length;

    return {
      configured: true,
      offerId,
      offerName: chosen.offerName || this.sourceOfferName,
      ymlId: cleanText(chosen.ymlId || chosen.id || ""),
      downloaded: Array.isArray(parsed.offers) ? parsed.offers.length : 0,
      parsed: normalized.length,
      imported: catalogResult.imported || 0,
      updated: updated || 0,
      rejected: rejectedItems.length + (catalogResult.rejected || 0),
      errors: [
        ...(errors || []),
        ...rejectedItems.map((item) => item.reason),
        ...((catalogResult.rejectedItems || []).map((item) => item.reason || item.reasons?.join(", ") || "Produto rejeitado")),
      ],
      warnings,
      products: catalogResult.products || normalized,
      rejectedItems,
    };
  }
}

const actionpayYmlImporter = new ActionpayYmlImporter();

export default actionpayYmlImporter;
