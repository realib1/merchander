# Use getURL() to resolve preview environments securely

- **Type:** Fix
- **Status:** verified
- **Fixes:** F-10

## The problem
Hardcoding `process.env.NEXT_PUBLIC_APP_URL` breaks Vercel preview environments because it locks email, SMS, and payment webhook callbacks to either the production URL or `http://localhost:3000`. This leads to broken callbacks from payment gateways (Hubtel/Paystack) when testing in a preview branch, and sends users to the wrong environment.

## The fix
Replace `process.env.NEXT_PUBLIC_APP_URL` with the `getURL()` utility from `@/utils/url` (or `@/utils`) across all actions and payment libraries. `getURL()` correctly handles Vercel system environment variables (`VERCEL_BRANCH_URL`, etc.) so preview environments work securely out of the box without hardcoding.

## Build steps

### 1. Update actions and libs to use getURL()
- **Status:** verified
- **Task:** Update `src/app/actions/outreach.ts`, `src/app/actions/staff.ts`, `src/app/actions/preorder-batches.ts`, `src/app/actions/batch-notifications.ts`, `src/lib/payments/confirmation.ts`, `src/utils/paymentLinks.ts`, `src/app/actions/payments-online.ts`, `src/lib/intelligence/orders.ts`, `src/lib/payments/hubtel.ts`, and `src/app/actions/platform.ts`. Import `getURL` and replace inline checks like `process.env.NEXT_PUBLIC_APP_URL || ''` with `getURL()`. Update any affected unit tests.
- **Done when:** `NEXT_PUBLIC_APP_URL` is no longer used directly to build URLs in those files.

## Verify
- Run `yarn test` and `yarn check` (typecheck) to ensure no regressions were introduced.
- Review the diff to confirm all replacements are correct.

## Findings

### f-10-geturl/F-10 [P1] closed - Hardcoded NEXT_PUBLIC_APP_URL breaks preview environments for emails and webhooks

**File:** src/app/actions/outreach.ts:174, 301, 417 (and 9 other files)
**Found:** 2026-09-12 by /audit (scope: email; lens: quality, security)
**Why it matters:** Using `process.env.NEXT_PUBLIC_APP_URL` directly means that Vercel preview environments will generate emails, SMS messages, webhook callbacks, and payment redirects that point to the production environment (if the variable is set globally) or to `http://localhost:3000` (if it falls back). This will cause payment webhooks from Paystack/Hubtel to fail (routing to localhost or production instead of the preview branch), and emails/SMS messages will direct users to the wrong environment.
**Suggested fix:** Import `getURL` from `@/utils/url` and replace `process.env.NEXT_PUBLIC_APP_URL || ''` and `process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'` with `getURL()` across all affected files.
**Resolution:** Replaced all hardcoded NEXT_PUBLIC_APP_URL occurrences with getURL(). Verified with typechecking and tests.
