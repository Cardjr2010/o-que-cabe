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
  assert.equal(data.shortcuts.length, 0);
  assert.ok(Array.isArray(data.decisionHighlights));
  assert.ok(data.decisionHighlights.length >= 2);
  assert.ok(data.decisionHighlights.some((entry) => String(entry.query || "").includes("iphone 17 pro 256gb")));
  assert.ok(data.decisionHighlights.some((entry) => String(entry.query || "").includes("galaxy s26 ultra 256gb")));
  assert.ok(Array.isArray(data.activeCampaigns));
  assert.ok(data.activeCampaigns.length === 0);
  assert.equal(data.catalogFresh, false);
  assert.ok(Array.isArray(data.activeSources));
  assert.equal(data.activeSources.length, 0);
  assert.ok(Array.isArray(data.topBrands));
  assert.equal(data.topBrands.length, 0);
  assert.ok(categoryKeys.some((category) => ["celulares", "notebooks", "tablets", "tvs"].includes(category)));
  assert.ok(categoryKeys.every((category) => !["carregador", "cabo", "pelicula", "capa", "acessorio", "peca", "compativel", "outros"].includes(category)));
});

