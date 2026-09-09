# Feature: Platform Merchant Provisioning ("Add Merchander")

**From build-plan:** feature 27
**Status:** verified

## Goal

Equip platform staff (SHERO internal operators) with an administrative workspace provisioning tool in `/platform/merchants` to create and configure a new merchant workspace ("Merchander") on demand for testing, VIP onboarding, and assisted partner setup. Automatically provisions the tenant workspace, owner account, primary branch, storefront, default settings, and subscription tier with immutable audit logging and a 1-click credential handoff card.

## Design reference

- Existing Platform Management Modals: `src/app/platform/security/components/StaffManagementClient.tsx` (staff provisioning modal) and `src/app/platform/merchants/components/MerchantsClient.tsx` (status and plan override modals).
- StudioGrid Pro & AdminCN Design Tokens: rounded-2xl surfaces, tabbed step indicator, monospace credentials summary box, and Ghanaian currency/phone formatting.
- Drawer Primitive: `src/components/ui/Drawer.tsx` slide-over layout for comfortable multi-section form inputs.

## In scope

1. **Pure Provisioning Utilities & Validation (`src/utils/`):**
   - `src/utils/merchant-provisioning.ts`:
     - `validateMerchantSlug(slug: string)`: validates URL safety (lowercase alphanumeric, hyphens, length 2–60, no leading/trailing hyphens).
     - `generateInitialPassword()`: generates a secure, readable temporary password (e.g., `Merchander-2026-xxxx`).
     - `validateOwnerEmail(email: string)`: validates email format.
     - `formatMerchantCredentials(details: {...})`: formats credentials and dashboard links into a clean message suitable for 1-click clipboard copy to send over WhatsApp/Email.
   - 100% branch coverage unit test suite in `src/utils/merchant-provisioning.test.ts`.

2. **Server Action for Merchant Provisioning (`src/app/actions/platform.ts`):**
   - `createMerchanderAction(payload: CreateMerchanderPayload)`:
     - Least-privilege RBAC guard: requires caller to be active platform staff with role `platform_owner`, `platform_admin`, or `operations`.
     - Strict role separation invariant: explicitly verifies the owner email is not in `platform_staff_users` to prevent privilege confusion.
     - Unique slug validation against `storefront_settings`.
     - Auth user provisioning via Supabase Admin API (`adminSupabase.auth.admin.createUser`) with email confirmed.
     - Complete atomic workspace setup:
       - `tenants`: creates the workspace record.
       - `tenant_users`: links the user to the tenant with `role: 'owner'`.
       - `stores`: provisions primary branch ("Main Branch", location: Accra/custom).
       - `tenant_settings`: stores trading name, business contact, country (`GH`), and `settings_data` (including `business_type`, `enabled_modules`, `platform_status: 'active'`).
       - `storefront_settings`: stores store name, subdomain slug, currency (`GHS`), and default active theme.
       - `tenant_subscriptions`: provisions selected tier (or defaults to 14-day trial on Growth) with monthly cycle.
     - Platform audit logging: writes `action: 'PROVISION_MERCHANT'` to `platform_audit_logs`.
     - Revalidates `/platform` and `/platform/merchants`.
   - Unit tests in `src/app/actions/platform-provisioning.test.ts`.

3. **Platform UI & "Add Merchander" Drawer (`src/app/platform/merchants/`):**
   - `src/components/ui/Drawer.tsx`: Reusable accessible slide-over Drawer primitive.
   - `src/app/platform/merchants/components/AddMerchanderDrawer.tsx` and `src/app/platform/merchants/components/provisioning/`:
     - Multi-section provisioning form:
       - **Business Details**: Store Name, Subdomain Slug (with real-time slug preview: `[slug].merchander.app`), Primary City.
       - **Business Archetype & Modules**: 1-click archetype selector (Grocery & Retail, Importer & Pre-Orders, Social Boutique) with modular feature checkboxes.
       - **Owner Account**: Full Name, Email, WhatsApp Phone (`+233...`), Initial Password (with "Generate random password" option).
       - **Plan Tier**: Selector from active commercial plans in `platform_plans`.
     - Post-Creation Success Card:
       - Shows workspace details, assigned tier, and owner login credentials.
       - 1-Click "Copy Credentials for Merchant" button.
       - Direct link to inspect in merchant context (`/platform/merchants/[id]`).
   - `src/app/platform/merchants/components/MerchantsClient.tsx`:
     - Mount "+ Add Merchander" primary action button in header (active for `platform_owner`, `platform_admin`, `operations`).
     - Inserts the newly created tenant directly into the local state so the table updates immediately without full page reload.

## Out of scope

- Public unauthenticated `/signup` page (deferred to Feature 28).
- Automated live WhatsApp Cloud API welcome message dispatch via Meta (credentials copied by operator or sent via standard invite).
- Billing payment gateway checkout for the initial platform provisioning.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Pure merchant provisioning utilities & unit tests** - Create `src/utils/merchant-provisioning.ts` with slug validation, temporary password generation, and credentials message formatting, backed by comprehensive unit tests in `src/utils/merchant-provisioning.test.ts`. *Done when:* `yarn test src/utils/merchant-provisioning.test.ts` passes with 100% branch coverage.
- [x] **Step 2 - Server action for merchant provisioning & role-separation guards** - Implement `createMerchanderAction` in `src/app/actions/platform.ts` enforcing RBAC (`platform_owner`, `platform_admin`, `operations`), platform staff email rejection, auth user creation, workspace initialization (`tenants`, `tenant_users`, `stores`, `tenant_settings`, `storefront_settings`, `tenant_subscriptions`), and audit logging, backed by `src/app/actions/platform-provisioning.test.ts`. *Done when:* Unit tests pass verifying RBAC checks, staff email rejection, slug collision handling, and tenant data creation.
- [x] **Step 3 - Add Merchander Modal & Platform Console integration** - Create `src/app/platform/merchants/components/AddMerchanderModal.tsx` with business identity inputs, archetype presets, owner credentials, and post-creation copyable card, and integrate into `src/app/platform/merchants/components/MerchantsClient.tsx` and `src/app/platform/merchants/page.tsx`. *Done when:* Platform operators can open the modal, provision a new merchant workspace, view immediate table updates, and copy login credentials, with `yarn check`, `yarn lint`, and `yarn test` passing cleanly.

## Files / areas

- `src/utils/merchant-provisioning.ts` (NEW) - pure slug validation, password generator, credential formatter
- `src/utils/merchant-provisioning.test.ts` (NEW) - unit tests for provisioning utilities
- `src/types/platform.ts` (MODIFY) - types for merchant creation payload and response
- `src/app/actions/platform.ts` (MODIFY) - `createMerchanderAction` server action
- `src/app/actions/platform-provisioning.test.ts` (NEW) - unit tests for provisioning action
- `src/components/ui/Drawer.tsx` (NEW) - reusable accessible slide-over Drawer primitive
- `src/components/ui/index.ts` (MODIFY) - export Drawer
- `src/app/platform/merchants/components/AddMerchanderDrawer.tsx` (NEW) - provisioning drawer with sticky footer
- `src/app/platform/merchants/components/AddMerchanderModal.tsx` (MODIFY) - re-export AddMerchanderDrawer for backwards compatibility
- `src/app/platform/merchants/components/provisioning/` (NEW) - single-responsibility provisioning subcomponents
- `src/app/platform/merchants/components/MerchantsClient.tsx` (MODIFY) - add "+ Add Merchander" button and state update
- `src/app/platform/merchants/page.tsx` (MODIFY) - pass current staff role to client for permission gating

## Data / contracts

- `CreateMerchanderPayload`:
  ```ts
  {
    name: string;
    slug: string;
    ownerEmail: string;
    ownerName?: string;
    ownerPhone?: string;
    password?: string;
    tier: PlatformTier;
    billingCycle?: 'monthly' | 'annual';
    businessType?: 'grocery' | 'importer' | 'boutique' | 'general';
    enabledModules?: Record<string, boolean>;
    branchName?: string;
    city?: string;
  }
  ```
- Strict Role Separation: if `email` exists in `platform_staff_users`, action returns `{ error: 'Cannot provision a merchant using an active platform staff email.' }`.
- Audit Log Action: `PROVISION_MERCHANT` with target type `tenant`.

## Testing

- Logic unit tests: `yarn test src/utils/merchant-provisioning.test.ts`
- Action unit tests: `yarn test src/app/actions/platform-provisioning.test.ts`
- Full test suite: `yarn test`
- Type safety: `yarn check` (`tsc --noEmit`)
- Linter: `yarn lint` (`eslint src`)

## Notes for the AI

- Follow the Blueprint testing gate: pure logic in `src/utils/` must ship with passing tests in the same diff.
- Keep platform staff RBAC tight: check `verifyPlatformStaff(['platform_owner', 'platform_admin', 'operations'])` before any database mutations.
- Never log raw passwords in audit trails or console logs.
- Support both dark and light modes using existing surface/separator/brand tokens.
