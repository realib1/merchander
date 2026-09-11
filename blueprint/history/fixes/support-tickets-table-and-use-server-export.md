# Fix: Normalize Platform Support Tickets Table & Fix 'use server' Object Export

### Type: Fix
### Status: verified
### Completed: 2026-09-11
### Branch: fix/use-server-export

---

## The Problem

1. **Support Tickets JSONB Anti-Pattern:** Support tickets were previously embedded inside `tenant_settings.settings_data.support_tickets` as a JSONB array, causing race conditions, lack of relational integrity, inability to enforce foreign keys or indexes, and poor performance when platform staff aggregated cross-tenant support tickets.
2. **Next.js Turbopack 'use server' Build Error:** `src/app/actions/platform-settings.ts` contained a `'use server'` directive but exported a constant object (`DEFAULT_PLATFORM_SETTINGS`), causing Vercel and local production builds (`yarn build`) to fail with:
   ```
   Error: A "use server" file can only export async functions, found object.
   ```

---

## Affected Files

- `supabase/migrations/20260911000000_create_support_tickets.sql` (new migration)
- `src/types/platform.ts`
- `src/app/actions/platform-support.ts`
- `src/app/actions/platform.ts`
- `src/app/actions/support.ts`
- `src/app/actions/platform-settings.ts`
- `src/app/actions/platform-settings.test.ts`
- `blueprint/context/project-overview.md`

---

## The Fix

- **Step 1 - Database Migration:** Created `support_tickets` table with UUID primary keys, tenant isolation foreign keys (`ON DELETE CASCADE`), indexes on tenant_id/status/priority/created_at, RLS policies for platform staff and tenant users, and automated data migration moving JSONB tickets from `tenant_settings`.
- **Step 2 - Rewrite Server Actions:** Updated `platform-support.ts` and `support.ts` to perform direct, indexed relational operations against `support_tickets`, removing fragile read-modify-write JSONB array operations.
- **Step 3 - Platform Overview & Type Alignment:** Updated `PlatformSupportTicket` types, eliminated all loose `: any` typing, and updated `platform.ts` KPI aggregation.
- **Step 4 - Fix 'use server' Export:** Relocated `DEFAULT_PLATFORM_SETTINGS` to `src/types/platform.ts` and updated imports in `platform-settings.ts` and `platform-settings.test.ts`.

---

## Verification

### Automated
- `yarn check` (TypeScript: 0 errors)
- `yarn lint` (ESLint: 0 errors)
- `yarn test` (Vitest: 80 files, 712 tests, 100% green)
- `yarn build` (Next.js Turbopack: 59/59 static & dynamic routes compiled successfully)
