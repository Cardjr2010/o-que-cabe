import { buildOfferPricing } from "./CouponProvider.js";

export class FinalPurchaseCostEngine {
  calculate(product = {}, options = {}) {
    const pricing = buildOfferPricing(product, options);
    return {
      listedPrice: Number(product.price || 0),
      shipping: Number(pricing.shipping?.price || 0),
      mandatoryFees: 0,
      verifiedDiscount: Number(pricing.couponDiscount || 0),
      cashback: Number(pricing.verifiedCashback || 0),
      finalPurchaseCost: Number(pricing.finalPrice || product.price || 0),
      calculationConfidence: pricing.coupon?.status === "verified" || Number(pricing.shipping?.price || 0) >= 0 ? "HIGH" : "MODERATE",
      pricing,
    };
  }
}

export default FinalPurchaseCostEngine;
