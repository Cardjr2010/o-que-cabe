import fs from "node:fs";
import path from "node:path";
import FeedProvider from "../feed/FeedProvider.js";
import CatalogManager from "../catalog/CatalogManager.js";
import { resolveCatalogSeedPath } from "../runtime/catalog-path.js";
import { projectRoot } from "../runtime/project-root.js";

import actionpayProviderDefault, { ActionpayProvider } from "./ActionpayProvider.js";
import { ActionpayYmlImporter } from "../importers/ActionpayYmlImporter.js";

const root = projectRoot;
const defaultStatePath = path.join(root, "data", "actionpay-import-state.json");
const defaultCatalogSeedPath = resolveCatalogSeedPath(path.join(root, "data", "products.seed.json"));

function cleanText(value = "") {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export class ActionpayFeedProvider extends FeedProvider {
  constructor(options = {}) {
    super({ ...options, networkName: options.networkName || "actionpay" });
    this.statePath = cleanText(options.statePath || defaultStatePath);
    this.provider = options.provider || (actionpayProviderDefault instanceof ActionpayProvider ? actionpayProviderDefault : new ActionpayProvider(options.providerOptions || {}));
    this.catalogManager = options.catalogManager || new CatalogManager({
      ...(options.catalogOptions || {}),
      seedPath: options.catalogSeedPath || defaultCatalogSeedPath,
    });
    this.importer = options.importer || new ActionpayYmlImporter({
      provider: this.provider,
      catalogManager: this.catalogManager,
      catalogSeedPath: options.catalogSeedPath || defaultCatalogSeedPath,
      sourceOfferId: options.sourceOfferId || process.env.ACTIONPAY_SALDAO_OFFER_ID || "13241",
      sourceOfferName: options.sourceOfferName || "Saldão da Informática - Notebooks, iPhones e TVs.",
    });
    this.sourceOfferId = cleanText(options.sourceOfferId || process.env.ACTIONPAY_SALDAO_OFFER_ID || "13241") || "13241";
    this.sourceOfferName = cleanText(options.sourceOfferName || "Saldão da Informática - Notebooks, iPhones e TVs.");
  }

  getCatalogManager() {
    return this.catalogManager;
  }

  getStatePath() {
    return this.statePath || defaultStatePath;
  }

  configured() {
    return this.provider.isConfigured();
  }

  getDiagnostics() {
    const state = readJson(this.getStatePath(), {});
    return {
      configured: this.configured(),
      hasApiKey: Boolean(this.provider.apiKey),
      hasSourceId: Boolean(this.provider.sourceId),
      offerId: this.sourceOfferId,
      defaultSubId: this.provider.defaultSubId,
      lastImport: state.lastImport || null,
      totalProducts: this.getCatalogManager().list().filter((item) => String(item.marketplace || "").toLowerCase() === "actionpay").length,
    };
  }

  getStatus() {
    return this.getDiagnostics();
  }

  persistState(summary = {}) {
    writeJson(this.getStatePath(), {
      lastImport: summary.lastImport || new Date().toISOString(),
      configured: Boolean(summary.configured),
      offerId: summary.offerId || this.sourceOfferId,
      offerName: summary.offerName || this.sourceOfferName,
      imported: summary.imported || 0,
      updated: summary.updated || 0,
      rejected: summary.rejected || 0,
      downloaded: summary.downloaded || 0,
      parsed: summary.parsed || 0,
      warnings: Array.isArray(summary.warnings) ? summary.warnings.slice(0, 50) : [],
      errors: Array.isArray(summary.errors) ? summary.errors.slice(0, 50) : [],
      ymlId: summary.ymlId || "",
      totalProducts: summary.productCount || summary.products?.length || 0,
    });
  }

  async import(options = {}) {
    if (!this.configured()) {
      return {
        configured: false,
        offerId: this.sourceOfferId,
        offerName: this.sourceOfferName,
        ymlId: "",
        downloaded: 0,
        parsed: 0,
        imported: 0,
        updated: 0,
        rejected: 0,
        errors: ["Actionpay não configurada."],
        warnings: [],
        products: [],
      };
    }

    const result = await this.importer.importActionpaySaldaoToCatalog({
      offerId: options.offerId || this.sourceOfferId,
      sourceId: options.sourceId || this.provider.sourceId,
      subId1: options.subId1 || this.provider.defaultSubId,
    });
    this.persistState(result);
    return result;
  }

  async importToCatalog(options = {}) {
    return this.import(options);
  }

  async searchProducts(query = "", options = {}) {
    const needle = cleanText(query).toLowerCase();
    const products = this.getCatalogManager()
      .list()
      .filter((item) => String(item.marketplace || "").toLowerCase() === "actionpay")
      .filter((item) => {
        if (!needle) return true;
        const haystack = cleanText(`${item.title || ""} ${item.category || ""} ${item.brand || ""} ${item.model || ""} ${item.seller || ""}`).toLowerCase();
        return haystack.includes(needle);
      });
    const limited = products.slice(0, Number(options.limit || 20));
    return {
      configured: this.configured(),
      statusHttp: 200,
      dataMode: "real",
      strategyUsed: "actionpay_feed_catalog",
      error: "",
      rawCount: products.length,
      returnedCount: limited.length,
      products: limited,
      firstFive: limited.slice(0, 5).map((item) => ({
        title: item.title,
        price: item.price,
        permalink: item.productUrl || item.affiliateUrl || "",
        image: item.image || "",
      })),
    };
  }

  async getProduct(itemId) {
    const item = this.getCatalogManager().list().find((product) =>
      String(product.id || "") === String(itemId || "") ||
      String(product.externalId || "") === String(itemId || "") ||
      String(product.productUrl || "") === String(itemId || "") ||
      String(product.affiliateUrl || "") === String(itemId || ""),
    );
    if (!item) {
      return {
        configured: this.configured(),
        statusHttp: 404,
        dataMode: "demo",
        error: "ACTIONPAY_PRODUCT_NOT_FOUND",
        product: null,
      };
    }
    return {
      configured: this.configured(),
      statusHttp: 200,
      dataMode: String(item.dataMode || "real"),
      error: "",
      product: item,
    };
  }

  getPermalink(item = {}) {
    return cleanText(item.affiliateUrl || item.productUrl || item.permalink || "");
  }

  getImage(item = {}) {
    return cleanText(item.image || item.thumbnail || "");
  }
}

const actionpayFeedProvider = new ActionpayFeedProvider();

export default actionpayFeedProvider;
