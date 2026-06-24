# Changelog

## Unreleased

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
