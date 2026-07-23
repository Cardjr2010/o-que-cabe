import https from "node:https";
import http from "node:http";
import { VERIFIED_AFFILIATE_OFFERS, isVerifiedAffiliateOfferFresh } from "../src/data/verified-affiliate-offers.js";
import { ACTIVE_OFFER_CAMPAIGNS, isCampaignActive, isCampaignFresh } from "../src/data/offer-campaigns.js";

function fetchUrl(url, redirects = 0) {
  return new Promise((resolve) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.request(url, {
      method: "GET",
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36",
        "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    }, (res) => {
      const status = res.statusCode || 0;
      const location = res.headers.location;
      if (location && status >= 300 && status < 400 && redirects < 5) {
        const next = new URL(location, url).toString();
        res.resume();
        resolve(fetchUrl(next, redirects + 1));
        return;
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        if (body.length < 250000) body += chunk;
      });
      res.on("end", () => {
        const titleMatch = body.match(/<title[^>]*>([^<]+)<\/title>/i);
        const normalized = body.toLowerCase();
        const signals = [];
        for (const keyword of [
          "esgotado",
          "indisponível",
          "indisponivel",
          "sem estoque",
          "out of stock",
          "unavailable",
          "produto não encontrado",
          "produto nao encontrado",
          "captcha",
          "não é possível acessar a página",
        ]) {
          if (normalized.includes(keyword)) signals.push(keyword);
        }
        resolve({
          status,
          title: titleMatch ? titleMatch[1].trim() : "",
          signals,
        });
      });
    });
    req.on("error", (error) => resolve({ status: 0, title: "", signals: [], error: error.message }));
    req.setTimeout(15000, () => req.destroy(new Error("timeout")));
    req.end();
  });
}

function classifyOffer(result = {}) {
  if (result.error) return "erro";
  if (result.status === 403) return "bloqueado";
  if (result.signals.some((item) => item.includes("captcha"))) return "bloqueado";
  if (result.signals.some((item) => item.includes("não é possível acessar a página"))) return "bloqueado";
  if (result.signals.some((item) => item.includes("esgotado") || item.includes("indispon"))) return "indisponivel";
  if (result.status >= 200 && result.status < 300) return "acessivel";
  return "incerto";
}

const now = new Date();
const offers = [];

for (const offer of VERIFIED_AFFILIATE_OFFERS) {
  const checkedUrl = offer.permalink || offer.productUrl || offer.affiliateUrl || "";
  const probe = checkedUrl ? await fetchUrl(checkedUrl) : { status: 0, title: "", signals: ["sem_url"] };
  offers.push({
    id: offer.id,
    title: offer.displayTitle || offer.title,
    source: offer.sourceLabel || offer.sourceName || offer.source,
    verifiedAt: offer.verifiedAt || null,
    fresh: isVerifiedAffiliateOfferFresh(offer, now),
    status: classifyOffer(probe),
    httpStatus: probe.status,
    pageTitle: probe.title,
    signals: probe.signals,
    checkedUrl,
  });
}

const campaigns = ACTIVE_OFFER_CAMPAIGNS.map((campaign) => ({
  id: campaign.id,
  code: campaign.coupon?.code || null,
  validUntil: campaign.validUntil || null,
  active: isCampaignActive(campaign, now),
  fresh: isCampaignFresh(campaign, now),
}));

console.log(JSON.stringify({
  auditedAt: now.toISOString(),
  offers,
  campaigns,
}, null, 2));
