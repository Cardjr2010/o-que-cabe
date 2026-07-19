import crypto from "node:crypto";
import OAuthTokenStore from "./OAuthTokenStore.js";

function envValue(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return String(value).trim();
  }
  return "";
}

function toBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value) {
  return Buffer.from(String(value || ""), "base64url");
}

export class VercelKvOAuthTokenStore extends OAuthTokenStore {
  constructor({
    fetchImpl = null,
    restUrl = "",
    restToken = "",
    encryptionSecret = "",
    prefix = "",
  } = {}) {
    super();
    this.fetchImpl = fetchImpl || globalThis.fetch;
    this.restUrl = restUrl || envValue("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL");
    this.restToken = restToken || envValue("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN");
    this.encryptionSecret = encryptionSecret || envValue("OAUTH_TOKEN_ENCRYPTION_KEY", "TOKEN_STORE_ENCRYPTION_KEY", "KV_ENCRYPTION_KEY");
    this.prefix = prefix || envValue("OAUTH_TOKEN_STORE_PREFIX") || "oqc";
  }

  isConfigured() {
    return Boolean(this.restUrl && this.restToken && this.encryptionSecret);
  }

  get accountKeyPrefix() {
    return `${this.prefix}:oauth`;
  }

  get stateKeyPrefix() {
    return `${this.prefix}:oauth-state`;
  }

  deriveKey() {
    return crypto.createHash("sha256").update(this.encryptionSecret).digest();
  }

  encrypt(payload) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.deriveKey(), iv);
    const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return JSON.stringify({
      iv: toBase64Url(iv),
      tag: toBase64Url(tag),
      data: toBase64Url(ciphertext),
      alg: "aes-256-gcm",
    });
  }

  decrypt(serialized) {
    if (!serialized) return null;
    const payload = JSON.parse(String(serialized));
    const decipher = crypto.createDecipheriv("aes-256-gcm", this.deriveKey(), fromBase64Url(payload.iv));
    decipher.setAuthTag(fromBase64Url(payload.tag));
    const plaintext = Buffer.concat([
      decipher.update(fromBase64Url(payload.data)),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString("utf8"));
  }

  refreshHash(refreshToken = "") {
    return crypto.createHash("sha256").update(String(refreshToken || "")).digest("hex");
  }

  tokenKey(provider, accountId = "default") {
    return `${this.accountKeyPrefix}:${provider}:${accountId}`;
  }

  tokenMetaKey(provider, accountId = "default") {
    return `${this.accountKeyPrefix}:${provider}:${accountId}:refresh-hash`;
  }

  stateKey(provider, state) {
    return `${this.stateKeyPrefix}:${provider}:${state}`;
  }

  async command(args = []) {
    if (!this.isConfigured()) {
      throw new Error("TOKEN_STORE_NOT_CONFIGURED");
    }
    const response = await this.fetchImpl(this.restUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.restToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body?.error || body?.message || `KV_HTTP_${response.status}`);
    }
    if (body?.error) {
      throw new Error(body.error);
    }
    return body?.result ?? null;
  }

  async get(provider, accountId = "default") {
    if (!this.isConfigured()) return null;
    const encrypted = await this.command(["GET", this.tokenKey(provider, accountId)]);
    if (!encrypted) return null;
    try {
      return this.decrypt(encrypted);
    } catch {
      return null;
    }
  }

  async save(provider, accountId = "default", tokenData = {}) {
    if (!this.isConfigured()) return false;
    const encrypted = this.encrypt(tokenData);
    const refreshHash = this.refreshHash(tokenData?.refresh_token || "");
    await this.command(["SET", this.tokenKey(provider, accountId), encrypted]);
    await this.command(["SET", this.tokenMetaKey(provider, accountId), refreshHash]);
    return true;
  }

  async replaceAtomically(provider, accountId = "default", expectedRefreshToken = "", tokenData = {}) {
    if (!this.isConfigured()) return false;
    const script = `
local meta = redis.call('GET', KEYS[2])
if meta and meta ~= ARGV[1] then
  return 0
end
redis.call('SET', KEYS[1], ARGV[2])
redis.call('SET', KEYS[2], ARGV[3])
return 1
`;
    const result = await this.command([
      "EVAL",
      script,
      "2",
      this.tokenKey(provider, accountId),
      this.tokenMetaKey(provider, accountId),
      this.refreshHash(expectedRefreshToken || ""),
      this.encrypt(tokenData),
      this.refreshHash(tokenData?.refresh_token || ""),
    ]);
    return Number(result) === 1;
  }

  async delete(provider, accountId = "default") {
    if (!this.isConfigured()) return false;
    await this.command(["DEL", this.tokenKey(provider, accountId), this.tokenMetaKey(provider, accountId)]);
    return true;
  }

  async saveState(provider, state, data = {}, ttlSeconds = 900) {
    if (!this.isConfigured()) return false;
    await this.command([
      "SET",
      this.stateKey(provider, state),
      this.encrypt(data),
      "EX",
      String(Math.max(1, Number(ttlSeconds || 900))),
      "NX",
    ]);
    return true;
  }

  async consumeState(provider, state) {
    if (!this.isConfigured()) return null;
    const script = `
local value = redis.call('GET', KEYS[1])
if not value then
  return ''
end
redis.call('DEL', KEYS[1])
return value
`;
    const result = await this.command([
      "EVAL",
      script,
      "1",
      this.stateKey(provider, state),
    ]);
    if (!result) return null;
    try {
      return this.decrypt(result);
    } catch {
      return null;
    }
  }
}

export function createOAuthTokenStore(options = {}) {
  return new VercelKvOAuthTokenStore(options);
}

export default VercelKvOAuthTokenStore;
