# OQC Source Intelligence Layer

Data: 22/07/2026

## Entrega

Camada nova criada em laboratório/admin, sem substituir o fluxo público atual:

- `src/sources/SourceIntelligenceLayer.js`
- `src/search/ProductIntentParser.js`
- `src/search/SourcePlanner.js`
- `src/intelligence/ProductMatchEngine.js`
- `src/intelligence/OfficialStoreResolver.js`
- `src/intelligence/SourceQualityEngine.js`
- `src/intelligence/SellerTrustEngine.js`
- `src/pricing/FinalPurchaseCostEngine.js`
- `src/intelligence/PurchaseDecisionEngine.js`
- `src/intelligence/DecisionExplanationEngine.js`
- `src/providers/gecko/GeckoApiClient.js`
- `src/market/PriceObservationStore.js`
- `src/observability/SourceCostTracker.js`

## Superfície administrativa

- Página: `/admin/shopping-lab.html`
- Endpoint: `/api/admin/shopping-lab/search`
- Proteção: `OQC_ADMIN_TOKEN`

## Comportamento atual

1. A busca é parseada para intenção estruturada.
2. O planner escolhe fontes elegíveis por categoria.
3. As fontes são consultadas em paralelo.
4. Os produtos são normalizados para um contrato único.
5. O motor de match rejeita:
   - acessórios;
   - modelos errados;
   - conflitos de tipo;
   - CPU incompatível quando a busca pede CPU explícita.
6. A camada calcula:
   - confiança da fonte;
   - confiança do vendedor;
   - custo final;
   - decisões distintas.

## Estado honesto das fontes no laboratório local

- Catálogo OQC: operacional
- Mercado Livre direto: configurado, mas sem token real válido
- Amazon direta: credenciais Creators presentes, mas bloqueada por elegibilidade
- Gecko API: não configurada

## Resultado

O laboratório já evita falsos positivos críticos:

- `iPhone 17 Pro Max 256GB` não aceita mais `iPhone 7`
- `TV Samsung 55` não aceita smartphone com `TV` no nome
- `notebook Lenovo i5 16GB` não aceita `i7`
- `casa até 50` retorna refinamento em vez de peça industrial

## Validação técnica

- `node --test`: 165/165
- `node --check api/web.js`: OK
- `node --check public/app.js`: OK
- `node --check server.mjs`: OK

## Bloqueios restantes

- Gecko sem `GECKO_API_BASE_URL` e `GECKO_API_KEY`
- Mercado Livre sem `access_token`/`refresh_token` reais persistidos
- Amazon Creators com `AssociateNotEligible`

