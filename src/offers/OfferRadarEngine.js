import { ACTIVE_OFFER_CAMPAIGNS, isCampaignActive, isCampaignFresh } from "../data/offer-campaigns.js";
import { OFFER_RADAR_TARGETS } from "../data/offer-radar-targets.js";
import {
  VERIFIED_AFFILIATE_OFFERS,
  isVerifiedAffiliateOfferAutomatedSourceAllowed,
  isVerifiedAffiliateOfferFresh,
  isVerifiedAffiliateOfferLinkHealthy,
} from "../data/verified-affiliate-offers.js";

const SOURCE_LABELS = {
  amazon: "Amazon",
  mercado_livre: "Mercado Livre",
  magalu: "Magalu",
  shopee: "Shopee",
  casas_bahia: "Casas Bahia",
  verified_partner_offers: "Ofertas verificadas",
};

function sourceKey(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function sourceOfOffer(offer = {}) {
  return sourceKey(offer.sourceName || offer.sourceLabel || offer.seller?.name || offer.source || "unknown");
}

function labelForSource(source = "") {
  const key = sourceKey(source);
  return SOURCE_LABELS[key] || String(source || "Fonte desconhecida");
}

function hoursBetween(left, right) {
  const diffMs = right.getTime() - left.getTime();
  return diffMs / (60 * 60 * 1000);
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function freshnessDate(offer = {}) {
  return [
    offer.lastCheckedAt,
    offer.verifiedAt,
    offer.updatedAt,
  ]
    .map(parseDate)
    .filter(Boolean)
    .sort((left, right) => right.getTime() - left.getTime())[0] || null;
}

function groupBySource(items = [], getSource = (item) => item.source) {
  const grouped = {};
  for (const item of items) {
    const key = sourceKey(getSource(item));
    if (!grouped[key]) {
      grouped[key] = {
        source: key,
        label: labelForSource(key),
        total: 0,
      };
    }
    grouped[key].total += 1;
  }
  return Object.values(grouped).sort((left, right) => right.total - left.total);
}

function classifyOffer(offer = {}, referenceDate = new Date()) {
  const allowed = isVerifiedAffiliateOfferAutomatedSourceAllowed(offer);
  const linkStatus = String(offer?.linkValidation?.status || "").trim().toLowerCase();
  const healthy = isVerifiedAffiliateOfferLinkHealthy(offer, referenceDate);
  const fresh = isVerifiedAffiliateOfferFresh(offer, referenceDate);
  const checkedAt = freshnessDate(offer);
  const ageHours = checkedAt ? hoursBetween(checkedAt, referenceDate) : null;

  if (!allowed) return "blocked_source";
  if (!healthy && linkStatus && linkStatus !== "direct_product") return "invalid_link";
  if (fresh) return "fresh";
  if (ageHours === null) return "missing_validation";
  return "stale";
}

function buildOfferSummary(offers = [], referenceDate = new Date()) {
  const rows = offers.map((offer) => ({
    offer,
    source: sourceOfOffer(offer),
    state: classifyOffer(offer, referenceDate),
    checkedAt: freshnessDate(offer)?.toISOString() || null,
  }));
  const counts = rows.reduce((acc, row) => {
    acc[row.state] = (acc[row.state] || 0) + 1;
    return acc;
  }, {});
  return {
    total: rows.length,
    fresh: counts.fresh || 0,
    stale: counts.stale || 0,
    blockedSource: counts.blocked_source || 0,
    invalidLink: counts.invalid_link || 0,
    missingValidation: counts.missing_validation || 0,
    bySource: groupBySource(rows, (row) => row.source),
    staleExamples: rows
      .filter((row) => row.state === "stale" || row.state === "missing_validation")
      .slice(0, 8)
      .map((row) => ({
        id: row.offer.id,
        title: row.offer.displayTitle || row.offer.title,
        source: labelForSource(row.source),
        checkedAt: row.checkedAt,
      })),
  };
}

function buildCampaignSummary(campaigns = [], referenceDate = new Date()) {
  const rows = campaigns.map((campaign) => {
    const active = isCampaignActive(campaign, referenceDate);
    const fresh = isCampaignFresh(campaign, referenceDate);
    return {
      campaign,
      source: sourceKey(campaign.source),
      active,
      fresh,
      state: active && fresh ? "active" : (active ? "stale" : "expired"),
    };
  });
  const counts = rows.reduce((acc, row) => {
    acc[row.state] = (acc[row.state] || 0) + 1;
    return acc;
  }, {});
  return {
    total: rows.length,
    active: counts.active || 0,
    stale: counts.stale || 0,
    expired: counts.expired || 0,
    bySource: groupBySource(rows, (row) => row.source),
    expiredOrStaleExamples: rows
      .filter((row) => row.state !== "active")
      .slice(0, 8)
      .map((row) => ({
        id: row.campaign.id,
        label: row.campaign.label || row.campaign.headline,
        source: labelForSource(row.source),
        validUntil: row.campaign.validUntil || null,
        verifiedAt: row.campaign.coupon?.verifiedAt || row.campaign.verifiedAt || null,
        state: row.state,
      })),
  };
}

function buildTargetCoverage(targets = [], offers = [], referenceDate = new Date()) {
  const freshOffers = offers.filter((offer) => isVerifiedAffiliateOfferFresh(offer, referenceDate));
  return targets.map((target) => {
    const aliases = [target.query, ...(target.aliases || [])].map(sourceKey).filter(Boolean);
    const matches = freshOffers.filter((offer) => {
      const haystack = [
        offer.title,
        offer.displayTitle,
        offer.brand,
        offer.model,
        offer.category,
        Array.isArray(offer.searchKeywords) ? offer.searchKeywords.join(" ") : "",
      ].map(sourceKey).join(" ");
      return aliases.some((alias) => haystack.includes(alias));
    });
    return {
      id: target.id,
      label: target.label,
      query: target.query,
      category: target.category,
      freshOffers: matches.length,
      sources: groupBySource(matches, sourceOfOffer).map((item) => item.label),
      status: matches.length >= 3 ? "good" : (matches.length > 0 ? "thin" : "empty"),
    };
  });
}

function buildRecommendedActions(offerSummary, campaignSummary, targetCoverage) {
  const actions = [];
  if (offerSummary.stale || offerSummary.missingValidation || offerSummary.invalidLink) {
    actions.push({
      priority: "high",
      action: "revalidate_offers",
      label: "Revalidar ofertas antigas antes de exibir",
      reason: `${offerSummary.stale + offerSummary.missingValidation + offerSummary.invalidLink} ofertas precisam de nova leitura ou revisao.`,
    });
  }
  if (campaignSummary.stale || campaignSummary.expired) {
    actions.push({
      priority: "high",
      action: "remove_or_refresh_campaigns",
      label: "Remover ou atualizar campanhas vencidas",
      reason: `${campaignSummary.stale + campaignSummary.expired} campanhas nao podem aparecer como ativas.`,
    });
  }
  const emptyTargets = targetCoverage.filter((target) => target.status === "empty");
  const thinTargets = targetCoverage.filter((target) => target.status === "thin");
  if (emptyTargets.length || thinTargets.length) {
    actions.push({
      priority: "medium",
      action: "collect_priority_products",
      label: "Capturar produtos prioritarios por screener/link direto",
      reason: `${emptyTargets.length} alvos sem oferta fresca e ${thinTargets.length} com cobertura fina.`,
      targets: [...emptyTargets, ...thinTargets].slice(0, 8).map((target) => target.label),
    });
  }
  actions.push({
    priority: "medium",
    action: "use_offer_intake_as_primary_path",
    label: "Usar intake de ofertas como caminho principal",
    reason: "A API aberta do Mercado Livre segue bloqueada por 403; links diretos e paginas de campanha sao a rota operacional.",
  });
  return actions;
}

export class OfferRadarEngine {
  constructor({
    offers = VERIFIED_AFFILIATE_OFFERS,
    campaigns = ACTIVE_OFFER_CAMPAIGNS,
    targets = OFFER_RADAR_TARGETS,
    referenceDate = null,
  } = {}) {
    this.offers = Array.isArray(offers) ? offers : [];
    this.campaigns = Array.isArray(campaigns) ? campaigns : [];
    this.targets = Array.isArray(targets) ? targets : [];
    this.referenceDate = referenceDate instanceof Date ? referenceDate : null;
  }

  buildStatus(referenceDate = this.referenceDate || new Date()) {
    const offerSummary = buildOfferSummary(this.offers, referenceDate);
    const campaignSummary = buildCampaignSummary(this.campaigns, referenceDate);
    const targetCoverage = buildTargetCoverage(this.targets, this.offers, referenceDate);
    return {
      ok: true,
      generatedAt: referenceDate.toISOString(),
      mode: "offer_intake_first",
      marketplaceApi: {
        mercadoLivreOpenSearch: "blocked_403",
        amazonCreatorsApi: "blocked_associate_not_eligible",
      },
      offers: offerSummary,
      campaigns: campaignSummary,
      targetCoverage,
      recommendedActions: buildRecommendedActions(offerSummary, campaignSummary, targetCoverage),
    };
  }
}

export default OfferRadarEngine;
