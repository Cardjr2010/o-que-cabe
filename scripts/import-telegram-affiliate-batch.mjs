import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { importTelegramAffiliateHtml, previewTelegramAffiliateHtml } from "./import-telegram-affiliate-offers.mjs";

function parseArgs(argv = []) {
  const args = {
    inputDir: "",
    date: "",
    maxPerFile: 300,
    dryRun: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--input-dir") {
      args.inputDir = argv[index + 1] || "";
      index += 1;
    } else if (value === "--date") {
      args.date = argv[index + 1] || "";
      index += 1;
    } else if (value === "--max-per-file") {
      args.maxPerFile = Number(argv[index + 1] || args.maxPerFile);
      index += 1;
    } else if (value === "--dry-run") {
      args.dryRun = true;
    }
  }
  return args;
}

function walkHtmlFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkHtmlFiles(entryPath));
    } else if (/^messages.*\.html$/i.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files.sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function mergeCounts(target = {}, source = {}) {
  for (const [key, value] of Object.entries(source || {})) {
    target[key] = (target[key] || 0) + Number(value || 0);
  }
  return target;
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.inputDir) {
    console.error("Uso: node scripts/import-telegram-affiliate-batch.mjs --input-dir <pasta> [--date DD.MM.YYYY] [--dry-run]");
    process.exit(1);
  }

  const inputDir = path.resolve(args.inputDir);
  const files = walkHtmlFiles(inputDir);
  const summary = {
    ok: true,
    generatedAt: new Date().toISOString(),
    inputDir,
    files: files.length,
    dryRun: args.dryRun,
    messages: 0,
    accepted: 0,
    rejected: 0,
    bySource: {},
    byCategory: {},
    fileResults: [],
  };

  for (const filePath of files) {
    const html = fs.readFileSync(filePath, "utf8");
    const result = args.dryRun
      ? previewTelegramAffiliateHtml({ html, date: args.date, max: args.maxPerFile })
      : importTelegramAffiliateHtml({
        html,
        inputPath: filePath,
        inputDir: path.dirname(filePath),
        date: args.date,
        max: args.maxPerFile,
      });
    summary.messages += Number(result.messages || 0);
    summary.accepted += Number(result.accepted || 0);
    summary.rejected += Number(result.rejected || 0);
    mergeCounts(summary.bySource, result.bySource);
    mergeCounts(summary.byCategory, result.byCategory);
    summary.fileResults.push({
      file: path.relative(inputDir, filePath),
      messages: result.messages,
      accepted: result.accepted,
      rejected: result.rejected,
      bySource: result.bySource,
      byCategory: result.byCategory,
    });
  }

  console.log(JSON.stringify(summary, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}
