# Current Feature

## Fix: social intelligence release hold

Status: complete in code, pending privacy/safety validation before re-enablement.

### Scope

- Keep general intelligence features available.
- Pause social customer replies for WhatsApp and Telegram while the privacy and beta-review checks are incomplete.
- Clearly label the feature as under review in dashboards and channel settings.

### Changed behavior

- Social reply dispatch is blocked behind a centralized under-review gate.
- Non-social intelligence remains active.
- Product messaging now says "Social replies: under review" instead of implying the social reply feature is live.

### Files changed

- [src/lib/intelligence/social-release.ts](src/lib/intelligence/social-release.ts)
- [src/app/api/webhooks/whatsapp/route.ts](src/app/api/webhooks/whatsapp/route.ts)
- [src/app/api/webhooks/telegram/route.ts](src/app/api/webhooks/telegram/route.ts)
- [src/app/dashboard/settings/automation/components/AutomationSettingsForm.tsx](src/app/dashboard/settings/automation/components/AutomationSettingsForm.tsx)
- [src/app/dashboard/settings/channels/components/TelegramChannelCard.tsx](src/app/dashboard/settings/channels/components/TelegramChannelCard.tsx)
- [src/app/actions/settings-social.test.ts](src/app/actions/settings-social.test.ts)

### Follow-up before full launch

- Minimize customer data sent to the intelligence layer.
- Add adversarial and malformed-message tests for social replies.
- Re-enable social intelligence only after privacy and safety review passes.
