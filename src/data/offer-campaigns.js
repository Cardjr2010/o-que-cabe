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

export const ACTIVE_OFFER_CAMPAIGNS = [
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

export function listActiveOfferCampaigns(referenceDate = new Date()) {
  return ACTIVE_OFFER_CAMPAIGNS.filter((campaign) => isCampaignActive(campaign, referenceDate));
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
};
