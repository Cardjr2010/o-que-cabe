import test from "node:test";
import assert from "node:assert/strict";
import PurchaseDecisionEngine from "../src/intelligence/PurchaseDecisionEngine.js";

test("PurchaseDecisionEngine escolhe melhor oferta geral e menor preço", () => {
  const engine = new PurchaseDecisionEngine();
  const decisions = engine.decide([
    {
      id: "1",
      title: "iPhone 17 Pro Max Loja Oficial",
      matchClass: "EXACT_MATCH",
      decisionScore: 96,
      finalPurchaseCost: 8199,
      officialStore: { confidence: "VERIFIED" },
      installments: { available: true, amount: 683.25 },
    },
    {
      id: "2",
      title: "iPhone 17 Pro Max Menor Preço",
      matchClass: "EXACT_MATCH",
      decisionScore: 88,
      finalPurchaseCost: 7999,
      officialStore: { confidence: "NOT_VERIFIED" },
      installments: { available: true, amount: 749.9 },
    },
  ], { totalBudget: 10000 });

  assert.ok(decisions.some((item) => item.decision === "BEST_OVERALL"));
  assert.ok(decisions.some((item) => item.decision === "BEST_PRICE"));
});
