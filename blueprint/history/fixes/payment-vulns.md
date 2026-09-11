# Payment Integration API Key and Webhook Vulnerability Fixes

**Type:** Fix
**Status:** verified
**Fixes:** F-01, F-02, F-03, F-04, F-05

## The problem
The recent audit uncovered critical security vulnerabilities and performance issues in the Hubtel and Paystack payment integrations:
1. Webhooks blindly mark orders as paid without verifying that the paid amount matches the actual order total (F-01, F-02). 
2. Idempotency queries omit `tenant_id`, bypassing optimal composite indexing and causing potential sequential scans (F-03).
3. The system accepts Hubtel API keys without executing a live network check to ensure they are valid (F-04).
4. Paystack API key verification fails open, allowing keys to be accepted if a transient network error occurs during verification (F-05).

## The fix
- Prevent partial or malicious checkout payments from triggering a successful order completion by enforcing `paid_amount >= order.total_amount` in webhooks. If the amount is less, log the payment but do not update the order status.
- Scope all webhook idempotency `payments` lookups to include `.eq('tenant_id', tenantId)`.
- Update `verifyPaymentProviderCredentials` to issue a test API call (e.g. hitting an empty invoice/status ping) for Hubtel keys. 
- Restrict Paystack's fail-open network catch block to non-production environments only.

## Build steps
- [x] 1. **Secure Paystack webhook and idempotency checks**. Fetch the order `total_amount` in the webhook. Update order status to 'paid' only if `amountGhs >= total_amount`. Add `.eq('tenant_id', tenantId)` to the idempotency check. Update tests. Done when `src/app/api/webhooks/paystack/route.ts` is patched and tests pass.
- [x] 2. **Secure Hubtel webhook and idempotency checks**. Fetch `total_amount` in the webhook's order lookup. Update order status to 'paid' only if `amount >= total_amount`. Add `.eq('tenant_id', tenantId)` to the idempotency check. Update tests. Done when `src/app/api/webhooks/hubtel/route.ts` is patched and tests pass.
- [x] 3. **Harden API Key Verification**. Update `verifyPaymentProviderCredentials` in `src/app/actions/settings-commerce.ts` to perform a live API check for Hubtel keys, and restrict the Paystack network bypass to `process.env.NODE_ENV !== 'production'`. Done when both checks correctly evaluate keys via live network rules.

## Verify
- Execute the test suite `yarn test` to confirm updated webhook constraints pass.
- Perform a manual review (using `/check` or `/try`) of the commerce settings page to ensure bad API keys are correctly rejected.

## Findings

### payment-vulns/F-01 [P0] closed - Unverified payment amounts in Paystack webhook

**File:** src/app/api/webhooks/paystack/route.ts:285
**Found:** 2026-09-11 by /audit (scope: current; lens: full)
**Why it matters:** The Paystack webhook blindly marks an order as `status: 'paid'` without verifying that the `amountGhs` paid matches the order's `total_amount`. An attacker or partial payment could mark a high-value order as fully paid by completing a transaction for a fraction of the cost.
**Suggested fix:** Fetch the order `total_amount` before marking it paid. Compare `amountGhs` to `order.total_amount`. If the paid amount is less, insert the payment record but do not update the order to 'paid'.
**Resolution:** Updated Paystack webhook to fetch total_amount and only mark order as paid if amountGhs >= total_amount.

### payment-vulns/F-02 [P0] closed - Unverified payment amounts in Hubtel webhook

**File:** src/app/api/webhooks/hubtel/route.ts:160
**Found:** 2026-09-11 by /audit (scope: current; lens: full)
**Why it matters:** Similar to Paystack, the Hubtel webhook marks orders as 'paid' as long as the callback has `Status: 'Success'`, without comparing the payload's `Amount` to the order's `total_amount`.
**Suggested fix:** Check the order `total_amount` before marking it paid. Only update the status if the amount covers the total.
**Resolution:** Updated Hubtel webhook to fetch total_amount early and only mark order as paid if amount >= total_amount.

### payment-vulns/F-03 [P1] closed - Missing tenant isolation in payment idempotency checks

**File:** src/app/api/webhooks/paystack/route.ts:251, src/app/api/webhooks/hubtel/route.ts:101
**Found:** 2026-09-11 by /audit (scope: current; lens: full)
**Why it matters:** Both webhooks check `existingPayment` using only `.eq('transaction_ref', paymentRef)`. The `payments` table has a composite unique index on `(tenant_id, provider, transaction_ref)`. Failing to include `tenant_id` could cause a full table scan or false positives if transaction refs clash across tenants.
**Suggested fix:** Add `.eq('tenant_id', tenantId)` to the idempotency checks.
**Resolution:** Added `.eq('tenant_id', matchedOrder.tenant_id)` to existingPayment checks in both webhooks.

### payment-vulns/F-04 [P1] closed - Hubtel API keys lack live network verification

**File:** src/app/actions/settings-commerce.ts:650
**Found:** 2026-09-11 by /audit (scope: current; lens: full)
**Why it matters:** Hubtel credentials only undergo basic string format checking. If a merchant enters invalid but well-formatted Hubtel keys, the UI accepts them as valid. The merchant will only discover the keys are broken when buyers try to pay and the application crashes.
**Suggested fix:** Perform a live API request (e.g., to a Hubtel status endpoint) using the provided Client ID and Client Secret, just like Paystack does. If Hubtel returns a 401, reject the keys.
**Resolution:** Added live ping to Hubtel transactions status endpoint to verify keys in settings-commerce.ts.

### payment-vulns/F-05 [P1] closed - Paystack live verification fails open

**File:** src/app/actions/settings-commerce.ts:640
**Found:** 2026-09-11 by /audit (scope: current; lens: full)
**Why it matters:** When checking Paystack keys, if the network request times out or fails (e.g., DNS error), the code catches the error, logs a warning, and returns `valid: true`. In production, this means transient network errors will cause bad keys to be saved successfully.
**Suggested fix:** Only allow the fail-open fallback in local development (`process.env.NODE_ENV !== 'production'`). In production, throw the error or return `valid: false` so that keys are strictly verified.
**Resolution:** Restricted Paystack's fail-open catch block to non-production environments.

