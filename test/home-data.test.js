import test from "node:test";
import assert from "node:assert/strict";
import { buildHomeCatalogData } from "../src/runtime/home-data.js";

test("home data prioriza o balcao de informatica sem acessorios aleatorios", () => {
  const data = buildHomeCatalogData();
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const categoryKeys = categories.map((entry) => String(entry.category || ""));

  assert.equal(data.ok, true);
  assert.equal(data.focusLabel, "Balcão de Informática");
  assert.ok(categories.length > 0);
  assert.ok(Array.isArray(data.shortcuts));
  assert.ok(Array.isArray(data.activeSources));
  assert.ok(categoryKeys.some((category) => ["celular", "notebook", "tablet", "tv"].includes(category)));
  assert.ok(categoryKeys.every((category) => !["carregador", "cabo", "pelicula", "capa", "acessorio", "peca", "compativel", "outros"].includes(category)));
});
