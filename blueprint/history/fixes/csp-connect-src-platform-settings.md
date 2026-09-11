# Fix: CSP connect-src & Platform Settings Loading Resilience

### Type: Fix
### Status: verified
### Completed: 2026-09-11
### Branch: fix/csp-platform-settings

---

## The Problem

1. **Content Security Policy Blocks Supabase Client Connections:**
   In `next.config.ts`, `cspHeader` defines security directives (`default-src 'self'`, `script-src`, `style-src`, `img-src`, etc.), but completely omits `connect-src`. Under W3C CSP rules, omitting `connect-src` causes browsers to fall back to `default-src 'self'`. Consequently, all client-side network requests and WebSockets to Supabase (`https://*.supabase.co`, `wss://*.supabase.co`, e.g. token refresh `https://jzwrfeclfnzxwmodwlfs.supabase.co/auth/v1/token?grant_type=refresh_token`, realtime subscriptions, and client storage) are blocked by the browser with:
   ```
   Connecting to '<URL>' violates the following Content Security Policy directive: "default-src 'self'". Note that 'connect-src' was not explicitly set, so 'default-src' is used as a fallback. The action has been blocked.
   ```
   This breaks client-side session refresh and causes secondary errors (`TypeError: Cannot read properties of undefined (reading 'startTime')`) when performance observers inspect blocked requests.

2. **Fragile Platform Settings Singleton Retrieval Bricks Platform Console:**
   In `src/app/actions/platform-settings.ts:25`, `getPlatformSettingsAction()` executes:
   ```ts
   const { data, error } = await supabase.from('platform_settings').select('*').eq('id', 1).single();
   ```
   If row `id = 1` has not been seeded on the remote database instance (or was deleted), `.single()` returns `PGRST116: JSON object requested, multiple (or no) rows returned`, causing the action to fail with `{ data: null, error: 'Failed to load platform settings.' }`.
   In `/platform/settings`, `/platform/settings/controls`, and `/platform/settings/integrations`, the pages render a hard error banner:
   ```
   Failed to load platform settings: Failed to load platform settings.
   ```
   Additionally, `updatePlatformSettingsAction()` uses `.update().eq('id', 1)` instead of `.upsert()`, so if the row doesn't exist, updating settings silently updates 0 rows.

---

## The Fix

1. **Add `connect-src` to CSP in `next.config.ts`:**
   - Explicitly define `connect-src` in `cspHeader` to permit `'self'`, `https://*.supabase.co`, `wss://*.supabase.co`, `https://*.supabase.in`, `wss://*.supabase.in`, `http://localhost:*`, `http://127.0.0.1:*`, `ws://localhost:*`, `ws://127.0.0.1:*`, and payment gateway endpoints (`https://api.paystack.co`, `https://api.hubtel.com`).
   - Dynamically include `NEXT_PUBLIC_SUPABASE_URL` host and WebSocket protocol when configured.

2. **Self-Healing Singleton & Resilient Fallback in `src/app/actions/platform-settings.ts`:**
   - In `getPlatformSettingsAction`:
     - Switch from `.single()` to `.maybeSingle()`.
     - If row `id = 1` is absent, automatically upsert the default singleton configuration (`id: 1`, `platform_name: 'Merchander'`, `default_currency: 'GHS'`, `maintenance_mode: false`, `disable_new_signups: false`, `integrations: {}`).
     - If the database query fails (e.g. pending table migration), return safe default configuration so the platform console remains operational.
   - In `updatePlatformSettingsAction`:
     - Use `.upsert({ id: 1, ...finalUpdates })` to guarantee the singleton row exists.
   - In platform settings pages (`page.tsx`, `controls/page.tsx`, `integrations/page.tsx`), provide clear error states with recovery rather than unstyled blocking errors.

3. **Automated Unit Tests:**
   - Extend `src/app/actions/platform-settings.test.ts` to verify auto-initialization when row 1 is missing, resilient default fallbacks on DB error, and upsert handling on update.

---

## Build Steps

- [x] **Step 1: CSP connect-src & Resilient Platform Settings (Fix)**
  - Add `connect-src` with Supabase and WebSocket origins to `next.config.ts`.
  - Update `getPlatformSettingsAction` and `updatePlatformSettingsAction` in `src/app/actions/platform-settings.ts` to auto-initialize singleton row and provide resilient defaults.
  - Update `src/app/actions/platform-settings.test.ts` with tests for missing row auto-recovery and fallback.
  - **Done when:** `platform-settings.test.ts` passes, full vitest suite passes (80+ test files), `yarn check` passes with 0 errors, and `yarn lint` passes.

---

## Verification

### Automated
- `yarn test src/app/actions/platform-settings.test.ts` (10/10 passing)
- Full suite: `yarn test` (80 files, 712 passing, 100% green), `yarn check` (0 errors), `yarn lint` (0 errors).

### Manual
- Inspect `next.config.ts` headers response: verify `Content-Security-Policy` contains `connect-src` allowing `https://*.supabase.co` and `wss://*.supabase.co`.
- In browser console, verify token refresh `https://jzwrfeclfnzxwmodwlfs.supabase.co/auth/v1/token` is no longer blocked by CSP.
- Navigate to `/platform/settings`, `/platform/settings/controls`, and `/platform/settings/integrations`: verify settings load cleanly even if database singleton row was empty.

---

## Findings

### csp-connect-src-platform-settings/F-03 [P2] closed - messages insert path does not match the omnichannel schema

**File:** src/app/api/webhooks/whatsapp/route.ts:101
**Found:** 2026-09-03 by /audit (scope: full; lens: correctness)
**Why it matters:** Two mismatches between the webhook and `20260904000056_create_omnichannel_tables.sql`:
- The insert error handler treats `23505` as an idempotent duplicate (`external_id` already seen), but the migration creates only a **plain** index `idx_messages_external_id`, not a unique one. Meta retries deliveries aggressively, so duplicate inbound rows will accumulate and the dedup branch is dead.
- `messages.type` is enum `('text','template','media','interactive','system')`, but `parseWhatsAppMessages` emits `'image' | 'audio' | 'document' | 'video' | 'other'`. The insert casts `msg.type as any` (line 109), so every non-text message fails the enum check (`22P02`), is logged, and is dropped.
**Suggested fix:** Add a unique index on `(tenant_id, external_id)` (partial, `WHERE external_id IS NOT NULL`). Map the parser's media kinds to the `media` enum value before insert and keep the specific kind in `content.type` (already set). Drop the `as any`.
**Resolution:** Fixed on 2026-09-09 in fix/whatsapp-webhook-dedup-f03. Added migration `20260912000000_fix_messages_external_id_unique.sql` replacing plain index with a partial unique index on `(tenant_id, external_id)`. Added `mapWhatsAppMessageTypeToDb` mapping WhatsApp media types ('image', 'audio', 'document', 'video') to enum `'media'` while preserving subtype in `content.type`, removing `as any`. Added duplicate delivery skipping on `23505` to prevent duplicate extraction and outbound replies, verified with automated unit tests. Re-examined on 2026-09-11 by /audit (scope: full): confirmed unique constraint handling and enum mapping in route.ts. Closed.

### csp-connect-src-platform-settings/F-04 [P2] closed - WhatsApp inbound routing and outbound config are hardcoded mocks on a live route

**File:** src/app/api/webhooks/whatsapp/route.ts:54
**Found:** 2026-09-03 by /audit (scope: full; lens: quality)
**Why it matters:** `tenantId = msg.phoneNumberId === '123' ? 'tenant-123' : 'unknown'` with a `continue` on `'unknown'`, so the registered production route silently discards 100% of real inbound WhatsApp messages, and the `'123'` branch would insert a non-UUID `tenant_id`. `getTenantWhatsAppConfig` (`src/lib/channels/whatsapp/service.ts:9`) likewise returns `{ phoneNumberId: 'mock-phone-id', accessToken: 'mock-access-token' }` for `'tenant-123'` and throws otherwise. Mock scaffolding merged to `main` inside a live API route with no feature flag.
**Suggested fix:** Implement the real `phone_number_id -> tenant` lookup against the channel-connection settings table (or gate the route off until it exists). Same for `getTenantWhatsAppConfig`.
**Resolution:** Fixed on 2026-09-09 by fix/whatsapp-inbound-routing: implemented getTenantByWhatsAppPhoneId and updated getTenantWhatsAppConfig to query channel_connections for live credentials, preserving test fixture fallback. Covered by unit tests in service.test.ts and route.test.ts. Re-examined on 2026-09-11 by /audit (scope: full): live tenant routing verified. Closed.

### csp-connect-src-platform-settings/F-09 [P2] closed - Legacy dialogs across dashboard and store bypass the shared Modal component

**File:** src/app/dashboard/suppliers/components/SupplierScorecardModal.tsx:33
**Found:** 2026-09-09 by /audit (scope: full; lens: quality)
**Why it matters:** Multiple legacy dialogs across dashboard and storefront implemented custom inline backdrop divs instead of the shared `@/components/ui/Modal`.
**Suggested fix:** Refactor legacy modals to wrap the shared `@/components/ui/Modal` component.
**Resolution:** Fixed on 2026-09-09 in fix/f09-legacy-modals. Refactored all legacy dialogs across purchasing, suppliers, orders, inventory batches, settings, insights, and customer management to wrap the shared `@/components/ui/Modal`. Re-examined on 2026-09-11 by /audit (scope: full): verified no custom modal backdrop divs remain. Closed.

### csp-connect-src-platform-settings/F-10 [P3] closed - color.ts utility has no unit tests

**File:** src/utils/color.ts:1
**Found:** 2026-09-09 by /audit (scope: full; lens: tests)
**Why it matters:** `src/utils/color.ts` implements pure, assertable color validation and contrast math, but lacked unit tests.
**Suggested fix:** Add `src/utils/color.test.ts` covering valid/invalid hex formats, 3-digit expansion, and YIQ contrast threshold calculations.
**Resolution:** Fixed on 2026-09-09 in fix/color-tests-f10. Added 16 automated unit tests in `src/utils/color.test.ts`. Re-examined on 2026-09-11 by /audit (scope: full): 16 tests passing in vitest. Closed.

### csp-connect-src-platform-settings/F-12 [P2] closed - Native window.confirm() and window.alert() calls bypass ConfirmDialog and toast notifications

**File:** src/app/dashboard/categories/components/CategoriesTable.tsx:33
**Found:** 2026-09-09 by /audit (scope: full; lens: quality)
**Why it matters:** Multiple dashboard and platform client components directly called synchronous browser dialogs (`window.confirm()` in 14 locations and `window.alert()` in 5 locations).
**Suggested fix:** Replace native `confirm()` calls with `@/components/ui/ConfirmDialog` and `alert()` calls with `sonner` toasts.
**Resolution:** Fixed on 2026-09-09 in fix/native-dialogs-f12. Replaced all 14 native `window.confirm()` calls with `@/components/ui/ConfirmDialog` and all 5 `window.alert()` calls with `sonner` toasts. Re-examined on 2026-09-11 by /audit (scope: full): verified zero native confirm/alert dialogs in application code. Closed.

### csp-connect-src-platform-settings/F-15 [P2] closed - Fabricated conversation threads and hardcoded response time in dead conversations action

**File:** src/app/actions/conversations.ts:50
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** `getConversationsData()` synthesized fake `ConversationThread` objects and was unreferenced.
**Suggested fix:** Remove the dead action and dynamic response time calculations.
**Resolution:** Fixed on 2026-09-11 in fix/conversations-approvals-f15-f24. Removed the dead `src/app/actions/conversations.ts` server action file and dynamically computed metrics in `src/utils/conversationsMath.ts`. Re-examined on 2026-09-11 by /audit (scope: full): verified dead action removed and dynamic metrics verified. Closed.

### csp-connect-src-platform-settings/F-16 [P2] closed - Privacy & data policies form exposes disconnected controls and mock preview

**File:** src/app/dashboard/settings/privacy/components/PrivacySettingsForm.tsx:98
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** Deceptive active badge and mock preview on unbacked settings.
**Suggested fix:** Mark with honest "Roadmap / In Development" badge and copy.
**Resolution:** Replaced deceptive "Active on Storefront" badge with "Roadmap / In Development" and added explanatory roadmap notice. Re-examined on 2026-09-11 by /audit (scope: full): honest copy and badges verified. Closed.

### csp-connect-src-platform-settings/F-17 [P2] closed - Deceptive active badges for language and timezone in profile settings form

**File:** src/app/dashboard/settings/profile/components/ProfileForm.tsx:207
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** "Active for Alerts & Receipts" and "Locale Synchronized" badges were shown for unconsumed preferences.
**Suggested fix:** Remove misleading badges.
**Resolution:** Removed misleading badges and clarified preferences copy. Re-examined on 2026-09-11 by /audit (scope: full): verified badges removed and accurate copy in place. Closed.

### csp-connect-src-platform-settings/F-18 [P2] closed - Social channel connectors masquerade as functional sync without webhooks or handlers

**File:** src/app/dashboard/settings/channels/components/InstagramChannelCard.tsx:30
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** Instagram/Messenger cards offered toggles claiming DM sync without backing webhooks.
**Suggested fix:** Clearly indicate "Planned" status and disable unbacked switches.
**Resolution:** Fixed on 2026-09-11 in fix/social-channels-facade-f18. Updated cards to "Planned / In Development" and disabled switches. Re-examined on 2026-09-11 by /audit (scope: full): channel card statuses and transparent notices verified. Closed.

### csp-connect-src-platform-settings/F-19 [P2] closed - Email notification toggles claim active inbox delivery without email infrastructure

**File:** src/app/dashboard/settings/notifications/components/NotificationsForm.tsx:60
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** Email notification toggles promised delivery with no email provider configured.
**Suggested fix:** Add "In Development" badge and disable switches.
**Resolution:** Added "In Development" badge, disabled switches, and noted pending provider integration. Re-examined on 2026-09-11 by /audit (scope: full): verified disabled switches and in-development badges. Closed.

### csp-connect-src-platform-settings/F-20 [P2] closed - Intelligence grounding form fields are never ingested by the intelligence engine

**File:** src/app/dashboard/settings/business-profile/components/IntelligenceGroundingCard.tsx:51
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** Grounding fields were stored in `tenant_settings` but never consumed by AI prompts.
**Suggested fix:** Inject grounding data into system prompts.
**Resolution:** Fixed on 2026-09-11 in fix/ai-agent-grounding-f20-f21. Added grounding schemas and injected into Python and Next.js reply pipelines. Re-examined on 2026-09-11 by /audit (scope: full): end-to-end grounding context flow verified. Closed.

### csp-connect-src-platform-settings/F-21 [P2] closed - AI conversational agent configuration in automation settings is ignored by message handlers

**File:** src/app/dashboard/settings/automation/components/AutomationSettingsForm.tsx:116
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** AI agent enable/mode/tone configuration in automation settings was ignored by WhatsApp webhook.
**Suggested fix:** Query and honor `aiAgent` settings in WhatsApp webhook.
**Resolution:** Fixed on 2026-09-11 in fix/ai-agent-grounding-f20-f21. Webhook honors `enabled: false`, `mode: 'assisted'` (stages draft orders/replies into `ai_action_queue`), and forwards tone directives. Re-examined on 2026-09-11 by /audit (scope: full): verified webhook handler respects aiAgent configuration. Closed.

### csp-connect-src-platform-settings/F-22 [P2] closed - Platform master controls and integration API keys are never checked or consumed

**File:** src/app/platform/settings/components/ControlsSettingsForm.tsx:50
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** Maintenance mode, signups toggle, and Slack alert integrations in platform settings were never enforced.
**Suggested fix:** Check maintenance mode in proxy, enforce signups toggle, and wire Slack webhook alerts.
**Resolution:** Fixed on 2026-09-11 in fix/platform-controls-f22. Implemented maintenance mode proxy redirect to `/maintenance`, enforced signup pause in `selfServiceSignupAction`, and wired Slack alerts with test connection action. Re-examined on 2026-09-11 by /audit (scope: full): maintenance mode, signups toggle, and Slack alerting verified. Closed.

### csp-connect-src-platform-settings/F-23 [P3] closed - Dashboard intelligence engine falls back to hardcoded stable stock strings on zero sales velocity

**File:** src/app/actions/dashboard.ts:308
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** Fallback strings falsely reported stock levels as stable even when items were out of stock.
**Suggested fix:** Dynamically evaluate inventory levels and shipments.
**Resolution:** Fixed on 2026-09-11 in fix/dashboard-intelligence-f23. Extracted pure utility `computeDashboardIntelligence` and evaluated real out-of-stock and low-stock variants dynamically. Re-examined on 2026-09-11 by /audit (scope: full): verified dynamic intelligence computation and all 12 tests pass. Closed.

### csp-connect-src-platform-settings/F-24 [P3] closed - Sidebar "Conversations" nav item links to "Approvals & Inquiries" queue with mismatched intent

**File:** src/app/dashboard/components/sidebar/sidebarNavigation.ts:42
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** Sidebar "Conversations" link led to the operational AI approvals queue instead of a chat inbox.
**Suggested fix:** Rename sidebar item to "Approvals & Inquiries" with `CheckSquare` icon.
**Resolution:** Fixed on 2026-09-11 in fix/conversations-approvals-f15-f24. Renamed item to "Approvals & Inquiries" with `CheckSquare` icon. Re-examined on 2026-09-11 by /audit (scope: full): navigation naming and icon confirmed. Closed.
