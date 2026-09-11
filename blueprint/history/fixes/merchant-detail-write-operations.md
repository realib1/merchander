# Current Feature

- **Title:** Add admin write operations to merchant detail page
- **Type:** Fix
- **Status:** verified

## The problem

The merchant detail page (`/platform/merchants/[id]`) is functionally shallow (a P2 gap). It shows the merchant's current plan and platform status (active, suspended, past_due) but is strictly read-only. Platform admins currently have to navigate away or use database access to change a merchant's plan tier or suspend an abusive/delinquent account. 

The server actions to do this (`updateTenantPlanAction`, `updateTenantStatusAction`) already exist in `src/app/actions/platform.ts` but are not wired up to this UI.

## The fix

Wire up the existing server actions to interactive controls on the merchant detail page.

1. Create a `TenantControls` client component (or add directly to `page.tsx` if it becomes a client component) that allows changing the tier and platform status.
2. The UI should have:
   - A dropdown or modal to change the Plan Tier (free, starter, growth, business, enterprise).
   - A toggle or action menu to change the Platform Status (e.g. suspend, restrict, reactivate).
3. Both actions require a `reason` which will be passed to the server actions to ensure proper audit logging.
4. Ensure the component leverages `verifyPlatformStaff` correctly on the server side via the existing actions.

## Build steps

- [x] **Step 1: Create MerchantControlsClient component**
  - Extract the plan and status displays into an interactive client component `MerchantControlsClient.tsx` that receives the current tier, status, and tenantId.
  - Implement a basic UI to invoke `updateTenantPlanAction` and `updateTenantStatusAction` using `toast.promise` from `sonner` for feedback.
  - Prompt for a brief reason (e.g., via `window.prompt` or a small modal) before submitting.

- [x] **Step 2: Update the Merchant Detail page**
  - Update `src/app/platform/merchants/[id]/page.tsx` to mount `MerchantControlsClient` in the header or the main panel, replacing the read-only badges.
  - Ensure the page remains a Server Component overall, only making the specific controls interactive.

## Verify

1. Run the dev server.
2. Navigate to Platform > Merchants and click into a specific merchant.
3. Attempt to change their plan tier. Confirm the audit log updates and the UI reflects the new plan.
4. Attempt to suspend the merchant and provide a reason. Confirm the status changes and the audit log records the suspension.
