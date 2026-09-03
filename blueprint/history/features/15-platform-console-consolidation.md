# Current Feature: Platform Console Consolidation (Reality Check Part 3)

**Status:** verified
## Goal
Complete the final three points from the Platform Console Reality Check:
1. Strip the revenue surface to a single honest Contracted MRR figure, removing multiplier-based ARR and ARPU until a billing provider exists.
2. Centralize the RBAC map so that link visibility matches the backend enforcement gate.
3. Move `is_platform_staff()` from the `public` schema to `private` to hide it from the REST surface, updating all RLS policies that rely on it.

## In Scope
- Removing fabricated revenue metrics from types, actions, and the Revenue page.
- Centralizing role checks via a single `PLATFORM_RBAC_RULES` mapping.
- Securing `is_platform_staff()` with a dynamic DO-block SQL migration.

## Out of Scope
- Adding a billing provider or real ledger (deferred to billing scope).
- Modifying non-platform routes (e.g., merchant app RBAC).
- Creating new platform pages or features.

## The Build Loop
1. Run `yarn dev` to serve the app locally.
2. Observe errors from Next.js on `localhost:3000/platform`.
3. Check TypeScript compilation with `yarn check` after stripping revenue types.

## Build Steps

- [x] 1. **Honest Revenue Types**: Edit `src/types/platform.ts` to remove `projectedARR`, `arpuGHS`, and `failedBillingCount` from `PlatformOverviewKPIs` and `PlatformRevenueMetrics`. (We only show what we have collected/contracted).
- [x] 2. **Honest Revenue Actions**: Edit `src/app/actions/platform.ts` to remove the computation of those fields from `getPlatformOverviewData` and `getPlatformRevenueMetricsAction`.
- [x] 3. **Honest Revenue UI**: Edit `src/app/platform/revenue/page.tsx` to remove the ARPU, Projected ARR, and Past Due MetricCards (as past due is handled as an operational attention item on the main overview, not a revenue metric).
- [x] 4. **Centralize RBAC Map**: Edit `src/lib/auth/platform-staff.ts` to export a new `PLATFORM_RBAC_RULES` constant, mapping each `/platform/*` path prefix to its allowed `PlatformRole` array (exactly matching the frontend `PAGE_ROLES`).
- [x] 5. **Enforce RBAC on Nav**: Edit `src/app/platform/components/PlatformNav.tsx` to import and use `PLATFORM_RBAC_RULES` instead of its hardcoded dictionary.
- [x] 6. **Enforce RBAC on Actions**: Edit `src/app/actions/platform.ts` to update all `verifyPlatformStaff` calls, passing the exact array from `PLATFORM_RBAC_RULES` that corresponds to the data being fetched (e.g., `PLATFORM_RBAC_RULES['/platform/merchants']` for `getMerchantContextAction`).
- [x] 7. **Secure Platform Staff Function**: Create `supabase/migrations/20260903002200_move_platform_staff_to_private.sql` with a DO block to create `private.is_platform_staff()`, update all policies referencing `public.is_platform_staff()`, and drop the public one. (Done when migration executes successfully on local DB).

## Files & Areas
- `src/types/platform.ts`
- `src/app/actions/platform.ts`
- `src/app/platform/revenue/page.tsx`
- `src/lib/auth/platform-staff.ts`
- `src/app/platform/components/PlatformNav.tsx`
- `supabase/migrations/`

## Data & Contracts
- The `is_platform_staff()` function signature is identical, just moved to `private` and executing `SET search_path = public`.
- `PlatformOverviewKPIs` and `PlatformRevenueMetrics` will shed three properties. Components relying on them will be updated.

## Testing
- Logic testing: `yarn check` must pass cleanly without complaining about missing ARPU/ARR fields.
- Migration test: The new migration must apply cleanly against the current local database without orphaned policy references.

## Notes for the AI
- A dynamic DO block for updating policies involves looping over `pg_policy` and running dynamic SQL. Remember that `is_platform_staff()` might be in `qual` or `with_check`. Use `REPLACE(qual::text, 'public.is_platform_staff()', 'private.is_platform_staff()')` and `REPLACE(qual::text, 'is_platform_staff()', 'private.is_platform_staff()')`.
