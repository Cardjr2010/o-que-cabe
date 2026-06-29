# Changelog

## Unreleased

### Frontend restoration hotfix
- Restored the public homepage assets by letting the Vercel filesystem serve `public/` before the API routes, so `/app.js`, `/styles.css`, and icons are delivered normally again.
- Added explicit Vercel routes for `/`, `/app.js`, `/styles.css`, and favicon assets so the home shell loads even when static delivery precedence changes.
- Moved the deployable frontend assets into `api/static/` and routed every request through `api/web.js` so production can serve HTML, CSS, and JS from the serverless bundle reliably.
- Added root-level static copies of the frontend assets so Vercel filesystem delivery has a clean path for `/`, `/app.js`, and `/styles.css`.
- Routed `/` and the frontend asset URLs directly to `api/web.js` so the home no longer depends on the filesystem delivery behavior of the platform.
- Simplified Vercel routing to a single `/(.*)` handler so the page and the assets are consistently resolved by `api/web.js`.
- Reworked `vercel.json` again to keep the API on `api/web.js` while letting `/` fall back to the static home entrypoint.
- Replaced the generic root routing with explicit rewrites for `/`, `/app.js`, `/styles.css`, and icons so Vercel serves the home shell from the documented static files.
- Simplified the root routing again so `/` and `/api/(.*)` both hit `api/web.js`, while the frontend assets stay in the bundled static folder.
- Added an explicit frontend health endpoint so the deployment can verify that `public/index.html`, `public/app.js`, and `public/styles.css` are present.
- Kept the API routes on `api/web.js` while letting Vercel serve static assets from `public/` again.

### Hotfix catalog deployment
- Ensured the real catalog seed is available in the Vercel bundle through `src/data/products.seed.js`.
- Added stable seed resolution and catalog health reporting so production can see the loaded source and count.
- Kept the demo fallback intact while restoring the real catalog path for serverless deployment.
- Added a resilient real-search fallback so production can keep returning catalog products even if the full ranking path stumbles in the serverless runtime.

### Sprint 20
- Validated the real Mi Shop catalog experience across the main MVP search terms and confirmed the API continues returning HTTP 200.
- Confirmed that the real catalog responses carry `dataMode=real`, images, and usable links for the Mi Shop-backed searches.
- Tightened ranking labels so out-of-budget products are no longer surfaced as `Melhor escolha`.
- Added a validation report for the current real catalog base and updated the tests to match the live Mi Shop-backed behavior.

### Sprint 10
- Unified the feed pipeline so Actionpay, Awin, Mi Shop, and CSV imports flow through the same provider layer into the CatalogManager.
- Added a shared feed status endpoint and provider-specific import routes to standardize real product ingestion.
- Kept the OQC engine untouched while consolidating real product feeds behind the same contract.

### Hotfix
- Fixed UTF-8 text on the public home so budget labels, section headings, and helper copy render correctly again.
- Made demo cards honest by removing Mercado Livre as a fixed visual source, disabling external demo navigation, and keeping real offers labeled with their actual source.
- Reduced the mobile footprint of the results, categories, and pechinchas sections so the homepage reads more cleanly on smaller screens.

### Sprint 9
- Added a generic feed provider layer so CSV feeds can be parsed, validated, normalized, and imported through the CatalogManager without duplicating feed-specific code.
- Implemented a Mi Shop CSV provider as the first real feed-backed source for the new feed architecture.
- Added `/api/feed/providers` and `/api/feed/import` endpoints plus regression tests covering CSV detection, Mi Shop normalization, invalid-row rejection, and catalog-backed search after import.

### Sprint 19
- Added a Google Merchant adapter that reads products from an authorized Merchant Center account and normalizes them into the OQC catalog contract.
- Exposed internal Google Merchant status and import endpoints so the catalog can be populated without exposing tokens.
- Extended the catalog import path and tests to preserve real-source metadata instead of forcing every import into the old Mercado Livre seed shape.

### Sprint 18
- Simplified the homepage shortcuts so the lower section reads cleaner on mobile and desktop.
- Improved the product card presentation with clearer image fallbacks and more consistent button treatment.
- Removed demo-facing button text from the public UI so the site only shows actionable announcement links or unavailable states.

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

### Sprint 12
- Added a real Awin feed provider for approved advertisers with JSONL/CSV/JSON/XML parsing and manual feed support.
- Connected the Awin import flow to the CatalogManager so real feed products become part of the official product database.
- Added Awin status/import endpoints and regression tests for parsing, normalization, deduplication, and safe import behavior.

### Sprint 13
- Added an Actionpay provider and YML importer for the Saldão da Informática feed.
- Wired Actionpay status, YML listing, and import endpoints to import real affiliate products into the CatalogManager.
- Added regression tests for Actionpay URL building, HTTP error handling, YML parsing, normalization, catalog import, and secret-safe API responses.

### Sprint 10
- Reworked the home pechinchas into practical budget shortcuts for R$ 50, R$ 100, R$ 250, and R$ 500.
- Expanded the Mercado Livre demo base with more realistic low-budget examples so the MVP has useful results in demo mode.
- Replaced the cold `Link indisponível` fallback on demo cards with the clearer `Demo — sem anúncio real` label.

### Sprint 10
- Added a real Awin feed provider that can download, parse, normalize, and import products into the CatalogManager.
- Added Awin import and status endpoints plus local/manual feed support so the OQC can start from approved real products without changing the engine stack.
- Added tests for Awin feed parsing, normalization, import deduplication, and endpoint diagnostics.

# Changelog

### Hotfix Vercel Production
- Added the missing `ValueEngine` module to the production commit so `RankingEngine` can load on Vercel without `ERR_MODULE_NOT_FOUND`.
- Fixed the serverless root-path resolution so the Vercel function no longer looks for `public/index.html` and seed files inside the `api/` directory when the runtime working directory differs.
- Added safe `/api/health` and `/api/catalog/health` diagnostics so production can report catalog state without taking the function down.
- Wrapped the Vercel handler in a global try/catch and added a safe fallback home page to prevent `FUNCTION_INVOCATION_FAILED` from uncaught file-path errors.

### Hotfix Catalog Deployment
- Added a bundled copy of `products.seed.json` under `src/data/` so Vercel can package the real catalog with the serverless function.
- Added a catalog path resolver that prefers bundled files and falls back to local paths when available.
- Extended catalog health diagnostics with resolved path and source information so production can confirm which seed file is active.

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
