# Fix: Payment Key Auto-Encryption, Channel Dynamic Resolution & Empty-Store Insights Guard (Issues 2, 14, 16, 18, 23)

## Overview
- **Type:** Fix
- **Status:** completed
- **Scope:** Payment Credentials Auto-Encryption & Webhook Verification (P0), Dynamic Channel Resolution in Action Queue, Channel Connector Previews, Empty-Store Insights Onboarding Guard, and Accessible Checkbox Standardization

## The Problem
1. **Issue 23 (Payment Gateway Keys Plaintext / Incomplete Per-Tenant Webhooks):**
   - While `updatePaymentSettings` encrypts newly entered secrets using AES-256-GCM via `encryptSecret`, existing legacy database rows may still hold plaintext keys in `tenant_settings.settings_data`. `getPaymentSettings` masks secrets for display but does not upgrade legacy plaintext secrets in storage.
   - Paystack and Hubtel webhook verification routes fall back exclusively to global environment variables (`process.env.PAYSTACK_SECRET_KEY`, `process.env.HUBTEL_CLIENT_SECRET`), failing to authenticate webhook deliveries for merchants using their own encrypted API keys.
2. **Issue 16 (Hardcoded "WhatsApp" Across Action Cards):**
   - In `src/app/dashboard/conversations/components/ApprovalActionCard.tsx` and `UrgentExceptionCard.tsx`, the channel name is hardcoded to "WhatsApp" in header badges, takeover notifications, and success toasts (`toast.success('Action approved and sent via WhatsApp')`), ignoring `action.channel_identity?.channel`.
3. **Issue 2 (Channel Connectors Beyond WhatsApp Status Clarity):**
   - In `/dashboard/settings/channels`, non-WhatsApp channels (Instagram, Telegram, Messenger) appear as fully available toggleable integrations, but Telegram only partially extracts cart intents and Instagram/Messenger lack webhook dispatchers. This creates false expectations for merchants.
4. **Issue 14 (Insights Analysis Engine Returning Fabricated Defaults for Empty Stores):**
   - In `src/utils/insightRules.ts` and `/dashboard/insights`, when a newly provisioned merchant has 0 orders, 0 products, and 0 customers, the summary displays a confusing neutral placeholder (*"Stock levels are generally stable. No major shipments in transit."*) rather than an actionable empty state prompting catalog creation.
5. **Issue 18 (Raw `<input type="checkbox">` in DataTable):**
   - In `src/components/ui/DataTable.tsx`, table row multi-selection uses raw unstyled `<input type="checkbox">` elements rather than the project's accessible `@/components/ui/Checkbox` component.

## The Fix
1. **Payment Credentials Auto-Encryption & Per-Tenant Webhook Signature Support (Issue 23):**
   - In `src/app/actions/settings-commerce.ts`, ensure `getPaymentSettings()` and `updatePaymentSettings()` automatically detect unencrypted legacy secrets (`!isEncrypted(secret)`) and encrypt them.
   - In `src/app/api/webhooks/paystack/route.ts` and `src/app/api/webhooks/hubtel/route.ts`, support resolving decrypted merchant credentials from `tenant_settings` when an order or payload specifies a `tenant_id`.
2. **Dynamic Channel Resolution in Action Queue (Issue 16):**
   - Create a channel formatting helper `formatChannelName(channel?: string): string` and use it in `ApprovalActionCard.tsx` and `UrgentExceptionCard.tsx` to dynamically display "WhatsApp", "Telegram", "Instagram", or "Messenger" in badges, guidance copy, and toast notifications.
3. **Channel Connectors Preview Badging (Issue 2):**
   - Update `ChannelsSettingsView.tsx` / `ConnectedChannelsCard.tsx` to clearly badge non-WhatsApp connectors as "Developer Preview" or "Beta" with informational tooltips explaining inbound availability.
4. **Empty-Store Insights Guard & Onboarding State (Issue 14):**
   - Update `src/utils/insightRules.ts` to detect empty tenant datasets and return a dedicated onboarding insight state (*"Welcome to Merchander! Add your first products and record orders to activate real-time sales velocity and restock forecasting."*).
5. **DataTable Checkbox Standardization (Issue 18):**
   - Refactor `src/components/ui/DataTable.tsx` header and row selection to use `@/components/ui/Checkbox`.

## Build Steps
- [x] **Step 1: Implement Credentials Encryption, Dynamic Channels, Insights Guard, and DataTable Checkbox**
- Update `src/app/actions/settings-commerce.ts` with legacy plaintext encryption upgrade.
- Update `ApprovalActionCard.tsx` and `UrgentExceptionCard.tsx` with dynamic channel names.
- Update Channel Settings cards with status clarity.
- Update `src/utils/insightRules.ts` with empty-tenant guard.
- Update `src/components/ui/DataTable.tsx` with `@/components/ui/Checkbox`.
- Add unit tests in `src/utils/insightRules.test.ts` and `src/app/actions/settings-commerce.test.ts`.
- **Done when:** `yarn test` passes all tests, `yarn check` and `yarn lint` report 0 errors, and `yarn build` succeeds.

## Verify
- `yarn test`: verify all unit tests pass, including new insight rules and encryption tests.
- `yarn check`: TypeScript typecheck passes with 0 errors.
- `yarn lint`: ESLint passes with 0 errors, 0 warnings.
- `yarn build`: Next.js production build completes successfully.
