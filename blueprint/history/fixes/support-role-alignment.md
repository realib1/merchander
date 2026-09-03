# Current Feature

**Title:** Align /platform/support action roles with the route RBAC rule

**Type:** Fix

**Status:** verified

**Fixes:** F-26

**Source:** `/audit` re-review of the trust-boundary hygiene batch. The F-25 fix
added a `requirePlatformRoute('/platform/support')` guard that enforces
`PLATFORM_RBAC_RULES['/platform/support']`, but the page's data and write
actions gate on a different local constant, so the guard and the action disagree
on two roles.

## The problem

`src/app/actions/platform-support.ts` defined its own role list:

```
const SUPPORT_INBOX_ROLES = ['platform_owner', 'platform_admin', 'operations', 'support', 'compliance'] as const;
```

used by `getPlatformSupportTicketsAction` (read) and
`updateSupportTicketStatusAction` (write). The route guard uses
`PLATFORM_RBAC_RULES['/platform/support']` =
`['platform_owner', 'platform_admin', 'support', 'operations', 'tech_admin']`.

They disagreed on `tech_admin` (guard yes, action no) and `compliance` (guard
no, action yes):

- `tech_admin` passed the guard and `PlatformNav` showed the link, but the data
  action denied, so `/platform/support` rendered `<SupportClient initialTickets={[]} />`
  - the F-25 dead-shell symptom, for this one role.
- `compliance` was in `SUPPORT_INBOX_ROLES` (action authorized it) but not the
  RBAC rule, so `PlatformNav` hid the link and the guard redirected it. No
  working UI path to support.

`PLATFORM_RBAC_RULES` is the documented per-route policy (project overview;
`PlatformNav` link visibility; every F-24 route guard reads it), so it is the
side to converge on.

## The fix

Dropped the local `SUPPORT_INBOX_ROLES` constant and gated both support actions
on `PLATFORM_RBAC_RULES['/platform/support']` directly, matching how
`getPlatformStaffListAction` and the `platform.ts` actions were wired in F-24.
One source of truth; the guard and the action can no longer drift.

Net role change:

- `tech_admin` gains support-inbox access at the action (it already had the nav
  link and passed the guard) - closes the dead shell.
- `compliance` loses support-inbox access at the action, which it could not
  reach through the UI anyway (link hidden, guard redirects). Not a functional
  regression. The alternative (add `compliance` to
  `PLATFORM_RBAC_RULES['/platform/support']`, wider blast radius) was left as a
  reviewable option; this fix took the converge-on-the-RBAC-rule direction.

### Must not break

- `platform_owner` / `platform_admin` / `support` / `operations` still read and
  update support tickets (all four are in both lists today, so unchanged).
- The support access-grant flow (`support-grant.ts`,
  `platform_support_access_grants`) is untouched - it has its own gating and is
  not part of this finding.
- `triggerMerchantPasswordResetAction` (`['platform_owner','platform_admin','support']`)
  is a different action with its own list - left as is.
- `yarn test`, `yarn lint`, `yarn check`, `yarn build` all green.

## Build steps

- [x] 1. **Point the support actions at the shared RBAC rule.**
  In `src/app/actions/platform-support.ts`: removed the `SUPPORT_INBOX_ROLES`
  constant, added `import { PLATFORM_RBAC_RULES } from '@/lib/auth/platform-staff';`,
  and changed both `verifyPlatformStaff([...SUPPORT_INBOX_ROLES])` call sites
  (`getPlatformSupportTicketsAction`, `updateSupportTicketStatusAction`) to
  `verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/support'])`.
  **Evidence:** `yarn check` / `yarn lint` exit 0. `grep -rn SUPPORT_INBOX_ROLES
  src/` returns nothing; both call sites now reference
  `PLATFORM_RBAC_RULES['/platform/support']`, the same value the F-25 guard in
  `support/page.tsx` resolves.

- [x] 2. **Full verify.** `yarn test` (190, 26 files), `yarn lint` (0),
  `yarn check` (0), `yarn build` (0) all green.

## Verify

- `/platform/support` as `tech_admin`: page renders with real tickets (guard
  passes, action now allows). As `finance` or `compliance`: redirect to
  `/platform` (guard blocks, action would also deny). As `support` /
  `operations`: unchanged, still works. (No live multi-role staff login locally -
  the DB role-list plus the now-single role source is the evidence, as for
  F-24 / F-25.)
- `updateSupportTicketStatusAction` as `tech_admin`: succeeds. As `compliance`:
  `Forbidden` (was allowed before; now consistent with the UI).
- `yarn test` / `yarn lint` / `yarn check` / `yarn build` clean.

## Out of scope

- Widening `PLATFORM_RBAC_RULES['/platform/support']` to include `compliance`
  (the other way to reconcile) - only if review decides `compliance` needs
  support access.
- Any other route where a data action's role list might differ from its RBAC
  rule - none found for the guarded routes, but a broader sweep is a separate
  audit, not this fix.
- F-13 (platform query fan-out), F-14 (untested `src/utils` modules).

## Findings

### support-role-alignment/F-26 [P3] closed - /platform/support route guard and data action disagree on which roles are allowed

**File:** src/app/platform/support/page.tsx:9
**Found:** 2026-09-03 by /audit (scope: current; lens: security)
**Why it matters:** The F-25 fix added
`await requirePlatformRoute('/platform/support')`, which enforces
`PLATFORM_RBAC_RULES['/platform/support']` =
`['platform_owner','platform_admin','support','operations','tech_admin']`. But
`getPlatformSupportTicketsAction` and `updateSupportTicketStatusAction` gated on
`SUPPORT_INBOX_ROLES` =
`['platform_owner','platform_admin','operations','support','compliance']`. The
two sets disagreed on `tech_admin` (guard yes, action no - so the page still
rendered the empty `<SupportClient>` shell for this role) and `compliance`
(action yes, guard no - redirected away from a page its own action considered
in-scope, with no nav link either). No data exposed, writes gated, so P3, same
class as F-25.
**Resolution:** Fixed on `fix/support-role-alignment` (spec step 1). Took the
converge-on-the-RBAC-rule direction: `SUPPORT_INBOX_ROLES` deleted;
`getPlatformSupportTicketsAction` and `updateSupportTicketStatusAction` now call
`verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/support'])`, the identical
array the F-25 route guard resolves, so guard and action can no longer diverge.
`tech_admin` gains action access (dead shell closed); `compliance` loses action
access it had no UI path to (nav link hidden, guard redirects). Re-reviewed by
/audit (scope: current; lens: security) 2026-09-03: `platform-support.ts` has
exactly two exported actions, both now on the shared rule; no `SUPPORT_INBOX_ROLES`
left in the tree; pattern matches the F-24 wiring in `platform-staff.ts`.
`yarn check` / `lint` / `test` (190) / `build` exit 0. Original defect gone, no
new defect. Closed.

### Still open at completion (not part of this fix)

- **F-13 [P2] open** - platform overview query fan-out (whole-table scans +
  `listUsers({ perPage: 1000 })` cap).
- **F-14 [P2] open** - five pure `src/utils` modules with no tests despite the
  declared gate.
