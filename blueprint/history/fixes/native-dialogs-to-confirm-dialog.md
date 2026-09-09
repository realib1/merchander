# Fix: Replace Native Browser Dialogs with ConfirmDialog and Toast Notifications

**Type:** Fix  
**Status:** verified  
**Fixes:** F-12  

---

## The Problem

Multiple dashboard and platform client components directly invoke native browser dialogs (`window.confirm()` in 14 locations and `window.alert()` in 5 locations):
1. **Thread-blocking:** Synchronous browser dialogs freeze the browser UI thread and JavaScript event loop, halting animations, timers, and background fetches.
2. **Inconsistent UX:** Native dialogs cannot be styled to respect project design tokens, dark mode, or typography standards.
3. **Accessibility (a11y) Violations:** Native dialogs lack accessible ARIA attributes, keyboard focus trapping, and screen reader announcements. Additionally, modern browsers allow users to suppress future dialogs ("Prevent this page from creating additional dialogs"), which permanently breaks critical destructive action flows.

The project design system already provides `@/components/ui/ConfirmDialog` (wrapping `@/components/ui/Modal` with keyboard handling, focus trapping, loading state, and destructive action styling) and `sonner` toasts for notifications, but these components bypassed them.

---

## The Fix

1. Replaced `window.confirm()` and `confirm()` with the accessible `@/components/ui/ConfirmDialog` primitive across all 14 locations:
   - `src/app/dashboard/categories/components/CategoriesTable.tsx`
   - `src/app/dashboard/products/components/ProductsTable.tsx`
   - `src/app/dashboard/staff/components/StaffTable.tsx`
   - `src/app/dashboard/shipments/components/ShipmentsTable.tsx`
   - `src/app/dashboard/payments/components/PaymentsTable.tsx`
   - `src/app/dashboard/expenses/components/ExpensesTable.tsx`
   - `src/app/dashboard/settings/branches/components/BranchManagementClient.tsx`
   - `src/app/dashboard/settings/permissions/components/DeleteRoleButton.tsx`
   - `src/app/dashboard/settings/subscription/components/BillingMethodCard.tsx`
   - `src/app/dashboard/insights/components/TargetCard.tsx`
   - `src/app/dashboard/help/components/SupportAccessDelegationView.tsx`
   - `src/app/platform/system-health/components/IncidentsManager.tsx`
   - `src/app/platform/security/components/StaffManagementClient.tsx`
2. Replaced `window.alert()` and `alert()` with `toast.error()` from `sonner` across all 5 locations:
   - `src/utils/profitabilityExport.ts`
   - `src/app/dashboard/help/components/SupportAccessDelegationView.tsx`
   - `src/app/platform/security/components/StaffManagementClient.tsx`
3. Preserved all existing Server Action invocations, optimistic updates, and error handling logic unchanged.

---

## Build Steps

- [x] **Step 1: Replace native dialogs in Core Dashboard Tables and Utils**
- [x] **Step 2: Replace native dialogs in Settings, Insights, Help, and Platform Surfaces**

---

## Verify

- `rg "\b(confirm|alert|prompt)\s*\(" src/`: Zero matches in application code.
- `yarn check`: Zero TypeScript errors.
- `yarn lint`: Zero ESLint errors or warnings.
- `yarn test`: 59 test files, 517 tests passing.
