# Fix: Platform Master Controls & Integration Settings Enforcement (F-22)

### Type: Fix
### Status: verified
### Fixes: F-22

---

## The Problem

1. **Maintenance Mode Ignored by Middleware:**
   `src/app/platform/settings/components/ControlsSettingsForm.tsx` lets platform administrators toggle `maintenance_mode` ("Displays a maintenance screen to all merchants and suspends background workers. Only Platform Staff can bypass"), saving to `platform_settings`. However, neither `src/proxy.ts` nor `src/lib/supabase/proxy.ts` ever checks `maintenance_mode`. Merchants and public storefront visitors can access the application normally even when maintenance mode is active.

2. **Signups Toggle Ignored by Registration Actions:**
   `ControlsSettingsForm.tsx` lets platform administrators toggle `disable_new_signups` ("Prevents new merchants from registering. Existing merchants can still log in and operate"), saving to `platform_settings`. However, `src/app/actions/signup.ts` and `src/app/signup/page.tsx` never check this setting. New merchants can still register and provision workspaces without restriction even when signups are disabled.

3. **Platform Integration Keys Unconsumed & Untestable:**
   `src/app/platform/settings/components/IntegrationsSettingsForm.tsx` provides inputs for `slack_webhook_url` ("Used for critical system alerts and new signups") and `openai_api_key`, saving them to `platform_settings.integrations`. However, no alerting dispatcher queries `slack_webhook_url`, and the settings form lacks connection testing or validation.

---

## The Fix

1. **Maintenance Mode Enforcement in Middleware (`src/lib/supabase/proxy.ts`):**
   - Query `platform_settings.maintenance_mode` with a lightweight in-memory cache (5s TTL) to prevent DB overhead on hot paths.
   - For all non-exempt routes (`/dashboard`, `/store`, `/signup`), if maintenance mode is active and the visitor is not active platform staff (`isActivePlatformStaff`), redirect them to `/maintenance`.
   - Exempt `/platform`, `/login`, `/auth/*`, and `/maintenance` so platform staff can sign in and administer settings.
   - Create a dedicated, accessible `/maintenance/page.tsx` informing visitors of scheduled maintenance and providing platform staff a direct link to sign in.

2. **Signups Master Control Enforcement (`src/app/actions/signup.ts`, `src/app/signup/page.tsx`):**
   - In `selfServiceSignupAction`, check `platform_settings.disable_new_signups` before processing any registration data. If enabled, reject with a clear user-facing error message.
   - In `src/app/signup/page.tsx`, check `platform_settings.disable_new_signups` on render. If registrations are paused, display a clear "Registrations Temporarily Paused" message with a link to `/login` and support contact instead of showing the registration wizard.

3. **Slack Alert Dispatcher & Test Connection (`src/lib/alerts/slack.ts`, `IntegrationsSettingsForm.tsx`):**
   - Create `src/lib/alerts/slack.ts` to dispatch platform notifications using the configured Slack webhook URL from `platform_settings.integrations.slack_webhook_url` or `process.env.SLACK_WEBHOOK_URL`.
   - Trigger alert on new merchant self-service signup (`selfServiceSignupAction`) and on maintenance mode state change (`updatePlatformSettingsAction`).
   - Add `testSlackWebhookAction` in `src/app/actions/platform-settings.ts` and wire a "Test Connection" button in `IntegrationsSettingsForm.tsx`.
   - Clarify OpenAI input helper text regarding runtime fallback precedence.

---

## Build Steps

- [x] **Step 1: Maintenance Mode Enforcement & Maintenance Screen (F-22)**
  - Create `src/app/maintenance/page.tsx` with modern UI and staff login link.
  - Update `src/lib/supabase/proxy.ts` to check `platform_settings.maintenance_mode` (with in-memory cache) and redirect non-staff visitors to `/maintenance`.
  - Add unit tests in `src/lib/supabase/proxy.test.ts` for maintenance redirection and platform staff bypass.
  - **Done when:** Non-staff are redirected to `/maintenance` when maintenance mode is active, platform staff can bypass, and tests pass.

- [x] **Step 2: Signups Master Control Enforcement (F-22)**
  - Update `src/app/actions/signup.ts` to check `platform_settings.disable_new_signups` and reject new registrations when enabled.
  - Update `src/app/signup/page.tsx` to display paused registration notice when `disable_new_signups` is true.
  - Update `src/app/actions/signup.test.ts` with tests verifying rejection when signups are disabled.
  - **Done when:** `signup.test.ts` verifies signups rejection and `yarn check` passes.

- [x] **Step 3: Slack Alerting Dispatcher & Integrations Test Action (F-22)**
  - Create `src/lib/alerts/slack.ts` with `sendPlatformSlackAlert`.
  - Hook signup alerts into `selfServiceSignupAction` and maintenance toggling into `updatePlatformSettingsAction`.
  - Add `testSlackWebhookAction` in `src/app/actions/platform-settings.ts` and add "Test Connection" button in `IntegrationsSettingsForm.tsx`.
  - Add unit tests in `src/lib/alerts/slack.test.ts` and `src/app/actions/platform-settings.test.ts`.
  - **Done when:** `slack.test.ts` and `platform-settings.test.ts` pass and full `yarn test` is green.

---

## Verification

### Automated
- `yarn test src/lib/supabase/proxy.test.ts`
- `yarn test src/app/actions/signup.test.ts`
- `yarn test src/lib/alerts/slack.test.ts`
- `yarn test src/app/actions/platform-settings.test.ts`
- Full suite: `yarn test` (100% green: 78 files, 698 tests), `yarn check` (0 errors), `yarn lint` (0 errors).

### Manual
- Toggle `maintenance_mode` in `/platform/settings/controls` and verify `/dashboard` redirects to `/maintenance` for merchant users while `/platform` remains accessible to staff.
- Toggle `disable_new_signups` in `/platform/settings/controls` and verify `/signup` shows paused registration card and API rejects attempts.
- In `/platform/settings/integrations`, enter a Slack webhook URL and click "Test Connection" to receive an immediate test notification.
