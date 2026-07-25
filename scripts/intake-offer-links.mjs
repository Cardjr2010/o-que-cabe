import fs from "node:fs";
import path from "node:path";
import { resolveProjectPath } from "../src/runtime/project-root.js";
import { probeOfferLink } from "../src/offers/OfferLinkIntake.js";

function parseArgs(argv = []) {
  const args = { urls: [], input: "", out: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--input") {
      args.input = argv[index + 1] || "";
      index += 1;
    } else if (value === "--out") {
      args.out = argv[index + 1] || "";
      index += 1;
    } else if (value.startsWith("http://") || value.startsWith("https://")) {
      args.urls.push(value);
    }
  }
  return args;
}

function readInputUrls(filePath = "") {
  if (!filePath) return [];
  const resolved = path.isAbsolute(filePath) ? filePath : resolveProjectPath(filePath);
  const content = fs.readFileSync(resolved, "utf8");
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function sourceLabel(source = "") {
  const labels = {
    mercado_livre: "Mercado Livre",
    amazon: "Amazon",
    magalu: "Magalu",
    shopee: "Shopee",
    casas_bahia: "Casas Bahia",
  };
  return labels[source] || source || "Fonte desconhecida";
}

function toMarkdown(result = {}) {
  const lines = [
    `# Intake de ofertas verificadas`,
    "",
    `Gerado em: ${result.generatedAt}`,
    "",
    `Links analisados: ${result.total}`,
    `Aceitos como produto direto: ${result.accepted}`,
    `Rejeitados/revisao: ${result.rejected}`,
    "",
    "## Aceitos",
    "",
  ];

  const accepted = result.results.filter((item) => item.ok);
  if (!accepted.length) lines.push("Nenhum link aceito automaticamente.", "");
  for (const item of accepted) {
    lines.push(`- ${sourceLabel(item.source)} | ${item.title || "Sem titulo"} | R$ ${item.price || "sem preco"} | ${item.itemId || item.asin || "sem id"} | ${item.finalUrl}`);
  }

  lines.push("", "## Rejeitados ou para revisao", "");
  const rejected = result.results.filter((item) => !item.ok);
  if (!rejected.length) lines.push("Nenhum.", "");
  for (const item of rejected) {
    lines.push(`- ${sourceLabel(item.source)} | ${item.rejectionReason || item.linkValidation?.status || "revisao"} | HTTP ${item.statusHttp} | ${item.inputUrl}`);
  }

  lines.push("", "## JSON normalizado", "", "```json", JSON.stringify(result.results, null, 2), "```", "");
  return lines.join("\n");
}

const args = parseArgs(process.argv.slice(2));
const urls = [...new Set([...args.urls, ...readInputUrls(args.input)])];

if (!urls.length) {
  console.error("Uso: node scripts/intake-offer-links.mjs <url...> ou --input data/links.txt");
  process.exit(1);
}

const generatedAt = new Date().toISOString();
const results = [];
for (const url of urls) {
  results.push(await probeOfferLink(url, { now: new Date(generatedAt) }));
}

const payload = {
  generatedAt,
  total: results.length,
  accepted: results.filter((item) => item.ok).length,
  rejected: results.filter((item) => !item.ok).length,
  results,
};

const outputPath = args.out
  ? (path.isAbsolute(args.out) ? args.out : resolveProjectPath(args.out))
  : resolveProjectPath("RELATORIO_INTAKE_OFERTAS_VERIFICADAS.md");

ensureParentDir(outputPath);
fs.writeFileSync(outputPath, toMarkdown(payload), "utf8");
console.log(JSON.stringify(payload, null, 2));

