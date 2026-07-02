import test from "node:test";
import assert from "node:assert/strict";
import SEOIntelligenceEngine from "../src/seo/SEOIntelligenceEngine.js";

test("SEO intelligence expõe buscas em alta e menu da home", () => {
  const engine = new SEOIntelligenceEngine({ maxHotSearches: 6, maxHomeButtons: 6 });
  const hotSearches = engine.buildSeoHotSearches(6);
  const menu = engine.buildMenu();
  const buttons = engine.buildHomeButtons([
    { category: "celular", count: 90 },
    { category: "notebook", count: 77 },
    { category: "monitor", count: 121 },
    { category: "tv", count: 42 },
    { category: "tablet", count: 18 },
    { category: "fone", count: 16 },
  ]);

  assert.ok(Array.isArray(hotSearches));
  assert.ok(hotSearches.length > 0);
  assert.equal(menu[0]?.label, "Início");
  assert.equal(menu[1]?.href, "#departments");
  assert.ok(buttons.length <= 6);
  assert.ok(buttons.some((item) => item.category === "monitores"));
});

test("SEO resolve intenção de busca com atributos", () => {
  const engine = new SEOIntelligenceEngine();

  const monitor = engine.resolveQueryIntent("monitor gamer 144hz");
  const celular = engine.resolveQueryIntent("celular até 1000 reais 128gb");
  const notebook = engine.resolveQueryIntent("notebook bom até 2500");

  assert.equal(monitor?.category, "monitores");
  assert.ok(monitor?.intent?.attributes.includes("144HZ"));
  assert.equal(celular?.category, "celulares");
  assert.ok(celular?.intent?.attributes.includes("128GB"));
  assert.equal(notebook?.category, "notebooks");
});
