# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-03 [P2] fixed - messages insert path does not match the omnichannel schema

**File:** src/app/api/webhooks/whatsapp/route.ts:101
**Found:** 2026-09-03 by /audit (scope: full; lens: correctness)
**Why it matters:** Two mismatches between the webhook and
`20260904000056_create_omnichannel_tables.sql`:
- The insert error handler treats `23505` as an idempotent duplicate
  (`external_id` already seen), but the migration creates only a **plain** index
  `idx_messages_external_id`, not a unique one. Meta retries deliveries
  aggressively, so duplicate inbound rows will accumulate and the dedup branch
  is dead.
- `messages.type` is enum `('text','template','media','interactive','system')`,
  but `parseWhatsAppMessages` emits `'image' | 'audio' | 'document' | 'video' |
  'other'`. The insert casts `msg.type as any` (line 109), so every non-text
  message fails the enum check (`22P02`), is logged, and is dropped.
**Suggested fix:** Add a unique index on `(tenant_id, external_id)` (partial,
`WHERE external_id IS NOT NULL`). Map the parser's media kinds to the `media`
enum value before insert and keep the specific kind in `content.type` (already
set). Drop the `as any`.
**Resolution:** Fixed on 2026-09-09 in fix/whatsapp-webhook-dedup-f03. Added migration `20260912000000_fix_messages_external_id_unique.sql` replacing plain index with a partial unique index on `(tenant_id, external_id)`. Added `mapWhatsAppMessageTypeToDb` mapping WhatsApp media types ('image', 'audio', 'document', 'video') to enum `'media'` while preserving subtype in `content.type`, removing `as any`. Added duplicate delivery skipping on `23505` to prevent duplicate extraction and outbound replies, verified with automated unit tests.

### F-04 [P2] fixed - WhatsApp inbound routing and outbound config are hardcoded mocks on a live route

**File:** src/app/api/webhooks/whatsapp/route.ts:54
**Found:** 2026-09-03 by /audit (scope: full; lens: quality)
**Why it matters:** `tenantId = msg.phoneNumberId === '123' ? 'tenant-123' :
'unknown'` with a `continue` on `'unknown'`, so the registered production route
silently discards 100% of real inbound WhatsApp messages, and the `'123'` branch
would insert a non-UUID `tenant_id`. `getTenantWhatsAppConfig`
(`src/lib/channels/whatsapp/service.ts:9`) likewise returns
`{ phoneNumberId: 'mock-phone-id', accessToken: 'mock-access-token' }` for
`'tenant-123'` and throws otherwise. Mock scaffolding merged to `main` inside a
live API route with no feature flag.
**Suggested fix:** Implement the real `phone_number_id -> tenant` lookup against
the channel-connection settings table (or gate the route off until it exists).
Same for `getTenantWhatsAppConfig`.
**Resolution:** Fixed on 2026-09-09 by fix/whatsapp-inbound-routing: implemented getTenantByWhatsAppPhoneId and updated getTenantWhatsAppConfig to query channel_connections for live credentials, preserving test fixture fallback. Covered by unit tests in service.test.ts and route.test.ts.

### F-09 [P2] fixed - Legacy dialogs across dashboard and store bypass the shared Modal component

**File:** src/app/dashboard/suppliers/components/SupplierScorecardModal.tsx:33
**Found:** 2026-09-09 by /audit (scope: full; lens: quality)
**Why it matters:** Multiple legacy dialogs across dashboard and storefront (including `SupplierScorecardModal.tsx`, `NewSupplierModal.tsx`, `SupplierPOExportModal.tsx`, `BatchLifecycleModal.tsx`, `BatchBroadcastModal.tsx`, `MoMoReconciliationModal.tsx`, `WaybillSlipModal.tsx`, `CancelOrderModal.tsx`, `OrderDispatchModal.tsx`, `NewPurchaseOrderModal.tsx`, `EditPurchaseOrderModal.tsx`, and `RecordPODeliveryModal.tsx`) implement custom inline backdrop divs (`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 ...`) instead of the shared `@/components/ui/Modal`. As a result, these dialogs lack standardized focus trapping, background scroll locking, and Escape key listeners.
**Suggested fix:** Refactor legacy modals to wrap the shared `@/components/ui/Modal` component.
**Resolution:** Fixed on 2026-09-09 in fix/f09-legacy-modals. Refactored all legacy dialogs across purchasing, suppliers, orders, inventory batches, settings, insights, and customer management (`SupplierScorecardModal`, `NewSupplierModal`, `NewPurchaseOrderModal`, `EditPurchaseOrderModal`, `RecordPODeliveryModal`, `CancelOrderModal`, `OrderDispatchModal`, `MoMoReconciliationModal`, `WaybillSlipModal`, `SupplierPOExportModal`, `BatchLifecycleModal`, `BatchBroadcastModal`, `TargetFormModal`, `CustomersDeleteModal`, `BillingMethodModal`, `ProviderConnectModal`, `SupportAccessDelegationView`, `RestockRecommendationsView`, and `KanbanBoard`) to wrap the shared `@/components/ui/Modal`. Standardized portal mounting, focus trapping, background scroll locking, and Escape key listeners across all dialogs. Zero custom backdrop overlays remain in dashboard dialog components. Verified cleanly with `yarn check`, `yarn lint`, and all 564 unit tests in `yarn test`.

### F-10 [P3] fixed - color.ts utility has no unit tests

**File:** src/utils/color.ts:1
**Found:** 2026-09-09 by /audit (scope: full; lens: tests)
**Why it matters:** `src/utils/color.ts` implements pure, assertable color validation and contrast math (`isValidHex`, `normalizeHex`, `getContrastTextColor`), but lacks a companion `src/utils/color.test.ts`. This departs from the project standard requiring unit test coverage for pure logic in `src/utils/`.
**Suggested fix:** Add `src/utils/color.test.ts` covering valid/invalid hex formats, 3-digit expansion, and YIQ contrast threshold calculations.
**Resolution:** Fixed on 2026-09-09 in fix/color-tests-f10. Added 16 automated unit tests in `src/utils/color.test.ts` covering 3-digit and 6-digit hex validation, normalization, edge thresholds, and YIQ contrast calculations.

### F-12 [P2] fixed - Native window.confirm() and window.alert() calls bypass ConfirmDialog and toast notifications

**File:** src/app/dashboard/categories/components/CategoriesTable.tsx:33
**Found:** 2026-09-09 by /audit (scope: full; lens: quality)
**Why it matters:** Multiple dashboard and platform client components directly call synchronous browser dialogs (`window.confirm()` in 14 locations and `window.alert()` in 5 locations).
Synchronous browser dialogs:
1. Block the JavaScript event loop and UI thread synchronously, halting animations, timers, and background fetches.
2. Cannot be styled, ignoring dark mode and design system tokens.
3. Violate web accessibility (a11y) standards by lacking ARIA dialog roles, focus management, and keyboard trapping. Additionally, browsers allow users to select "Prevent this page from creating additional dialogs", permanently suppressing future prompts and breaking critical flows.
The codebase already has `@/components/ui/ConfirmDialog` (wrapping `@/components/ui/Modal`) for accessible confirmation flows and `sonner` toasts for notifications, but these components bypass them.
**Suggested fix:**
1. Replace native `confirm()` calls with `@/components/ui/ConfirmDialog` across the 14 table and management components (`CategoriesTable`, `StaffTable`, `ShipmentsTable`, `PaymentsTable`, `ExpensesTable`, `ProductsTable`, `BranchManagementClient`, `DeleteRoleButton`, `BillingMethodCard`, `TargetCard`, `SupportAccessDelegationView`, `IncidentsManager`, and `StaffManagementClient`).
2. Replace native `alert()` calls with `toast.error()` / `toast.warning()` from `sonner` in `profitabilityExport.ts`, `SupportAccessDelegationView.tsx`, and `StaffManagementClient.tsx`.
**Resolution:** Fixed on 2026-09-09 in fix/native-dialogs-f12. Replaced all 14 native `window.confirm()` calls with accessible `@/components/ui/ConfirmDialog` modals featuring focus trapping, loading indicators, and destructive styling. Replaced all 5 `window.alert()` calls with `sonner` toasts (`toast.error` / `toast.success`). Typecheck (`yarn check`), lint (`yarn lint`), and all 517 tests (`yarn test`) pass.

### F-15 [P2] open - Fabricated conversation threads and hardcoded response time in dead conversations action

**File:** src/app/actions/conversations.ts:50
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** `getConversationsData()` synthesizes fake `ConversationThread` objects by mapping over customer records and generating placeholder messages (`"Customer started conversation"`, `"Awaiting payment confirmation for order..."`) with synthetic intents. Additionally, `src/utils/conversationsMath.ts:26` hardcodes `avgResponseTimeMinutes: 3.5` as a static benchmark. `getConversationsData()` is unreferenced by any page or component, creating dead code with simulated data.
**Suggested fix:** Remove the dead `getConversationsData` function and synthetic thread generators, or connect real inbound messages from `messages` / omnichannel tables with dynamic response time calculations.
**Resolution:**

### F-16 [P2] fixed - Privacy & data policies form exposes disconnected controls and mock preview

**File:** src/app/dashboard/settings/privacy/components/PrivacySettingsForm.tsx:98
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** In `PrivacySettingsForm.tsx`:
1. `showCookieBanner` displays an interactive "Storefront Banner Preview" with an "Active on Storefront" badge, but `src/app/store/[slug]/` contains zero cookie banner logic or components.
2. `marketingConsentCheckbox` promises a promotional WhatsApp/SMS opt-in at checkout, but `CartCheckoutForm.tsx` does not render this field.
3. `deleteAbandonedAfterDays` presents retention schedules (30, 90, 180, 365 days) for abandoned carts, but no background worker, cron job, or cleanup function executes this purge.
**Suggested fix:** Either implement the storefront cookie banner, marketing opt-in checkbox, and cart purge cleanup routine, or mark these settings with an honest "Coming Soon" badge until backing functionality exists.
**Resolution:** Replaced deceptive "Active on Storefront" badge with "Roadmap / In Development", replaced fake interactive button preview with an informative roadmap notice clarifying that banner and marketing opt-ins are staged for upcoming releases, and documented that background cart retention purges will execute once periodic cron workers are activated in system infrastructure. Added unit test coverage in `src/app/actions/settings-preferences.test.ts`.

### F-17 [P2] fixed - Deceptive active badges for language and timezone in profile settings form

**File:** src/app/dashboard/settings/profile/components/ProfileForm.tsx:207
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** `ProfileForm.tsx` displays an "Active for Alerts & Receipts" badge next to Preferred Language with helper text "Used for account communications, system alert emails, and storefront notifications", but `user_metadata.language` is never referenced anywhere in notification or receipt templates. Similarly, Timezone displays "Locale Synchronized" claiming it "Determines how timestamps, activity logs, order invoices, and store operating hours are displayed", but formatters throughout the app ignore this setting.
**Suggested fix:** Remove the misleading "Active for Alerts & Receipts" and "Locale Synchronized" badges, and note that locale formatting customization is currently in development until formatters consume these user preferences.
**Resolution:** Removed the misleading "Active for Alerts & Receipts" and "Locale Synchronized" badges. Updated helper copy for Language to clarify it is an account preference with multi-language templates planned for upcoming release, and for Timezone to note standardization across store receipts and logs.

### F-18 [P2] open - Social channel connectors masquerade as functional sync without webhooks or handlers

**File:** src/app/dashboard/settings/channels/components/InstagramChannelCard.tsx:30
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:**
1. `InstagramChannelCard.tsx` and `MessengerChannelCard.tsx` offer toggles claiming to "Sync customer DMs and story replies into your unified inbox", but no webhook endpoints (`/api/webhooks/instagram`, `/api/webhooks/messenger`) or Meta Graph API sync routines exist.
2. `src/app/api/webhooks/telegram/route.ts:44` extracts a cart from incoming Telegram messages but discards it with `// TODO: Trigger order state machine (Ticket 4)`.
Only WhatsApp has a functional end-to-end webhook and state machine.
**Suggested fix:** Clearly indicate that Instagram and Facebook Messenger connectors are "Planned" rather than interactive mock toggles, and implement the Telegram order dispatch queue or remove stubbed webhook code.
**Resolution:**

### F-19 [P2] fixed - Email notification toggles claim active inbox delivery without email infrastructure

**File:** src/app/dashboard/settings/notifications/components/NotificationsForm.tsx:60
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** `NotificationsForm.tsx` provides switches for `emailNewOrder`, `emailPaymentReceived`, `emailLowInventory`, and `emailDailySummary` promising "Operational alerts delivered directly to your registered inbox". However, the application has no email service provider integration (e.g. Resend, SendGrid, Postmark) and no dispatch code in `src/app/actions/` or background workers. Merchants toggling these settings receive zero emails.
**Suggested fix:** Integrate a real transactional email provider (such as Resend) or label email alerts as "Coming Soon / In Development" to prevent merchant false expectations.
**Resolution:** Added an "In Development" badge to the Email Notifications header, updated card description to state transactional email delivery is in development, disabled the switches (`disabled={true}`), and added explanatory inline hints indicating pending email provider integration. Added unit test coverage in `src/app/actions/settings-preferences.test.ts`.

### F-20 [P2] open - Intelligence grounding form fields are never ingested by the intelligence engine

**File:** src/app/dashboard/settings/business-profile/components/IntelligenceGroundingCard.tsx:51
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** `IntelligenceGroundingCard.tsx` provides inputs for `aboutBusiness`, `whatWeSell`, `deliveryInfo`, `returnPolicy`, and `customerPolicies` under the header "Information Used by Intelligence", claiming these ground customer-facing assistants and automated responses. These fields are stored in `tenant_settings` but are never fetched, prompt-injected, or referenced by `src/lib/intelligence/` or `services/intelligence/`.
**Suggested fix:** Inject the grounding data into the system prompt context in `src/lib/intelligence/reply.ts` / `services/intelligence/`, or clarify in the UI that grounding data is currently stored as draft configuration.
**Resolution:**

### F-21 [P2] open - AI conversational agent configuration in automation settings is ignored by message handlers

**File:** src/app/dashboard/settings/automation/components/AutomationSettingsForm.tsx:116
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** `AutomationSettingsForm.tsx` lets merchants toggle `aiAgent.enabled`, select operational modes ("Assisted (Copilot)" vs "Autonomous Sales Agent"), customize catalog grounding, and select response tones. However, neither `src/app/api/webhooks/whatsapp/route.ts` nor `src/lib/intelligence/reply.ts` ever checks `aiAgent.enabled`, `aiAgent.mode`, or `aiAgent.responseTone`. The webhook processes messages regardless of the switch state, rendering the configuration UI completely detached from runtime execution.
**Suggested fix:** Read `aiAgent` configuration from `tenant_settings` in `src/app/api/webhooks/whatsapp/route.ts` and `reply.ts`, honoring `enabled: false` (bypassing AI auto-replies) and passing mode/tone settings to prompt builders.
**Resolution:**

### F-22 [P2] open - Platform master controls and integration API keys are never checked or consumed

**File:** src/app/platform/settings/components/ControlsSettingsForm.tsx:50
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:**
1. In `ControlsSettingsForm.tsx`, toggles for `maintenance_mode` ("Displays a maintenance screen to all merchants...") and `disable_new_signups` ("Prevents new merchants from registering...") save to `platform_settings`. However, `proxy.ts` never checks `maintenance_mode`, and `src/app/actions/auth.ts` / `signup/page.tsx` never checks `disable_new_signups`.
2. In `IntegrationsSettingsForm.tsx:50`, fields for `openai_api_key` and `slack_webhook_url` save to `platform_settings`, but are never queried by the intelligence service or alert dispatchers (which only read static environment variables).
**Suggested fix:** Check `maintenance_mode` in middleware/proxy, enforce `disable_new_signups` in the signup action, and either consume platform settings for OpenAI/Slack or remove the dead inputs.
**Resolution:**

### F-23 [P3] open - Dashboard intelligence engine falls back to hardcoded stable stock strings on zero sales velocity

**File:** src/app/actions/dashboard.ts:308
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** In `dashboard.ts`, when a merchant account has products and orders but no products with positive weekly sales velocity (`lowStockList.length === 0`), `getDashboardIntelligence()` returns hardcoded fallback strings: `supplyInsight: ['• Stock levels are generally stable.', '• No major shipments in transit.']`. This message is displayed even if inventory levels are actually at 0 for critical items, giving merchants false confidence that stock is stable.
**Suggested fix:** Evaluate actual inventory levels across product variants and shipments in transit dynamically instead of returning static strings about stability.
**Resolution:**

### F-24 [P3] open - Sidebar "Conversations" nav item links to "Approvals & Inquiries" queue with mismatched intent

**File:** src/app/dashboard/components/sidebar/sidebarNavigation.ts:42
**Found:** 2026-09-10 by /audit (scope: full; lens: quality)
**Why it matters:** `sidebarNavigation.ts:42` defines a navigation item named "Conversations" with a `MessageSquare` icon leading to `/dashboard/conversations`. However, `/dashboard/conversations/page.tsx` is titled "Approvals & Inquiries" and displays an operational approval and exceptions triage workspace for `ai_action_queue` items. Merchants clicking "Conversations" expecting an omnichannel chat inbox find a backend approvals queue.
**Suggested fix:** Rename the sidebar navigation item to "Approvals & Inquiries" (or "Approvals Queue") with an appropriate icon (e.g. `CheckSquare` or `ShieldAlert`), or provide a dedicated customer conversation interface.
**Resolution:**



