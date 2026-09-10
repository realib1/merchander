# Fix: Deceptive Settings UI & Mock Facades

**Type:** Fix  
**Status:** verified  
**Fixes:** F-16, F-17, F-19  

---

## The Problem
1. **F-17 (`ProfileForm.tsx:207-250`)**: Displays an "Active for Alerts & Receipts" badge for language and "Locale Synchronized" badge for timezone with helper text claiming active integration across receipts, system emails, and storefront notifications, even though these preferences are not consumed by notification or formatting services.
2. **F-19 (`NotificationsForm.tsx:60-140`)**: Provides switches for `emailNewOrder`, `emailPaymentReceived`, `emailLowInventory`, and `emailDailySummary` claiming "Operational alerts delivered directly to your registered inbox", despite having no transactional email service provider integrated.
3. **F-16 (`PrivacySettingsForm.tsx:98-196`)**: Shows an interactive "Storefront Banner Preview" with an "Active on Storefront" badge for cookie banners (which do not exist on the storefront), a marketing opt-in checkout toggle (not rendered on checkout), and an abandoned cart retention schedule (unbacked by any background purge task).

---

## The Fix
1. In `ProfileForm.tsx`, remove the misleading "Active for Alerts & Receipts" and "Locale Synchronized" badges. Update the helper text to honestly describe language and timezone as account preferences with multi-language and locale formatting rollout planned.
2. In `NotificationsForm.tsx`, add an "In Development" badge to the Email Notifications card header, update description copy to reflect that email alerts are currently in development, and disable the switches with helpful hints explaining that transactional email provider integration (SMTP/Resend) is pending setup.
3. In `PrivacySettingsForm.tsx`, replace the "Active on Storefront" badge and simulated interactive preview with an honest "Roadmap / In Development" status badge, clarify that cookie banner and marketing checkout opt-in are roadmap features, and add an informative notice explaining that abandoned cart purge routines will execute once background cron scheduling is enabled.
4. Add unit test coverage verifying that settings forms render without error and communicate accurate feature statuses.

---

## Build Steps
- [x] **Step 1: Clean up deceptive badges in Profile and Notifications settings**  
  Remove misleading badges in `ProfileForm.tsx` and mark email notification alerts as "In Development" in `NotificationsForm.tsx`.  
  *Done when:* Profile form displays clean preference labels without false "Active" claims, Email Notifications card clearly displays "In Development" with disabled switches, and tests pass.

- [x] **Step 2: Replace mock cookie preview and unbacked switches in Privacy settings**  
  Update `PrivacySettingsForm.tsx` to replace the mock "Active on Storefront" badge with "Roadmap / In Development", replace fake interactive preview with clear roadmap notice, and document retention schedule state.  
  *Done when:* Privacy settings clearly communicate roadmap status for cookie banner and marketing opt-ins, and all tests in `yarn test`, `yarn check`, and `yarn lint` pass.

---

## Verify
1. Run `yarn test` to confirm all unit tests pass.
2. Run `yarn check` and `yarn lint` to confirm zero type or lint regressions.
3. Visit `/dashboard/settings/profile`: verify absence of deceptive "Active" / "Synchronized" badges.
4. Visit `/dashboard/settings/notifications`: verify "In Development" badge and disabled email switches.
5. Visit `/dashboard/settings/privacy`: verify "Roadmap / In Development" badge and honest banner notice.
