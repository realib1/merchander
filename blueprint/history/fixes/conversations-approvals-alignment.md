# Fix: Align Approvals Queue Navigation & Eliminate Synthetic Conversations (F-15, F-24)

### Type: Fix
### Status: completed
### Fixes: F-15, F-24

---

## The Problem

1. **F-15 (Fabricated conversation threads & hardcoded response time):**
   `src/app/actions/conversations.ts:50` defines `getConversationsData()` which maps over customer records and synthesizes fake `ConversationThread` objects with canned messages (`"Customer started conversation"`, `"Awaiting payment confirmation for order..."`) and synthetic intents. Additionally, `src/utils/conversationsMath.ts:26` hardcodes `avgResponseTimeMinutes: 3.5` as a static benchmark. `getConversationsData()` is unreferenced by any page or component, creating dead code with simulated data.

2. **F-24 (Sidebar "Conversations" nav item intent mismatch):**
   `src/app/dashboard/components/sidebar/sidebarNavigation.ts:42` names the `/dashboard/conversations` navigation item `"Conversations"` with a `MessageSquare` icon. However, `/dashboard/conversations/page.tsx` is actually titled "Approvals & Inquiries" and renders the operational approval and exceptions triage workspace for `ai_action_queue` items. Merchants clicking "Conversations" expecting a customer chat inbox find an AI approvals and exceptions management queue.

---

## The Fix

1. **Sidebar Navigation Alignment (`sidebarNavigation.ts`):**
   - Update the `/dashboard/conversations` nav item in `src/app/dashboard/components/sidebar/sidebarNavigation.ts` from `"Conversations"` (`MessageSquare`) to `"Approvals & Inquiries"` (`CheckSquare`).
   - Add unit test coverage in `src/app/dashboard/components/sidebar/sidebarNavigation.test.ts` to ensure navigation groups, item names, icons, route mappings, and module filtering (`getFilteredNavGroups`) remain reliable and regression-free.

2. **Eliminate Dead Synthetic Action & Fix Response Time Math (`conversations.ts`, `conversationsMath.ts`):**
   - Delete dead `src/app/actions/conversations.ts` to completely remove unreferenced synthetic thread generators that fabricate fake messages.
   - In `src/utils/conversationsMath.ts`, update `computeConversationsMetrics` to accept duration data and dynamically calculate average response times, returning `0` when no duration data exists rather than hardcoding `3.5`.
   - Consolidate and update tests in `src/utils/conversationsMath.test.ts` to verify dynamic metrics calculation, and remove redundant `src/utils/conversations.test.ts`.

---

## Build Steps

- [x] **Step 1: Sidebar Navigation Alignment (F-24)**
  - Update `src/app/dashboard/components/sidebar/sidebarNavigation.ts` to import `CheckSquare` and name the nav item `"Approvals & Inquiries"`.
  - Create `src/app/dashboard/components/sidebar/sidebarNavigation.test.ts` verifying all nav groups, module filtering (`NAV_ITEM_MODULE_MAP`), and that `/dashboard/conversations` is registered as `"Approvals & Inquiries"` with `CheckSquare`.
  - **Done when:** `sidebarNavigation.ts` exposes `"Approvals & Inquiries"` with `CheckSquare` and `sidebarNavigation.test.ts` passes.

- [x] **Step 2: Remove Dead Synthetic Action & Fix Dynamic Response Time Math (F-15)**
  - Delete dead `src/app/actions/conversations.ts`.
  - Refactor `computeConversationsMetrics` in `src/utils/conversationsMath.ts` to remove the hardcoded `3.5` response time and calculate real averages from duration inputs (or 0 when empty).
  - Update `src/utils/conversationsMath.test.ts` to cover dynamic response time calculations and remove the duplicate `src/utils/conversations.test.ts`.
  - **Done when:** Dead synthetic conversation generator is deleted, response time is calculated dynamically without hardcoded constants, and `yarn test` passes cleanly.

---

## Verification

### Automated
- `yarn test` (all 75 unit test suites pass, 666 tests passed).
- `yarn check` (`tsc --noEmit` clean, 0 type errors).
- `yarn lint` (`eslint src` clean, 0 lint warnings or errors).

### Manual
- Inspected dashboard sidebar: navigation link at `/dashboard/conversations` is labeled **Approvals & Inquiries** with `CheckSquare`.
- Navigated to `/dashboard/conversations`: page title, header, and metrics align with the sidebar entry.
