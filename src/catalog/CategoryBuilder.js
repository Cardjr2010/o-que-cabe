import { normalizeText } from "./ProductNormalizer.js";

function titleCase(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (/^[A-Z0-9]+$/.test(word)) return word;
      if (word.length <= 2) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function humanLabel(category = "") {
  const value = normalizeText(category);
  const labels = {
    xiaomi: "Xiaomi",
    redmi: "Redmi",
    poco: "POCO",
    celular: "Celulares",
    smartphone: "Smartphones",
    notebook: "Notebooks",
    tablet: "Tablets",
    tv: "TVs",
    relogio: "Relógios",
    fone: "Fones",
    carregador: "Carregadores",
    cabo: "Cabos",
    pelicula: "Películas",
    capa: "Capas",
    monitor: "Monitores",
    acessorio: "Acessórios",
    peca: "Peças",
    compativel: "Compatíveis",
    casa: "Casa",
    presente: "Presentes",
    ferramenta: "Ferramentas",
    ferragem: "Ferragens",
    construcao: "Casa e Construção",
  };
  return labels[value] || titleCase(value);
}

export default class CategoryBuilder {
  constructor(options = {}) {
    this.minCount = Number(options.minCount || 5);
    this.maxButtons = Number(options.maxButtons || 12);
  }

  build(items = []) {
    const map = new Map();
    for (const item of Array.isArray(items) ? items : []) {
      const key = normalizeText(item.normalizedCategory || item.category || "outros") || "outros";
      const entry = map.get(key) || {
        category: key,
        label: humanLabel(key),
        count: 0,
        sampleTitles: [],
        marketplaces: new Set(),
        sellers: new Set(),
      };
      entry.count += 1;
      if (item.title && entry.sampleTitles.length < 3) entry.sampleTitles.push(item.displayTitle || item.title);
      if (item.marketplace) entry.marketplaces.add(String(item.marketplace));
      if (item.seller) entry.sellers.add(String(item.seller));
      map.set(key, entry);
    }

    return [...map.values()]
      .filter((entry) => entry.count >= this.minCount)
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"))
      .map((entry) => ({
        category: entry.category,
        label: entry.label,
        count: entry.count,
        sampleTitles: entry.sampleTitles,
        marketplaces: [...entry.marketplaces].sort(),
        sellers: [...entry.sellers].sort(),
      }));
  }

  suggestHomeButtons(items = []) {
    return this.build(items).slice(0, this.maxButtons).map((entry) => ({
      label: entry.label,
      category: entry.category,
      count: entry.count,
      sampleTitles: entry.sampleTitles,
    }));
  }

  buildMarketplaceSummary(items = []) {
    const map = new Map();
    for (const item of Array.isArray(items) ? items : []) {
      const key = String(item.marketplace || item.source || "unknown").trim() || "unknown";
      const entry = map.get(key) || { marketplace: key, count: 0, categories: new Set(), sellers: new Set() };
      entry.count += 1;
      if (item.normalizedCategory || item.category) entry.categories.add(String(item.normalizedCategory || item.category));
      if (item.seller) entry.sellers.add(String(item.seller));
      map.set(key, entry);
    }
    return [...map.values()]
      .sort((a, b) => b.count - a.count || a.marketplace.localeCompare(b.marketplace, "pt-BR"))
      .map((entry) => ({
        marketplace: entry.marketplace,
        count: entry.count,
        categories: [...entry.categories].sort(),
        sellers: [...entry.sellers].sort(),
      }));
  }

  buildSellerSummary(items = []) {
    const map = new Map();
    for (const item of Array.isArray(items) ? items : []) {
      const key = String(item.seller || item.store || item.marketplace || "unknown").trim() || "unknown";
      const entry = map.get(key) || { seller: key, count: 0, categories: new Set(), status: new Set() };
      entry.count += 1;
      if (item.normalizedCategory || item.category) entry.categories.add(String(item.normalizedCategory || item.category));
      if (item.status) entry.status.add(String(item.status));
      map.set(key, entry);
    }
    return [...map.values()]
      .sort((a, b) => b.count - a.count || a.seller.localeCompare(b.seller, "pt-BR"))
      .map((entry) => ({
        seller: entry.seller,
        count: entry.count,
        categories: [...entry.categories].sort(),
        status: [...entry.status].sort(),
      }));
  }

  buildBrandSummary(items = []) {
    const map = new Map();
    for (const item of Array.isArray(items) ? items : []) {
      const key = String(item.brand || "sem marca").trim() || "sem marca";
      const entry = map.get(key) || { brand: key, count: 0, categories: new Set(), marketplaces: new Set() };
      entry.count += 1;
      if (item.normalizedCategory || item.category) entry.categories.add(String(item.normalizedCategory || item.category));
      if (item.marketplace) entry.marketplaces.add(String(item.marketplace));
      map.set(key, entry);
    }
    return [...map.values()]
      .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand, "pt-BR"))
      .map((entry) => ({
        brand: entry.brand,
        count: entry.count,
        categories: [...entry.categories].sort(),
        marketplaces: [...entry.marketplaces].sort(),
      }));
  }
}

export { humanLabel };


