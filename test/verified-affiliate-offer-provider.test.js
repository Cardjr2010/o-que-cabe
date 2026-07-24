import test from "node:test";
import assert from "node:assert/strict";
import VerifiedAffiliateOfferProvider from "../src/providers/VerifiedAffiliateOfferProvider.js";
import { isScreenedOfferVisible, listActiveOfferCampaigns } from "../src/data/offer-campaigns.js";
import {
  isVerifiedAffiliateOfferAutomatedSourceAllowed,
  isVerifiedAffiliateOfferFresh,
  isVerifiedAffiliateOfferLinkHealthy,
} from "../src/data/verified-affiliate-offers.js";

test("campanha capturada por screener respeita a data de validade", () => {
  const activeOnDay = listActiveOfferCampaigns(new Date("2026-07-20T12:00:00-03:00"));
  const expiredAfterDay = listActiveOfferCampaigns(new Date("2026-07-21T09:00:00-03:00"));

  assert.ok(activeOnDay.some((campaign) => campaign.id === "magalu-pushfullsu-screened"));
  assert.ok(!expiredAfterDay.some((campaign) => campaign.id === "magalu-pushfullsu-screened"));
});

test("oferta verificada com janela expirada nao entra na busca", async () => {
  const provider = new VerifiedAffiliateOfferProvider({
    offers: [
      {
        id: "offer-expired",
        title: "Apple iPhone 17 Pro Max 256GB",
        displayTitle: "Apple iPhone 17 Pro Max 256GB",
        brand: "Apple",
        model: "iPhone 17 Pro Max 256GB",
        category: "celular",
        normalizedCategory: "celular",
        visibleUntil: "2026-07-19T23:59:59-03:00",
        affiliateUrl: "https://example.com/expired",
      },
      {
        id: "offer-active",
        title: "Apple iPhone 17 Pro Max 256GB",
        displayTitle: "Apple iPhone 17 Pro Max 256GB",
        brand: "Apple",
        model: "iPhone 17 Pro Max 256GB",
        category: "celular",
        normalizedCategory: "celular",
        visibleUntil: "2026-07-25T23:59:59-03:00",
        verifiedAt: "2026-07-24T10:07:00.000Z",
        lastCheckedAt: "2026-07-24T10:07:00.000Z",
        linkValidation: { status: "direct_product", checkedAt: "2026-07-24T10:07:00.000Z" },
        affiliateUrl: "https://example.com/active",
      },
    ],
  });

  const result = await provider.searchProducts("iphone 17 pro max", { limit: 10 });

  assert.equal(result.products.length, 1);
  assert.equal(result.products[0].id, "offer-active");
});

test("isScreenedOfferVisible aceita oferta sem janela e bloqueia janela futura", () => {
  assert.equal(isScreenedOfferVisible({}), true);
  assert.equal(
    isScreenedOfferVisible(
      { visibleFrom: "2026-07-21T00:00:00-03:00" },
      new Date("2026-07-20T10:00:00-03:00"),
    ),
    false,
  );
});

test("oferta verificada antiga deixa de aparecer mesmo com link manual", async () => {
  assert.equal(
    isVerifiedAffiliateOfferFresh(
      { verifiedAt: "2026-07-19T00:00:00.000Z" },
      new Date("2026-07-23T12:00:00.000Z"),
    ),
    false,
  );

  const provider = new VerifiedAffiliateOfferProvider({
    offers: [
      {
        id: "offer-stale",
        title: "Apple iPhone 17 Pro Max 256GB",
        displayTitle: "Apple iPhone 17 Pro Max 256GB",
        brand: "Apple",
        model: "iPhone 17 Pro Max 256GB",
        category: "celular",
        normalizedCategory: "celular",
        verifiedAt: "2026-07-19T00:00:00.000Z",
        affiliateUrl: "https://example.com/stale",
      },
    ],
  });

  const result = await provider.searchProducts("iphone 17 pro max", { limit: 10 });
  assert.equal(result.products.length, 0);
});

test("rechecagem recente reativa oferta sem fingir nova verificacao de preco", () => {
  assert.equal(
    isVerifiedAffiliateOfferFresh(
      {
        verifiedAt: "2026-07-19T00:00:00.000Z",
        lastCheckedAt: "2026-07-23T01:41:28.728Z",
      },
      new Date("2026-07-23T12:00:00.000Z"),
    ),
    true,
  );
});

test("fonte Magalu sai do fluxo automatico mesmo quando o link existe", async () => {
  assert.equal(
    isVerifiedAffiliateOfferAutomatedSourceAllowed({ sourceLabel: "magalu" }),
    false,
  );

  const provider = new VerifiedAffiliateOfferProvider({
    offers: [
      {
        id: "offer-magalu",
        title: "Apple iPhone 17 Pro Max 256GB",
        displayTitle: "Apple iPhone 17 Pro Max 256GB",
        brand: "Apple",
        model: "iPhone 17 Pro Max 256GB",
        category: "celular",
        normalizedCategory: "celular",
        sourceLabel: "magalu",
        verifiedAt: "2026-07-23T00:30:00.000Z",
        affiliateUrl: "https://example.com/magalu",
      },
      {
        id: "offer-amazon",
        title: "Apple iPhone 17 Pro 256GB",
        displayTitle: "Apple iPhone 17 Pro 256GB",
        brand: "Apple",
        model: "iPhone 17 Pro 256GB",
        category: "celular",
        normalizedCategory: "celular",
        sourceLabel: "amazon",
        verifiedAt: "2026-07-23T00:30:00.000Z",
        affiliateUrl: "https://example.com/amazon",
      },
    ],
  });

  const result = await provider.searchProducts("iphone 17 pro 256gb", { limit: 10 });
  assert.equal(result.products.length, 1);
  assert.equal(result.products[0].id, "offer-amazon");
});


test("oferta automatica some quando o link revalidado nao leva ao produto", () => {
  assert.equal(
    isVerifiedAffiliateOfferLinkHealthy(
      {
        affiliateUrl: "https://meli.la/exemplo",
        linkValidation: {
          status: "social_redirect",
          checkedAt: "2026-07-24T10:07:00.000Z",
        },
      },
      new Date("2026-07-24T12:00:00.000Z"),
    ),
    false,
  );

  assert.equal(
    isVerifiedAffiliateOfferFresh(
      {
        verifiedAt: "2026-07-24T10:07:00.000Z",
        lastCheckedAt: "2026-07-24T10:07:00.000Z",
        linkValidation: {
          status: "direct_product",
          checkedAt: "2026-07-24T10:07:00.000Z",
        },
      },
      new Date("2026-07-24T12:00:00.000Z"),
    ),
    true,
  );
});
