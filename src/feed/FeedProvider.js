import fs from "node:fs";
import path from "node:path";
import CatalogManager from "../catalog/CatalogManager.js";

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

export function parseCsvLine(line = "") {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < String(line).length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

export function parseCsvText(csvText = "") {
  const lines = String(csvText || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (!lines.length) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
  return { headers, rows };
}

export default class FeedProvider {
  constructor(options = {}) {
    this.catalog = options.catalogManager || new CatalogManager(options.catalogOptions || {});
    this.networkName = options.networkName || "feed";
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
    this.seedPath = options.seedPath || path.join(process.cwd(), "data", "products.seed.json");
  }

  get name() {
    return this.networkName;
  }

  validate(row = {}) {
    const title = cleanText(row.title || row.name || "");
    const price = Number(row.price || 0);
    const url = cleanText(row.productUrl || row.affiliateUrl || row.url || row.link || "");
    const category = cleanText(row.category || "");
    const marketplace = cleanText(row.marketplace || this.networkName || "");
    const reasons = [];
    if (!title) reasons.push("title ausente");
    if (!Number.isFinite(price) || price <= 0) reasons.push("price inválido");
    if (!url || !isHttpUrl(url)) reasons.push("url ausente");
    if (!marketplace) reasons.push("marketplace ausente");
    if (category === "") reasons.push("category ausente");
    return {
      ok: reasons.length === 0,
      reasons,
    };
  }

  detectFormat(source = "", text = "") {
    const lower = cleanText(source).toLowerCase();
    if (lower.endsWith(".csv")) return "csv";
    if (lower.endsWith(".json")) return "json";
    if (lower.endsWith(".xml")) return "xml";
    if (lower.endsWith(".tsv")) return "tsv";
    const trimmed = String(text || "").trimStart();
    if (trimmed.startsWith("<")) return "xml";
    if (trimmed.startsWith("{")) return "json";
    if (trimmed.includes("\t")) return "tsv";
    return "csv";
  }

  async readSource(source = "", options = {}) {
    const text = String(source || "").trim();
    const inlineText = String(options.text || options.feedText || "").trim();
    const effectiveText = inlineText || text;
    if (!effectiveText) {
      return { ok: false, error: "FEED_SOURCE_MISSING", text: "", source: "" };
    }

    if (inlineText) {
      return { ok: true, text: inlineText, source: options.source || "inline-feed", statusHttp: 200 };
    }

    if (/^https?:\/\//i.test(text)) {
      if (!this.fetchImpl) return { ok: false, error: "FETCH_NOT_AVAILABLE", text: "", source: text };
      const response = await this.fetchImpl(text, { headers: { Accept: "*/*" } });
      const body = await response.text().catch(() => "");
      if (!response.ok) {
        return { ok: false, error: `HTTP_${response.status}`, statusHttp: response.status, text: body, source: text };
      }
      return { ok: true, text: body, source: text, statusHttp: response.status };
    }

    const absolutePath = path.resolve(text);
    if (!fs.existsSync(absolutePath)) {
      return { ok: false, error: "FEED_SOURCE_NOT_FOUND", text: "", source: absolutePath };
    }
    return { ok: true, text: fs.readFileSync(absolutePath, "utf8"), source: absolutePath, statusHttp: 200 };
  }

  parse() {
    throw new Error("parse() must be implemented by subclasses.");
  }

  normalize() {
    throw new Error("normalize() must be implemented by subclasses.");
  }

  buildProductKeys(product = {}) {
    return [
      product.id,
      product.externalId,
      product.productUrl,
      product.affiliateUrl,
      `${normalizeText(product.title)}|${normalizeText(product.brand)}|${normalizeText(product.model)}`,
    ].filter(Boolean).map((value) => normalizeText(value));
  }

  findExisting(product = {}) {
    const catalog = this.catalog.list();
    const keys = this.buildProductKeys(product);
    for (const item of catalog) {
      const itemKeys = this.buildProductKeys(item);
      if (keys.some((key) => itemKeys.includes(key))) return item;
    }
    return null;
  }

  isDuplicate(product = {}) {
    const existing = this.findExisting(product);
    if (!existing) return false;
    const keys = ["title", "category", "brand", "model", "price", "currency", "productUrl", "affiliateUrl", "image"];
    return keys.every((field) => normalizeText(existing[field]) === normalizeText(product[field]));
  }

  async import(source, options = {}) {
    const read = await this.readSource(source, options);
    if (!read.ok) {
      return {
        provider: this.name,
        imported: 0,
        updated: 0,
        duplicates: 0,
        rejected: 0,
        errors: [read.error || "FEED_SOURCE_ERROR"],
        products: [],
        rejectedRows: [],
        rawCount: 0,
        format: options.format || this.detectFormat(source, read.text),
      };
    }

    const format = options.format || this.detectFormat(read.source, read.text);
    const parsed = await this.parse(read.text, { ...options, source: read.source, format });
    const normalized = Array.isArray(parsed.products) ? parsed.products : [];
    const rejectedRows = Array.isArray(parsed.rejectedRows) ? parsed.rejectedRows : [];
    const duplicates = normalized.filter((item) => this.isDuplicate(item)).length;
    const result = typeof this.catalog.importProducts === "function"
      ? this.catalog.importProducts(normalized, options.mode || "merge")
      : this.catalog.import(normalized, options.mode || "merge");

    return {
      provider: this.name,
      imported: result.imported || 0,
      updated: result.updated || 0,
      duplicates,
      rejected: (result.rejected || 0) + rejectedRows.length,
      errors: [
        ...(parsed.errors || []),
        ...((result.rejectedItems || []).map((item) => item.reason || item.reasons?.join(", ") || "Produto rejeitado")),
      ],
      products: result.products || normalized,
      rejectedRows,
      rawCount: parsed.rawCount ?? normalized.length,
      format,
    };
  }
}
