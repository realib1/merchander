# Fix: Social Channel Connectors Facade

**Type:** Fix  
**Status:** verified  
**Fixes:** F-18  

---

## The Problem
1. **F-18 (`InstagramChannelCard.tsx:30-58`)**: Displays a "Beta" badge and interactive "Connect" switch with checkboxes promising "Sync customer DMs and story replies into your unified inbox", but no webhook endpoint (`/api/webhooks/instagram`) or Meta Graph API sync routine exists.
2. **F-18 (`MessengerChannelCard.tsx:30-58`)**: Displays a "Beta" badge and active toggle claiming to "Capture messages and live inquiries from your Facebook business page", but no Facebook webhook endpoint (`/api/webhooks/messenger`) exists.
3. **F-18 (`TelegramChannelCard.tsx:30-58` & `telegram/route.ts:44`)**: Promises instant order notification alerts and customer bot sync, while the webhook extracts chat intent but discards the order with `// TODO: Trigger order state machine (Ticket 4)`.

---

## The Fix
1. In `InstagramChannelCard.tsx`, replace the misleading "Beta" and "Connected" badges with "Planned / In Development". Keep the Instagram handle input active (as it links to public storefront headers and footers), but disable the unbacked connection switch and sync checkboxes with clear explanatory notices that live Meta DM sync is scheduled on the product roadmap.
2. In `MessengerChannelCard.tsx`, replace the misleading "Beta" and "Connected" badges with "Planned / In Development", disable the unbacked switch and checkbox, and update description copy to clarify that Meta Messenger webhook integration is scheduled for an upcoming release.
3. In `TelegramChannelCard.tsx` and `src/app/api/webhooks/telegram/route.ts`, update badge and copy to explicitly state that bot webhook intake is in Developer Preview with automated order placement queued for an upcoming release.
4. Add automated unit tests verifying that channel settings persistence preserves social handles and configurations while accurately reflecting status.

---

## Build Steps
- [x] **Step 1: Replace deceptive sync toggles in Instagram and Messenger channel cards**  
  Update `InstagramChannelCard.tsx` and `MessengerChannelCard.tsx` to display honest "Planned / In Development" badges, disable unbacked DM sync toggles, and provide clear roadmap notices while preserving social handle inputs for storefront links.  
  *Done when:* Both cards clearly indicate planned status without pretending to sync live DMs, handle inputs remain editable for storefront links, and tests pass.

- [x] **Step 2: Clarify Telegram Developer Preview state and verify channel settings**  
  Update `TelegramChannelCard.tsx` and `src/app/api/webhooks/telegram/route.ts` with transparent developer preview notices, and add unit test coverage in `src/app/actions/settings-social.test.ts`.  
  *Done when:* Telegram card communicates preview status accurately, and all unit tests in `yarn test`, `yarn check`, and `yarn lint` pass.

---

## Verify
1. Run `yarn test` to confirm all unit tests pass, including social settings tests.
2. Run `yarn check` and `yarn lint` to confirm clean typecheck and zero lint errors.
3. Visit `/dashboard/settings/channels`:
   - Verify that Instagram Direct shows "Planned / In Development", allows setting the brand handle for storefront links, but does not claim live DM sync.
   - Verify that Facebook Messenger shows "Planned / In Development" with disabled unbacked switches.
   - Verify that Telegram shows transparent "Developer Preview" messaging.
