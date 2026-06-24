import test from "node:test";
import assert from "node:assert/strict";
import ScoreEngine from "../src/engines/ScoreEngine.js";

function buildProduct(overrides = {}) {
  return {
    title: "Produto de teste",
    price: 599,
    referencePrice: 700,
    freeShipping: true,
    seller: {
      reputation: "gold",
      rating: 92,
      sales: 1800,
    },
    deliveryDays: 3,
    rating: 4.7,
    reviewCount: 1500,
    warrantyMonths: 12,
    brand: "Samsung",
    soldQuantity: 1200,
    ...overrides,
  };
}

test("retorna score e breakdown transparentes", () => {
  const result = ScoreEngine.evaluateProduct(buildProduct());

  assert.equal(typeof result.score, "number");
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.equal(result.breakdown.length, 8);
  assert.equal(result.breakdown.reduce((sum, item) => sum + item.weight, 0), 100);
  assert.ok(result.breakdown.every((item) => typeof item.reason === "string" && item.reason.length > 0));
  assert.ok(result.explanation.length > 0);
});

test("produto barato mas vendedor ruim perde força", () => {
  const cheapBadSeller = ScoreEngine.evaluateProduct(buildProduct({
    title: "Barato com vendedor ruim",
    price: 420,
    referencePrice: 650,
    seller: {
      reputation: "poor",
      rating: 48,
      sales: 18,
    },
    reviewCount: 35,
    rating: 3.6,
    soldQuantity: 22,
  }));

  const expensiveExcellentSeller = ScoreEngine.evaluateProduct(buildProduct({
    title: "Mais caro com vendedor excelente",
    price: 680,
    referencePrice: 650,
    seller: {
      reputation: "platinum",
      rating: 98,
      sales: 9000,
    },
    reviewCount: 4200,
    rating: 4.9,
    soldQuantity: 6500,
  }));

  assert.ok(expensiveExcellentSeller.score > cheapBadSeller.score);
  assert.match(cheapBadSeller.breakdown.find((item) => item.factor === "Vendedor").reason, /confiança baixa|pouco documentada/i);
  assert.match(expensiveExcellentSeller.breakdown.find((item) => item.factor === "Vendedor").reason, /Platinum|altíssima confiança/i);
});

test("frete grátis supera frete caro", () => {
  const freeShipping = ScoreEngine.evaluateProduct(buildProduct({
    title: "Frete grátis",
    shippingCost: 0,
    freeShipping: true,
  }));

  const expensiveShipping = ScoreEngine.evaluateProduct(buildProduct({
    title: "Frete caro",
    shippingCost: 89,
    freeShipping: false,
  }));

  const freeFactor = freeShipping.breakdown.find((item) => item.factor === "Frete");
  const expensiveFactor = expensiveShipping.breakdown.find((item) => item.factor === "Frete");

  assert.ok(freeShipping.score > expensiveShipping.score);
  assert.match(freeFactor.reason, /grátis/i);
  assert.match(expensiveFactor.reason, /caro/i);
});

test("alta avaliação rende mais que baixa avaliação", () => {
  const highReviews = ScoreEngine.evaluateProduct(buildProduct({
    title: "Alta avaliação",
    rating: 4.9,
    reviewCount: 5000,
  }));

  const lowReviews = ScoreEngine.evaluateProduct(buildProduct({
    title: "Baixa avaliação",
    rating: 3.2,
    reviewCount: 12,
  }));

  const highFactor = highReviews.breakdown.find((item) => item.factor === "Avaliações");
  const lowFactor = lowReviews.breakdown.find((item) => item.factor === "Avaliações");

  assert.ok(highReviews.score > lowReviews.score);
  assert.match(highFactor.reason, /estrelas/i);
  assert.match(lowFactor.reason, /fracas|medianas/i);
});

test("marca, garantia e entrega entram na explicação", () => {
  const result = ScoreEngine.evaluateProduct(buildProduct({
    title: "Detalhes completos",
    deliveryDays: 2,
    warrantyMonths: 24,
    brand: "Apple",
  }));

  const delivery = result.breakdown.find((item) => item.factor === "Entrega");
  const warranty = result.breakdown.find((item) => item.factor === "Garantia");
  const brand = result.breakdown.find((item) => item.factor === "Marca");

  assert.match(delivery.reason, /dias/i);
  assert.match(warranty.reason, /Garantia/i);
  assert.match(brand.reason, /Marca/i);
  assert.match(result.explanation, /combinação|equilibrar/i);
});
