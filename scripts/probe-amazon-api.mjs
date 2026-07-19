import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AmazonRapidApiSearchProvider from "../src/providers/AmazonRapidApiSearchProvider.js";

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
  const provider = new AmazonRapidApiSearchProvider();
  const diagnosticsBefore = provider.getDiagnostics();
  const result = await provider.searchProducts(query, { limit: 3, marketplace: "BR" });
  const diagnosticsAfter = provider.getDiagnostics();

  const output = {
    query,
    provider: diagnosticsAfter.provider,
    authMode: diagnosticsAfter.authMode,
    configured: diagnosticsAfter.configured,
    marketplace: diagnosticsAfter.marketplace,
    env: {
      keyPresent: Boolean(diagnosticsAfter.hasKey),
      hostPresent: Boolean(diagnosticsAfter.hasHost),
      endpointPresent: Boolean(diagnosticsAfter.hasEndpoint),
      clientIdPresent: Boolean(diagnosticsAfter.hasClientId),
      clientSecretPresent: Boolean(diagnosticsAfter.hasClientSecret),
      associateTagPresent: Boolean(diagnosticsAfter.hasAssociateTag),
    },
    before: {
      lastStatus: diagnosticsBefore.lastStatus,
      lastErrorType: diagnosticsBefore.lastErrorType,
    },
    result: {
      statusHttp: result.statusHttp,
      error: result.error || null,
      dataMode: result.dataMode,
      rawCount: result.rawCount,
      returnedCount: result.returnedCount,
      firstFive: result.firstFive || [],
      rawResponseSample: result.rawResponseSample || null,
    },
    after: {
      lastStatus: diagnosticsAfter.lastStatus,
      lastErrorType: diagnosticsAfter.lastErrorType,
      lastSuccessAt: diagnosticsAfter.lastSuccessAt,
    },
  };

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({
    ok: false,
    message: error?.message || "probe_failed",
    name: error?.name || "Error",
  }, null, 2)}\n`);
  process.exitCode = 1;
});
