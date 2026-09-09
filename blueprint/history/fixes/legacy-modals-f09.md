# Fix: Standardize Legacy Dialogs on Shared Accessible Modal (F-09)

Type: Fix
Status: verified
Fixes: F-09

## The problem

Multiple legacy dialogs across the dashboard and inventory areas implement custom inline backdrop divs (`<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 ...">`) instead of wrapping the shared, accessible `@/components/ui/Modal` component.

As a result, these legacy dialogs:
1. Lack standardized web accessibility (a11y) support, missing `role="dialog"`, `aria-modal="true"`, and automatic focus trapping.
2. Do not lock background page scrolling when opened, causing confusing background page scrolls beneath the overlay.
3. Lack standardized Escape key dismissal and click-outside backdrop event listeners.
4. Render inline within the DOM tree rather than into the document root via Portals, making them susceptible to parent overflow, z-index stacking context clipping, or transform bugs.

## The fix

Refactor all identified legacy modals to wrap `@/components/ui/Modal`. Preserve all existing form logic, inputs, validation, callbacks, state management, and styling, while delegating overlay presentation, portal mounting, focus trapping, scroll locking, and Escape key listeners to `@/components/ui/Modal`.

Refactor the dialogs in three cohesive, reviewable steps:
1. **Purchasing & Supplier Modals:** `SupplierScorecardModal.tsx`, `NewSupplierModal.tsx`, `NewPurchaseOrderModal.tsx`, `EditPurchaseOrderModal.tsx`, and `RecordPODeliveryModal.tsx`.
2. **Orders & Inventory Batches Modals:** `CancelOrderModal.tsx`, `OrderDispatchModal.tsx`, `MoMoReconciliationModal.tsx`, `WaybillSlipModal.tsx`, `SupplierPOExportModal.tsx`, `BatchLifecycleModal.tsx`, and `BatchBroadcastModal.tsx`.
3. **Settings, Insights & Customers Modals:** `TargetFormModal.tsx`, `CustomersDeleteModal.tsx`, `BillingMethodModal.tsx`, `ProviderConnectModal.tsx`, and `SupportAccessDelegationView.tsx`.

## Build steps

- [x] **Step 1 - Purchasing & Supplier Modals** - Refactor `SupplierScorecardModal`, `NewSupplierModal`, `NewPurchaseOrderModal`, `EditPurchaseOrderModal`, and `RecordPODeliveryModal` to wrap `@/components/ui/Modal`. *Done when:* All 5 modals use the shared `Modal` component with focus trapping and portal rendering, and `yarn check` passes.
- [x] **Step 2 - Orders & Inventory Batches Modals** - Refactor `CancelOrderModal`, `OrderDispatchModal`, `MoMoReconciliationModal`, `WaybillSlipModal`, `SupplierPOExportModal`, `BatchLifecycleModal`, and `BatchBroadcastModal` to wrap `@/components/ui/Modal`. *Done when:* All 7 order and batch modals use the shared `Modal` component, and `yarn check` passes.
- [x] **Step 3 - Settings, Insights & Customers Modals** - Refactor `TargetFormModal`, `CustomersDeleteModal`, `BillingMethodModal`, `ProviderConnectModal`, and `SupportAccessDelegationView` to wrap `@/components/ui/Modal`. *Done when:* All remaining legacy dialogs use the shared `Modal` component, zero custom `fixed inset-0 z-50` backdrop overlays remain in dialog components, and `yarn check`, `yarn lint`, and `yarn test` pass cleanly.

## Verify

- `yarn check` (`tsc --noEmit`) to ensure TypeScript typing across all modal props.
- `yarn lint` (`eslint src`) to ensure no lint violations or unescaped entities.
- `yarn test` to confirm all 564 unit tests remain green.
- Verify that `grep` for custom backdrop patterns (`fixed inset-0 z-50 flex items-center justify-center`) in dialog components returns zero matches.
