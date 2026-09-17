# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

## INT-001 - LLM safety flags are trusted without server-side verification

- **Severity:** P1
- **Status:** open
- **Area:** `services/intelligence/app/services/qa.py`, `src/lib/intelligence/safety.ts`
- **Finding:** The production Gemini path accepts `reply_text`, `intent`, `confidence`, `grounded_facts`, and `requires_human_approval` directly from the model. The TypeScript safety classifier then uses those model-supplied values to decide whether a reply is Green and may be dispatched automatically. There is no post-generation check that the reply facts exist in the tenant catalog, active orders, or merchant policy grounding, and `agent_config.safetyTier` is not enforced by the Python service.
- **Impact:** A prompt-injected or incorrect model response can claim high confidence and Green eligibility, causing an unverified customer-facing reply. The deterministic heuristic path is safer, but it does not protect production when an LLM key is configured.
- **Evidence:** Existing tests cover heuristic responses; no test covers adversarial or fabricated production LLM output.
- **Required fix:** Add a deterministic policy/fact verification layer after model generation. Clamp confidence and force Yellow/Red when facts, payment claims, human requests, or order details cannot be verified. Treat model approval flags as advisory only.

## INT-002 - Telegram approval actions are marked executed without dispatch

- **Severity:** P1
- **Status:** open
- **Area:** `src/app/api/webhooks/telegram/route.ts`, `src/app/actions/approvals.ts`
- **Finding:** Telegram Yellow/Red replies are inserted into `ai_action_queue`, but `approveAction()` only dispatches when the channel identity is WhatsApp. A Telegram action can therefore be marked `executed` without sending anything to the customer. Telegram also lacks the autonomous assurance/handoff notice implemented in the WhatsApp route.
- **Impact:** Human escalation and approved replies silently disappear for Telegram customers, violating the PRD requirement that adapters support outgoing messages and human handoff.
- **Required fix:** Dispatch approvals through a channel adapter selected from the originating channel identity, and only mark an action executed after successful delivery. Add Telegram assurance/handoff behavior and channel-specific delivery metadata.

## INT-003 - Intelligence service has a known default API key

- **Severity:** P1
- **Status:** open
- **Area:** `services/intelligence/app/config.py`
- **Finding:** `INTELLIGENCE_SERVICE_API_KEY` defaults to a committed development value. The service can start with that known credential unless deployment configuration overrides it.
- **Impact:** Anyone who obtains network access to the Intelligence service can call authenticated extraction and reply endpoints using the default key, potentially consuming the model and accessing tenant-grounded responses.
- **Required fix:** Make the key required in production and fail startup when it is missing or equal to the development default. Keep development defaults limited to explicit non-production environments.

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
