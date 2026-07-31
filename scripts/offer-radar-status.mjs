import fs from "node:fs";
import { resolveProjectPath } from "../src/runtime/project-root.js";
import OfferRadarEngine from "../src/offers/OfferRadarEngine.js";

function cleanText(value = "") {
  return String(value || "")
    .replace(/â€”|â€“/g, "-")
    .replace(/Ã¡/g, "a")
    .replace(/Ã /g, "a")
    .replace(/Ã¢/g, "a")
    .replace(/Ã£/g, "a")
    .replace(/Ã©/g, "e")
    .replace(/Ãª/g, "e")
    .replace(/Ã­/g, "i")
    .replace(/Ã³/g, "o")
    .replace(/Ã´/g, "o")
    .replace(/Ãµ/g, "o")
    .replace(/Ãº/g, "u")
    .replace(/Ã§/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toMarkdown(status = {}) {
  const lines = [
    "# Relatorio - Radar de ofertas OQC",
    "",
    `Gerado em: ${status.generatedAt}`,
    "",
    "## Estado honesto das fontes",
    "",
    `- Mercado Livre busca aberta: ${status.marketplaceApi?.mercadoLivreOpenSearch || "desconhecido"}`,
    `- Amazon Creators API: ${status.marketplaceApi?.amazonCreatorsApi || "desconhecido"}`,
    `- Modo recomendado: ${status.mode}`,
    "",
    "## Ofertas verificadas",
    "",
    `- Total no banco: ${status.offers?.total || 0}`,
    `- Frescas: ${status.offers?.fresh || 0}`,
    `- Antigas: ${status.offers?.stale || 0}`,
    `- Fonte bloqueada: ${status.offers?.blockedSource || 0}`,
    `- Link invalido: ${status.offers?.invalidLink || 0}`,
    `- Sem validacao: ${status.offers?.missingValidation || 0}`,
    "",
    "### Por fonte",
    "",
    ...(status.offers?.bySource || []).map((item) => `- ${item.label}: ${item.total}`),
    "",
    "## Campanhas e cupons",
    "",
    `- Total cadastradas: ${status.campaigns?.total || 0}`,
    `- Ativas e frescas: ${status.campaigns?.active || 0}`,
    `- Ativas mas antigas: ${status.campaigns?.stale || 0}`,
    `- Expiradas: ${status.campaigns?.expired || 0}`,
    "",
    "## Cobertura dos produtos prioritarios",
    "",
    ...(status.targetCoverage || []).map((target) => (
      `- ${target.label}: ${target.freshOffers} ofertas frescas (${target.status})`
    )),
    "",
    "## Acoes recomendadas",
    "",
    ...(status.recommendedActions || []).map((action) => {
      const targets = Array.isArray(action.targets) && action.targets.length
        ? ` Alvos: ${action.targets.map(cleanText).join(", ")}.`
        : "";
      return `- [${action.priority}] ${cleanText(action.label)}: ${cleanText(action.reason)}${targets}`;
    }),
    "",
  ];

  if (status.offers?.staleExamples?.length) {
    lines.push("## Exemplos que precisam revalidar", "");
    for (const item of status.offers.staleExamples) {
      lines.push(`- ${cleanText(item.title)} | ${cleanText(item.source)} | ${item.checkedAt || "sem data"}`);
    }
    lines.push("");
  }

  if (status.campaigns?.expiredOrStaleExamples?.length) {
    lines.push("## Campanhas vencidas/antigas", "");
    for (const item of status.campaigns.expiredOrStaleExamples) {
      lines.push(`- ${cleanText(item.label)} | ${cleanText(item.source)} | ${item.state} | validade: ${item.validUntil || "sem data"}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

const status = new OfferRadarEngine().buildStatus();
const reportPath = resolveProjectPath("RELATORIO_RADAR_OFERTAS_OQC.md");

fs.writeFileSync(reportPath, toMarkdown(status), "utf8");

console.log(JSON.stringify({
  generatedAt: status.generatedAt,
  reportPath,
  offers: status.offers,
  campaigns: {
    total: status.campaigns.total,
    active: status.campaigns.active,
    stale: status.campaigns.stale,
    expired: status.campaigns.expired,
  },
  targetCoverage: status.targetCoverage,
  recommendedActions: status.recommendedActions,
}, null, 2));
