# Fix: Base UI Accessibility Violations

**Type:** Fix
**Status:** verified

## The problem
During an a11y audit of the foundational UI design language, three structural violations were identified:
1. **Low Contrast on Brand Buttons:** The brand primary color (`#ff6a00`) paired with white text yields a contrast ratio of ~2.86:1, failing the WCAG AA requirement of 4.5:1 for normal text.
2. **Semantic Misuse:** Theme toggle controls (and potentially other non-navigational actions) are using `<a>` tags instead of `<button>` tags, confusing screen readers.
3. **Small Tap Targets:** Navigation links lack the vertical padding required to meet the minimum 48x48px tap target size for mobile devices.

## The fix
- **Globals (`globals.css`):** Deepen the `--brand-primary` color in dark mode (and equivalent in light mode) to improve contrast with white text, or ensure buttons using the brand background default to black text (`#000000`). For this fix, we will adjust the dark mode `--brand-primary` hex to a deeper shade of orange (e.g., `#d95800`) to guarantee contrast with white text.
- **Component Primitives (`src/components/ui`):** Ensure the `Button` component explicitly sets text color to contrast with its background variant (e.g. `text-white` on `bg-brand-primary` after tweaking the shade).
- **Semantics & Tap Targets:** Create/Update the global navigation and theme toggle components (if they exist yet) to use `<button>` for state changes and ensure all interactive `<a href>` elements have at least `padding-y: 0.75rem` (`py-3`).

## Build steps
- [x] **Adjust Brand Colors:** Modify `src/app/globals.css` to update the `--brand-primary` hex value for better contrast.
- [x] **Update UI Components:** Check `src/components/ui/button.tsx` (or similar) to ensure accessible text colors and sufficient padding (`min-h-12`).

## Verify
- Inspect `src/app/globals.css` to confirm the brand color hex contrast against `#ffffff` is >= 4.5:1.
- Render the `Button` component and verify its minimum height is at least 48px.
- Confirm any toggle actions use `<button>` elements.

## Findings

## base-ui-accessibility-violations/INT-001 - LLM safety flags are trusted without server-side verification

- **Severity:** P1
- **Status:** closed
- **Area:** `services/intelligence/app/services/qa.py`, `src/lib/intelligence/safety.ts`
- **Finding:** The production Gemini path accepts `reply_text`, `intent`, `confidence`, `grounded_facts`, and `requires_human_approval` directly from the model. The TypeScript safety classifier then uses those model-supplied values to decide whether a reply is Green and may be dispatched automatically. There is no post-generation check that the reply facts exist in the tenant catalog, active orders, or merchant policy grounding, and `agent_config.safetyTier` is not enforced by the Python service.
- **Impact:** A prompt-injected or incorrect model response can claim high confidence and Green eligibility, causing an unverified customer-facing reply. The deterministic heuristic path is safer, but it does not protect production when an LLM key is configured.
- **Evidence:** Existing tests cover heuristic responses; no test covers adversarial or fabricated production LLM output.
- **Required fix:** Add a deterministic policy/fact verification layer after model generation. Clamp confidence and force Yellow/Red when facts, payment claims, human requests, or order details cannot be verified. Treat model approval flags as advisory only.

## base-ui-accessibility-violations/INT-002 - Telegram approval actions are marked executed without dispatch

- **Severity:** P1
- **Status:** closed
- **Area:** `src/app/api/webhooks/telegram/route.ts`, `src/app/actions/approvals.ts`
- **Finding:** Telegram Yellow/Red replies are inserted into `ai_action_queue`, but `approveAction()` only dispatches when the channel identity is WhatsApp. A Telegram action can therefore be marked `executed` without sending anything to the customer. Telegram also lacks the autonomous assurance/handoff notice implemented in the WhatsApp route.
- **Impact:** Human escalation and approved replies silently disappear for Telegram customers, violating the PRD requirement that adapters support outgoing messages and human handoff.
- **Required fix:** Dispatch approvals through a channel adapter selected from the originating channel identity, and only mark an action executed after successful delivery. Add Telegram assurance/handoff behavior and channel-specific delivery metadata.

## base-ui-accessibility-violations/INT-003 - Intelligence service has a known default API key

- **Severity:** P1
- **Status:** closed
- **Area:** `services/intelligence/app/config.py`
- **Finding:** `INTELLIGENCE_SERVICE_API_KEY` defaults to a committed development value. The service can start with that known credential unless deployment configuration overrides it.
- **Impact:** Anyone who obtains network access to the Intelligence service can call authenticated extraction and reply endpoints using the default key, potentially consuming the model and accessing tenant-grounded responses.
- **Required fix:** Make the key required in production and fail startup when it is missing or equal to the development default. Keep development defaults limited to explicit non-production environments.
