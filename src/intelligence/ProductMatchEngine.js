import { normalizeText } from "../catalog/ProductNormalizer.js";

const ACCESSORY_TERMS = [
  "capa",
  "case",
  "pelicula",
  "película",
  "cabo",
  "carregador",
  "adaptador",
  "suporte",
  "replacement",
  "display",
  "tela",
  "bateria",
  "protetor",
];

const PRODUCT_TYPE_CONFLICTS = {
  smartphone: ["tv", "smart tv", "monitor", "notebook", "laptop", "roteador", "router"],
  notebook: ["smartphone", "celular", "iphone", "galaxy", "tv", "smart tv", "monitor"],
  monitor: ["smartphone", "celular", "iphone", "galaxy", "tv", "smart tv", "notebook"],
  tv: ["smartphone", "celular", "iphone", "galaxy", "notebook", "laptop", "monitor"],
  router: ["smartphone", "celular", "iphone", "galaxy", "tv", "notebook", "monitor"],
};

function contains(text = "", value = "") {
  return normalizeText(text).includes(normalizeText(value));
}

function isAccessoryText(text = "") {
  return ACCESSORY_TERMS.some((term) => contains(text, term));
}

function extractModelSignals(value = "") {
  const normalized = normalizeText(value);
  return {
    numeric: [...normalized.matchAll(/\b\d{1,4}\b/g)].map((match) => match[0]),
    keywords: ["pro max", "pro", "ultra", "plus", "mini", "fe", "edge"]
      .filter((token) => normalized.includes(token)),
  };
}

function hasConflictingProductType(productText = "", productCategory = "", intentType = "") {
  const conflicts = PRODUCT_TYPE_CONFLICTS[intentType] || [];
  return conflicts.some((term) => contains(`${productCategory} ${productText}`, term));
}

export class ProductMatchEngine {
  classify(product = {}, intent = {}) {
    const title = String(product.title || product.displayTitle || "").trim();
    const normalizedTitle = normalizeText(title);
    const category = normalizeText(product.category || product.normalizedCategory || "");
    const brand = normalizeText(product.brand || "");
    const productText = normalizeText([title, product.model, product.variant, product.description, product.category].filter(Boolean).join(" "));

    const reasons = [];
    let matchScore = 0;

    if (!title) {
      return { className: "INSUFFICIENT_DATA", matchScore: -100, reasons: ["missing_title"] };
    }

    const accessory = isAccessoryText(productText) || product.isAccessory === true || product.productType === "accessory";
    if (accessory && !intent.includeAccessories) {
      return { className: "ACCESSORY", matchScore: -100, reasons: ["accessory_detected"] };
    }

    if (intent.productType && hasConflictingProductType(productText, category, intent.productType)) {
      return { className: "WRONG_PRODUCT", matchScore: -100, reasons: ["product_type_conflict"] };
    }

    if (intent.brand && contains(brand || productText, intent.brand)) {
      matchScore += 20;
      reasons.push("brand_match");
    } else if (intent.brand) {
      matchScore -= 30;
      reasons.push("brand_mismatch");
    }

    const modelSignals = extractModelSignals(intent.model || "");
    const missingNumericSignal = modelSignals.numeric.some((token) => !contains(productText, token));
    const missingKeywordSignal = modelSignals.keywords.some((token) => !contains(productText, token));

    if (intent.model && contains(productText, intent.model)) {
      matchScore += 45;
      reasons.push("exact_model");
    } else if (intent.model && (missingNumericSignal || missingKeywordSignal)) {
      matchScore -= 45;
      reasons.push("model_signal_mismatch");
    } else if (intent.model && intent.family && contains(productText, intent.family)) {
      matchScore += 15;
      reasons.push("family_match");
    } else if (intent.model) {
      matchScore -= 35;
      reasons.push("wrong_model");
    }

    if (intent.storage && contains(productText, intent.storage)) {
      matchScore += 10;
      reasons.push("storage_match");
    }

    if (intent.memory && contains(productText, intent.memory)) {
      matchScore += 10;
      reasons.push("memory_match");
    }

    if (intent.processor && contains(productText, intent.processor)) {
      matchScore += 12;
      reasons.push("processor_match");
    } else if (intent.processor && /\b(i3|i5|i7|i9|ryzen 3|ryzen 5|ryzen 7|ryzen 9)\b/i.test(productText)) {
      return { className: "WRONG_PRODUCT", matchScore: -60, reasons: ["processor_mismatch"] };
    }

    if (intent.refreshRate && contains(productText, intent.refreshRate)) {
      matchScore += 10;
      reasons.push("refresh_rate_match");
    }

    if (intent.screenSize && contains(productText, intent.screenSize)) {
      matchScore += 8;
      reasons.push("screen_size_match");
    }

    if (intent.productType && contains(`${category} ${productText}`, intent.productType.replace("_", " "))) {
      matchScore += 20;
      reasons.push("product_type_match");
    }

    if (intent.category && contains(`${category} ${productText}`, intent.category)) {
      matchScore += 12;
      reasons.push("category_match");
    }

    if (Number(product.price || 0) <= 0) {
      return { className: "INSUFFICIENT_DATA", matchScore: -80, reasons: ["missing_price"] };
    }

    if (intent.model && matchScore >= 45) {
      return { className: "EXACT_MATCH", matchScore, reasons };
    }
    if (matchScore >= 30) {
      return { className: "VALID_VARIANT", matchScore, reasons };
    }
    if (matchScore > 0) {
      return { className: "RELATED_MODEL", matchScore, reasons };
    }
    return { className: "WRONG_PRODUCT", matchScore, reasons };
  }
}

export default ProductMatchEngine;
