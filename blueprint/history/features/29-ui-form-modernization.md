# Feature: UI Form Modernization & Code Quality Audit (Drawer vs Modal & LOC Refactor)

**From build-plan:** feature 29
**Status:** verified

## Goal

Systematically audit and refactor existing forms across the platform console and merchant dashboard. Migrate tall, multi-section forms and inspectors from centered popups and hand-rolled overlay markups to accessible right-hand slide-over `Drawer` components with pinned headers and footers. Decompose oversized monolithic client components to enforce the "one job per component" and LOC modularity rules, eliminate custom overlay anti-patterns, replace loose types with strict interfaces, and purge stray em dashes across code and user-facing text.

## In scope

- **Form Surface Policy Enforcement:**
  - Dialog / Modal (`Modal.tsx`): Restricted to short, focused interactions (1 to 3 fields maximum, confirmation dialogs, quick status toggles, destructive confirmations, export prompts, simple 1-step inputs).
  - Slide-over Drawer (`Drawer.tsx`): Standardized for all multi-section forms, multi-field resource creation/editing (4+ fields, physical addresses, multi-currency pricing, line-item pickers, cargo parameters), and rich detail inspectors.
  - Ban on Hand-Rolled Overlays: Eliminate ad-hoc `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 ...` or custom inline drawer animations in favor of the shared `Modal` and `Drawer` primitives.
- **Platform Console Form Modularization & LOC Deconstruction:**
  - `MerchantsClient.tsx` (570 LOC): Extract `MerchantStatusModal.tsx` and `MerchantPlanModal.tsx` using `Modal`. Shrink `MerchantsClient.tsx` to under 300 LOC.
  - `StaffManagementClient.tsx` (429 LOC): Extract `AddStaffModal.tsx` using `Modal`. Shrink `StaffManagementClient.tsx` to under 270 LOC and fix em dash on line 365.
  - `PlansBillingClient.tsx` (547 LOC): Extract tier editor into `PlanEditorDrawer.tsx` using `Drawer` with multi-currency, limit, and toggle sections. Shrink `PlansBillingClient.tsx` to under 260 LOC.
  - `IncidentsManager.tsx` (444 LOC): Extract `IncidentModal.tsx` using `Modal`. Shrink `IncidentsManager.tsx` to under 280 LOC.
- **Merchant Dashboard Drawer Migrations:**
  - `PaymentDetailsDrawer.tsx`: Migrate from `<Modal>` wrapper to `<Drawer size="md">`, aligning implementation with its name and inspector UX.
  - `ShipmentFormModal.tsx` & `ShipmentDetailsModal.tsx`: Migrate 16-field cargo form and timeline detail inspector to `ShipmentFormDrawer.tsx` and `ShipmentDetailsDrawer.tsx` using `Drawer size="lg"`. Update `ShipmentsClient.tsx`.
  - `CreateRoleModal.tsx` & `EditRoleModal.tsx`: Migrate multi-permission matrix form into unified `RoleFormDrawer.tsx` using `Drawer size="lg"`, grouping permissions by domain category.
  - `BranchFormModal.tsx` & `StockTransferModal.tsx`: Eliminate hand-rolled modal backdrop markups and migrate to `BranchFormDrawer.tsx` and `StockTransferDrawer.tsx` using `Drawer size="lg"`.
  - `BatchFormModal.tsx`: Eliminate hand-rolled overlay and migrate 12-field pre-order batch creator with product selector into `BatchFormDrawer.tsx` using `Drawer size="lg"`.
  - `OrderDetailsSheet.tsx`: Refactor custom hand-rolled motion slide-over to consume the shared `Drawer` primitive.
- **Code Quality & Anti-Pattern Audit:**
  - Purge stray em dashes (U+2014) across affected files (`StaffManagementClient.tsx`, `SupplierPOExportModal.tsx`, `ApprovalsWorkspace.tsx`, `platform.ts`, etc.) and replace with hyphens, colons, or parentheses.
  - Ensure zero `any` assertions across all newly created or refactored components.
  - Verify complete type safety with `yarn check` and test suite pass with `yarn test`.

## Out of scope

- Creating new business workflows or database migrations (this is a purely architectural and UI modernization refactor).
- Full page forms (`ProductForm.tsx` at `/dashboard/products/new`), which already live on dedicated routes and have already been modularized into domain sub-components.
- Unplanned restyling of unaffected tables, cards, or server actions.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Platform Console form modularization and modal cleanup** - Extract `MerchantStatusModal.tsx` and `MerchantPlanModal.tsx` from `MerchantsClient.tsx`, `AddStaffModal.tsx` from `StaffManagementClient.tsx`, `PlanEditorDrawer.tsx` (using `Drawer`) from `PlansBillingClient.tsx`, and `IncidentModal.tsx` from `IncidentsManager.tsx`. Eliminate all inline hand-rolled modal overlay divs in `src/app/platform/`. *Done when:* All four client components are below 300 LOC, inline modal markups are replaced by reusable `Modal` or `Drawer` components, and `yarn check` passes.
- [x] **Step 2 - Dashboard logistics, orders, and payments drawer migration** - Migrate `PaymentDetailsDrawer.tsx` from `<Modal>` to `<Drawer size="md">`. Migrate `ShipmentFormModal.tsx` and `ShipmentDetailsModal.tsx` to `ShipmentFormDrawer.tsx` and `ShipmentDetailsDrawer.tsx` using `<Drawer size="lg">`, updating `ShipmentsClient.tsx`. Refactor `OrderDetailsSheet.tsx` to use the shared `Drawer` primitive instead of custom motion overlay divs. *Done when:* Transaction details, shipment creation, shipment details, and order details render inside accessible right-hand slide-over `Drawer` components with escape key handling, focus traps, and pinned headers/footers.
- [x] **Step 3 - Dashboard settings and inventory drawer migration** - Migrate `BranchFormModal.tsx` and `StockTransferModal.tsx` in branch settings to `BranchFormDrawer.tsx` and `StockTransferDrawer.tsx` using `<Drawer size="lg">`. Unify `CreateRoleModal.tsx` and `EditRoleModal.tsx` into `RoleFormDrawer.tsx` with categorized permission groups. Migrate `BatchFormModal.tsx` to `BatchFormDrawer.tsx` using `<Drawer size="lg">`. *Done when:* Branch setup, stock transfers, role creation/editing, and pre-order batch configuration open in smooth slide-over `Drawer` panels with zero hand-rolled backdrop divs.
- [x] **Step 4 - Anti-pattern audit, em dash purge, and full verification** - Audit refactored code and related modules for anti-patterns: purge stray em dashes (U+2014) in `StaffManagementClient.tsx`, `SupplierPOExportModal.tsx`, `ApprovalsWorkspace.tsx`, and `platform.ts`, replace any remaining `any` assertions with strict TypeScript types, verify modal/drawer accessibility props, and run full verification suites. *Done when:* `yarn check` passes with zero TypeScript diagnostics, `yarn test` passes all tests with green exit code, and no em dashes remain in target files.

## Files / areas

- `src/app/platform/merchants/components/MerchantsClient.tsx`
- `src/app/platform/merchants/components/MerchantStatusModal.tsx` (new)
- `src/app/platform/merchants/components/MerchantPlanModal.tsx` (new)
- `src/app/platform/security/components/StaffManagementClient.tsx`
- `src/app/platform/security/components/AddStaffModal.tsx` (new)
- `src/app/platform/plans-billing/components/PlansBillingClient.tsx`
- `src/app/platform/plans-billing/components/PlanEditorDrawer.tsx` (new)
- `src/app/platform/system-health/components/IncidentsManager.tsx`
- `src/app/platform/system-health/components/IncidentModal.tsx` (new)
- `src/app/dashboard/payments/components/PaymentDetailsDrawer.tsx`
- `src/app/dashboard/shipments/components/ShipmentFormDrawer.tsx` (migrated from ShipmentFormModal)
- `src/app/dashboard/shipments/components/ShipmentDetailsDrawer.tsx` (migrated from ShipmentDetailsModal)
- `src/app/dashboard/shipments/components/ShipmentsClient.tsx`
- `src/app/dashboard/orders/components/OrderDetailsSheet.tsx`
- `src/app/dashboard/settings/branches/components/BranchFormDrawer.tsx` (migrated from BranchFormModal)
- `src/app/dashboard/settings/branches/components/StockTransferDrawer.tsx` (migrated from StockTransferModal)
- `src/app/dashboard/settings/branches/components/BranchesClient.tsx`
- `src/app/dashboard/settings/permissions/components/RoleFormDrawer.tsx` (unified from Create/EditRoleModal)
- `src/app/dashboard/settings/permissions/components/PermissionsClient.tsx`
- `src/app/dashboard/inventory/batches/components/BatchFormDrawer.tsx` (migrated from BatchFormModal)
- `src/app/dashboard/inventory/batches/components/BatchesOverviewClient.tsx`

## Data / contracts

- No schema migrations.
- UI contract:
  - Short forms (<= 3 inputs, confirmations) consume `Modal` (`isOpen`, `onClose`, `title`, `description`, `children`, `footer`).
  - Complex / tall forms (>= 4 inputs, multi-section, cargo, pre-orders, branches) and side-sheet inspectors consume `Drawer` (`isOpen`, `onClose`, `title`, `description`, `icon`, `children`, `footer`, `size`).
- TypeScript contracts: Strict component props interfaces; no `any` parameters or return types.

## Testing

- Typecheck: `yarn check` (`tsc --noEmit`) must succeed with zero errors after every step.
- Logic tests: `yarn test` (`vitest run`) must pass completely.
- Manual verification:
  - Step 1: Open Platform Merchants -> click "Change Status" and "Modify Plan" -> verify modal opens with focus trap and closes on backdrop/esc. Open Platform Security -> click "Add Staff" -> verify modal. Open Plans & Billing -> click "Create New Tier" -> verify right-side slide-over drawer with pinned header and footer. Open System Health -> click "Publish Incident" -> verify modal.
  - Step 2: Open Dashboard Payments -> click any payment row -> verify transaction details slide over in `Drawer`. Open Dashboard Shipments -> click "New Shipment" -> verify logistics creation opens in `Drawer`; click a shipment row -> verify details inspector opens in `Drawer`. Open Orders -> click order row -> verify order details sheet opens cleanly via `Drawer`.
  - Step 3: Open Settings Branches -> click "Add Branch" -> verify branch drawer opens; click "Stock Transfer" -> verify transfer drawer opens. Open Settings Permissions -> click "Create Custom Role" -> verify permissions drawer with categorized check groups. Open Inventory Batches -> click "New Pre-Order Batch" -> verify pre-order drawer opens with dates and product picker.
  - Step 4: Run `yarn lint` and `yarn check` to verify zero errors, no `any`, and zero em dashes.

## Notes for the AI

- Maintain strict functional components and React 19 / Next.js 16 conventions.
- All new drawer and modal components are client components and require `'use client'`.
- Never re-inline modal backdrops (`fixed inset-0 ...`); always import `Modal` or `Drawer` from `@/components/ui`.
- Do not use em dashes (U+2014) in comments, strings, or commit messages. Use hyphens, colons, or parentheses.
- Keep components focused and under 250 to 300 LOC.
