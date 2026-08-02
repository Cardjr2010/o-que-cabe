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
  assert.ok(data.shortcuts.length > 0);
  assert.ok(Array.isArray(data.decisionHighlights));
  assert.equal(data.decisionHighlights.length, 0);
  assert.ok(data.decisionHighlights.every((entry) => !String(entry.query || "").includes("galaxy s26 ultra 256gb")));
  assert.ok(Array.isArray(data.offerCategories));
  assert.equal(data.offerCategories.length, 0);
  assert.ok(data.offerCategories.every((entry) => Number(entry.count || 0) > 0));
  assert.ok(data.offerCategories.every((entry) => {
    const titles = Array.isArray(entry.sampleTitles) ? entry.sampleTitles.join(" ").toLowerCase() : "";
    return !/\b(capa|pel[ií]cula|cabo|carregador|suporte|software|escova de carv[aã]o)\b/i.test(titles);
  }));
  assert.ok(Array.isArray(data.guideCards));
  assert.ok(data.guideCards.length >= 3);
  assert.ok(data.guideCards.every((entry) => String(entry.href || "").startsWith("/blog/")));
  assert.ok(Array.isArray(data.activeCampaigns));
  assert.ok(data.activeCampaigns.every((entry) => !["PUSHFULLSU", "VIPMELI", "MELIBARATO", "CUPOMPRACASA"].includes(String(entry.code || ""))));
  assert.ok(data.activeCampaigns.every((entry) => Number.isFinite(Date.parse(entry.verifiedAt || entry.updatedAt || ""))));
  assert.equal(data.catalogFresh, true);
  assert.ok(Array.isArray(data.activeSources));
  assert.ok(data.activeSources.length > 0);
  assert.equal(data.activeSources[0].source, "Info Store - Informática");
  assert.equal(data.activeSources[0].count, 1462);
  assert.ok(data.activeSources.some((entry) => entry.source === "Magalu" && entry.count === 8));
  assert.ok(Array.isArray(data.topBrands));
  assert.ok(data.topBrands.length > 0);
  assert.ok(categoryKeys.some((category) => ["celulares", "notebooks", "tablets", "tvs"].includes(category)));
  assert.ok(categoryKeys.every((category) => !["carregador", "cabo", "pelicula", "capa", "acessorio", "peca", "compativel", "outros"].includes(category)));
});

