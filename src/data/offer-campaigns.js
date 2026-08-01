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
    id: "meli-descontodoml-20off-2026-08-02",
    source: "mercado_livre",
    sourceLabel: "Mercado Livre",
    headline: "Cupom DESCONTODOML",
    label: "20% OFF em produtos selecionados",
    description: "Campanha de cupom do Mercado Livre capturada do export Telegram de afiliados. Nao representa produto individual.",
    query: "ofertas mercado livre",
    intent: {
      query: "ofertas mercado livre",
      mode: "total",
      totalBudget: 300,
      months: 12,
    },
    externalUrl: "https://bit.ly/4pGnXwJ",
    validUntil: "2026-08-02T23:59:59-03:00",
    verifiedAt: "2026-07-31T20:30:00-03:00",
    badge: "20% OFF",
    disclaimer: "Cupom de campanha. O OQC nao aplica esse desconto ao preco principal sem validar a elegibilidade do produto.",
    coupon: {
      source: "telegram_mercado_livre_campaign",
      code: "DESCONTODOML",
      type: "percent",
      value: 20,
      minimumPurchase: 79,
      maximumDiscount: null,
      validUntil: "2026-08-02T23:59:59-03:00",
      verifiedAt: "2026-07-31T20:30:00-03:00",
      status: "verified",
    },
    offerIds: [],
    screenedSource: "telegram_affiliate_export",
  },
  {
    id: "meli-cupomnoml-22off-2026-08-02",
    source: "mercado_livre",
    sourceLabel: "Mercado Livre",
    headline: "Cupom CUPOMNOML",
    label: "22% OFF em produtos selecionados",
    description: "Campanha de cupom do Mercado Livre capturada do export Telegram de afiliados. Nao representa produto individual.",
    query: "ofertas mercado livre",
    intent: {
      query: "ofertas mercado livre",
      mode: "total",
      totalBudget: 300,
      months: 12,
    },
    externalUrl: "https://bit.ly/4fq6uoQ",
    validUntil: "2026-08-02T23:59:59-03:00",
    verifiedAt: "2026-07-31T20:30:00-03:00",
    badge: "22% OFF",
    disclaimer: "Cupom de campanha. O OQC nao aplica esse desconto ao preco principal sem validar a elegibilidade do produto.",
    coupon: {
      source: "telegram_mercado_livre_campaign",
      code: "CUPOMNOML",
      type: "percent",
      value: 22,
      minimumPurchase: 29,
      maximumDiscount: null,
      validUntil: "2026-08-02T23:59:59-03:00",
      verifiedAt: "2026-07-31T20:30:00-03:00",
      status: "verified",
    },
    offerIds: [],
    screenedSource: "telegram_affiliate_export",
  },
  {
    id: "meli-ofertas-25off-2026-08-02",
    source: "mercado_livre",
    sourceLabel: "Mercado Livre",
    headline: "Cupom OFERTAS",
    label: "25% OFF em produtos selecionados",
    description: "Campanha de cupom do Mercado Livre capturada do export Telegram de afiliados. Nao representa produto individual.",
    query: "ofertas mercado livre",
    intent: {
      query: "ofertas mercado livre",
      mode: "total",
      totalBudget: 300,
      months: 12,
    },
    externalUrl: "https://bit.ly/4wkj7aY",
    validUntil: "2026-08-02T23:59:59-03:00",
    verifiedAt: "2026-07-31T20:30:00-03:00",
    badge: "25% OFF",
    disclaimer: "Cupom de campanha. O OQC nao aplica esse desconto ao preco principal sem validar a elegibilidade do produto.",
    coupon: {
      source: "telegram_mercado_livre_campaign",
      code: "OFERTAS",
      type: "percent",
      value: 25,
      minimumPurchase: 29,
      maximumDiscount: null,
      validUntil: "2026-08-02T23:59:59-03:00",
      verifiedAt: "2026-07-31T20:30:00-03:00",
      status: "verified",
    },
    offerIds: [],
    screenedSource: "telegram_affiliate_export",
  },
  {
    id: "meli-meliacha-22off-2026-08-02",
    source: "mercado_livre",
    sourceLabel: "Mercado Livre",
    headline: "Cupom MELIACHA",
    label: "22% OFF em achadinhos selecionados",
    description: "Campanha de cupom do Mercado Livre capturada do export Telegram de afiliados. Nao representa produto individual.",
    query: "achadinhos mercado livre",
    intent: {
      query: "achadinhos mercado livre",
      mode: "total",
      totalBudget: 300,
      months: 12,
    },
    externalUrl: "https://bit.ly/3THEuVf",
    validUntil: "2026-08-02T23:59:59-03:00",
    verifiedAt: "2026-07-31T20:30:00-03:00",
    badge: "22% OFF",
    disclaimer: "Cupom de campanha. O OQC nao aplica esse desconto ao preco principal sem validar a elegibilidade do produto.",
    coupon: {
      source: "telegram_mercado_livre_campaign",
      code: "MELIACHA",
      type: "percent",
      value: 22,
      minimumPurchase: 29,
      maximumDiscount: null,
      validUntil: "2026-08-02T23:59:59-03:00",
      verifiedAt: "2026-07-31T20:30:00-03:00",
      status: "verified",
    },
    offerIds: [],
    screenedSource: "telegram_affiliate_export",
  },
  {
    id: "meli-queropromo-25off-2026-08-02",
    source: "mercado_livre",
    sourceLabel: "Mercado Livre",
    headline: "Cupom QUEROPROMO",
    label: "25% OFF em produtos selecionados",
    description: "Campanha de cupom do Mercado Livre capturada do export Telegram de afiliados. Nao representa produto individual.",
    query: "promocoes mercado livre",
    intent: {
      query: "promocoes mercado livre",
      mode: "total",
      totalBudget: 300,
      months: 12,
    },
    externalUrl: "https://bit.ly/4fnMxz1",
    validUntil: "2026-08-02T23:59:59-03:00",
    verifiedAt: "2026-07-31T20:30:00-03:00",
    badge: "25% OFF",
    disclaimer: "Cupom de campanha. O OQC nao aplica esse desconto ao preco principal sem validar a elegibilidade do produto.",
    coupon: {
      source: "telegram_mercado_livre_campaign",
      code: "QUEROPROMO",
      type: "percent",
      value: 25,
      minimumPurchase: 29,
      maximumDiscount: null,
      validUntil: "2026-08-02T23:59:59-03:00",
      verifiedAt: "2026-07-31T20:30:00-03:00",
      status: "verified",
    },
    offerIds: [],
    screenedSource: "telegram_affiliate_export",
  },
  {
    id: "meli-bikeminions1p-15off-2026-08-05",
    source: "mercado_livre",
    sourceLabel: "Mercado Livre",
    headline: "Cupom BIKEMINIONS1P",
    label: "15% OFF em produtos selecionados",
    description: "Campanha de cupom do Mercado Livre capturada do export Telegram de afiliados. Nao representa produto individual.",
    query: "tablet positivo minions",
    intent: {
      query: "tablet positivo minions",
      mode: "total",
      totalBudget: 800,
      months: 12,
    },
    externalUrl: "https://bit.ly/4wwB3zl",
    validUntil: "2026-08-05T23:59:59-03:00",
    verifiedAt: "2026-07-31T20:30:00-03:00",
    badge: "15% OFF",
    disclaimer: "Cupom de campanha. O OQC nao aplica esse desconto ao preco principal sem validar a elegibilidade do produto.",
    coupon: {
      source: "telegram_mercado_livre_campaign",
      code: "BIKEMINIONS1P",
      type: "percent",
      value: 15,
      minimumPurchase: 100,
      maximumDiscount: null,
      validUntil: "2026-08-05T23:59:59-03:00",
      verifiedAt: "2026-07-31T20:30:00-03:00",
      status: "verified",
    },
    offerIds: [],
    screenedSource: "telegram_affiliate_export",
  },
  {
    id: "amazon-bestsellers-br-2026-07-28",
    source: "amazon",
    sourceLabel: "Amazon",
    headline: "Mais vendidos da Amazon",
    label: "Ranking vivo para descobrir produtos fortes",
    description: "Pagina oficial de mais vendidos da Amazon Brasil com link afiliado. Use como radar de demanda; produtos individuais so entram no OQC quando houver link direto validado.",
    query: "mais vendidos amazon",
    intent: {
      query: "mais vendidos amazon",
      mode: "total",
      totalBudget: 1500,
      months: 12,
    },
    externalUrl: "https://www.amazon.com.br/gp/bestsellers?&linkCode=ll2&tag=candombledesm-20&linkId=23c060689b1aed809c2085551d458441&ref_=as_li_ss_tl",
    validUntil: "2026-07-30T23:59:59-03:00",
    verifiedAt: "2026-07-28T10:00:00-03:00",
    badge: "Radar Amazon",
    disclaimer: "Ranking de categoria, nao produto individual. O OQC usa essa pagina para priorizar quais itens merecem monitoramento e validacao manual.",
    coupon: {
      source: "amazon_bestsellers_radar",
      code: null,
      type: "none",
      value: 0,
      minimumPurchase: null,
      maximumDiscount: null,
      validUntil: "2026-07-30T23:59:59-03:00",
      verifiedAt: "2026-07-28T10:00:00-03:00",
      status: "verified",
    },
    offerIds: [],
    screenedSource: "amazon_bestsellers_page",
  },
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
    externalUrl: campaign.externalUrl || null,
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
