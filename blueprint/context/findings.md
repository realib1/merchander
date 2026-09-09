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

### F-04 [P2] open - WhatsApp inbound routing and outbound config are hardcoded mocks on a live route

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
**Resolution:**

### F-09 [P2] open - Legacy dialogs across dashboard and store bypass the shared Modal component

**File:** src/app/dashboard/suppliers/components/SupplierScorecardModal.tsx:33
**Found:** 2026-09-09 by /audit (scope: full; lens: quality)
**Why it matters:** Multiple legacy dialogs across dashboard and storefront (including `SupplierScorecardModal.tsx`, `NewSupplierModal.tsx`, `SupplierPOExportModal.tsx`, `BatchLifecycleModal.tsx`, `BatchBroadcastModal.tsx`, `MoMoReconciliationModal.tsx`, `WaybillSlipModal.tsx`, `CancelOrderModal.tsx`, `OrderDispatchModal.tsx`, `NewPurchaseOrderModal.tsx`, `EditPurchaseOrderModal.tsx`, and `RecordPODeliveryModal.tsx`) implement custom inline backdrop divs (`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 ...`) instead of the shared `@/components/ui/Modal`. As a result, these dialogs lack standardized focus trapping, background scroll locking, and Escape key listeners.
**Suggested fix:** Refactor legacy modals to wrap the shared `@/components/ui/Modal` component.
**Resolution:**

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

