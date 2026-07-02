import fs from "node:fs";
import { resolveProjectPath } from "../runtime/project-root.js";
import { normalizeText } from "../catalog/ProductNormalizer.js";

const DEFAULT_SEED_PATH = resolveProjectPath("data", "seo-keywords.seed.json");

const DEFAULT_HOME_PRIORITY = [
  "monitores",
  "celulares",
  "notebooks",
  "tvs",
  "informatica",
  "casa e construcao",
  "audio",
  "relogios",
  "ferramentas",
  "flores e presentes",
];

const DISPLAY_LABELS = new Map([
  ["celulares", "Celulares"],
  ["notebooks", "Notebooks"],
  ["monitores", "Monitores"],
  ["tvs", "TVs"],
  ["informatica", "Informática"],
  ["casa e construcao", "Casa e Construção"],
  ["audio", "Áudio"],
  ["relogios", "Relógios"],
  ["ferramentas", "Ferramentas"],
  ["flores e presentes", "Flores e Presentes"],
  ["ferragens", "Ferragens"],
  ["tablets", "Tablets"],
  ["cabos e carregadores", "Cabos e Carregadores"],
  ["acessorios", "Acessórios"],
  ["pecas", "Peças"],
]);

const DEFAULT_KEYWORDS = [
  { label: "Celular até R$ 1.000 128GB", query: "celular até 1000 reais 128gb", category: "celulares", volume: 1000, intent: { mode: "total", totalBudget: 1000, attributes: ["128gb"] } },
  { label: "Celular até R$ 1.000 256GB", query: "celular até 1000 reais 256gb", category: "celulares", volume: 320, intent: { mode: "total", totalBudget: 1000, attributes: ["256gb"] } },
  { label: "Celular até R$ 100", query: "celular até 100 reais", category: "celulares", volume: 140, intent: { mode: "total", totalBudget: 100 } },
  { label: "Celular bom até R$ 1.000", query: "celular até 1000 reais bom", category: "celulares", volume: 50, intent: { mode: "total", totalBudget: 1000, attributes: ["bom"] } },
  { label: "Notebook bom até R$ 2.500", query: "notebook bom até 2500 reais", category: "notebooks", volume: 70, intent: { mode: "total", totalBudget: 2500 } },
  { label: "Melhor notebook até R$ 2.500", query: "melhor notebook até 2500 reais", category: "notebooks", volume: 50, intent: { mode: "total", totalBudget: 2500 } },
  { label: "Notebook gamer até R$ 2.500", query: "notebook gamer até 2500 reais", category: "notebooks", volume: 30, intent: { mode: "total", totalBudget: 2500, attributes: ["gamer"] } },
  { label: "Notebook até R$ 2.500 i5", query: "notebook até 2500 i5", category: "notebooks", volume: 50, intent: { mode: "total", totalBudget: 2500, attributes: ["i5"] } },
  { label: "Monitor gamer curvo", query: "monitor gamer curvo", category: "monitores", volume: 8100, intent: { category: "monitores", attributes: ["curvo"] } },
  { label: "Monitor gamer 144Hz", query: "monitor gamer 144hz", category: "monitores", volume: 5400, intent: { category: "monitores", attributes: ["144hz"] } },
  { label: "Monitor gamer 240Hz", query: "monitor gamer 240hz", category: "monitores", volume: 5400, intent: { category: "monitores", attributes: ["240hz"] } },
  { label: "Monitor gamer 27 polegadas", query: "monitor gamer 27 polegadas", category: "monitores", volume: 3600, intent: { category: "monitores", attributes: ["27 polegadas"] } },
  { label: "Monitor gamer 4K", query: "monitor gamer 4k", category: "monitores", volume: 3600, intent: { category: "monitores", attributes: ["4k"] } },
  { label: "Monitor gamer AOC", query: "monitor gamer aoc", category: "monitores", volume: 3600, intent: { category: "monitores", brand: "AOC" } },
  { label: "Monitor gamer Samsung", query: "monitor gamer samsung", category: "monitores", volume: 2400, intent: { category: "monitores", brand: "Samsung" } },
  { label: "Monitor gamer barato", query: "monitor gamer barato", category: "monitores", volume: 1600, intent: { category: "monitores", attributes: ["barato"] } },
  { label: "Monitor gamer 24 polegadas", query: "monitor gamer 24 polegadas", category: "monitores", volume: 1900, intent: { category: "monitores", attributes: ["24 polegadas"] } },
  { label: "Monitor gamer LG UltraGear 27", query: "monitor gamer lg ultragear 27", category: "monitores", volume: 1900, intent: { category: "monitores", brand: "LG", attributes: ["ultragear", "27"] } },
];

function readSeedFile(seedPath = DEFAULT_SEED_PATH) {
  try {
    if (!fs.existsSync(seedPath)) return DEFAULT_KEYWORDS;
    const raw = fs.readFileSync(seedPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_KEYWORDS;
    return parsed;
  } catch {
    return DEFAULT_KEYWORDS;
  }
}

function normalizeCategoryKey(value = "") {
  return normalizeText(String(value || ""))
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalCategoryKey(value = "") {
  const normalized = normalizeCategoryKey(value);
  const aliases = {
    monitor: "monitores",
    monitores: "monitores",
    celular: "celulares",
    celulares: "celulares",
    notebook: "notebooks",
    notebooks: "notebooks",
    tv: "tvs",
    tvs: "tvs",
    tablet: "tablets",
    tablets: "tablets",
    fone: "audio",
    fones: "audio",
    audio: "audio",
    relogio: "relogios",
    relogios: "relogios",
    ferramenta: "ferramentas",
    ferramentas: "ferramentas",
    ferragem: "ferragens",
    ferragens: "ferragens",
    casa: "casa e construcao",
    construcao: "casa e construcao",
    "casa e construcao": "casa e construcao",
    presente: "flores e presentes",
    flores: "flores e presentes",
    "flores e presentes": "flores e presentes",
    acessorio: "acessorios",
    acessorios: "acessorios",
    peca: "pecas",
    pecas: "pecas",
  };
  return aliases[normalized] || normalized;
}

function displayCategoryLabel(value = "") {
  const normalized = canonicalCategoryKey(value);
  return DISPLAY_LABELS.get(normalized) || String(value || "").replace(/\s+/g, " ").trim();
}

function uniqueArray(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function extractAttributes(query = "") {
  const normalized = normalizeText(query);
  const attributes = [];
  const patterns = [
    { test: /\b(\d{3,4})gb\b/i, value: (match) => `${match[1]}GB` },
    { test: /\b(144hz|165hz|240hz|120hz)\b/i, value: (match) => match[1].toUpperCase() },
    { test: /\b(curvo|curved)\b/i, value: () => "curvo" },
    { test: /\b(24|27|32)\s*polegadas?\b/i, value: (match) => `${match[1]} polegadas` },
    { test: /\b(gamer)\b/i, value: () => "gamer" },
    { test: /\b(i5|i7|ryzen 5|ryzen 7|ryzen 3)\b/i, value: (match) => match[1].toUpperCase() },
    { test: /\b(barato|bom|melhor)\b/i, value: (match) => match[1].toLowerCase() },
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern.test);
    if (match) {
      attributes.push(pattern.value(match));
    }
  }
  return uniqueArray(attributes);
}

function matchKeyword(query = "", entry = {}) {
  const normalizedQuery = normalizeText(query);
  const normalizedKeyword = normalizeText(entry.query || entry.label || "");
  if (!normalizedQuery || !normalizedKeyword) return false;
  return normalizedQuery.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedQuery);
}

function categoryVolumeMap(keywords = []) {
  const map = new Map();
  for (const entry of Array.isArray(keywords) ? keywords : []) {
    const category = canonicalCategoryKey(entry.category || "");
    if (!category) continue;
    const current = map.get(category) || { category, volume: 0, hotSearches: [] };
    current.volume += Number(entry.volume || 0);
    current.hotSearches.push(entry);
    map.set(category, current);
  }
  return map;
}

export default class SEOIntelligenceEngine {
  constructor(options = {}) {
    this.options = {
      seedPath: options.seedPath || DEFAULT_SEED_PATH,
      maxHotSearches: Number(options.maxHotSearches || 6),
      maxHomeButtons: Number(options.maxHomeButtons || 6),
      minCategoryCount: Number(options.minCategoryCount || 5),
    };
    this.keywords = readSeedFile(this.options.seedPath).map((entry) => ({
      label: String(entry.label || entry.query || "").trim(),
      query: String(entry.query || entry.label || "").trim(),
      category: canonicalCategoryKey(entry.category || ""),
      volume: Number(entry.volume || 0),
      intent: entry.intent && typeof entry.intent === "object" ? entry.intent : {},
    })).filter((entry) => entry.label && entry.query && entry.category);
  }

  getKeywords() {
    return this.keywords.map((entry) => ({
      ...entry,
      intent: { ...entry.intent },
    }));
  }

  getHotSearches(limit = this.options.maxHotSearches) {
    return this.getKeywords()
      .sort((a, b) => b.volume - a.volume || a.label.localeCompare(b.label, "pt-BR"))
      .slice(0, limit)
      .map((entry) => ({
        label: entry.label,
        query: entry.query,
        category: entry.category,
        volume: entry.volume,
        intent: { ...entry.intent },
      }));
  }

  buildSeoHotSearches(limit = this.options.maxHotSearches) {
    return this.getHotSearches(limit);
  }

  resolveQueryIntent(query = "") {
    const normalized = String(query || "").trim();
    if (!normalized) return null;
    const lowered = normalizeText(normalized);
    const matched = this.getKeywords()
      .filter((entry) => matchKeyword(lowered, entry))
      .sort((a, b) => b.volume - a.volume || a.label.localeCompare(b.label, "pt-BR"))[0];
    if (!matched) return null;
    return {
      label: matched.label,
      query: matched.query,
      category: matched.category,
      volume: matched.volume,
      intent: {
        category: matched.category,
        attributes: extractAttributes(normalized),
        ...matched.intent,
      },
    };
  }

  buildHomeButtons(items = []) {
    const categoryMap = new Map();
    const itemList = Array.isArray(items) ? items : [];
    const boostedCategories = categoryVolumeMap(this.getKeywords());

    for (const item of itemList) {
      const category = canonicalCategoryKey(item?.category || item?.department || item?.normalizedCategory || "");
      const label = displayCategoryLabel(item?.category || item?.department || item?.normalizedCategory || "");
      if (!category || ["outros", "pecas", "acessorios"].includes(category)) continue;
      const productType = normalizeCategoryKey(item?.productType || "");
      const current = categoryMap.get(category) || {
        category,
        label,
        count: 0,
        principalCount: 0,
        accessoryCount: 0,
        sources: new Set(),
        sampleTitles: [],
        seoVolume: boostedCategories.get(category)?.volume || 0,
      };
      current.count += 1;
      if (productType === "accessory" || Boolean(item?.isAccessory)) current.accessoryCount += 1;
      else current.principalCount += 1;
      if (item.marketplace || item.source) current.sources.add(String(item.marketplace || item.source));
      const title = item.displayTitle || item.title || item.originalTitle || "";
      if (title && current.sampleTitles.length < 3) current.sampleTitles.push(title);
      categoryMap.set(category, current);
    }

    const allowedOrder = DEFAULT_HOME_PRIORITY;
    const buttons = [...categoryMap.values()]
      .filter((entry) => entry.count >= this.options.minCategoryCount)
      .filter((entry) => entry.principalCount > 0)
      .map((entry) => {
        const seoBoost = Math.log10((entry.seoVolume || 0) + 10) * 12;
        const priorityBoost = Math.max(0, (allowedOrder.length - allowedOrder.indexOf(entry.category) - 1)) * 4;
        const accessoryPenalty = entry.accessoryCount > entry.principalCount ? 22 : 0;
        const countBoost = Math.min(entry.count, 150) * 0.7;
        const score = countBoost + seoBoost + priorityBoost - accessoryPenalty;
        const intentEntry = this.getHotSearches(20).find((hot) => hot.category === entry.category);
        return {
          category: entry.category,
          label: entry.label,
          count: entry.count,
          principalCount: entry.principalCount,
          accessoryCount: entry.accessoryCount,
          seoVolume: entry.seoVolume || 0,
          query: intentEntry?.query || entry.category,
          volume: intentEntry?.volume || entry.seoVolume || 0,
          intent: intentEntry?.intent || { category: entry.category },
          score,
        };
      })
      .sort((a, b) => b.score - a.score || b.count - a.count || a.label.localeCompare(b.label, "pt-BR"))
      .slice(0, this.options.maxHomeButtons)
      .map((entry) => ({
        category: entry.category,
        label: entry.label,
        count: entry.count,
        query: entry.query,
        seoVolume: entry.volume,
        intent: entry.intent,
      }));

    const fallback = this.getHotSearches(this.options.maxHomeButtons)
      .filter((entry) => !buttons.some((button) => button.category === entry.category))
      .slice(0, Math.max(0, this.options.maxHomeButtons - buttons.length))
      .map((entry) => ({
        category: entry.category,
        label: displayCategoryLabel(entry.category),
        count: 0,
        query: entry.query,
        seoVolume: entry.volume,
        intent: entry.intent,
      }));

    return [...buttons, ...fallback].slice(0, this.options.maxHomeButtons);
  }

  buildMenu() {
    return [
      { label: "Início", href: "/", active: true },
      { label: "Departamentos", href: "#departments", active: true },
      { label: "Blog", href: "#blog", active: true },
      { label: "Minha Conta", href: "#conta", active: true },
      { label: "Favoritos", href: "#favoritos", future: true, active: false },
    ];
  }
}

export function buildSeoHotSearches(limit = 6) {
  return new SEOIntelligenceEngine({ maxHotSearches: limit }).buildSeoHotSearches(limit);
}

export function buildHomeMenu() {
  return new SEOIntelligenceEngine().buildMenu();
}
