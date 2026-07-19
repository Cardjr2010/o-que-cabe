import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MercadoLivreSearchProvider from "../src/providers/MercadoLivreSearchProvider.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const oauthPath = path.join(projectRoot, "data", "mercadolivre-oauth.json");

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

function readStoredOAuth() {
  try {
    return JSON.parse(fs.readFileSync(oauthPath, "utf8"));
  } catch {
    return null;
  }
}

function isLikelyPlaceholderToken(value = "") {
  const token = String(value || "").trim().toLowerCase();
  if (!token) return false;
  return token.includes("token-test") || token === "novo-token" || token === "refresh-token-test";
}

async function main() {
  loadDotEnv();
  const query = process.argv.slice(2).join(" ").trim() || "iphone 17";
  const provider = new MercadoLivreSearchProvider();
  const oauth = readStoredOAuth();
  const diagnosticsBefore = provider.getDiagnostics();
  const result = await provider.searchProducts(query, { limit: 3 });
  const diagnosticsAfter = provider.getDiagnostics();

  const output = {
    query,
    env: {
      clientIdPresent: Boolean(process.env.MELI_CLIENT_ID),
      clientSecretPresent: Boolean(process.env.MELI_CLIENT_SECRET),
      accessTokenPresent: Boolean(process.env.MELI_ACCESS_TOKEN),
      refreshTokenPresent: Boolean(process.env.MELI_REFRESH_TOKEN),
      storedOauthPresent: Boolean(oauth),
      storedAccessTokenPlaceholder: isLikelyPlaceholderToken(oauth?.access_token),
      storedRefreshTokenPlaceholder: isLikelyPlaceholderToken(oauth?.refresh_token),
    },
    before: diagnosticsBefore,
    result: {
      statusHttp: result.statusHttp,
      error: result.error || null,
      tokenState: result.tokenState || null,
      authMode: result.authMode || null,
      dataMode: result.dataMode,
      rawCount: result.rawCount,
      returnedCount: result.returnedCount,
      firstFive: result.firstFive || [],
    },
    after: diagnosticsAfter,
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
