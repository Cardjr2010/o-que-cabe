import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "../api/web.js";
import { buildHomeCatalogData } from "../src/runtime/home-data.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    writeHead(status, headers = {}) {
      this.statusCode = status;
      this.headers = { ...this.headers, ...headers };
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body = "") {
      this.body = String(body);
    },
  };
}

async function callApi(url) {
  const response = createResponse();
  await handler({ url, method: "GET" }, response);
  return { response, body: JSON.parse(response.body) };
}

test("home comunica as metricas oficiais sem presumir orcamento", () => {
  const html = readProjectFile("public/index.html");
  const rootHtml = readProjectFile("index.html");
  const bundledHtml = readProjectFile("api/static/index.html");

  assert.equal(rootHtml.replace(/\r\n/g, "\n"), html.replace(/\r\n/g, "\n"), "o index da raiz deve acompanhar a home publica canonica");
  assert.equal(bundledHtml.replace(/\r\n/g, "\n"), html.replace(/\r\n/g, "\n"), "o HTML empacotado pela funcao deve acompanhar a home publica canonica");
  assert.match(html, /Busque um produto, informe seu limite e compare poucas op(?:ç|Ã§)(?:õ|Ãµ)es boas\./);
  assert.match(html, /Pre(?:ç|Ã§)o, origem e parcelamento ficam claros no resultado\./);
  assert.match(html, /<strong id="trustTotalCatalog">--<\/strong>\s*<span>produtos publicados/);
  assert.match(html, /<strong id="trustDepartments">--<\/strong>\s*<span>consulta por or(?:ç|Ã§|ÃƒÂ§)amento/);
  assert.match(html, /<strong id="trustSources">--<\/strong>\s*<span>links diretos quando confirmados/);
  assert.doesNotMatch(html, /Hoje catalogo atualizado|15\.999 produtos reais analisados|15\.999<\/strong>|16\.740<\/strong>|741<\/strong>/);
  assert.doesNotMatch(html, /ocultos por qualidade|produtos ocultos/i);
  assert.doesNotMatch(html, /id="productInput"[^>]*\svalue=/);
  assert.doesNotMatch(html, /id="monthlyInput"[^>]*\svalue=/);
  assert.doesNotMatch(html, /id="totalBudgetInput"[^>]*\svalue=/);
  assert.doesNotMatch(html, /Seu teto estimado:\s*<strong[^>]*>R\$/);
});

test("links futuros nao fingem navegacao e promessas respeitam os dados disponiveis", () => {
  const html = readProjectFile("public/index.html");
  const script = readProjectFile("public/app.js");

  assert.doesNotMatch(html, /<a[^>]+href="#blog"/i);
  assert.doesNotMatch(html, /<a[^>]+href="#conta"/i);
  assert.match(html, /<a[^>]+href="\/blog\/"[^>]*>Guias<\/a>/i);
  assert.doesNotMatch(html, /<a[^>]*>\s*Minha Conta/i);
  assert.doesNotMatch(html, /corta juros abusivos|fretes absurdos|ma reputacao/i);
  assert.match(html, /quando a fonte disponibiliza essas informa(?:c|ç|Ã§)(?:o|õ|Ãµ)es/i);
  assert.match(script, /source\.toLowerCase\(\) === "estimated"/);
  assert.match(script, /Parcelamento estimado\. Confirme na loja\./);
});

test("home-data expoe apenas metricas publicas e menu seguro", () => {
  const data = buildHomeCatalogData();

  assert.equal(data.totalPublishedProducts, 2280);
  assert.equal(data.publicCatalogSummary.publishedProducts, 2280);
  assert.equal(data.hiddenProducts, undefined);
  assert.equal(data.totalCatalogProducts, undefined);
  assert.equal(data.catalogSummary, undefined);
  assert.ok(data.catalogUpdatedAt === null || Number.isFinite(Date.parse(data.catalogUpdatedAt)));
  assert.ok(Array.isArray(data.topSources));
  assert.equal(data.topSources[0].source, "Info Store - Informática");
  assert.equal(data.topSources[0].count, 1462);
  assert.ok(data.topSources.every((entry) => entry.analyzedCount === undefined && entry.hiddenCount === undefined));
  assert.ok(data.topSources.some((entry) => entry.source === "Amazon" && entry.count === 361));
  assert.ok(data.topSources.some((entry) => entry.source === "Mercado Livre" && entry.count === 247));
  assert.ok(data.topSources.some((entry) => entry.source === "Magalu" && entry.count === 8));
  const futureItems = data.menu.filter((item) => ["Blog", "Minha Conta"].includes(item.label));
  assert.equal(futureItems.length, 2);
  assert.ok(futureItems.every((item) => item.future === true && item.active === false && item.href === ""));
});

test("status de fontes nunca expoe segredos e mantem diagnostico honesto", async () => {
  const oldRapidApiKey = process.env.RAPIDAPI_AMAZON_KEY;
  const oldRapidApiHost = process.env.RAPIDAPI_AMAZON_HOST;
  const oldMeliToken = process.env.MELI_ACCESS_TOKEN;
  const oldMeliSecret = process.env.MELI_CLIENT_SECRET;
  const rapidApiKey = "rapidapi-secret-that-must-never-leak";
  const rapidApiHost = "real-time-amazon-data.p.rapidapi.com";
  const meliToken = "meli-token-that-must-never-leak";
  const meliSecret = "meli-secret-that-must-never-leak";

  process.env.RAPIDAPI_AMAZON_KEY = rapidApiKey;
  process.env.RAPIDAPI_AMAZON_HOST = rapidApiHost;
  process.env.MELI_ACCESS_TOKEN = meliToken;
  process.env.MELI_CLIENT_SECRET = meliSecret;

  try {
    const amazon = await callApi("/api/amazon/status");
    const mercadoLivre = await callApi("/api/ml/status");
    const publicPayload = JSON.stringify([amazon.body, mercadoLivre.body]);

    assert.equal(amazon.response.statusCode, 200);
    assert.equal(amazon.body.configured, true);
    assert.ok(["rapidapi_amazon", "amazon_creators_api", "amazon_unconfigured"].includes(String(amazon.body.provider || "")));
    assert.ok(["boolean", "object"].includes(typeof amazon.body.eligible));
    assert.equal(mercadoLivre.response.statusCode, 200);
    assert.equal(mercadoLivre.body.configured, true);
    assert.equal(typeof mercadoLivre.body.authorizationRequired, "boolean");
    assert.doesNotMatch(publicPayload, new RegExp(rapidApiKey));
    assert.doesNotMatch(publicPayload, new RegExp(rapidApiHost.replace(/\./g, "\\.")));
    assert.doesNotMatch(publicPayload, new RegExp(meliToken));
    assert.doesNotMatch(publicPayload, new RegExp(meliSecret));
    assert.doesNotMatch(publicPayload, /x-rapidapi-key|MELI_ACCESS_TOKEN|CLIENT_SECRET/i);
  } finally {
    if (oldRapidApiKey === undefined) delete process.env.RAPIDAPI_AMAZON_KEY;
    else process.env.RAPIDAPI_AMAZON_KEY = oldRapidApiKey;
    if (oldRapidApiHost === undefined) delete process.env.RAPIDAPI_AMAZON_HOST;
    else process.env.RAPIDAPI_AMAZON_HOST = oldRapidApiHost;
    if (oldMeliToken === undefined) delete process.env.MELI_ACCESS_TOKEN;
    else process.env.MELI_ACCESS_TOKEN = oldMeliToken;
    if (oldMeliSecret === undefined) delete process.env.MELI_CLIENT_SECRET;
    else process.env.MELI_CLIENT_SECRET = oldMeliSecret;
  }
});

test("oauth do Mercado Livre usa dominio brasileiro acessivel", () => {
  const apiSource = readProjectFile("api/web.js");
  assert.match(apiSource, /https:\/\/auth\.mercadolivre\.com\.br\/authorization/);
  assert.doesNotMatch(apiSource, /https:\/\/auth\.mercadolibre\.com\.br\/authorization/);
});

test("oauth do Mercado Livre permite reparar token quebrado sem expor admin", () => {
  const apiSource = readProjectFile("api/web.js");
  assert.match(apiSource, /mercadolivreAuthRecordNeedsRepair/);
  assert.match(apiSource, /repairRequested/);
  assert.match(apiSource, /TOKEN_MISSING_OR_REQUIRED/);
});

test("busca publica nao devolve produtos demo quando nao ha oferta confirmada", async () => {
  const oldFetch = global.fetch;
  global.fetch = async () => new Response(JSON.stringify({ results: [] }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });

  try {
    const { response, body } = await callApi("/api/search?q=produto-inexistente-oqc-9z8y7x6w&mode=total&totalBudget=500");
    assert.equal(response.statusCode, 200);
    assert.ok(Array.isArray(body.products));
    assert.ok(body.products.every((item) => String(item.dataMode || item.mode || "").toLowerCase() !== "demo"));
    assert.doesNotMatch(JSON.stringify(body), /TOKEN_MISSING|403|CLIENT_SECRET|MELI_ACCESS_TOKEN/i);
  } finally {
    global.fetch = oldFetch;
  }
});
