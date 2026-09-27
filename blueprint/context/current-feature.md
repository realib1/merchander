# Scope Initial Release to WhatsApp and Telegram

Type: Fix
Status: not started
Fixes: INT-005

## The problem
The product copy, PRD, and roadmap claim omnichannel support across WhatsApp, Telegram, Instagram, and Facebook Messenger. However, only WhatsApp and Telegram currently have inbound/outbound paths, webhooks, and Intelligence platform support. Instagram and Messenger remain unimplemented, creating a disconnect between stated product capabilities and the actual implementation.

## The fix
Instead of building out full channel adapters for Instagram and Messenger for this release, we will explicitly scope the initial release to WhatsApp and Telegram.
1. Update `blueprint/project-plan.md` to remove claims of Instagram and Messenger support at launch, moving them to future phases or clearly noting them as post-launch additions.
2. Update `blueprint/context/project-overview.md` to reflect that the current omnichannel strategy focuses purely on WhatsApp and Telegram.
3. Ensure that any product copy mentioning supported channels restricts the list to WhatsApp and Telegram.

## Build steps
1. Edit `blueprint/project-plan.md` to update references to "WhatsApp, Instagram, Telegram, etc." to "WhatsApp and Telegram".
2. Edit `blueprint/context/project-overview.md` to scope the social channels appropriately.
3. Run `yarn check` and `yarn test` to ensure we didn't break any assertions (though this is purely documentation and copy).

## Verify
Read `blueprint/project-plan.md` and `blueprint/context/project-overview.md` to confirm Instagram and Messenger are no longer promised as part of the initial launch.
