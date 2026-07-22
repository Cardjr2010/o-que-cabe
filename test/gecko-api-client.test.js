import test from "node:test";
import assert from "node:assert/strict";
import GeckoApiClient from "../src/providers/gecko/GeckoApiClient.js";

test("GeckoApiClient reporta não configurado sem segredo", async () => {
  const client = new GeckoApiClient({ baseUrl: "", apiKey: "" });
  const result = await client.probeMarketplace({ source: "amazon", query: "iphone 17" });

  assert.equal(result.ok, false);
  assert.equal(result.status, 503);
  assert.equal(result.errorType, "GECKO_NOT_CONFIGURED");
});

test("GeckoApiClient sanitiza headers no request reportado", async () => {
  const client = new GeckoApiClient({
    baseUrl: "https://example.com",
    apiKey: "segredo",
    fetchImpl: async () => new Response(JSON.stringify({ products: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  });

  const result = await client.probeMarketplace({ source: "amazon", query: "iphone 17" });
  assert.equal(result.ok, true);
  assert.ok(!JSON.stringify(result.request).includes("segredo"));
});
