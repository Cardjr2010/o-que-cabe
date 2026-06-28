# Changelog

## Unreleased

### Sprint 23
- Added a new affiliate deals block on the home page so the site can show daily coupons and affiliate offers with images, validity, and direct destination links.
- Wired a new `/api/affiliate-offers` endpoint to serve curated offers from a local seed file without interfering with the budget search flow.
- Added a dedicated `Apple > iPhone` shortcut and kept `Tablet` and `Computador` prepared for future expansion.

### Sprint 22
- Tuned the new `Apple > iPhone` shortcut to target a specific `iPhone 17 Pro Max` search instead of the broader Apple phone family.
- Set the Apple shortcut to use a higher budget so the flow can surface the current premium device path without collapsing into a generic iPhone result.
- Kept `Tablet` and `Computador` as disabled future entries in the submenu.

### Sprint 21
- Added a new `Apple` category entry in the public home so iPhone can be expanded from a single top-level brand button.
- Prepared the submenu structure for `iPhone`, `Tablet`, and `Computador` without changing the existing search flow.
- Kept the public UI focused on the current catalog and budget modes while making the brand navigation easier to extend.

### Sprint 20
- Added a new `FeedImporter` for incremental CSV and JSON ingestion using streams and delta detection.
- Wired feed updates into the official catalog path so repeated rows are skipped unless relevant fields change.
- Added a cron-friendly feed sync script plus a server endpoint for scheduled ingestion from local files or remote URLs.
- Added a CJ shopping feed preset and remote-feed warning when a URL only exposes headers instead of product rows.
- Added tests for CSV streaming, JSON updates, and installment parsing to keep catalog ingestion stable.

### Sprint 19
- Added price-history-aware catalog merging so imported products preserve prior prices and record changes when a product is updated.
- Promoted the CatalogManager as the place where imported products receive status, timestamps, and stable merge behavior.
- Added a regression test to verify the catalog records price changes instead of overwriting history.

### Sprint 18
- Expanded the official seed catalog to cover the six home categories with 20 products each, so the quick-start buttons and category cards now have a fuller catalog behind them.
- Kept the catalog-driven search flow intact while improving visual coverage for celulares, TVs, notebooks, relógios, casa, and presente.

### Sprint 17
- Connected the CSV importer to the official `CatalogManager` so CSV imports now flow through the managed product database.
- Removed the parallel seed-writing path from the importer script and made the catalog handle merge and deduplication.
- Added catalog-aware tests and a report documenting the new CSV-to-catalog flow.

### Sprint 16
- Added a managed catalog layer so OQC products are handled through `CatalogManager` instead of being edited as raw JSON.
- Introduced catalog repository, validation, update, and export modules to support import, merge, disable, delete, and search flows.
- Added a simple internal `/catalog` page and `/api/catalog` endpoint for catalog visibility and export.

### Sprint 15
- Added a manual CSV template for populating the OQC with real product candidates across celulares, TVs, and notebooks.
- Documented how to fill prices, product links, and affiliate links before running the importer.
- Kept the template safe by leaving `price`, `productUrl`, and `image` blank where the product still needs verification.

### Sprint 14
- Added a CSV product importer so catalog entries can be loaded into the OQC seed from a simple flat file.
- Introduced a small CLI import script that validates, deduplicates, and merges CSV products into `data/products.seed.json`.
- Kept affiliate URL priority and honest rejection of invalid products so the MVP remains trustworthy.

### Sprint 13
- Added a WooCommerce-style importer layer to keep real products inside the OQC catalog before search and ranking run.
- Introduced `ProductImporter` and `WooCommerceStyleImporter` to normalize imported products into the OQC seed contract.
- Kept the local product seed as the first source for supported categories so the MVP remains useful without live marketplace dependence.

### Sprint 12
- Added the first real OQC product seed with 30 curated products across celulares, TVs, and notebooks.
- Routed the Mercado Livre provider to prefer the local seed base before falling back to live connector or demo behavior.
- Kept product links specific to category-level Mercado Livre destinations instead of generic marketplace home pages.

### Hotfix
- Removed Amazon and marketplace-origin visual elements from the public home so the MVP stays focused on Mercado Livre only.
- Kept the home limited to OQC, monthly and total budget modes, categories, results, and the honest demo message.
- Preserved future marketplace adapters in code while hiding them from the public interface.

### Hotfix
- Removed `undefined` leakage from card and recommendation text so the UI stays readable even when optional fields are missing.
- Disabled demo card navigation so the MVP never sends users to a Mercado Livre search or home page while still in demo mode.
- Kept real button labels explicit: `Abrir anúncio` and `Link indisponível`.
- Added regression tests covering demo non-navigation, fallback text, and the absence of `undefined` in the card rendering path.

### Sprint 11
- Added a public shopping fallback that can return real product cards when Mercado Livre search is blocked.
- Wired the connector to prefer authenticated Mercado Livre, then catalog, then a public shopping result path before demo.
- Added test coverage for the public shopping path so a query like `shampoo` can resolve to real-public results instead of falling back to demo.

### Sprint 10
- Reworked the home pechinchas into practical budget shortcuts for R$ 50, R$ 100, R$ 250, and R$ 500.
- Expanded the Mercado Livre demo base with more realistic low-budget examples so the MVP has useful results in demo mode.
- Replaced the cold `Link indisponível` fallback on demo cards with the clearer `Demo — sem anúncio real` label.

### Sprint 12
- Simplified the home search form so each budget mode shows only the fields that matter.
- Added a short mode hint to make Monthly vs Total easier to read at a glance.
- Reduced repeated result copy so recommendation cards and product cards read more cleanly on mobile.

### Sprint 11
- Tightened the home search card so monthly and total budget modes no longer feel visually mixed.
- Made the budget form switch its own layout state per mode, hiding the inactive budget input and showing clearer mode-specific labels.
- Kept the rest of the MVP behavior intact and verified the app still passes the full test suite.

### Sprint 10
- Expanded `BudgetEngine` with financial metrics for installment-aware analysis, including monthly impact, total term cost, embedded interest, and a traffic-light warning level.
- Preserved the existing CABE / APERTADO / NÃO CABE classification so the current ranking flow and UI remain stable.
- Added coverage for the new finance metrics while keeping the existing budget classification tests intact.

### Sprint 9
- Added a new "Pechinchas em foco" entry point on the home with budget shortcuts for R$ 50, R$ 100, R$ 250, and R$ 500.
- Wired the pechincha cards to reuse the existing monthly and total search flows without changing the MVP rules or reintroducing marketplace redirects.
- Kept the home focused on the OQC experience while preserving the honest demo behavior and the current engine stack.

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
