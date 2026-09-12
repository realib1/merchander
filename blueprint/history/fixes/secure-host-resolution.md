# Secure host resolution for Vercel in password reset links

**Type:** Fix

## The problem

The `requestPasswordReset` server action in `src/app/actions/auth.ts` currently uses client-supplied HTTP headers (`x-forwarded-host` or `host`) to construct the `origin` for the password reset callback URL if `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL` are not defined. This introduces a Host Header Injection vulnerability where an attacker can forge the `Host` header to route the password reset link to an attacker-controlled domain.

## The fix

Introduce a shared `getURL()` utility that securely resolves the base URL using Vercel's system environment variables (`VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_BRANCH_URL`, `VERCEL_URL`) instead of relying on the HTTP request headers. Refactor `requestPasswordReset` to use this utility, completely removing the vulnerability.

## Findings

### F-01 [P0] closed - Entire test suite crashes before running any tests

**File:** `vitest.config.ts` (root) / all 84 test files
**Found:** 2026-09-12 by /audit
**Why it matters:** `yarn test` exits with code 1 and runs zero tests. Every test file fails immediately with `TypeError: Cannot read properties of undefined (reading 'config')`.
**Suggested fix:** Rename `vitest.config.ts` → `vitest.config.mts`; then re-run `yarn test` to verify all 84 suites pass.
**Resolution:** Resolved by user in a separate chat / out-of-band. Verified by passing test suite.

### F-02 [P1] closed - Hubtel webhook authorizes before signature verification completes

**File:** `src/app/api/webhooks/hubtel/route.ts:44-84`
**Found:** 2026-09-12 by /audit
**Why it matters:** `isAuthorized` is set at line 44 (global env Basic Auth check) _before_ the order is resolved. If the global env credentials are set and match, the request passes even if it came from a different tenant's Hubtel account.
**Suggested fix:** Invert the auth order: always attempt per-tenant credential validation first when a `clientReference` starting with `ord_` is present.
**Resolution:** Resolved by user in a separate chat / out-of-band.

### F-03 [P1] closed - Paystack webhook signature is verified against client-supplied tenantId

**File:** `src/app/api/webhooks/paystack/route.ts:70-79`
**Found:** 2026-09-12 by /audit
**Why it matters:** The `tenantId` used to resolve the per-tenant secret key (line 71) comes from `parsedPayload.data?.metadata`, which is part of the unverified JSON body. An attacker who knows any tenant's `tenantId` can embed it in a forged webhook to cause the server to load that tenant's secret key and attempt HMAC verification against a crafted payload.
**Suggested fix:** Perform the initial signature check against the global env key only. If that fails, attempt per-tenant key resolution and re-verify. Reject the request if both checks fail. Never use the unauthenticated `tenantId` from the body to select the verification key on the first pass.
**Resolution:** Resolved by user in a separate chat / out-of-band.

### F-10 [P1] closed - Host Header Injection in password reset email link

**File:** `src/app/actions/auth.ts:212-217`
**Found:** 2026-09-12 by /audit
**Why it matters:** The `requestPasswordReset` server action constructs the `origin` for the password reset email's `redirectTo` parameter using the unverified `x-forwarded-host` or `host` headers.
**Suggested fix:** Do not fall back to client-provided HTTP headers for constructing security-sensitive callback URLs. Instead, read the system environment variables automatically provided by Vercel.
**Resolution:** Replaced the unsafe header fallback with a centralized `getURL()` utility that prioritizes Vercel environment variables to construct the origin securely.
