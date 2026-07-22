const SOURCE_GROUPS = {
  celulares: ["catalog", "mercado_livre_direct", "amazon_direct", "gecko_mercado_livre", "gecko_amazon", "gecko_magalu", "gecko_casas_bahia"],
  notebooks: ["catalog", "mercado_livre_direct", "amazon_direct", "gecko_amazon", "gecko_magalu", "gecko_casas_bahia"],
  monitores: ["catalog", "mercado_livre_direct", "amazon_direct", "gecko_amazon", "gecko_magalu"],
  tvs: ["catalog", "mercado_livre_direct", "amazon_direct", "gecko_amazon", "gecko_magalu", "gecko_casas_bahia"],
  roteadores: ["catalog", "mercado_livre_direct", "amazon_direct", "gecko_amazon", "gecko_mercado_livre"],
  ferramentas: ["catalog", "mercado_livre_direct", "amazon_direct", "gecko_mercado_livre", "gecko_amazon"],
  audio: ["catalog", "mercado_livre_direct", "amazon_direct", "gecko_amazon", "gecko_mercado_livre"],
  casa: ["catalog", "gecko_magalu", "gecko_casas_bahia", "gecko_shopee"],
  games: ["catalog", "mercado_livre_direct", "amazon_direct", "gecko_amazon", "gecko_mercado_livre"],
};

export class SourcePlanner {
  plan(intent = {}, availableSources = []) {
    const available = new Set(Array.isArray(availableSources) ? availableSources : []);
    const preferred = SOURCE_GROUPS[intent.category] || ["catalog", "mercado_livre_direct", "amazon_direct"];
    const selectedSources = [];
    const skippedSources = [];
    const reasonBySource = {};

    for (const source of preferred) {
      if (available.size && !available.has(source)) {
        skippedSources.push(source);
        reasonBySource[source] = "not_available";
        continue;
      }
      if (intent.refinementRequired && source !== "catalog") {
        skippedSources.push(source);
        reasonBySource[source] = "refinement_required";
        continue;
      }
      selectedSources.push(source);
      reasonBySource[source] = "selected";
    }

    return {
      selectedSources,
      skippedSources,
      reasonBySource,
    };
  }
}

export default SourcePlanner;
