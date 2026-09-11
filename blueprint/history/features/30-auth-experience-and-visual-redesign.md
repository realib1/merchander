# Feature 30: Auth Experience & Visual Redesign (Login & Signup)

**Status:** Completed  
**Completed Date:** 2026-09-11  
**Branch:** feature/auth-ui-redesign  

---

## What Changed

1. **Login Experience (`/login`)**:
   - Implemented a 50/50 split-screen desktop layout matching reference designs with lifestyle merchant hero photography (`/images/auth/signin-hero.png`).
   - Added mobile brand curve accent SVG in bottom right corner.
   - Enhanced `LoginForm`:
     - Email or Ghanaian phone number identifier input (`024 123 4567`).
     - Password reveal toggle (Eye / EyeOff).
     - Remember me and Forgot password options.
     - Preserved multi-factor authentication (MFA) challenge flow.

2. **Signup Experience (`/signup`)**:
   - Implemented 50/50 split-screen desktop layout matching reference designs with hero photography (`/images/auth/signup-hero.png`).
   - Added mobile brand curve accent SVG.
   - Refactored `SignupWizardClient` from an oversized 662 LOC monolith into modular, single-responsibility components under `src/app/signup/components/`:
     - `SignupProgressHeader.tsx` (45 LOC): segmented progress bar and step status.
     - `StepAccountCredentials.tsx` (123 LOC): account creation fields and login link.
     - `StepBusinessProfile.tsx` (99 LOC): store name, `.merchander.store` subdomain preview, currency, and operational city.
     - `StepArchetypeSelection.tsx` (117 LOC): business archetype cards and custom module matrix.
     - `StepReviewLaunch.tsx` (105 LOC): workspace confirmation and 14-day free access banner.
     - `WizardControls.tsx` (61 LOC): back, continue, and launch workspace actions.
     - `useSignupWizard.ts` (124 LOC): clean state management and validation hook.
     - `SignupWizardClient.tsx` (88 LOC): lightweight orchestrator component.
   - Unified card container styling (`bg-surface rounded-2xl border border-separator shadow-xl p-5 sm:p-7`) and `max-w-xl` width across all steps.

---

## Verification

- `yarn check`: 0 errors.
- `yarn lint`: 0 errors, 0 warnings.
- `yarn test`: 75/75 files passed (657/657 tests green).
- Live endpoints tested: `http://localhost:3000/login` (200 OK), `http://localhost:3000/signup` (200 OK).
- All components strictly adhere to `< 150 LOC`.
