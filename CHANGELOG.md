# Changelog

## Unreleased

### Sprint 8
- Added a marketplace provider abstraction so the OQC can grow beyond Mercado Livre without changing the engine stack.
- Introduced `MarketplaceProvider` plus a Mercado Livre implementation that preserves the OQC product shape.
- Routed the API through the provider layer while keeping BudgetEngine, ScoreEngine, and RankingEngine unchanged.

### Sprint 7
- Introduced `MercadoLivreConnector` as the single integration layer for Mercado Livre data access.
- Added token-aware strategies with controlled fallback to honest demo data when real access is unavailable.
- Added connector diagnostics and tests for token absence, 403 handling, item lookup, normalization, and safe fallback behavior.

### Sprint 6
- Fixed the local search flow to accept `mode=total` with `totalBudget` only and keep the API on HTTP 200 for trust-building flows.
- Tightened Mercado Livre demo fallback relevance so categories stay coherent and the demo messages stay honest.
- Simplified product and recommendation button labels to make real versus demo destinations clearer in the MVP.
- Added automated checks for total mode stability, category coherence, and the current CTA labels.

### Sprint 4
- Connected `BudgetEngine`, `ScoreEngine`, and `RankingEngine` to the main Mercado Livre search flow.
- Added recommendation output with ranked picks, grouped results, and score breakdowns.
- Added integration tests covering the OQC search response and ranking behavior.

### Sprint 3
- Added `RankingEngine` as the shared recommendation ordering module.
- Ranked products by budget status first, then score, with transparent labels and reasons.
- Added automated tests for CABE/APERTADO/NÃO CABE ordering, link-based tie-breaking, and demo labeling.

### Sprint 2
- Added `ScoreEngine` as the shared trust scoring module.
- Aligned scoring weights with the OQC Trust Framework and exposed a transparent breakdown for every score.
- Added automated tests covering seller quality, frete, rating, delivery, warranty, brand, and sold quantity signals.

### Sprint 1
- Added `BudgetEngine` as the shared budget classification module.
- Centralized monthly and total budget decisions in the engine.
- Added automated tests for budget context, classification, and ranking priority.
