import test from "node:test";
import assert from "node:assert/strict";
import RiskEngine from "../src/engines/RiskEngine.js";
import ExplanationEngine from "../src/engines/ExplanationEngine.js";
import { buildHomeCatalogData } from "../src/runtime/home-data.js";

test("RiskEngine classifica verde, amarelo e vermelho", () => {
  const green = RiskEngine.evaluateRisk({ title: "Notebook", price: 500, dataMode: "real" }, { mode: "total", totalBudget: 1000, months: 10 });
  const yellow = RiskEngine.evaluateRisk({ title: "Notebook", price: 850, dataMode: "real" }, { mode: "total", totalBudget: 1000, months: 10 });
  const red = RiskEngine.evaluateRisk({ title: "Notebook", price: 1200, dataMode: "real" }, { mode: "total", totalBudget: 1000, months: 10 });

  assert.equal(green.riskLevel, "green");
  assert.equal(yellow.riskLevel, "yellow");
  assert.equal(red.riskLevel, "red");
  assert.ok(green.waitSimulation.canBuyCashAfterWait);
});

test("ExplanationEngine explica cabimento e risco", () => {
  const explanation = ExplanationEngine.buildExplanation(
    { title: "Celular", status: "CABE", isAccessory: false },
    {
      budget: { mode: "total", totalBudget: 1500 },
      risk: { riskLevel: "green", waitSimulation: { canBuyCashAfterWait: true } },
      rank: 0,
    },
  );

  assert.match(explanation.text, /cabe|melhor combinação|à vista/i);
  assert.ok(Array.isArray(explanation.bullets));
  assert.ok(explanation.bullets.length > 0);
});

test("home-data expõe categorias, atalhos e fontes reais", () => {
  const data = buildHomeCatalogData();

  assert.equal(data.ok, true);
  assert.equal(data.focusLabel, "Balcão de Informática");
  assert.ok(Array.isArray(data.shortcuts));
  assert.ok(Array.isArray(data.activeSources));
  assert.ok(data.totalProducts > 0);
  assert.ok(data.categories.every((entry) => !["carregador", "cabo", "pelicula", "capa", "acessorio", "peca", "compativel", "outros"].includes(entry.category)));
});
