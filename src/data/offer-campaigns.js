function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function toDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

const MAX_CAMPAIGN_VERIFICATION_AGE_HOURS = 48;

export const ACTIVE_OFFER_CAMPAIGNS = [
  {
    id: "magalu-pushfullsu-screened",
    source: "magalu",
    sourceLabel: "Magalu",
    headline: "Cupom PUSHFULLSU",
    label: "Suplementos a partir de R$ 20,90",
    description: "Campanha oficial observada por screener da Magalu para suplementos com ate 40% OFF, valida somente durante a janela informada no post.",
    query: "suplementos",
    intent: {
      query: "suplementos",
      mode: "total",
      totalBudget: 120,
      months: 12,
    },
    validUntil: "2026-07-20T23:59:59-03:00",
    badge: "ate 40% OFF",
    disclaimer: "Campanha capturada de canal oficial. O OQC so deve exibir produtos manualmente validados e apenas enquanto essa janela estiver ativa.",
    coupon: {
      source: "magalu_screened_campaign",
      code: "PUSHFULLSU",
      type: "percent",
      value: 40,
      minimumPurchase: 20.9,
      maximumDiscount: null,
      validUntil: "2026-07-20T23:59:59-03:00",
      verifiedAt: "2026-07-20T11:43:00-03:00",
      status: "verified",
    },
    offerIds: [],
    screenedSource: "manual_screener",
  },
  {
    id: "meli-vipmeli-15off",
    source: "mercado_livre",
    sourceLabel: "Mercado Livre",
    headline: "Cupom VIPMELI",
    label: "15% OFF ate R$ 60",
    description: "Campanha de hoje para itens selecionados do Mercado Livre com desconto limitado a R$ 60.",
    query: "iphone 17 pro max",
    intent: {
      query: "iphone 17 pro max 256gb",
      mode: "total",
      totalBudget: 12000,
      months: 12,
    },
    validUntil: "2026-07-20T23:59:59-03:00",
    badge: "15% OFF",
    disclaimer: "Campanha verificada hoje. Confirme a elegibilidade do anuncio antes de fechar a compra.",
    coupon: {
      source: "mercado_livre_campaign",
      code: "VIPMELI",
      type: "fixed",
      value: 60,
      minimumPurchase: 79,
      maximumDiscount: 60,
      validUntil: "2026-07-20T23:59:59-03:00",
      verifiedAt: "2026-07-20T10:00:00-03:00",
      status: "verified",
    },
    offerIds: [
      "verified-ml-iphone-17-pro-max-256gb",
      "verified-ml-galaxy-s26-ultra-256gb",
    ],
  },
  {
    id: "meli-cupompracasa-18off",
    source: "mercado_livre",
    sourceLabel: "Mercado Livre",
    headline: "Cupom CUPOMPRACASA",
    label: "18% OFF para itens de casa",
    description: "Cupom de campanha para produtos selecionados da casa, utilidades e organizacao.",
    query: "casa",
    intent: {
      query: "casa",
      mode: "total",
      totalBudget: 300,
      months: 12,
    },
    validUntil: "2026-07-26T23:59:59-03:00",
    badge: "18% OFF",
    disclaimer: "Campanha de categoria. O desconto depende da selecao da loja no momento da compra.",
    coupon: {
      source: "mercado_livre_campaign",
      code: "CUPOMPRACASA",
      type: "percent",
      value: 18,
      minimumPurchase: 79,
      maximumDiscount: null,
      validUntil: "2026-07-26T23:59:59-03:00",
      verifiedAt: "2026-07-20T10:00:00-03:00",
      status: "verified",
    },
    offerIds: [],
  },
  {
    id: "meli-melibarato-18off",
    source: "mercado_livre",
    sourceLabel: "Mercado Livre",
    headline: "Cupom MELIBARATO",
    label: "18% OFF em produtos selecionados",
    description: "Campanha ampla de desconto para itens selecionados acima do minimo exigido pela loja.",
    query: "celular",
    intent: {
      query: "celular",
      mode: "total",
      totalBudget: 1500,
      months: 12,
    },
    validUntil: "2026-07-26T23:59:59-03:00",
    badge: "18% OFF",
    disclaimer: "Cupom verificado no painel de campanha. Valide a elegibilidade do item antes de pagar.",
    coupon: {
      source: "mercado_livre_campaign",
      code: "MELIBARATO",
      type: "percent",
      value: 18,
      minimumPurchase: 79,
      maximumDiscount: null,
      validUntil: "2026-07-26T23:59:59-03:00",
      verifiedAt: "2026-07-20T10:00:00-03:00",
      status: "verified",
    },
    offerIds: [],
  },
];

export function isCampaignActive(campaign = {}, referenceDate = new Date()) {
  const validUntil = toDate(campaign.validUntil);
  if (!validUntil) return true;
  return validUntil.getTime() >= referenceDate.getTime();
}

export function isCampaignFresh(campaign = {}, referenceDate = new Date()) {
  const verifiedAt = toDate(campaign?.coupon?.verifiedAt || campaign?.verifiedAt);
  if (!verifiedAt) return false;
  const ageMs = referenceDate.getTime() - verifiedAt.getTime();
  return ageMs >= 0 && ageMs <= MAX_CAMPAIGN_VERIFICATION_AGE_HOURS * 60 * 60 * 1000;
}

export function listActiveOfferCampaigns(referenceDate = new Date()) {
  return ACTIVE_OFFER_CAMPAIGNS.filter((campaign) => (
    isCampaignActive(campaign, referenceDate)
    && isCampaignFresh(campaign, referenceDate)
  ));
}

export function isScreenedOfferVisible(offer = {}, referenceDate = new Date()) {
  const visibleFrom = toDate(offer.visibleFrom || offer.validFrom || offer.startsAt);
  const visibleUntil = toDate(offer.visibleUntil || offer.validUntil || offer.endsAt);
  if (visibleFrom && visibleFrom.getTime() > referenceDate.getTime()) return false;
  if (visibleUntil && visibleUntil.getTime() < referenceDate.getTime()) return false;
  return true;
}

export function resolveCampaignCouponForProduct(product = {}, referenceDate = new Date()) {
  const productId = String(product.id || "").trim();
  if (!productId) return null;
  const campaign = listActiveOfferCampaigns(referenceDate).find((item) => Array.isArray(item.offerIds) && item.offerIds.includes(productId));
  return campaign?.coupon || null;
}

export function buildCampaignCards(referenceDate = new Date()) {
  return listActiveOfferCampaigns(referenceDate).map((campaign) => ({
    id: campaign.id,
    source: campaign.source,
    sourceLabel: campaign.sourceLabel,
    headline: campaign.headline,
    label: campaign.label,
    description: campaign.description,
    query: campaign.query,
    intent: campaign.intent || null,
    validUntil: campaign.validUntil || null,
    badge: campaign.badge || null,
    disclaimer: campaign.disclaimer || "",
    code: campaign.coupon?.code || null,
    benefitType: campaign.coupon?.type || "fixed",
    benefitValue: campaign.coupon?.value || 0,
  }));
}

export default {
  ACTIVE_OFFER_CAMPAIGNS,
  buildCampaignCards,
  listActiveOfferCampaigns,
  resolveCampaignCouponForProduct,
  isScreenedOfferVisible,
  isCampaignFresh,
};
