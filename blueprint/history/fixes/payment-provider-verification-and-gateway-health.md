# Fix: Payment Provider Verification & Storefront Gateway Health

**Type:** Fix  
**Status:** verified  
**Fixes:** F-13, F-14  

---

## The Problem
1. **F-13 (`ProviderConnectModal.tsx:44-57`)**: The `handleTestAndSave` handler uses a fake `setTimeout(..., 600)` with `toast.success` to "test" Paystack/Hubtel credentials. No validation against key format or provider endpoints is performed, giving false-positive green confirmations to invalid or broken credentials.
2. **F-14 (`storefront-dashboard.ts:96`)**: In `getStorefrontOverview`, `isHubtelConnected` is evaluated as `Boolean(providers?.hubtel?.connected ?? true)`. Because `providers` is queried from `settings_data.payments` (whereas payment configs are stored in `settings_data.payment_settings`), `providers?.hubtel?.connected` is undefined. The `?? true` nullish coalescing fallback erroneously marks Hubtel MoMo as connected for 100% of tenants in `StorefrontAnalyticsCard.tsx`, even fresh tenants with zero payment setup.

---

## The Fix
1. Create a server action `verifyPaymentProviderCredentials` in `src/app/actions/settings-commerce.ts` that enforces format validation on public/secret keys (e.g. `pk_live_` / `pk_test_` and `sk_live_` / `sk_test_` for Paystack; required non-empty Client ID & Client Secret for Hubtel) and executes an active verification check before reporting success.
2. In `src/app/dashboard/settings/payments/components/ProviderConnectModal.tsx`, replace the simulated `setTimeout` with a call to `verifyPaymentProviderCredentials`. If verification fails, prevent saving, display an error toast, and keep the modal open.
3. In `src/app/actions/storefront-dashboard.ts`, retrieve `payment_settings` correctly from `settings_data.payment_settings` (with fallback to `settings_data.payments`), and strictly evaluate `isHubtelConnected: Boolean(providers?.hubtel?.connected)` without the `?? true` fallback.
4. Add automated unit tests in `src/app/actions/settings-commerce.test.ts` for provider credential validation and live check handling.
5. Create `src/app/actions/storefront-dashboard.test.ts` with unit test coverage asserting that `isHubtelConnected` and `isPaystackConnected` correctly reflect tenant payment configurations and default to `false` for unconfigured tenants.

---

## Build Steps
- [x] **Step 1: Replace simulated payment provider verification with server action**  
  Implement `verifyPaymentProviderCredentials` in `src/app/actions/settings-commerce.ts` and wire it into `ProviderConnectModal.tsx`, eliminating the simulated `setTimeout`. Add credential verification tests in `src/app/actions/settings-commerce.test.ts`.  
  *Done when:* Submitting invalid keys fails with an explicit error toast, valid keys verify without client timeouts, and tests pass.

- [x] **Step 2: Correct storefront dashboard payment gateway health lookup**  
  Update `storefront-dashboard.ts` to query `payment_settings` properly and remove the `?? true` fallback for Hubtel. Add unit tests in `src/app/actions/storefront-dashboard.test.ts`.  
  *Done when:* Fresh/unconfigured tenants report `isHubtelConnected: false` and `isPaystackConnected: false`, configured tenants report `true`, and all tests in `yarn test` pass.

---

## Verify
1. Run `yarn test` to confirm all unit tests pass, including the new tests in `settings-commerce.test.ts` and `storefront-dashboard.test.ts`.
2. Run `yarn check` and `yarn lint` to confirm clean typecheck and zero lint regressions.
3. In browser at `/dashboard/settings/payments`, open Connect Paystack/Hubtel, input invalid keys, and verify rejection.
4. In browser at `/dashboard/online-store`, verify that unconfigured accounts display the red/alert disconnected state for Hubtel MoMo instead of a false green checkmark.

---

## Findings

### payment-provider-verification-and-gateway-health/F-13 [P1] closed - Simulated API key verification ping creates false positive in payment provider setup

**File:** src/app/dashboard/settings/payments/components/ProviderConnectModal.tsx:44  
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)  
**Why it matters:** In `ProviderConnectModal.tsx`, `handleTestAndSave` sets `isTesting(true)` and invokes a `setTimeout(..., 600)` with `toast.success(`${providerName} connected successfully`)`. No network ping, server action, or API verification against Paystack or Hubtel is performed. Merchants can enter random strings or invalid keys and receive immediate green confirmation, leading to silent payment failure at storefront checkout.  
**Suggested fix:** Call an authenticated server action (e.g. `verifyAndSavePaymentProvider`) that performs an active test ping against Paystack/Hubtel credential verification endpoints before saving and showing success.  
**Resolution:** Fixed on 2026-09-10 in fix/f13-f14-payment-gateways. Implemented `verifyPaymentProviderCredentials` server action in `src/app/actions/settings-commerce.ts` validating public and secret key formats, test/live mode consistency, numeric Hubtel POS IDs, and executing active Paystack API balance checks. Wired `ProviderConnectModal.tsx` to call `verifyPaymentProviderCredentials` and removed the simulated `setTimeout`. Covered by 7 new unit tests in `src/app/actions/settings-commerce.test.ts`.

### payment-provider-verification-and-gateway-health/F-14 [P1] closed - Hubtel gateway health defaults to connected via fallback in storefront dashboard

**File:** src/app/actions/storefront-dashboard.ts:96  
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)  
**Why it matters:** In `storefront-dashboard.ts`, the checkout gateway health is calculated as `isHubtelConnected: Boolean(providers?.hubtel?.connected ?? true)`. Because `providers` is queried from `settings_data.payments` (whereas payment configs are stored in `payment_settings`), `providers?.hubtel?.connected` is almost always undefined. The `?? true` nullish coalescing fallback marks Hubtel MoMo as connected with a green checkmark badge in `StorefrontAnalyticsCard.tsx` for 100% of tenants, even fresh tenants who have never configured payment gateways.  
**Suggested fix:** Query `tenant_payment_settings` or `payment_settings` correctly and remove the `?? true` fallback so `isHubtelConnected` defaults strictly to `false` unless verified active credentials exist.  
**Resolution:** Fixed on 2026-09-10 in fix/f13-f14-payment-gateways. Updated `src/app/actions/storefront-dashboard.ts` to query `payment_settings` from `settings_data.payment_settings` (with fallback to `settings_data.payments`), and removed the `?? true` fallback for `isHubtelConnected`. Created `src/app/actions/storefront-dashboard.test.ts` with 4 unit tests verifying disconnected defaults for unconfigured accounts and accurate reporting when configured.
