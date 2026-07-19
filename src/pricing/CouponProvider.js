function toNumber(value, fallback = 0) {
  if (value == null || value === "") return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const normalized = String(value)
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStatus(value = "") {
  const status = String(value || "").trim().toLowerCase();
  if (!status) return "unknown";
  if (["verified", "unverified", "expired", "unknown"].includes(status)) return status;
  return "unknown";
}

function normalizeCoupon(rawCoupon = {}, source = "") {
  if (!rawCoupon || typeof rawCoupon !== "object") {
    return {
      source: String(source || ""),
      code: null,
      type: "fixed",
      value: 0,
      minimumPurchase: null,
      maximumDiscount: null,
      validUntil: null,
      verifiedAt: null,
      status: "unknown",
    };
  }

  return {
    source: String(rawCoupon.source || source || ""),
    code: rawCoupon.code ? String(rawCoupon.code).trim() : null,
    type: ["fixed", "percent", "cashback", "coins"].includes(String(rawCoupon.type || "").trim().toLowerCase())
      ? String(rawCoupon.type).trim().toLowerCase()
      : "fixed",
    value: toNumber(rawCoupon.value, 0),
    minimumPurchase: rawCoupon.minimumPurchase == null ? null : toNumber(rawCoupon.minimumPurchase, 0),
    maximumDiscount: rawCoupon.maximumDiscount == null ? null : toNumber(rawCoupon.maximumDiscount, 0),
    validUntil: rawCoupon.validUntil ? String(rawCoupon.validUntil) : null,
    verifiedAt: rawCoupon.verifiedAt ? String(rawCoupon.verifiedAt) : null,
    status: normalizeStatus(rawCoupon.status),
  };
}

function computeCouponDiscount(price = 0, coupon = {}) {
  if (!coupon || coupon.status !== "verified") return 0;
  if (coupon.minimumPurchase != null && price < Number(coupon.minimumPurchase || 0)) return 0;

  if (coupon.type === "percent") {
    const rawDiscount = price * (Number(coupon.value || 0) / 100);
    if (coupon.maximumDiscount != null) {
      return Math.min(rawDiscount, Number(coupon.maximumDiscount || 0));
    }
    return rawDiscount;
  }

  if (coupon.type === "fixed" || coupon.type === "cashback" || coupon.type === "coins") {
    return Number(coupon.value || 0);
  }

  return 0;
}

export function buildOfferPricing(product = {}) {
  const price = toNumber(product.price, 0);
  const shippingPrice = toNumber(product?.shipping?.price, 0);
  const coupon = normalizeCoupon(product.coupon, product.source || product.marketplace || "");
  const verifiedCashback = coupon.status === "verified" && coupon.type === "cashback"
    ? Number(coupon.value || 0)
    : 0;
  const couponDiscount = coupon.type === "cashback" ? 0 : computeCouponDiscount(price + shippingPrice, coupon);
  const finalPrice = Math.max(0, Number((price + shippingPrice - couponDiscount - verifiedCashback).toFixed(2)));

  return {
    coupon,
    shipping: {
      price: shippingPrice,
      free: product?.shipping?.free === true || shippingPrice === 0,
    },
    couponDiscount: Number(couponDiscount.toFixed(2)),
    verifiedCashback: Number(verifiedCashback.toFixed(2)),
    finalPrice,
  };
}

export default {
  buildOfferPricing,
};
