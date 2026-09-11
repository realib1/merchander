# Fix: AI Conversational Agent & Grounding Settings Integrity (F-20, F-21)

### Type: Fix
### Status: verified
### Fixes: F-20, F-21

---

## The Problem

1. **F-20 (Intelligence Grounding Fields Never Ingested):**
   `src/app/dashboard/settings/business-profile/components/IntelligenceGroundingCard.tsx` provides inputs for `aboutBusiness`, `whatWeSell`, `deliveryInfo`, `returnPolicy`, and `customerPolicies` under "Information Used by Intelligence", claiming these ground customer-facing assistants and automated responses. These fields are stored in `tenant_settings.settings_data.intelligence` but are never fetched, prompt-injected, or referenced by `src/lib/intelligence/reply.ts` or `services/intelligence/`.

2. **F-21 (AI Conversational Agent Settings Ignored by Webhook Handlers):**
   `src/app/dashboard/settings/automation/components/AutomationSettingsForm.tsx` lets merchants toggle `aiAgent.enabled`, select operational modes ("Assisted (Copilot)" vs "Autonomous Sales Agent"), and select response tones. However, `src/app/api/webhooks/whatsapp/route.ts` never inspects `tenant_settings.settings_data.automation.aiAgent`. It executes cart extraction and auto-dispatches green replies even if `aiAgent.enabled` is false or if `aiAgent.mode` is set to "Assisted (Copilot)" (which explicitly promises no automated responses are sent without merchant review).

---

## The Fix

1. **Schema & Types Extension (`messaging.ts`, `schemas.py`):**
   - Define `BusinessGroundingContext` (`aboutBusiness`, `whatWeSell`, `deliveryInfo`, `returnPolicy`, `customerPolicies`) and `AiAgentConfig` (`mode`, `responseTone`, `safetyTier`, `groundingEnabled`).
   - Add optional `grounding` and `agent_config` fields to `ReplyRequest` in both TypeScript and Python.

2. **Python Intelligence Service Grounding & Tone Ingestion (`qa.py`, `main.py`):**
   - In `build_qa_grounding_context`, format and append the merchant's business profile and policies from `grounding` into the QA context.
   - In `heuristic_generate_reply`, answer delivery and policy inquiries directly from `grounding` data when matched.
   - In `generate_grounded_reply`, incorporate business grounding and tone directives (`friendly`, `professional`, `enthusiastic`, `concise`) into the Gemini LLM prompt.

3. **Next.js AI Client Grounding Support (`reply.ts`):**
   - Update `generateGroundedReply` to accept `grounding` and `agent_config` and pass them to the Python service endpoint.
   - Enhance the offline fallback in `reply.ts` to answer delivery or policy inquiries from `grounding` when present instead of returning a generic fallback.

4. **WhatsApp Webhook AI Enforcement (`route.ts`):**
   - In `src/app/api/webhooks/whatsapp/route.ts`, query `tenant_settings` to read `settings_data.automation.aiAgent` and `settings_data.intelligence`.
   - If `aiAgent.enabled === false`, bypass cart extraction and AI reply generation while keeping the inbound message recorded in the database.
   - If `aiAgent.mode === 'assisted'` (Copilot), capture draft orders into `ai_action_queue` without sending customer assurance notices, and stage generated replies into `ai_action_queue` for merchant review instead of auto-dispatching green replies.
   - If `aiAgent.mode === 'autonomous'`, auto-dispatch green replies and send draft order assurance notices.
   - Pass merchant grounding information and agent configuration to `generateGroundedReply`.

---

## Build Steps

- [x] **Step 1: Types & Python Intelligence Grounding Ingestion (F-20, F-21)**
  - Extend `src/types/messaging.ts` with `BusinessGroundingContext` and `AiAgentConfig` in `ReplyRequest`.
  - Update `services/intelligence/app/schemas.py`, `services/intelligence/app/main.py`, and `services/intelligence/app/services/qa.py` to ingest grounding policies and agent tone into Q&A context and prompts.
  - Update `services/intelligence/tests/test_qa.py` to verify grounding ingestion.
  - **Done when:** `messaging.ts` exports grounding types and Python Q&A tests pass with grounding context.

- [x] **Step 2: Next.js Grounded Reply Client Enhancement (F-20)**
  - Update `src/lib/intelligence/reply.ts` to forward `grounding` and `agent_config` to `/api/v1/reply` and leverage grounding in offline fallback.
  - Update `src/lib/intelligence/reply.test.ts` to verify grounding and agent config forwarding.
  - **Done when:** `reply.test.ts` passes with grounding verification.

- [x] **Step 3: WhatsApp Webhook AI Config Enforcement & Mode Guarding (F-20, F-21)**
  - In `src/app/api/webhooks/whatsapp/route.ts`, load `tenant_settings`, check `aiAgent.enabled`, enforce `mode: 'assisted'` vs `'autonomous'`, and forward grounding to `generateGroundedReply`.
  - Add comprehensive unit tests in `src/app/api/webhooks/whatsapp/route.test.ts` for disabled agent bypass, assisted mode queuing, and grounding forwarding.
  - **Done when:** `route.test.ts` passes all test cases and `yarn test` is 100% green.

---

## Verification

### Automated
- `yarn test src/lib/intelligence/reply.test.ts` (reply client tests pass).
- `yarn test src/app/api/webhooks/whatsapp/route.test.ts` (webhook routing and AI mode tests pass).
- Full suite: `yarn test` (100% green), `yarn check` (0 errors), `yarn lint` (0 errors).

### Manual
- Disable AI Agent in `/dashboard/settings/automation`: simulate an inbound WhatsApp message and verify no automated reply is dispatched.
- Set mode to "Assisted (Copilot)": simulate an inbound message and verify proposed reply is staged in the Approvals queue (`ai_action_queue`) without sending customer messages.
- Populate delivery info in `/dashboard/settings/business-profile`: ask about delivery and verify the reply reflects the merchant's configured delivery policy.
