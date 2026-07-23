import test from "node:test";
import assert from "node:assert/strict";
import { buildHomeCatalogData } from "../src/runtime/home-data.js";

test("home data expõe catálogo real e departamentos coerentes", () => {
  const data = buildHomeCatalogData();
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const categoryKeys = categories.map((entry) => String(entry.category || ""));

  assert.equal(data.ok, true);
  assert.equal(data.focusLabel, "Consultor de compras");
  assert.ok(Array.isArray(data.menu));
  assert.ok(Array.isArray(data.homeButtons));
  assert.ok(data.homeButtons.length <= 6);
  assert.ok(Array.isArray(data.seoHotSearches));
  assert.ok(data.seoHotSearches.length > 0);
  assert.ok(categories.length > 0);
  assert.ok(Array.isArray(data.shortcuts));
  assert.ok(Array.isArray(data.decisionHighlights));
  assert.ok(data.decisionHighlights.length > 0);
  assert.ok(Array.isArray(data.activeCampaigns));
  assert.ok(data.activeCampaigns.length === 0);
  assert.equal(data.catalogFresh, false);
  assert.ok(Array.isArray(data.activeSources));
  assert.ok(categoryKeys.some((category) => ["celulares", "notebooks", "tablets", "tvs"].includes(category)));
  assert.ok(categoryKeys.every((category) => !["carregador", "cabo", "pelicula", "capa", "acessorio", "peca", "compativel", "outros"].includes(category)));
  assert.ok(data.decisionHighlights.some((entry) => /iPhone 17 Pro Max|Galaxy S26 Ultra/i.test(String(entry.label || ""))));
});

