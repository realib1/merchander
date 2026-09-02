# Coding Standards

> Rewritten by `/adopt` to match what this codebase actually does. Merchander is
> Next.js 16 (App Router) + React 19 + TypeScript + Supabase + Tailwind v4. Edit
> to taste; the Writing and Comments sections are the Blueprint defaults and were
> kept as-is.

## TypeScript

- Strict mode (`strict: true`, `noEmit`, `moduleResolution: "bundler"`).
- No `any`. Use `unknown` and narrow, or define a type. Casting through
  `as unknown as X` happens in a few places against Supabase's generated row
  types - keep it rare and localized, not a habit.
- Define interfaces / types for props, action payloads, action results, and data
  models. Domain types live in `src/types/[feature].ts`; generated DB types in
  `src/types/supabase.ts` (do not hand-edit - regenerate).
- Path alias: `@/*` -> `src/*`.

## React

- Functional components only, hooks for state and effects.
- Server components at the page/layout level; add `'use client'` for
  interactivity (forms, modals, drawers, charts, anything with state or browser
  APIs). This app is client-heavy by necessity - that is expected, not a smell.
- One job per component. Shared interactive logic goes in `src/hooks/`.
- Reusable UI primitives live in `src/components/ui` (hand-rolled, shadcn-style:
  `Button`, `Card`, `Modal`, `DataTable`, `MetricCard`, `FormField`, ...). Reuse
  them before adding a new one.

## Next.js

- App Router. Server components fetch through Server Actions or Supabase directly;
  they do not call `fetch` to our own API.
- **Server Actions are the default mutation and data path.** They live in
  `src/app/actions/[feature].ts`, one `'use server'` module per feature area
  (~60 of them). Group by feature, not by verb.
- API routes (`src/app/api/`) are only for inbound webhooks (Paystack, Hubtel,
  WhatsApp, Telegram) and the auth reset endpoint - things that need a real HTTP
  request from a third party. Do not add an API route for something a Server
  Action can do.
- Edge middleware is `src/proxy.ts` (Next 16 renamed `middleware` -> `proxy`). It
  refreshes the Supabase session, gates `/dashboard` and `/platform` behind auth
  and AAL2, and routes users to the right portal. Keep it edge-safe (no Node-only
  imports).
- Dynamic routes for item/collection pages (`[id]`, `[slug]`, `[code]`).

## Supabase & data access

- **Two clients, know which you are using:**
  - `createClient()` (`src/lib/supabase/server.ts`) - anon key, carries the
    user's cookies, **RLS applies**. This is the default for anything acting on
    behalf of a merchant.
  - `createAdminClient()` (`src/lib/supabase/admin.ts`) - service role, **bypasses
    RLS**. Only for platform-staff operations and genuinely cross-tenant reads.
    Every action that uses it must first authorize the caller
    (`verifyPlatformStaff([...])` for the platform plane; an explicit
    `auth.getUser()` + tenant-scope check for merchant self-service).
- **Tenant isolation is the top invariant.** Every tenant-owned table has
  `tenant_id` and an RLS policy. In app code, scope every query by the
  authenticated user's tenant (`tenant_users` lookup by `auth.uid()`); never
  trust a client-supplied `tenant_id` or user id.
- Platform-staff checks go through `src/lib/auth/platform-staff.ts`
  (`getPlatformStaffRecord` / `isActivePlatformStaff`) and
  `verifyPlatformStaff()` in `src/app/actions/platform.ts` - do not re-inline the
  `platform_staff_users` query.
- Schema changes are SQL migrations in `supabase/migrations/`
  (`<timestamp>_<name>.sql`), applied with the Supabase CLI. **Never seed
  `auth.users`, passwords, or environment-specific rows in a migration** - local
  demo data goes in `supabase/seed.sql` (runs only on `supabase db reset`);
  shared-environment accounts are provisioned out of band.
- After a schema change, regenerate `src/types/supabase.ts`.

## Validation & error handling

- Validate untrusted input with Zod at the top of the action.
- Server Actions use try/catch and return a result object. The common shape is
  `{ success?: boolean; data?: T; error?: string }`; some read actions return the
  domain object directly. Match the neighbouring actions in the same file.
- Log failures with `console.error` (context string + error). Surface
  user-facing errors through `sonner` toasts on the client.
- Let `redirect()` / `NEXT_REDIRECT` errors re-throw - catch with
  `isRedirectError`, never swallow them.

## File organization

- Pages: `src/app/[route]/page.tsx`
- Route-local components: `src/app/[route]/components/ComponentName.tsx`
- Server Actions: `src/app/actions/[feature].ts`
- Shared UI primitives: `src/components/ui/`; other shared components:
  `src/components/[area]/`
- Hooks: `src/hooks/`; context providers: `src/context/`
- Domain types: `src/types/[feature].ts`
- Pure logic + helpers: `src/utils/[name].ts`
- Integrations / infra: `src/lib/[area]/` (`supabase/`, `payments/`,
  `intelligence/`, `auth/`)

## Naming

- Components: PascalCase files matching the component name.
- Functions and Server Actions: camelCase; action names read as verbs
  (`createBusinessTarget`, `getPlatformOverviewData`).
- Types / interfaces: PascalCase, no prefix.
- Constants: SCREAMING_SNAKE_CASE.
- Migrations: `<utc-timestamp>_<snake_case_description>.sql`.

## Styling

- Tailwind CSS v4, CSS-first config. Theme tokens are `@theme` variables in
  `src/app/globals.css` - **there is no `tailwind.config.js`**.
- Style with token-backed utilities (`bg-surface`, `text-muted`,
  `border-separator`, `text-brand-primary`, `font-display`). Do not hardcode hex
  values or use inline `style` for anything the token system covers.
- Dark mode first, light mode optional (`next-themes`).
- Icons: `lucide-react`. Animation: `motion`. Toasts: `sonner`. Charts:
  `recharts`.

## Formatting

- Prettier: single quotes, semicolons, `trailingComma: "es5"`, 2-space indent,
  `printWidth: 120`, `arrowParens: "always"`. Run `yarn format`.
- ESLint: `eslint-config-next`. `yarn lint` must pass (no warnings) - it and
  `yarn check` run in the Husky pre-commit hook.

## Testing

**The test gate is ON.** `AGENTS.md` declares `test: yarn test` (Vitest), so a
step that adds pure logic must ship a passing test in the same diff, and the
suite must be green before a step is approved and before `/complete` merges.

- **What to test:** pure, assertable logic in `src/utils/` - parsers, formatters,
  validators, id/slug/token builders, phone normalization, pricing and
  profitability math, engine calculations (targets, insights). Every existing
  test file is `src/utils/*.test.ts` and follows this scope.
- **What not to test:** React components, Server Actions, and anything that talks
  to Supabase or a payment provider. The suite does not mock the Supabase client
  and should not start. Verify those with the running app, a screenshot, and the
  build.
- Test files sit next to their source (`format.ts` -> `format.test.ts`). Run via
  `yarn test`; Vitest is configured for `src/**/*.test.{ts,tsx}` in a `node`
  environment with globals on.
- An empty suite fails, not passes.

Stack binding: Vitest, plain function tests (no framework harness). If a future
step needs to test time-dependent logic use `vi.useFakeTimers()`.

## Browser Verification

No browser-test harness is set up. For UI and integration behavior, use the dev
server, browser screenshots, build output, and API/action responses as evidence.
Run `/browser-tests` if a repeatable harness becomes worth it; do not add one
mid-feature.

## Code Quality

- No commented-out code. Delete it; git remembers.
- No unused imports or variables (ESLint enforces).
- Keep functions focused; extract when a Server Action grows past readable.
- The dashboard-metrics and platform-aggregation actions do a lot of in-memory
  joining of separate queries - acceptable, but prefer an RPC / view when a new
  aggregation would otherwise fan out into many round-trips.

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
