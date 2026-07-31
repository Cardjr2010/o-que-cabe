import test from "node:test";
import assert from "node:assert/strict";
import OfferRadarEngine from "../src/offers/OfferRadarEngine.js";

test("radar mostra APIs externas bloqueadas sem declarar operacional", () => {
  const status = new OfferRadarEngine({
    offers: [],
    campaigns: [],
    targets: [],
    referenceDate: new Date("2026-07-31T12:00:00.000Z"),
  }).buildStatus();

  assert.equal(status.marketplaceApi.mercadoLivreOpenSearch, "blocked_403");
  assert.equal(status.marketplaceApi.amazonCreatorsApi, "blocked_associate_not_eligible");
  assert.equal(status.mode, "offer_intake_first");
});

test("radar separa ofertas frescas, antigas e fontes bloqueadas", () => {
  const status = new OfferRadarEngine({
    referenceDate: new Date("2026-07-31T12:00:00.000Z"),
    campaigns: [],
    targets: [],
    offers: [
      {
        id: "fresh",
        title: "Apple iPhone 17 256GB",
        sourceLabel: "amazon",
        seller: { name: "Amazon.com.br" },
        verifiedAt: "2026-07-31T10:00:00.000Z",
        lastCheckedAt: "2026-07-31T10:00:00.000Z",
        linkValidation: { status: "direct_product", checkedAt: "2026-07-31T10:00:00.000Z" },
      },
      {
        id: "stale",
        title: "Apple iPhone 17 Pro Max 256GB",
        sourceLabel: "mercado_livre",
        officialStore: true,
        verifiedAt: "2026-07-26T10:00:00.000Z",
        lastCheckedAt: "2026-07-26T10:00:00.000Z",
        linkValidation: { status: "direct_product", checkedAt: "2026-07-26T10:00:00.000Z" },
      },
      {
        id: "blocked-source",
        title: "Magalu Oferta",
        sourceLabel: "magalu",
        verifiedAt: "2026-07-31T10:00:00.000Z",
      },
    ],
  }).buildStatus();

  assert.equal(status.offers.fresh, 1);
  assert.equal(status.offers.stale, 1);
  assert.equal(status.offers.blockedSource, 1);
});

test("radar aponta cobertura fina dos produtos prioritarios", () => {
  const status = new OfferRadarEngine({
    referenceDate: new Date("2026-07-31T12:00:00.000Z"),
    campaigns: [],
    targets: [
      {
        id: "iphone-17",
        label: "iPhone 17 256GB",
        query: "iphone 17 256gb",
        aliases: ["apple iphone 17"],
        category: "celulares",
      },
    ],
    offers: [
      {
        id: "fresh-iphone",
        title: "Apple iPhone 17 256GB Preto",
        displayTitle: "Apple iPhone 17 256GB Preto",
        sourceLabel: "amazon",
        seller: { name: "Amazon.com.br" },
        verifiedAt: "2026-07-31T10:00:00.000Z",
        lastCheckedAt: "2026-07-31T10:00:00.000Z",
        linkValidation: { status: "direct_product", checkedAt: "2026-07-31T10:00:00.000Z" },
      },
    ],
  }).buildStatus();

  assert.equal(status.targetCoverage[0].freshOffers, 1);
  assert.equal(status.targetCoverage[0].status, "thin");
  assert.ok(status.recommendedActions.some((action) => action.action === "collect_priority_products"));
});
