import fs from "node:fs";
import { projectRoot } from "../runtime/project-root.js";

import path from "node:path";

const root = projectRoot;

const linksPath = path.join(root, "data", "mercadolivre-links.json");
const oauthTokenPath = path.join(root, "data", "mercadolivre-oauth.json");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readMercadoLivreOAuth() {
  return readJson(oauthTokenPath, null);
}

function writeMercadoLivreOAuth(payload) {
  fs.writeFileSync(oauthTokenPath, JSON.stringify(payload, null, 2), "utf8");
}

function mercadolivreClientId() {
  return process.env.MELI_CLIENT_ID || process.env.CLIENT_ID || process.env.MERCADOLIVRE_CLIENT_ID || process.env.MERCADO_LIVRE_CLIENT_ID || "";
}

function mercadolivreClientSecret() {
  return process.env.MELI_CLIENT_SECRET || process.env.CLIENT_SECRET || process.env.MERCADOLIVRE_CLIENT_SECRET || process.env.MERCADO_LIVRE_CLIENT_SECRET || "";
}

function hasMercadoLivreToken() {
  const data = readMercadoLivreOAuth();
  return Boolean(data && data.access_token);
}

function getMercadoLivreAuthHeaders(token) {
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
}

function tokenExpired(data) {
  if (!data) return true;
  const expiresAt = Number(data.expires_at || 0);
  if (!expiresAt) return false;
  return Date.now() >= expiresAt - 60_000;
}

async function refreshMercadoLivreToken(refreshToken) {
  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: mercadolivreClientId(),
      client_secret: mercadolivreClientSecret(),
      refresh_token: refreshToken,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.message || body.error_description || body.error || `HTTP ${response.status}`;
    throw new Error(message);
  }
  const payload = {
    access_token: body.access_token,
    refresh_token: body.refresh_token || refreshToken,
    token_type: body.token_type || "bearer",
    expires_in: body.expires_in,
    expires_at: Date.now() + Number(body.expires_in || 0) * 1000,
    scope: body.scope || null,
    user_id: body.user_id || null,
    created_at: new Date().toISOString(),
  };
  writeMercadoLivreOAuth(payload);
  return payload;
}

async function getMercadoLivreTokenData() {
  const data = readMercadoLivreOAuth();
  if (!data || !data.access_token) return null;
  if (!tokenExpired(data)) return data;
  if (!data.refresh_token) return data;
  try {
    return await refreshMercadoLivreToken(data.refresh_token);
  } catch {
    return data;
  }
}

function extractMercadoLivreItemId(url) {
  const value = String(url || "");
  const match = value.match(/(?:MLB[-]?)(\d{6,})/i);
  if (!match) return null;
  return `MLB${match[1]}`;
}

async function fetchMercadoLivreItemById(itemId) {
  const tokenData = await getMercadoLivreTokenData();
  if (!tokenData || !tokenData.access_token) {
    throw new Error("Conecte sua conta Mercado Livre para consultar produtos reais.");
  }
  const headers = getMercadoLivreAuthHeaders(tokenData.access_token);
  const response = await fetch(`https://api.mercadolibre.com/items/${encodeURIComponent(itemId)}`, { headers });
  const body = await response.json().catch(async () => ({ raw: await response.text().catch(() => "") }));
  if (!response.ok) {
    const error = new Error(`Mercado Livre HTTP ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

function normalizeItem(item, affiliateUrl, originalUrl) {
  return {
    id: item.id,
    title: item.title,
    category: item.category_id || "",
    store: "Mercado Livre",
    price: item.price,
    image: item.thumbnail || "",
    rating: null,
    description: item.title || "",
    productUrl: item.permalink || originalUrl || "",
    affiliateUrl: affiliateUrl || null,
    source: "mercadolivre",
    availableQuantity: item.available_quantity,
    condition: item.condition,
    lastChecked: new Date().toISOString(),
  };
}

async function loadManualMercadoLivreProducts() {
  const links = readJson(linksPath, []).filter((item) => item && item.active !== false);
  const output = [];
  for (const link of links) {
    const itemId = extractMercadoLivreItemId(link.url);
    if (!itemId) {
      output.push({
        id: link.id,
        title: link.title || "Produto inválido",
        category: link.category || "",
        store: "Mercado Livre",
        price: null,
        image: "",
        rating: null,
        description: link.notes || "URL inválida para extração do ID MLB.",
        productUrl: link.url,
        affiliateUrl: link.affiliateUrl || null,
        source: "mercadolivre",
        availableQuantity: null,
        condition: null,
        lastChecked: new Date().toISOString(),
        error: "Não foi possível extrair o ID MLB da URL.",
      });
      continue;
    }

    try {
      const item = await fetchMercadoLivreItemById(itemId);
      output.push(normalizeItem(item, link.affiliateUrl, link.url));
    } catch (error) {
      output.push({
        id: link.id,
        title: link.title || itemId,
        category: link.category || "",
        store: "Mercado Livre",
        price: null,
        image: "",
        rating: null,
        description: link.notes || "Falha ao consultar o item.",
        productUrl: link.url,
        affiliateUrl: link.affiliateUrl || null,
        source: "mercadolivre",
        availableQuantity: null,
        condition: null,
        lastChecked: new Date().toISOString(),
        error: error.message,
      });
    }
  }
  return output;
}

export default {
  extractMercadoLivreItemId,
  fetchMercadoLivreItemById,
  loadManualMercadoLivreProducts,
  readMercadoLivreOAuth,
  hasMercadoLivreToken,
  getMercadoLivreTokenData,
};