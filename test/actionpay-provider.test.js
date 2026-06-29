import test from "node:test";
import assert from "node:assert/strict";

async function loadProviderClass() {
  const url = new URL("../src/providers/ActionpayProvider.js", import.meta.url);
  url.searchParams.set("t", `${Date.now()}-${Math.random()}`);
  const module = await import(url.href);
  return module.ActionpayProvider;
}

test("ActionpayProvider fica desconfigurado sem env", async () => {
  const ActionpayProvider = await loadProviderClass();
  const provider = new ActionpayProvider({ apiKey: "", sourceId: "" });

  assert.equal(provider.isConfigured(), false);
  assert.equal(provider.getDiagnostics().hasApiKey, false);
  assert.equal(provider.getDiagnostics().hasSourceId, false);
});

test("ActionpayProvider buildUrl monta a URL sem expor segredo em status", async () => {
  const ActionpayProvider = await loadProviderClass();
  const provider = new ActionpayProvider({ apiKey: "secret-key", sourceId: "source-1" });
  const url = provider.buildUrl("apiWmYmls", {
    act: "deeplinks",
    yml: "777",
    source: "source-1",
    subId1: "oqc",
  });

  assert.ok(url.includes("apiWmYmls"));
  assert.ok(url.includes("key=secret-key"));
  assert.ok(url.includes("format=xml"));
  assert.ok(url.includes("act=deeplinks"));
  assert.ok(url.includes("yml=777"));

  const diagnostics = provider.getDiagnostics();
  assert.equal(diagnostics.hasApiKey, true);
  assert.equal(diagnostics.hasSourceId, true);
  assert.ok(!JSON.stringify(diagnostics).includes("secret-key"));
});

test("ActionpayProvider trata erro HTTP da API", async () => {
  const ActionpayProvider = await loadProviderClass();
  const provider = new ActionpayProvider({
    apiKey: "secret-key",
    sourceId: "source-1",
    fetchImpl: async () => ({
      ok: false,
      status: 403,
      headers: { get: () => "text/xml" },
      text: async () => "<error>forbidden</error>",
    }),
  });

  await assert.rejects(() => provider.getYmls("13241"), (error) => {
    assert.equal(error.statusHttp, 403);
    assert.equal(error.code, "ACTIONPAY_HTTP_403");
    assert.ok(String(error.message).includes("403"));
    return true;
  });
});
