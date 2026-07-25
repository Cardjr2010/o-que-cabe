import { normalizeText, scoreProductMatch } from "../catalog/ProductNormalizer.js";
import {
  VERIFIED_AFFILIATE_OFFERS,
  isVerifiedAffiliateOfferAutomatedSourceAllowed,
  isVerifiedAffiliateOfferFresh,
} from "../data/verified-affiliate-offers.js";
import { isScreenedOfferVisible } from "../data/offer-campaigns.js";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function tokenHits(query = "", haystack = "") {
  const tokens = normalizeText(query)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
  if (!tokens.length) return 0;
  const text = normalizeText(haystack);
  return tokens.filter((token) => text.includes(token)).length;
}

function hasAnyToken(text = "", tokens = []) {
  const normalized = normalizeText(text);
  return tokens.some((token) => normalized.includes(normalizeText(token)));
}

function sellerName(offer = {}) {
  return String(typeof offer.seller === "object" ? offer.seller?.name : offer.seller || "").trim();
}

function isTrustedPartnerOffer(offer = {}) {
  const source = normalizeText(offer.sourceName || offer.sourceLabel || offer.source || "");
  if (source.includes("mercado_livre")) return offer.officialStore === true;
  if (source.includes("amazon")) return normalizeText(sellerName(offer)).includes("amazon.com.br");
  return true;
}

function isPrincipalDeviceQuery(query = "") {
  const normalized = normalizeText(query);
  return /\b(iphone|galaxy|samsung|redmi|poco|motorola|moto|celular|smartphone|notebook|monitor|tv|roteador)\b/.test(normalized);
}

function isAccessoryTitle(text = "") {
  return /\b(capa|case|pelicula|pelicula|vidro|carregador|cabo|adaptador|suporte|fone|headphone|earbud|airpods|pulseira|strap|protector|protetor|controle remoto|remote|bateria|tela)\b/.test(normalizeText(text));
}

function getSpecificModelTokens(query = "") {
  return normalizeText(query)
    .split(/\s+/)
    .filter((token) => (
      /[a-z]+\d|\d+[a-z]/.test(token)
      || /^s\d{2}$/.test(token)
      || /^a\d{2}$/.test(token)
      || /^\d{3,4}hz$/.test(token)
      || /^be\d{3,5}$/.test(token)
    ));
}

function isRelevantOfferForQuery(offer = {}, query = "") {
  const normalizedQuery = normalizeText(query);
  const strictTitleHaystack = [
    offer.title,
    offer.displayTitle,
    offer.brand,
    offer.model,
  ].filter(Boolean).join(" ");
  const haystack = [
    offer.title,
    offer.displayTitle,
    offer.brand,
    offer.model,
    Array.isArray(offer.searchKeywords) ? offer.searchKeywords.join(" ") : "",
  ].filter(Boolean).join(" ");

  if (isPrincipalDeviceQuery(normalizedQuery) && isAccessoryTitle(haystack) && !isAccessoryTitle(normalizedQuery)) {
    return false;
  }

  const strictModelTokens = getSpecificModelTokens(normalizedQuery);
  const normalizedTitleHaystack = normalizeText(strictTitleHaystack);
  if (strictModelTokens.length && !strictModelTokens.every((token) => normalizedTitleHaystack.includes(token))) {
    return false;
  }

  const guardedFamilies = [
    { query: ["iphone", "apple"], offer: ["iphone", "apple"] },
    { query: ["galaxy", "samsung", "s26", "s25", "s24"], offer: ["galaxy", "samsung", "s26", "s25", "s24"] },
    { query: ["xiaomi", "be6500"], offer: ["xiaomi", "be6500"] },
  ];
  const mismatchedFamily = guardedFamilies.some((family) => (
    hasAnyToken(normalizedQuery, family.query)
    && !hasAnyToken(haystack, family.offer)
  ));
  if (mismatchedFamily) return false;

  const tokens = normalizedQuery.split(/\s+/).filter((token) => token.length > 1);
  if (tokens.length >= 3) {
    const hits = tokenHits(normalizedQuery, haystack);
    return hits >= Math.max(2, Math.ceil(tokens.length * 0.35));
  }

  return tokenHits(normalizedQuery, haystack) >= 1;
}

function offerSearchScore(offer = {}, query = "") {
  const haystack = [
    offer.title,
    offer.displayTitle,
    offer.brand,
    offer.model,
    offer.category,
    offer.normalizedCategory,
    offer.department,
    Array.isArray(offer.searchKeywords) ? offer.searchKeywords.join(" ") : "",
  ].filter(Boolean).join(" ");
  const normalizedQuery = normalizeText(query);
  const hits = tokenHits(normalizedQuery, haystack);
  const tokenCount = Math.max(1, normalizedQuery.split(/\s+/).filter(Boolean).length);
  const fullMatchBonus = normalizeText(haystack).includes(normalizedQuery) ? 3 : 0;
  const exactModelBonus = offer.model && normalizedQuery.includes(normalizeText(offer.model)) ? 3 : 0;
  const semanticScore = scoreProductMatch({
    title: offer.title,
    category: offer.category,
    brand: offer.brand,
    model: offer.model,
  }, query);
  return semanticScore + (hits / tokenCount) * 4 + fullMatchBonus + exactModelBonus;
}

function offerRelevanceScore(offer = {}, query = "") {
  const haystack = [
    offer.title,
    offer.displayTitle,
    offer.brand,
    offer.model,
    Array.isArray(offer.searchKeywords) ? offer.searchKeywords.join(" ") : "",
  ].filter(Boolean).join(" ");
  const normalizedQuery = normalizeText(query);
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const hits = tokenHits(normalizedQuery, haystack);
  const ratio = tokens.length ? hits / tokens.length : 0;
  const exactModel = offer.model && normalizedQuery.includes(normalizeText(offer.model));
  const exactTitle = normalizedQuery && normalizeText(haystack).includes(normalizedQuery);
  return Math.max(0.1, Math.min(1, ratio + (exactModel ? 0.2 : 0) + (exactTitle ? 0.1 : 0)));
}

export default class VerifiedAffiliateOfferProvider {
  constructor({ offers = VERIFIED_AFFILIATE_OFFERS, referenceDate = null } = {}) {
    this.offers = Array.isArray(offers) ? offers : [];
    this.referenceDate = referenceDate instanceof Date ? referenceDate : null;
  }

  getDiagnostics() {
    const referenceDate = this.referenceDate || new Date();
    const visibleOffers = this.offers.filter((offer) => (
      isScreenedOfferVisible(offer, referenceDate)
      && isVerifiedAffiliateOfferFresh(offer, referenceDate)
      && isVerifiedAffiliateOfferAutomatedSourceAllowed(offer)
      && isTrustedPartnerOffer(offer)
    ));
    return {
      configured: visibleOffers.length > 0,
      hasCatalog: visibleOffers.length > 0,
      provider: "verified_affiliate_offers",
      offers: visibleOffers.length,
      totalOffers: this.offers.length,
    };
  }

  async searchProducts(query = "", options = {}) {
    const limit = Math.max(1, toNumber(options.limit, 12));
    const referenceDate = options.referenceDate instanceof Date ? options.referenceDate : (this.referenceDate || new Date());
    const normalizedQuery = normalizeText(query);
    const ranked = this.offers
      .filter((offer) => (
        isScreenedOfferVisible(offer, referenceDate)
        && isVerifiedAffiliateOfferFresh(offer, referenceDate)
        && isVerifiedAffiliateOfferAutomatedSourceAllowed(offer)
        && isTrustedPartnerOffer(offer)
        && isRelevantOfferForQuery(offer, normalizedQuery)
      ))
      .map((offer) => ({
        ...offer,
        matchScore: offerSearchScore(offer, normalizedQuery),
      }))
      .filter((offer) => offer.matchScore >= 0.9)
      .map((offer) => ({
        ...offer,
        oqc: {
          ...(offer.oqc || {}),
          relevanceScore: offerRelevanceScore(offer, normalizedQuery),
        },
        score: Math.max(1, Math.round(offer.matchScore * 10)),
      }))
      .sort((left, right) => right.matchScore - left.matchScore)
      .slice(0, limit);

    return {
      provider: "verified_affiliate_offers",
      products: ranked,
      rawCount: ranked.length,
      returnedCount: ranked.length,
      statusHttp: 200,
      fallbackText: ranked.length ? "Encontramos ofertas verificadas em fontes parceiras." : "",
    };
  }
}
