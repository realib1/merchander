# Fix: Settings Integrity, Currency Propagation & Bot Configuration (Issues 6, 21, 24, 25, 26)

## Overview
- **Type:** Fix
- **Status:** verified
- **Scope:** Profile Language & Timezone Formatting, Operating Currency Propagation, Privacy & Data Policies UX, Automation & AI Bot Config, and Settings Navigation Completeness

## The Problem
1. **Issue 21 (Mocked Language & Timezone in Profile):** In `/dashboard/settings/profile`, language and timezone dropdowns save to user metadata, but lack clarity on their platform impact. `formatDate` in `src/utils/format.ts` does not support an explicit `timeZone` option, so timestamps default to system locale time without honoring the store's timezone setting.
2. **Issue 24 (Currency Setting Doesn't Propagate):** While `Operating Currency` can be saved in `/dashboard/settings/payments` (and stored in `tenant_settings.store_currency`), core dashboard metric components (`DashboardTopMetrics.tsx`, `ExpensesTopMetrics.tsx`, `ShipmentsTopMetrics.tsx`, and analytics/profitability export utilities) hardcode `GHS` or omit the currency parameter, ignoring the merchant's configured store currency.
3. **Issue 6 (Privacy & Data Policies Looks Like a Mockup):** The `/dashboard/settings/privacy` page has functional toggles, but sparse contextual descriptions, leaving merchants unsure how cookie banners or data retention policies interact with the storefront or Ghana Data Protection Act 2012 (Act 843).
4. **Issue 25 (Automation & Bots Disconnected from AI):** In `/dashboard/settings/automation`, the settings form only manages basic keyword matching and away greetings. It lacks controls for the AI Intelligence service (autonomous agent mode, catalog grounding toggle, and human-in-the-loop safety tier), creating confusion between simple auto-responders and AI-powered commerce bots.
5. **Issue 26 (Settings Menu Audit & Navigation Completeness):** The fully functional `/dashboard/settings/conversations` (chat auto-assignment & SLA targets) is missing from the inner `SettingsSidebar.tsx` navigation under *Operations & Channels*, making it undiscoverable.

## The Fix
1. **Profile Language & Timezone Integrity (Issue 21):**
   - Add a `timeZone` option to `formatDate` in `src/utils/format.ts` so order timestamps and reports can format in the tenant's chosen timezone.
   - Update `ProfileForm.tsx` with informative badges and clear descriptions for language (active for alerts, UI translation coming soon) and timezone (controls order timestamps and business hour schedules).
2. **Operating Currency Propagation (Issue 24):**
   - Include `currency` in `getDashboardMetrics` in `src/app/actions/dashboard.ts` from `tenant_settings.store_currency`.
   - Update `DashboardTopMetrics.tsx`, `ExpensesTopMetrics.tsx`, and `ShipmentsTopMetrics.tsx` to receive and display the dynamic store currency instead of hardcoded `GHS`.
   - Update `analyticsExport.ts` and `profitabilityExport.ts` to accept a dynamic currency parameter.
3. **Privacy & Data Policies Modernization (Issue 6):**
   - Refactor `PrivacySettingsForm.tsx` with rich explanatory cards, compliance badges (Ghana Data Protection Act 2012 / GDPR baseline), and an interactive storefront cookie banner preview.
4. **AI Intelligence & Bot Automation Integration (Issue 25):**
   - Extend `AutomationSettings` in `src/types/settings.ts` and `src/app/actions/settings-social.ts` with an `aiAgent` configuration: `enabled`, `mode` (`assisted` | `autonomous`), `responseTone` (`friendly` | `professional` | `concise`), and `groundingEnabled`.
   - Add an **AI Intelligence & Conversational Agent** card to `AutomationSettingsForm.tsx` with mode selectors, grounding switches, and safety tier explanations.
5. **Settings Navigation Completeness (Issue 26):**
   - Add `Chat Routing & SLA` (`/dashboard/settings/conversations`) to `settingsGroups` in `src/app/dashboard/settings/components/SettingsSidebar.tsx` under *Operations & Channels*.
6. **Automated Unit Tests:**
   - Update `src/utils/format.test.ts` to test timezone-aware date formatting.
   - Add unit tests in `src/app/actions/settings-social.test.ts` for automation settings serialization and AI agent configuration.

## Build Steps
### Step 1: Implement Timezone Formatting, Currency Propagation, Privacy Polish, AI Bot Config, and Navigation [COMPLETED]
- [x] Update `src/utils/format.ts` and `src/utils/format.test.ts` with timezone support.
- [x] Propagate `store_currency` through `getDashboardMetrics`, `DashboardTopMetrics.tsx`, `ExpensesTopMetrics.tsx`, and `ShipmentsTopMetrics.tsx`.
- [x] Enhance `PrivacySettingsForm.tsx` with clear compliance guidance and visual banner preview.
- [x] Extend `AutomationSettings` schema and add the AI Intelligence & Conversational Agent card in `AutomationSettingsForm.tsx`.
- [x] Add Chat Routing to `SettingsSidebar.tsx`.
- [x] Add test coverage for automation settings and date formatting.
- **Done when:** `yarn test` passes all tests, `yarn check` and `yarn lint` report 0 errors, and `yarn build` succeeds. [PASSED]

## Verify
- `yarn test`: verify all unit tests pass, including new timezone and automation tests. [PASSED: 68/68 files, 605/605 tests]
- `yarn check`: TypeScript typecheck passes with 0 errors. [PASSED: 0 errors]
- `yarn lint`: ESLint passes with 0 errors, 0 warnings. [PASSED: 0 errors, 0 warnings]
- `yarn build`: Next.js production build completes successfully. [PASSED: 58 routes compiled]
