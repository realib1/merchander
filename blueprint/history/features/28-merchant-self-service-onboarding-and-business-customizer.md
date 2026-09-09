# Feature: Merchant Self-Service Onboarding & Business Customizer

**From build-plan:** feature 28
**Status:** verified

## Goal

Provide a public, high-converting self-service merchant onboarding experience at `/signup` with a guided 4-step wizard that captures business identity, sets an operational archetype (Import & Resale, Boutique Fashion, Wholesale Distribution, General Merchant, or Custom Setup), provisions the isolated tenant workspace, and configures initial module toggles. In the merchant dashboard, introduce `/dashboard/settings/modules` (Business Customizer) where merchant owners can dynamically enable/disable modules governed by subscription plan entitlements, which in turn dynamically shapes the sidebar navigation and filters available role permissions in the RBAC manager (`RoleFormDrawer.tsx`).

## Design reference

- **Design Tokens**: `prototypes/theme.css` (porting into `src/app/globals.css` `@theme` in Step 1).
- **Signup Wizard Mockup**: `prototypes/signup-wizard.html` (multi-step stepper, live slug preview, archetype cards with feature checklists, module launch preview).
- **Module Customizer Mockup**: `prototypes/business-customizer.html` (in-app module toggles, archetype preset switcher, live sidebar impact preview).
- **Adaptive Dashboard Mockup**: `prototypes/tailored-dashboard.html` (dynamic sidebar navigation, archetype-tailored metric cards).

## In scope

1. **Design Tokens Porting (`src/app/globals.css`)**:
   - Port the locked tokens from `prototypes/theme.css` into `src/app/globals.css` `@theme` block.
   - Establish `--color-brand-primary-hover`, elevated surface tokens, and component indicator styles for both dark obsidian and light zinc modes.

2. **Pure Business Module & Archetype Utilities (`src/utils/business-modules.ts` & test)**:
   - Module enum/keys: `'shipments'`, `'batches'`, `'suppliers'`, `'storefront'`, `'profitability'`, `'intelligence'`.
   - Archetype presets: `import_resale`, `boutique_fashion`, `wholesale_distributor`, `general_pos`, `custom`.
   - `getEffectiveModules(tier, enabledModules)`: pure calculation ensuring unentitled modules are filtered out based on subscription tier ceiling.
   - `filterPermissionsByModules(enabledModules, permissionGroups)`: pure function pruning permissions from RBAC forms when parent modules are dormant.
   - 100% test coverage in `src/utils/business-modules.test.ts`.

3. **Database Schema & Migrations (`supabase/migrations/`)**:
   - Migration adding `business_archetype` (text default `'import_resale'`) and `enabled_modules` (text[] default `ARRAY['storefront', 'profitability', 'intelligence']::text[]`) to `public.tenant_settings`.
   - Update `src/types/supabase.ts` and `src/types/platform.ts`.

4. **Self-Service Signup Server Action (`src/app/actions/signup.ts` & test)**:
   - `selfServiceSignupAction(payload: SelfServiceSignupPayload)`:
     - Validates email, password, full name, phone (`+233`), and store slug.
     - Verifies slug uniqueness against `storefront_settings`.
     - Creates Supabase Auth user.
     - Provisions tenant records atomically: `tenants`, `tenant_users` (`owner`), `stores` (primary branch), `tenant_settings` (archetype + enabled modules), `storefront_settings` (slug + store name), and `tenant_subscriptions` (starter tier or growth trial).
     - Seeds archetype-tailored default roles in `tenant_roles`.
     - Signs the user in and redirects to `/dashboard`.
   - Comprehensive unit tests in `src/app/actions/signup.test.ts`.

5. **Public Signup Wizard Page (`src/app/signup/`)**:
   - Public route `/signup` accessible to unauthenticated visitors.
   - Multi-step client component (`SignupWizardClient.tsx`):
     - Step 1: Account credentials (name, email, password, Ghana phone).
     - Step 2: Store profile (store name, currency GHS/USD, slug preview `[slug].merchander.store`, base city).
     - Step 3: Business archetype selector (4 primary presets + Custom setup card).
     - Step 4: Module review & Launch button.
   - Error handling for duplicate slugs or existing emails.

6. **In-App Business Module Customizer (`src/app/dashboard/settings/modules/`)**:
   - Settings page in merchant dashboard matching `prototypes/business-customizer.html`.
   - Active Archetype Banner with preset selector.
   - Toggle matrix for modules with live impact tags.
   - **Subscription Tier Entitlement Guard**: Modules requiring higher tiers (e.g. Shipments / Batches requiring Growth) display a plan badge and locked switch with an upgrade modal.
   - Server action `updateTenantModulesAction` to persist module preferences.

7. **Dynamic Sidebar & RBAC Integration**:
   - Update `sidebarNavigation.ts` to accept active modules and filter out dormant groups/items.
   - Update `Sidebar.tsx` to pass tenant settings into navigation filtering.
   - In `RoleFormDrawer.tsx`, filter available permission categories using `filterPermissionsByModules`.

## Out of scope

- Direct payment card checkout during registration (free trial / starter tier is assigned on signup; billing upgrades are performed in Settings > Subscription).
- Automated live WhatsApp Cloud API welcome message dispatch via Meta (deferred to channel onboarding).
- Automated DNS nameserver validation for custom domains (handled in Domains settings).

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Theme Token Porting & Pure Module Utilities** - Port design tokens from `prototypes/theme.css` into `src/app/globals.css` `@theme`, and create `src/utils/business-modules.ts` with archetype definitions, module metadata, tier entitlement checks, and RBAC permission filtering, backed by 100% test coverage in `src/utils/business-modules.test.ts`. *Done when:* `yarn test src/utils/business-modules.test.ts` passes and `yarn check` passes.
- [x] **Step 2 - Database Migration & Type Alignment** - Create Supabase migration adding `business_archetype` and `enabled_modules` to `public.tenant_settings`, regenerate/update types in `src/types/supabase.ts` and `src/types/business-modules.ts`, and update settings fetchers. *Done when:* Migration file is created and typecheck `yarn check` passes cleanly.
- [x] **Step 3 - Self-Service Signup Server Action & Role Seeding** - Implement `selfServiceSignupAction` in `src/app/actions/signup.ts` handling auth creation, slug verification, atomic tenant provisioning, subscription initialization, and archetype default role seeding, with unit test coverage in `src/app/actions/signup.test.ts`. *Done when:* Tests pass verifying successful registration, slug collision rejection, duplicate email handling, and atomic record insertion.
- [x] **Step 4 - Public Signup Wizard Page (`/signup`)** - Build the public multi-step onboarding wizard in `src/app/signup/` with step navigation, credential forms, store details, archetype selection cards (including Custom Setup), module launch preview, and responsive dual-mode layout matching `prototypes/signup-wizard.html`. *Done when:* Visiting `/signup` renders the interactive wizard, step validation functions, and successful completion signs the merchant in and routes to `/dashboard`.
- [x] **Step 5 - In-App Business Module Customizer (`/dashboard/settings/modules`)** - Create `/dashboard/settings/modules` with active archetype presets, module toggles, subscription entitlement lock badges, and `updateTenantModulesAction` server action matching `prototypes/business-customizer.html`. *Done when:* Merchant owners can view active modules, toggle allowed modules, see plan upgrade triggers for locked modules, and save preferences.
- [x] **Step 6 - Dynamic Sidebar Navigation & Role Form Drawer Integration** - Update `sidebarNavigation.ts` and `Sidebar.tsx` to filter out dormant module links based on tenant settings, and update `RoleFormDrawer.tsx` to hide permissions belonging to inactive modules. *Done when:* Toggling off a module removes it from the sidebar and hides its permission checkboxes from the custom role drawer, verified with `yarn check`, `yarn lint`, and `yarn test`.

## Files / areas

- `src/app/globals.css` (MODIFY) - port prototype tokens into `@theme`
- `src/utils/business-modules.ts` (NEW) - pure module metadata, presets, entitlement & RBAC filter functions
- `src/utils/business-modules.test.ts` (NEW) - unit tests for business module utilities
- `supabase/migrations/<timestamp>_add_tenant_modules_and_archetype.sql` (NEW) - schema migration for tenant_settings
- `src/types/supabase.ts` (MODIFY) - type definitions for tenant_settings additions
- `src/types/business-modules.ts` (NEW) - shared module and archetype types
- `src/app/actions/signup.ts` (NEW) - server action for public self-service signup
- `src/app/actions/signup.test.ts` (NEW) - unit tests for signup action
- `src/app/signup/page.tsx` (NEW) - public signup page entrypoint
- `src/app/signup/components/SignupWizardClient.tsx` (NEW) - multi-step onboarding wizard component
- `src/app/signup/components/` (NEW) - wizard subcomponents (StepAccount, StepBusiness, StepArchetype, StepReview)
- `src/app/dashboard/settings/modules/page.tsx` (NEW) - in-app module customizer page
- `src/app/dashboard/settings/modules/components/ModuleCustomizerClient.tsx` (NEW) - module toggles client component
- `src/app/actions/tenant-modules.ts` (NEW) - server action to update tenant module preferences
- `src/app/dashboard/components/sidebar/sidebarNavigation.ts` (MODIFY) - dynamic module navigation filtering
- `src/app/dashboard/components/sidebar/Sidebar.tsx` (MODIFY) - pass enabled modules to navigation generator
- `src/app/dashboard/settings/permissions/components/RoleFormDrawer.tsx` (MODIFY) - dynamically filter permission groups by active modules

## Data / contracts

- `BusinessArchetype`: `'import_resale' | 'boutique_fashion' | 'wholesale_distributor' | 'general_pos' | 'custom'`
- `BusinessModuleKey`: `'shipments' | 'batches' | 'suppliers' | 'storefront' | 'profitability' | 'intelligence'`
- `tenant_settings` table additions:
  - `business_archetype text NOT NULL DEFAULT 'import_resale'`
  - `enabled_modules text[] NOT NULL DEFAULT ARRAY['storefront', 'profitability', 'intelligence']::text[]`
- `SelfServiceSignupPayload`:
  - `fullName: string`
  - `email: string`
  - `password: string`
  - `phone: string`
  - `storeName: string`
  - `slug: string`
  - `currency: string`
  - `city: string`
  - `archetype: BusinessArchetype`
  - `customModules?: BusinessModuleKey[]`

## Testing

- Logic gate: `yarn test` runs Vitest. Pure functions in `src/utils/business-modules.ts` and `src/app/actions/signup.ts` will have 100% test coverage.
- Typecheck gate: `yarn check` (`tsc --noEmit`) must remain clean.
- Lint gate: `yarn lint` (`eslint src`) must pass without warnings.
- Browser test: Browser verification of `/signup` multi-step progression, archetype selection, and `/dashboard/settings/modules` toggling.
