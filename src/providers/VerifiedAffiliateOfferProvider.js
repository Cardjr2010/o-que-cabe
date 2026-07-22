import { normalizeText, scoreProductMatch } from "../catalog/ProductNormalizer.js";
import { VERIFIED_AFFILIATE_OFFERS } from "../data/verified-affiliate-offers.js";
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
  constructor({ offers = VERIFIED_AFFILIATE_OFFERS } = {}) {
    this.offers = Array.isArray(offers) ? offers : [];
  }

  getDiagnostics(options = {}) {
    const referenceDate = options.referenceDate || new Date();
    const visibleOffers = this.offers.filter((offer) => isScreenedOfferVisible(offer, referenceDate));
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
    const referenceDate = options.referenceDate || new Date();
    const normalizedQuery = normalizeText(query);
    const ranked = this.offers
      .filter((offer) => isScreenedOfferVisible(offer, referenceDate))
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
