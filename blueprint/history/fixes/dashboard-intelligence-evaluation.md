# Fix: Dynamic Dashboard Intelligence Stock & Supply Insights (F-23)

### Type: Fix
### Status: verified
### Fixes: F-23

---

## The Problem

In `src/app/actions/dashboard.ts:308`, when an established merchant account has products and orders but no low-stock products with active sales velocity (`lowStockList.length === 0`), `getDashboardIntelligence()` falls back to static hardcoded strings:
```ts
supplyInsight: ['• Stock levels are generally stable.', '• No major shipments in transit.']
recommendation: 'Maintain current reorder strategies.'
```

This causes multiple data integrity and intelligence flaws:
1. **False Sense of Stability on Zero-Stock Items:** If a merchant has items with 0 stock but 0 sales in the last 30 days, `supplyInsight` falsely informs the merchant that "Stock levels are generally stable" when catalog items are depleted.
2. **Blind to Real In-Transit Shipments:** If `purchaseOrdersList` has incoming shipments (`purchaseOrdersList.length > 0`), the fallback blindly states "No major shipments in transit", ignoring actual scheduled purchase orders.
3. **Fabricated Sales Velocity on Zero-Sales Items:** When `lowStockList.length > 0`, `Math.max(1, Math.round(totalSoldLast30Days / 4.33))` forces `avgWeeklySales` to 1 even when 0 units were sold in 30 days, falsely claiming the item is "moving fast at 1 units/week". Furthermore, if `remaining === 0`, it computes `daysRemaining: 1` and claims it "will likely sell out in 1 days" despite already being out of stock.

---

## The Fix

1. **Extract Pure Intelligence Computation (`src/utils/dashboardIntelligence.ts`):**
   - Create a pure, deterministic intelligence evaluator `computeDashboardIntelligence(input)` to evaluate velocity insights, supply insights, and recommendations from live store data.
   - Accurately evaluate out-of-stock items (`remaining <= 0`), low-stock items with zero sales velocity, active shipments in transit from `purchaseOrdersList`, and healthy inventory coverage.
   - Eliminate fabricated sales rates and static "No major shipments in transit" assertions.

2. **Integrate into Dashboard Server Action (`src/app/actions/dashboard.ts`):**
   - In `getDashboardMetrics()`, query counts for out-of-stock variants (`quantity <= 0`) and total tracked variants from `inventory_levels`.
   - Pass real counts, `lowStockList`, and `purchaseOrdersList` to `computeDashboardIntelligence()`.

3. **Comprehensive Unit Testing (`src/utils/dashboardIntelligence.test.ts`, `src/app/actions/dashboard.test.ts`):**
   - Test fresh merchant tenants (welcome onboarding message).
   - Test depleted stock (`remaining <= 0`) with zero sales and with prior sales.
   - Test active incoming purchase orders when `lowStockList` is empty (dynamically displaying shipment count, total units, and ETA).
   - Test completely healthy inventory (reporting tracked variants above threshold).

---

## Build Steps

- [x] **Step 1: Dynamic Dashboard Intelligence Evaluator & Action Integration (F-23)**
  - Create `src/utils/dashboardIntelligence.ts` with pure `computeDashboardIntelligence()`.
  - Update `src/app/actions/dashboard.ts` to compute actual stock status, query out-of-stock variant metrics, and use `computeDashboardIntelligence()`.
  - Create unit tests in `src/utils/dashboardIntelligence.test.ts` and `src/app/actions/dashboard.test.ts`.
  - **Done when:** `dashboardIntelligence.test.ts` and `dashboard.test.ts` pass, all 698+ vitest tests pass, and `yarn check` passes with 0 errors.

---

## Verification

### Automated
- `yarn test src/utils/dashboardIntelligence.test.ts`
- `yarn test src/app/actions/dashboard.test.ts`
- Full suite: `yarn test` (100% green: 80 files, 710 tests), `yarn check` (0 errors), `yarn lint` (0 errors).

### Manual
- Navigate to `/dashboard` for a store with incoming purchase orders but no low-stock velocity items: verify the Intelligence Card dynamically shows in-transit shipment counts and ETAs instead of "No major shipments in transit".
- For a store with 0-quantity variants: verify the Intelligence Card flags out-of-stock variants instead of claiming "Stock levels are generally stable".
