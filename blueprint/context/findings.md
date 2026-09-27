# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.


## INT-004 - Sensitive order context is sent to the external LLM

- **Severity:** P2
- **Status:** open
- **Area:** `services/intelligence/app/services/qa.py`
- **Finding:** The production prompt includes sender identifiers and full delivery addresses from active orders. The PRD requires customer and channel identity handling, but this external model boundary has no visible minimization, redaction, retention, or provider-policy control.
- **Impact:** Customer location and identity data may be disclosed to the configured LLM provider beyond what is required to answer most product or policy questions.
- **Required fix:** Minimize prompts by default, omit delivery addresses unless the customer explicitly asks for delivery/order details, redact sender identifiers, and document provider retention and regional processing controls.

## INT-005 - Channel architecture is not yet at PRD parity

- **Severity:** P2
- **Status:** open
- **Area:** channel adapters, `src/types/messaging.ts`, dashboard connector settings
- **Finding:** WhatsApp and Telegram now have inbound and outbound paths, but Instagram and Facebook Messenger have no webhook, identity, Intelligence, or outbound adapter. The common Intelligence platform type also excludes those channels. The PRD describes channel-agnostic adapters and unified identity, while the current implementation remains a two-channel runtime with planned placeholders for the others.
- **Impact:** The product cannot yet claim that Merchander Intelligence works across its configured social channels. Instagram and Messenger are correctly blocked from activation now, but they remain unimplemented rather than PRD-complete.
- **Required fix:** Either explicitly scope the release to WhatsApp and Telegram in product copy and roadmap, or implement the remaining official channel adapters behind the shared normalized message and outbound interfaces.
