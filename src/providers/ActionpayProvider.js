import fs from "node:fs";
import { projectRoot } from "../runtime/project-root.js";

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

function parseJsonMaybe(text = "") {
  try {
    return JSON.parse(String(text || ""));
  } catch {
    return null;
  }
}

function decodeEntities(value = "") {
  return String(value ?? "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
}

function extractTagValue(block, tagNames = []) {
  for (const tagName of tagNames) {
    const pattern = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i");
    const match = String(block || "").match(pattern);
    if (match && match[1] != null) return cleanText(decodeEntities(match[1]));
  }
  return "";
}

function extractAttributes(block = "") {
  const attrs = {};
  const start = String(block || "").match(/^<\s*([a-z0-9:_-]+)([^>]*)>/i);
  const attrText = start ? start[2] || "" : "";
  for (const attrMatch of attrText.matchAll(/([a-z0-9:_-]+)\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    const key = attrMatch[1];
    const value = attrMatch[3] ?? attrMatch[4] ?? "";
    attrs[key] = decodeEntities(value);
  }
  return attrs;
}

function xmlBlocks(text = "", tagName = "") {
  if (!tagName) return [];
  const pattern = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  const matches = [];
  for (const match of String(text || "").matchAll(pattern)) {
    matches.push(match[0]);
  }
  return matches;
}

function wrapObjectFromXmlBlock(block = "", keys = {}) {
  const object = {};
  for (const [key, tagNames] of Object.entries(keys)) {
    object[key] = extractTagValue(block, Array.isArray(tagNames) ? tagNames : [tagNames]);
  }
  return object;
}

function normalizeUrlObject(value = "") {
  if (typeof value === "string") {
    return { url: isHttpUrl(value) ? value.trim() : "" };
  }
  if (value && typeof value === "object") {
    return { url: cleanText(value.url || value.href || value.link || "") };
  }
  return { url: "" };
}

function normalizeResponsePayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const keys = ["ymls", "yml", "offers", "offer", "items", "results", "data"];
  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return [payload];
}

function extractXmlEntries(text = "", rootTag = "yml") {
  return xmlBlocks(text, rootTag).map((block) => ({
    ...wrapObjectFromXmlBlock(block, {
      offerId: ["offer_id", "offerId", "offer"],
      offerName: ["offer_name", "offerName", "name"],
      ymlId: ["yml_id", "ymlId", "id"],
      ymlName: ["yml_name", "ymlName", "name"],
      format: ["format"],
      type: ["type"],
    }),
    file: normalizeUrlObject({
      url: extractTagValue(block, ["file", "url"]),
      href: extractTagValue(block, ["href"]),
    }),
    infoFile: normalizeUrlObject({
      url: extractTagValue(block, ["infoFile", "info_file", "info"]),
      href: extractTagValue(block, ["infoUrl", "info_url"]),
    }),
    regionalFile: normalizeUrlObject({
      url: extractTagValue(block, ["regionalFile", "regional_file", "regional"]),
      href: extractTagValue(block, ["regionalUrl", "regional_url"]),
    }),
    raw: block,
  }));
}

function extractEntriesFromText(text = "") {
  const source = String(text || "");
  if (!source.trim()) return [];
  if (source.includes("<yml")) return extractXmlEntries(source, "yml");
  if (source.includes("<offer")) return extractXmlEntries(source, "offer");
  if (source.includes("<source")) return extractXmlEntries(source, "source");
  return [];
}

export class ActionpayProvider {
  constructor(config = {}) {
    this.config = { ...config };
    this.fetchImpl = config.fetchImpl || globalThis.fetch;
    this.baseUrl = cleanText(config.baseUrl || process.env.ACTIONPAY_BASE_URL || "https://actionpay.com.br/pt");
  }

  get apiKey() {
    return cleanText(this.config.apiKey || process.env.ACTIONPAY_API_KEY || "");
  }

  get sourceId() {
    return cleanText(this.config.sourceId || process.env.ACTIONPAY_SOURCE_ID || "");
  }

  get defaultSubId() {
    return cleanText(this.config.defaultSubId || process.env.ACTIONPAY_DEFAULT_SUBID || "oqc") || "oqc";
  }

  get saldaoOfferId() {
    return cleanText(this.config.saldaoOfferId || process.env.ACTIONPAY_SALDAO_OFFER_ID || "13241") || "13241";
  }

  isConfigured() {
    return Boolean(this.apiKey && this.sourceId);
  }

  buildUrl(method, params = {}) {
    const cleanMethod = cleanText(method).replace(/^\/+|\/+$/g, "");
    const url = new URL(`${this.baseUrl.replace(/\/+$/g, "")}/${cleanMethod}/`);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("format", cleanText(params.format || this.config.format || "xml") || "xml");
    for (const [key, value] of Object.entries(params || {})) {
      if (value == null || value === "") continue;
      if (key === "format") continue;
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  async request(method, params = {}, options = {}) {
    const url = options.url || this.buildUrl(method, params);
    if (!this.fetchImpl) {
      return {
        ok: false,
        statusHttp: 0,
        error: "FETCH_NOT_AVAILABLE",
        url,
        raw: "",
        data: null,
      };
    }

    const response = await this.fetchImpl(url, {
      headers: {
        Accept: options.accept || "application/xml, text/xml, application/json, text/plain, */*",
      },
      method: options.method || "GET",
    });

    const raw = await response.text().catch(() => "");
    const contentType = response.headers?.get?.("content-type") || "";
    const data = contentType.includes("json") ? parseJsonMaybe(raw) : raw;

    if (!response.ok) {
      const error = new Error(`Actionpay HTTP ${response.status}`);
      error.statusHttp = response.status;
      error.code = `ACTIONPAY_HTTP_${response.status}`;
      error.url = url;
      error.response = data;
      throw error;
    }

    return {
      ok: true,
      statusHttp: response.status,
      url,
      raw,
      data,
      headers: response.headers,
    };
  }

  parseXmlFeed(text = "") {
    const source = String(text || "");
    const categories = {};
    for (const block of xmlBlocks(source, "category")) {
      const attrs = extractAttributes(block);
      const id = cleanText(attrs.id || attrs.ID || extractTagValue(block, ["id"]));
      const title = extractTagValue(block, ["category", "title", "name"]);
      if (id && title) categories[id] = title;
    }

    const offers = xmlBlocks(source, "offer").map((block) => {
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

    return { categories, offers, raw: source };
  }

  normalizeYmlEntry(raw = {}) {
    const file = normalizeUrlObject(raw.file || raw.files || raw.download || raw.downloadFile || raw.url || "");
    const infoFile = normalizeUrlObject(raw.infoFile || raw.info_file || raw.info || "");
    const regionalFile = normalizeUrlObject(raw.regionalFile || raw.regional_file || raw.regional || "");
    const offerId = cleanText(raw.offerId || raw.offer_id || raw.offer || raw.id || "");
    const offerName = cleanText(raw.offerName || raw.offer_name || raw.name || raw.offerTitle || "");
    const ymlId = cleanText(raw.ymlId || raw.yml_id || raw.fileId || raw.file_id || raw.id || "");
    const ymlName = cleanText(raw.ymlName || raw.yml_name || raw.name || raw.title || offerName || "");

    return {
      offerId,
      offerName,
      ymlId,
      ymlName,
      file,
      infoFile,
      regionalFile,
      raw,
    };
  }

  normalizeListResponse(data, fallback = {}) {
    const items = typeof data === "string" ? extractEntriesFromText(data) : normalizeResponsePayload(data);
    return items.map((item) => this.normalizeYmlEntry(item, fallback)).filter((item) => item.ymlId || item.offerId || item.ymlName);
  }

  async getSources() {
    const result = await this.request("apiWmSources");
    return {
      ok: true,
      statusHttp: result.statusHttp,
      items: this.normalizeListResponse(result.data, { type: "source" }),
      raw: result.raw,
    };
  }

  async getOffers() {
    const result = await this.request("apiWmOffers");
    return {
      ok: true,
      statusHttp: result.statusHttp,
      items: this.normalizeListResponse(result.data, { type: "offer" }),
      raw: result.raw,
    };
  }

  async getOfferById(offerId) {
    const targetId = cleanText(offerId);
    const result = await this.getOffers();
    return {
      ...result,
      item: result.items.find((item) => cleanText(item.offerId || item.ymlId || item.id) === targetId) || null,
    };
  }

  async getYmls(offerId = this.saldaoOfferId) {
    const targetId = cleanText(offerId || this.saldaoOfferId);
    const result = await this.request("apiWmYmls", {
      offer_id: targetId,
      offerId: targetId,
      offer: targetId,
    });
    const items = this.normalizeListResponse(result.data, { offerId: targetId });
    const filtered = items.filter((item) => !targetId || cleanText(item.offerId) === targetId || cleanText(item.offerName).includes(targetId));
    return {
      ok: true,
      statusHttp: result.statusHttp,
      offerId: targetId,
      items: filtered.length ? filtered : items,
      raw: result.raw,
    };
  }

  async getDeeplinkYml({ ymlId, sourceId = this.sourceId, subId1 = this.defaultSubId } = {}) {
    const targetYmlId = cleanText(ymlId);
    if (!targetYmlId) {
      return { ok: false, statusHttp: 400, error: "YML_ID_MISSING", raw: "", data: null };
    }
    const params = {
      act: "deeplinks",
      yml: targetYmlId,
      source: cleanText(sourceId),
      subId1: cleanText(subId1 || this.defaultSubId),
    };
    const result = await this.request("apiWmYmls", params);
    const parsed = typeof result.data === "string" ? this.parseXmlFeed(result.data) : result.data;
    return {
      ok: true,
      statusHttp: result.statusHttp,
      ymlId: targetYmlId,
      sourceId: cleanText(sourceId),
      subId1: cleanText(subId1 || this.defaultSubId),
      raw: result.raw,
      data: parsed,
      text: result.raw,
    };
  }

  async getLinks({ offerId, sourceId = this.sourceId } = {}) {
    const targetId = cleanText(offerId);
    const result = await this.request("apiWmLinks", {
      offer_id: targetId,
      offerId: targetId,
      source: cleanText(sourceId),
    });
    return {
      ok: true,
      statusHttp: result.statusHttp,
      items: this.normalizeListResponse(result.data, { offerId: targetId }),
      raw: result.raw,
    };
  }

  getDiagnostics() {
    return {
      configured: this.isConfigured(),
      hasApiKey: Boolean(this.apiKey),
      hasSourceId: Boolean(this.sourceId),
      offerId: this.saldaoOfferId,
      defaultSubId: this.defaultSubId,
    };
  }
}

const actionpayProvider = new ActionpayProvider();

export default actionpayProvider;