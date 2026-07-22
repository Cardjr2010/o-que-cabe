import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import GeckoApiClient from "../src/providers/gecko/GeckoApiClient.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function loadDotEnv() {
  const envPath = path.join(projectRoot, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || /^\s*#/.test(line) || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadDotEnv();
  const query = process.argv.slice(2).join(" ").trim() || "iphone 17";
  const client = new GeckoApiClient();
  const marketplaces = ["amazon", "mercado_livre", "magalu", "casas_bahia"];
  const results = [];

  for (const source of marketplaces) {
    const probe = await client.probeMarketplace({ source, query });
    results.push({
      source,
      configured: client.isConfigured(),
      status: probe.status,
      ok: probe.ok,
      errorType: probe.errorType,
      request: probe.request,
      sampleKeys: probe.body && typeof probe.body === "object" ? Object.keys(probe.body).slice(0, 12) : [],
      itemCount:
        probe.body?.data?.products?.length
        || probe.body?.data?.results?.length
        || probe.body?.products?.length
        || probe.body?.results?.length
        || probe.body?.items?.length
        || 0,
    });
  }

  process.stdout.write(`${JSON.stringify({
    query,
    env: {
      baseUrlPresent: Boolean(process.env.GECKO_API_BASE_URL),
      keyPresent: Boolean(process.env.GECKO_API_KEY),
      timeoutMs: Number(process.env.GECKO_API_TIMEOUT_MS || 12000),
    },
    results,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({
    ok: false,
    message: error?.message || "gecko_probe_failed",
    name: error?.name || "Error",
  }, null, 2)}\n`);
  process.exitCode = 1;
});
