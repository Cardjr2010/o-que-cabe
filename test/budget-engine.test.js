import test from "node:test";
import assert from "node:assert/strict";
import BudgetEngine from "../src/engines/BudgetEngine.js";

test("buildBudgetContext keeps monthly mode based on monthly x months", () => {
  const context = BudgetEngine.buildBudgetContext({ mode: "monthly", monthly: 200, months: 12, totalBudget: 500 });
  assert.equal(context.mode, "monthly");
  assert.equal(context.totalBudget, 2400);
  assert.equal(context.months, 12);
});

test("buildBudgetContext keeps total mode based on explicit totalBudget", () => {
  const context = BudgetEngine.buildBudgetContext({ mode: "total", monthly: 200, months: 12, totalBudget: 600 });
  assert.equal(context.mode, "total");
  assert.equal(context.totalBudget, 600);
});

test("classifyBudgetFit respects monthly mode", () => {
  const context = BudgetEngine.buildBudgetContext({ mode: "monthly", monthly: 100, months: 10 });
  assert.equal(BudgetEngine.classifyBudgetFit(900, context), "CABE");
  assert.equal(BudgetEngine.classifyBudgetFit(1100, context), "APERTADO");
  assert.equal(BudgetEngine.classifyBudgetFit(1300, context), "NÃO CABE");
});

test("classifyBudgetFit respects total mode", () => {
  const context = BudgetEngine.buildBudgetContext({ mode: "total", monthly: 100, months: 10, totalBudget: 500 });
  assert.equal(BudgetEngine.classifyBudgetFit(499, context), "CABE");
  assert.equal(BudgetEngine.classifyBudgetFit(550, context), "APERTADO");
  assert.equal(BudgetEngine.classifyBudgetFit(700, context), "NÃO CABE");
});

test("limitBudgetResults keeps ranking priority and caps groups", () => {
  const results = BudgetEngine.limitBudgetResults([
    { title: "A", status: "NÃO CABE", score: 10 },
    { title: "B", status: "CABE", score: 50 },
    { title: "C", status: "APERTADO", score: 80 },
    { title: "D", status: "CABE", score: 90 },
  ]);
  assert.equal(results[0].title, "D");
  assert.equal(results[1].title, "B");
  assert.equal(results[2].title, "C");
  assert.equal(results[3].title, "A");
});

test("evaluateBudget calcula impacto mensal, custo total e juros embutidos", () => {
  const result = BudgetEngine.evaluateBudget(1200, {
    mode: "monthly",
    budgetLivre: 400,
    months: 12,
    installment: {
      amount: 95,
      months: 12,
      downpayment: 120,
    },
  });

  assert.equal(result.status, "CABE");
  assert.equal(result.warningLevel, "yellow");
  assert.equal(result.financialMetrics.budgetLivre, 400);
  assert.equal(result.financialMetrics.installmentAmount, 95);
  assert.equal(result.financialMetrics.installmentMonths, 12);
  assert.equal(result.financialMetrics.downpayment, 120);
  assert.equal(result.financialMetrics.impactoMensal, 23.75);
  assert.equal(result.financialMetrics.custoTotalPrazo, 1260);
  assert.equal(result.financialMetrics.jurosEmbutidos, 5);
  assert.equal(result.decision.riskLevel, "yellow");
  assert.match(result.warningMessage, /orçamento livre/i);
});

test("evaluateBudget marca yellow e red pelo impacto mensal", () => {
  const yellow = BudgetEngine.evaluateBudget(900, {
    mode: "monthly",
    monthly: 100,
    months: 12,
    installment: {
      amount: 24,
      months: 12,
      downpayment: 0,
    },
  });
  const red = BudgetEngine.evaluateBudget(900, {
    mode: "monthly",
    monthly: 100,
    months: 12,
    installment: {
      amount: 40,
      months: 12,
      downpayment: 0,
    },
  });

  assert.equal(yellow.warningLevel, "yellow");
  assert.equal(yellow.financialMetrics.impactoMensal, 24);
  assert.equal(red.warningLevel, "red");
  assert.equal(red.financialMetrics.impactoMensal, 40);
});
