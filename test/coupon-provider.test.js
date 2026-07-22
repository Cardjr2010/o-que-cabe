import test from "node:test";
import assert from "node:assert/strict";
import { buildOfferPricing } from "../src/pricing/CouponProvider.js";

test("Cupom de campanha aplicavel reduz o preco final do produto verificado", () => {
  const pricing = buildOfferPricing({
    id: "verified-ml-iphone-17-pro-max-256gb",
    source: "mercado_livre",
    price: 10499,
  }, {
    referenceDate: new Date("2026-07-20T12:00:00-03:00"),
  });

  assert.equal(pricing.coupon.code, "VIPMELI");
  assert.equal(pricing.couponDiscount, 60);
  assert.equal(pricing.finalPrice, 10439);
});

test("Produto sem campanha vinculada nao recebe desconto artificial", () => {
  const pricing = buildOfferPricing({
    id: "verified-amazon-iphone-17-pro-256gb",
    source: "amazon",
    price: 8792.1,
  });

  assert.equal(pricing.coupon.status, "unknown");
  assert.equal(pricing.couponDiscount, 0);
  assert.equal(pricing.finalPrice, 8792.1);
});
