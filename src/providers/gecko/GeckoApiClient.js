function envValue(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return String(value).trim();
  }
  return "";
}

function sanitizeHeaders(headers = {}) {
  return Object.fromEntries(Object.entries(headers).filter(([key]) => !/authorization|x-api-key/i.test(String(key))));
}

export class GeckoApiClient {
  constructor({
    fetchImpl = null,
    baseUrl = "",
    apiKey = "",
    timeoutMs = 12000,
  } = {}) {
    this.fetchImpl = fetchImpl || globalThis.fetch;
    this.baseUrl = baseUrl || envValue("GECKO_API_BASE_URL");
    this.apiKey = apiKey || envValue("GECKO_API_KEY");
    this.timeoutMs = Number(timeoutMs || envValue("GECKO_API_TIMEOUT_MS") || 12000);
  }

  isConfigured() {
    return Boolean(this.baseUrl && this.apiKey);
  }

  buildUrl(pathname = "/v1/extract") {
    return new URL(pathname, this.baseUrl).toString();
  }

  async request(pathname = "/v1/extract", payload = {}, options = {}) {
    if (!this.isConfigured()) {
      return { ok: false, status: 503, errorType: "GECKO_NOT_CONFIGURED", body: null, request: null };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error("GECKO_TIMEOUT")), this.timeoutMs);
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      ...(options.useApiKeyHeader ? { "X-API-Key": this.apiKey } : {}),
    };

    try {
      const response = await this.fetchImpl(this.buildUrl(pathname), {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const text = await response.text().catch(() => "");
      let body = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = { rawText: text };
      }
      return {
        ok: response.ok,
        status: response.status,
        body,
        request: {
          url: this.buildUrl(pathname),
          method: "POST",
          headers: sanitizeHeaders(headers),
          payload,
        },
        errorType: response.ok ? null : `GECKO_HTTP_${response.status}`,
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        body: null,
        request: {
          url: this.buildUrl(pathname),
          method: "POST",
          headers: sanitizeHeaders(headers),
          payload,
        },
        errorType: error?.name === "AbortError" ? "GECKO_TIMEOUT" : "GECKO_REQUEST_FAILED",
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async probeMarketplace({ source = "amazon", query = "iphone 17", productUrl = "" } = {}) {
    const payload = {
      workflow: productUrl ? "pdp" : "plp",
      source,
      query,
      url: productUrl || undefined,
      marketplace: "BR",
    };
    return this.request("/v1/extract", payload);
  }
}

export default GeckoApiClient;
