# Platform Console Govern Phase

**Type:** Fix
**Status:** verified

## The problem

Following the "Platform Console Reality Check" audit (Phase 1: Strip completed), several critical governance and security gaps remain in the platform control plane (Phase 2: Govern):

1. **Merchant Context Gate:** `merchants/[id]/page.tsx` silently auto-logs `'Admin platform context diagnosis'` on every page load rather than requiring staff to explicitly declare a reason and linked support ticket.
2. **Audit Immutability:** The `platform_audit_logs` table relies solely on RLS and lacks a strict database-level trigger preventing modifications or deletions.
3. **Audit Log UX:** `platform-audit.ts` swallows query errors by returning an empty array. The `/platform/audit-logs` page lacks search, filters (actor, target, action), and pagination.
4. **Merchant Subscription Discrepancy:** The merchant-side `settings-subscription.ts` action still reads from legacy `tenant_settings.settings_data.subscription` JSON (using slugs `starter | pro | enterprise`) instead of the correct `tenant_subscriptions` table (`free | starter | growth | business | enterprise`), leading to divergent billing truth.
5. **Staff MFA Enforcement:** Staff rows track `mfa_enabled`, but the `/platform/layout.tsx` does not actively enforce a Supabase Auth AAL2 challenge.

## The fix

Address the governance and security gaps systematically:
- Introduce an interactive gate before rendering the merchant context. Staff must supply a reason (and optional ticket ID) which is then securely logged. Track session duration if feasible, or at minimum make the entry log explicit.
- Create a migration to add a `BEFORE UPDATE OR DELETE` trigger on `platform_audit_logs` that raises an exception, ensuring strict immutability.
- Add error surfacing, pagination, and filter controls to the audit logs page.
- Refactor `settings-subscription.ts` to source the tier and limits directly from `tenant_subscriptions`, aligning the merchant surface with the platform surface.
- Add an AAL2 check in `/platform/layout.tsx` to require active MFA for platform staff.

Must not break:
- Existing `is_platform_staff()` authorization rules.
- Merchant dashboard functionality (beyond correcting the displayed subscription tier).

## Build steps

- [x] 1. **Audit Immutability Trigger:** Write and apply a database migration that adds a `BEFORE UPDATE OR DELETE` trigger to `public.platform_audit_logs`. Done when a test `DELETE` query against the table fails with an explicit immutability error.
- [x] 2. **Audit Log UI Enhancements:** Update `platform-audit.ts` to throw or surface errors properly. Update `audit-logs/page.tsx` with UI controls for filtering (actor, action, target) and pagination. Done when logs can be filtered by a specific actor email.
- [x] 3. **Merchant Context Gate:** Create a gate component in `merchants/[id]/page.tsx` that requires a "Reason for access" before fetching `getMerchantContextAction` and rendering the context. Done when visiting a merchant page prompts for a reason, and submitting logs that exact reason.
- [x] 4. **Align Merchant Subscriptions:** Update `settings-subscription.ts` to read the active tier from `tenant_subscriptions`. Done when the merchant dashboard reflects the exact tier (`starter`, `business`, etc.) stored in the table.
- [x] 5. **Enforce Staff MFA:** Update `/platform/layout.tsx` to redirect or block access if `auth.mfa.getAuthenticatorAssuranceLevel()` is not `aal2` (when MFA is enrolled). Done when a staff session without AAL2 cannot view the console.

## Verify

- Log in as platform staff; verify you cannot access `/platform` without MFA (if enrolled).
- Visit `/platform/audit-logs` and filter by your email.
- Attempt to view a merchant's details and confirm the reason gate appears and logs correctly.
- Attempt to delete a row from `platform_audit_logs` via `supabase db execute` and confirm rejection.
- Log in as a merchant and confirm the subscription page matches the tier defined in the platform.
