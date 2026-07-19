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

test("home comunica as métricas oficiais sem presumir orçamento", () => {
  const html = readProjectFile("public/index.html");

  assert.match(html, /15\.999<\/strong>\s*<span>produtos publicados/);
  assert.match(html, /16\.740<\/strong>\s*<span>produtos analisados/);
  assert.match(html, /741<\/strong>\s*<span>produtos ocultos por qualidade ou fonte/);
  assert.doesNotMatch(html, /Hoje catálogo atualizado|15\.999 produtos reais analisados/);
  assert.doesNotMatch(html, /id="productInput"[^>]*\svalue=/);
  assert.doesNotMatch(html, /id="monthlyInput"[^>]*\svalue=/);
  assert.doesNotMatch(html, /id="totalBudgetInput"[^>]*\svalue=/);
  assert.doesNotMatch(html, /Seu teto estimado:\s*<strong[^>]*>R\$/);
});

test("links futuros não fingem navegação e promessas respeitam os dados disponíveis", () => {
  const html = readProjectFile("public/index.html");

  assert.doesNotMatch(html, /<a[^>]+href="#blog"/i);
  assert.doesNotMatch(html, /<a[^>]+href="#conta"/i);
  assert.match(html, /Blog <small>Em breve<\/small>/);
  assert.match(html, /Minha Conta <small>Em breve<\/small>/);
  assert.doesNotMatch(html, /corta juros abusivos|fretes absurdos|má reputação/i);
  assert.match(html, /quando a fonte disponibiliza essas informações/);
});

test("home-data expõe os números oficiais e menu seguro", () => {
  const data = buildHomeCatalogData();

  assert.equal(data.totalCatalogProducts, 16740);
  assert.equal(data.totalPublishedProducts, 15999);
  assert.equal(data.hiddenProducts, 741);
  assert.ok(data.catalogUpdatedAt === null || Number.isFinite(Date.parse(data.catalogUpdatedAt)));
  const futureItems = data.menu.filter((item) => ["Blog", "Minha Conta"].includes(item.label));
  assert.equal(futureItems.length, 2);
  assert.ok(futureItems.every((item) => item.future === true && item.active === false && item.href === ""));
});

test("status de fontes nunca expõe RapidAPI ou credenciais do Mercado Livre", async () => {
  const oldRapidApiKey = process.env.RAPIDAPI_AMAZON_KEY;
  const oldMeliToken = process.env.MELI_ACCESS_TOKEN;
  const oldMeliSecret = process.env.MELI_CLIENT_SECRET;
  const rapidApiKey = "rapidapi-secret-that-must-never-leak";
  const meliToken = "meli-token-that-must-never-leak";
  const meliSecret = "meli-secret-that-must-never-leak";

  process.env.RAPIDAPI_AMAZON_KEY = rapidApiKey;
  process.env.MELI_ACCESS_TOKEN = meliToken;
  process.env.MELI_CLIENT_SECRET = meliSecret;

  try {
    const amazon = await callApi("/api/amazon/status");
    const mercadoLivre = await callApi("/api/ml/status");
    const publicPayload = JSON.stringify([amazon.body, mercadoLivre.body]);

    assert.equal(amazon.response.statusCode, 200);
    assert.equal(amazon.body.configured, false);
    assert.equal(amazon.body.provider, "rapidapi_amazon");
    assert.equal(amazon.body.hasKey, true);
    assert.equal(mercadoLivre.response.statusCode, 200);
    assert.doesNotMatch(publicPayload, new RegExp(rapidApiKey));
    assert.doesNotMatch(publicPayload, new RegExp(meliToken));
    assert.doesNotMatch(publicPayload, new RegExp(meliSecret));
    assert.doesNotMatch(publicPayload, /x-rapidapi-key|MELI_ACCESS_TOKEN|CLIENT_SECRET/i);
  } finally {
    if (oldRapidApiKey === undefined) delete process.env.RAPIDAPI_AMAZON_KEY;
    else process.env.RAPIDAPI_AMAZON_KEY = oldRapidApiKey;
    if (oldMeliToken === undefined) delete process.env.MELI_ACCESS_TOKEN;
    else process.env.MELI_ACCESS_TOKEN = oldMeliToken;
    if (oldMeliSecret === undefined) delete process.env.MELI_CLIENT_SECRET;
    else process.env.MELI_CLIENT_SECRET = oldMeliSecret;
  }
});

test("busca pública não devolve produtos demo quando não há oferta confirmada", async () => {
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
