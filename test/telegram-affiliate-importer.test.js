import assert from "node:assert/strict";
import test from "node:test";

import { previewTelegramAffiliateHtml } from "../scripts/import-telegram-affiliate-offers.mjs";

const telegramHtml = `
<div class="message default clearfix">
  <div class="pull_right date details" title="31.07.2026 09:03:33 UTC-03:00">09:03</div>
  <div class="text">
    <strong>Novo Cupom no Mercado Livre 🔥</strong><br>
    15% OFF em R$ 79<br>
    👉 <a href="https://meli.la/2BZw2pz">https://meli.la/2BZw2pz</a>
  </div>
</div>
<div class="message default clearfix">
  <div class="pull_right date details" title="31.07.2026 20:29:10 UTC-03:00">20:29</div>
  <a class="photo_wrap" href="photos/photo_1.jpg"></a>
  <div class="text">
    <strong>Fritadeira Elétrica Air Fryer WAP Cozinha Barbecue com Painel Digital e 12 Funções Preto e cinza</strong><br>
    ✅ R$ 872,10 (Pix)<br>
    ➡️ <a href="https://meli.la/1XT472J">https://meli.la/1XT472J</a><br>
    📌 Anúncio | Preços sujeitos à alteração sem aviso prévio
  </div>
</div>
`;

test("previewTelegramAffiliateHtml accepts concrete products and rejects coupon-only messages", () => {
  const result = previewTelegramAffiliateHtml({ html: telegramHtml, max: 10 });

  assert.equal(result.ok, true);
  assert.equal(result.date, "31.07.2026");
  assert.equal(result.messages, 2);
  assert.equal(result.accepted, 1);
  assert.equal(result.rejected, 1);
  assert.equal(result.bySource.mercado_livre, 1);
  assert.equal(result.byCategory.casa, 1);
  assert.equal(result.products[0].title, "Fritadeira Elétrica Air Fryer WAP Cozinha Barbecue com Painel Digital e 12 Funções Preto e cinza");
  assert.equal(result.products[0].price, 872.1);
  assert.equal(result.products[0].source, "mercado_livre");
  assert.equal(result.products[0].link, "https://meli.la/1XT472J");
  assert.match(result.rejectedItems[0].reasons.join(" "), /título genérico/);
});

test("previewTelegramAffiliateHtml accepts ISO date filters", () => {
  const result = previewTelegramAffiliateHtml({ html: telegramHtml, date: "2026-07-31", max: 10 });

  assert.equal(result.ok, true);
  assert.equal(result.date, "31.07.2026");
  assert.equal(result.accepted, 1);
  assert.equal(result.bySource.mercado_livre, 1);
});
