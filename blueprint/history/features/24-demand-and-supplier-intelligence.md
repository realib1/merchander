# Feature: Demand & supplier intelligence

**From build-plan:** feature 24
**Status:** verified

## Goal

Equip merchants with predictive inventory intelligence and procurement analytics: calculate product sales velocity and stock depletion dates, generate automated restock recommendations with 1-click draft Purchase Order creation, and track supplier reliability scorecards (on-time delivery %, lead time accuracy, fulfillment completeness, and defect rates).

## Design reference

- [AdminCN Sales & Analytics Dashboard](https://shadcn-nextjs-admincn-admin-template.vercel.app/dashboard/sales): Bento metric cards, Recharts velocity sparklines, and actionable table queues.
- [StudioGrid Pro E-commerce](https://studiogrid-pro-ecommerce.netlify.app/): Clean operational tables, status badges, and drawer inspection flows.

## In scope

1. **Database Schema & Migration for Restock & Supplier Metrics:**
   - Add supplier performance and lead time columns to `public.suppliers`:
     - `default_lead_days` (integer default 14), `sea_lead_days` (integer default 45), `air_lead_days` (integer default 7).
     - `reliability_score` (numeric default 100.0).
   - Add fulfillment audit columns to `public.purchase_orders`:
     - `expected_delivery_date` (timestamptz), `actual_delivery_date` (timestamptz).
     - `quality_rating` (smallint check 1 to 5), `defect_count` (integer default 0).
     - `fulfillment_accuracy` (numeric default 100.0).
   - Add reorder settings to `public.product_variants`:
     - `reorder_point` (integer default 10), `reorder_quantity` (integer default 20).
     - `preferred_supplier_id` (uuid references `public.suppliers(id)` on delete set null).
   - TypeScript contracts in `src/types/intelligence-demand.ts`.

2. **Pure Demand Forecasting & Supplier Scoring Utilities (`src/utils/`):**
   - `src/utils/demand-forecast.ts`:
     - `calculateDailyVelocity(salesHistory, daysWindow)`: calculates average units sold per day excluding draft/cancelled orders. Handles 0 sales safely (velocity = 0).
     - `calculateRunOutDate(currentStock, dailyVelocity)`: projects days of stock remaining and depletion date. Returns `Infinity` (or null depletion date) when velocity is 0 to prevent division by zero.
     - `calculateDynamicReorderPoint(dailyVelocity, leadTimeDays, safetyBufferDays)`: computes dynamic reorder threshold `(velocity * leadTime) + safetyBuffer`.
     - `classifyStockHealth(currentStock, reorderPoint, leadTimeDays, dailyVelocity)`: returns `'critical'` (depletion < lead time), `'warning'` (below reorder point), `'healthy'`, `'no_sales'`, or `'overstocked'`.
   - `src/utils/supplier-scoring.ts`:
     - `calculatePunctualityRate(purchaseOrders)`: percentage of POs delivered on or before expected date.
     - `calculateLeadTimeVariance(purchaseOrders)`: average deviation between expected and actual delivery days.
     - `calculateFulfillmentAccuracy(purchaseOrders)`: ratio of received quantities vs ordered quantities.
     - `calculateCompositeSupplierScore(metrics)`: weighted score (40% punctuality, 30% fulfillment completeness, 20% quality/defect rate, 10% debt balance reliability) yielding a 0-100 rating and Grade (`A` / `B` / `C` / `Needs Attention`). Handles unrated/new suppliers gracefully (`'Unrated'`).
   - 100% branch coverage unit test suites in `src/utils/demand-forecast.test.ts` and `src/utils/supplier-scoring.test.ts`.

3. **Demand & Supplier Intelligence Server Actions (`src/app/actions/intelligence-demand.ts`):**
   - `getRestockRecommendationsAction(storeId?: string)`:
     - Scopes to tenant and evaluates inventory across all variants against recent 30-day sales velocity and active pre-order demand.
     - Returns prioritized restock candidates with days of cover, suggested reorder quantity, and preferred supplier.
   - `createDraftPOFromRestockAction({ supplierId, items: [{ variantId, quantity, costPrice }] })`:
     - Generates a new draft `purchase_order` and `purchase_order_items` from selected restock recommendations in a single atomic transaction.
   - `getSupplierScorecardsAction()`:
     - Aggregates historical POs, shipments, and defect records per supplier to compute real performance scores.
   - Unit tests in `src/app/actions/intelligence-demand.test.ts`.

4. **Merchant Restock & Stock Depletion Dashboard Surface:**
   - In `/dashboard/inventory` (via a dedicated **"Restock & Forecast"** tab) and integrated into `/dashboard/insights`:
     - Bento KPI Cards: *Critical Stockouts (< 7 days)*, *Suggested Restock Items*, *Projected Reorder Capital Needed (GHS)*, *Average Stock Depletion Rate*.
     - Interactive Restock Recommendation Table: variant name, current stock across stores, daily burn rate, run-out date countdown, suggested reorder qty, preferred supplier.
     - 1-Click Multi-Select Action: "Create Draft PO from Selected" which creates a purchase order pre-filled with supplier and items.

5. **Supplier Performance Scorecard Surface:**
   - In `/dashboard/suppliers`:
     - `SupplierScorecardModal`: opens from supplier table to view detailed reliability breakdown (overall score, Grade A/B/C/Needs Attention, On-Time Delivery %, Average Lead Time Variance, Defect Rate).
     - Supplier table badges for quick grade overview.
   - In `/dashboard/purchasing`:
     - `RecordPODeliveryModal`: allow merchant to mark PO as received with actual delivery date, quality rating (1-5 stars), and defect count for automated score calculation.
   - Full project verification (`yarn check`, `yarn lint`, `yarn test`).

## Out of scope

- Complex machine-learning neural networks or external AI training pipelines (deterministic statistical velocity + reorder formulas provide transparent, explainable decisions for Ghanaian merchants).
- Direct automated supplier bank transfers or foreign wire dispatch (orders remain record-first; payments handled in Feature 6 & 11).
- Multi-currency forex hedging for Chinese Yuan (RMB) / USD procurement fluctuations.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Database schema & migration for restock parameters and supplier metrics** - Create migration `supabase/migrations/20260910000000_demand_supplier_intelligence.sql` adding lead times and score columns to `suppliers`, delivery timestamps and quality fields to `purchase_orders`, and reorder point/quantity to `product_variants`. Define TypeScript types in `src/types/intelligence-demand.ts`. *Done when:* Migration applies cleanly and TypeScript types reflect all new fields.
- [x] **Step 2 - Pure demand forecasting, reorder math & supplier scoring utilities** - Build `src/utils/demand-forecast.ts` and `src/utils/supplier-scoring.ts` with sales velocity, run-out date calculation, dynamic reorder point calculation, and weighted supplier grading, backed by comprehensive test suites in `src/utils/demand-forecast.test.ts` and `src/utils/supplier-scoring.test.ts`. *Done when:* `yarn test` passes on both utility test files with 100% branch coverage.
- [x] **Step 3 - Server actions for demand forecasting, restock suggestions & draft PO creation** - Create `src/app/actions/intelligence-demand.ts` with `getRestockRecommendationsAction`, `createDraftPOFromRestockAction`, and `getSupplierScorecardsAction`, backed by `src/app/actions/intelligence-demand.test.ts`. *Done when:* Unit tests pass verifying tenant scoping, velocity calculations, draft PO generation, and scoring logic.
- [x] **Step 4 - Merchant dashboard restock recommendations & depletion timeline UI** - Build Restock Recommendations surface in `/dashboard/inventory` with Bento KPI metrics, stock depletion countdowns, health status badges, and 1-click multi-select Draft PO creation. *Done when:* Merchant can view predicted run-out dates and generate a draft PO from restock suggestions.
- [x] **Step 5 - Supplier intelligence scorecards & end-to-end verification** - Build Supplier Scorecard badges and PO delivery receipt rating modal in `/dashboard/suppliers` and `/dashboard/suppliers/[id]`, and run full system verification. *Done when:* Supplier ratings accurately reflect on-time delivery and defect records, and `yarn check` + `yarn lint` + `yarn test` pass with 0 errors.

## Files / areas

- `supabase/migrations/20260910000000_demand_supplier_intelligence.sql` (NEW) - schema columns for suppliers, POs, and variants
- `src/types/intelligence-demand.ts` (NEW) - types for forecasting, restock suggestions, and supplier scoring
- `src/types/suppliers.ts` (MODIFY) - supplier performance fields
- `src/utils/demand-forecast.ts` (NEW) - sales velocity, burn rate, run-out date math
- `src/utils/demand-forecast.test.ts` (NEW) - unit tests for demand forecasting
- `src/utils/supplier-scoring.ts` (NEW) - supplier punctuality, quality, and composite scoring
- `src/utils/supplier-scoring.test.ts` (NEW) - unit tests for supplier scoring
- `src/app/actions/intelligence-demand.ts` (NEW) - server actions for restock queue and supplier metrics
- `src/app/actions/intelligence-demand.test.ts` (NEW) - unit tests for intelligence actions
- `src/app/dashboard/inventory/components/RestockRecommendationsView.tsx` (NEW) - restock queue & depletion view
- `src/app/dashboard/inventory/page.tsx` (MODIFY) - mount Restock tab/view
- `src/app/dashboard/suppliers/components/SupplierScorecardBadge.tsx` (NEW) - supplier rating & grade badge
- `src/app/dashboard/suppliers/components/SupplierScorecardModal.tsx` (NEW) - supplier performance audit & reliability modal
- `src/app/dashboard/suppliers/components/SuppliersTable.tsx` (MODIFY) - display supplier grade and on-time rate
- `src/app/dashboard/purchasing/components/RecordPODeliveryModal.tsx` (NEW) - log delivery date, quality, and defects

## Data / contracts

- Stock health status: `'critical'` (depletion < lead time) | `'warning'` (below reorder point) | `'healthy'` | `'overstocked'`.
- Supplier grade: `'A'` (90-100%) | `'B'` (80-89%) | `'C'` (70-79%) | `'Needs Attention'` (< 70%).
- Composite score formula: 40% On-Time Delivery Rate + 30% Fulfillment Completeness + 20% Quality/Defect Rate + 10% Supplier Balance / Debt Ratio.
- Draft PO creation contract: atomic transaction inserting into `public.purchase_orders` and `public.purchase_order_items` scoped to merchant `tenant_id`.

## Testing

- Logic unit tests: `yarn test src/utils/demand-forecast.test.ts`
- Scoring unit tests: `yarn test src/utils/supplier-scoring.test.ts`
- Action unit tests: `yarn test src/app/actions/intelligence-demand.test.ts`
- Full test suite: `yarn test`
- Type safety: `yarn check` (`tsc --noEmit`)
- Linter: `yarn lint` (`eslint src`)

## Notes for the AI

- Pure logic in `src/utils/` must ship with passing unit tests in the same diff to satisfy the Blueprint logic-testing gate.
- Protect multi-tenant boundaries: every query and mutation must enforce `tenant_id` verification.
- Use date arithmetic carefully with timezone boundaries (UTC timestamps in database, local days calculation for merchant display).
- Respect UI design tokens (`brand-primary`, `surface`, `surface-elevated`, `separator`, `font-display`) and avoid hardcoded color styles.
