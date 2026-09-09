# Feature 25: Deployment Readiness

**From build-plan:** feature 25
**Status:** complete

## Goal

Prepare and verify production deployment readiness for Merchander on Vercel for the Next.js web application, while documenting the service topology for the paired Python Intelligence service (`services/intelligence`). Standardize environment variable contracts, production build optimizations, security headers, an automated `/api/health` monitoring endpoint, and a deployment and smoke-test runbook.

## In scope

- Public health check endpoint (`src/app/api/health/route.ts`) returning JSON `{ status: 'ok', timestamp, env, uptime }` for synthetic monitoring and Vercel post-deploy verification.
- Unit tests for `/api/health` in `src/app/api/health/__tests__/route.test.ts`.
- Vercel configuration (`vercel.json`) specifying framework presets, function settings, and security headers.
- Next.js production build optimization: resolve dynamic server usage warnings during static analysis (e.g. `export const dynamic = 'force-dynamic'` in `/dashboard/suppliers/page.tsx`).
- Production environment variable audit in `.env.example` documenting all configuration keys across Supabase, Paystack, Hubtel, Meta WhatsApp Cloud API, and Python Brain.
- Deployment and smoke-test runbook in `docs/deployment.md` covering Vercel project setup, Supabase remote migration sync, Python Brain deployment, and verification steps.

## Out of scope

- Direct execution of remote deployment commands against third-party providers (strictly local-only preparation under the `AGENTS.md` approval boundary).
- Writing live production secrets to git repository files.
- Modifying core application business logic or database schemas.

## Build steps

- [x] **Step 1 - Health Check Endpoint & Unit Tests** - Implement `src/app/api/health/route.ts` providing a lightweight JSON response with uptime, environment, and timestamp. Add unit tests in `src/app/api/health/__tests__/route.test.ts`. *Done when:* `GET /api/health` returns status `ok` and `yarn test` passes.
- [x] **Step 2 - Vercel Configuration & Dynamic Route Tuning** - Create `vercel.json` and configure `export const dynamic = 'force-dynamic'` on `/dashboard/suppliers/page.tsx` to eliminate dynamic server usage warnings during build. *Done when:* `vercel.json` is in place and `yarn build` finishes with 0 warnings.
- [x] **Step 3 - Environment Variable Audit & Template Update** - Audit and update `.env.example` with complete configuration documentation, grouping required and optional keys with descriptions. *Done when:* `.env.example` documents all active runtime environment variables.
- [x] **Step 4 - Production Deployment Runbook & Smoke Test Verification** - Create `docs/deployment.md` with step-by-step guidance for Vercel setup, Supabase migration verification, Python Brain container setup, and post-deploy smoke testing. *Done when:* `docs/deployment.md` is complete and readable.

## Files / areas

- `src/app/api/health/route.ts`
- `src/app/api/health/__tests__/route.test.ts`
- `vercel.json`
- `src/app/dashboard/suppliers/page.tsx`
- `.env.example`
- `docs/deployment.md`

## Verification

- Typecheck: `yarn check` (`tsc --noEmit`) passed with 0 errors.
- Linter: `yarn lint` (`eslint src`) passed with 0 warnings.
- Tests: `yarn test` passed (62 test files, 541 tests passing).
- Production Build: `yarn build` (`next build`) succeeded with 0 warnings across all 58 routes.
