# Feature 31c: Signup Credential Confirmation & Validation

**From build-plan:** 31c
**Branch:** feature/signup-credential-validation
**Status:** verified

## Goal

Strengthen the merchant signup credentials step (`/signup` Step 1) by adding a password confirmation field with real-time match validation and a mandatory terms of service & privacy agreement checkbox. This prevents typos in new merchant passwords and ensures legal terms acceptance before progressing to store setup.

## Design reference

- **Component**: `src/app/signup/components/StepAccountCredentials.tsx`
- **Wizard Hook**: `src/app/signup/components/useSignupWizard.ts`
- **Design Tokens**: Standard Merchander design tokens (`brand-primary`, `accent-brand-primary`, `border-separator`, `text-muted`, `text-destructive`, `text-success`).

## In scope

1. **Pure Signup Validation Utilities (`src/utils/signup-validation.ts`)**:
   - Pure, SSR-safe validation helper `validateCredentialsStep({ fullName, email, phone, password, confirmPassword, termsAccepted })`.
   - Checks:
     - Full name present.
     - Email non-empty and valid email format.
     - Phone number present.
     - Password at least 8 characters.
     - Confirm password matches password exactly.
     - Terms and privacy agreement checkbox is checked (`termsAccepted === true`).
   - Unit tests in `src/utils/signup-validation.test.ts` covering valid inputs and each failure branch with clear error messages.
2. **Signup Wizard Hook Integration (`src/app/signup/components/useSignupWizard.ts`)**:
   - Add `confirmPassword` (string) and `termsAccepted` (boolean) state to `useSignupWizard`.
   - Update `validateCurrentStep()` on step 1 to call `validateCredentialsStep()`.
   - Clear and surface step validation error via `formError`.
3. **StepAccountCredentials UI Component (`src/app/signup/components/StepAccountCredentials.tsx`)**:
   - Add "Confirm password" field with show/hide password toggle.
   - Provide real-time match feedback when `confirmPassword` is non-empty (e.g. green indicator on match, red error message when mismatching).
   - Add "Terms of Service and Privacy Policy" agreement checkbox with links.
   - Wire props through `SignupWizardClient.tsx`.
   - Keep `StepAccountCredentials.tsx` strictly under 150 LOC.

## Out of scope

- Changing backend Supabase auth parameters or `selfServiceSignupAction` payload (password confirmation is verified on client before dispatching `selfServiceSignupAction`).
- Custom terms and conditions per merchant store (this is for platform merchant signup).
- Modifying subsequent wizard steps (business profile, archetype selection, launch).

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Signup Credentials Validation Utilities & Tests** - Create `src/utils/signup-validation.ts` with pure validation logic for name, email, phone, password length, password match, and terms acceptance. Write comprehensive unit tests in `src/utils/signup-validation.test.ts`. *Done when:* `yarn test src/utils/signup-validation.test.ts` passes with 100% coverage and `yarn check` passes.
- [x] **Step 2 - UI Integration & Verification** - Add `confirmPassword` and `termsAccepted` to `useSignupWizard.ts`, wire into `StepAccountCredentials.tsx` and `SignupWizardClient.tsx` with real-time feedback and terms checkbox, keeping `StepAccountCredentials.tsx` < 150 LOC. *Done when:* `/signup` Step 1 enforces matching passwords and terms acceptance before proceeding, real-time match indicator reflects typing, component is < 150 LOC, and `yarn check`, `yarn lint`, `yarn test`, and `yarn build` pass with 0 errors.

## Files / areas

- `src/utils/signup-validation.ts` (NEW) - pure validation helpers for signup credentials step
- `src/utils/signup-validation.test.ts` (NEW) - unit tests for credential validation
- `src/app/signup/components/SignupCredentialInput.tsx` (NEW) - decomposed accessible input subcomponent with independent password toggle
- `src/app/signup/components/useSignupWizard.ts` (MODIFY) - state for confirmPassword and termsAccepted, validation wiring
- `src/app/signup/components/StepAccountCredentials.tsx` (MODIFY) - confirm password field, real-time match indicator, terms agreement checkbox
- `src/app/signup/components/SignupWizardClient.tsx` (MODIFY) - prop plumbing between hook and step component

## Data / contracts

- `validateCredentialsStep` signature:
  ```ts
  export interface CredentialsStepInput {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    termsAccepted: boolean;
  }

  export interface ValidationResult {
    isValid: boolean;
    error?: string;
  }
  ```

## Testing

- Automated: `yarn test src/utils/signup-validation.test.ts` tests all validation rules (empty name/email/phone, short password, mismatched passwords, unaccepted terms, valid data).
- Typecheck: `yarn check` passes with 0 errors.
- Lint: `yarn lint` passes with 0 errors.
- Manual check:
  1. Open `/signup`. Enter name, email, phone, password. Leave confirm password empty -> click Continue -> blocked with error.
  2. Type mismatching confirm password -> observe real-time mismatch warning -> click Continue -> blocked.
  3. Type matching confirm password -> observe match indicator -> uncheck terms -> click Continue -> blocked.
  4. Check terms -> click Continue -> smoothly transitions to Step 2 (Store Setup).

## Notes for the AI

- Maintain component size strictly under 150 LOC for `StepAccountCredentials.tsx`.
- Never submit passwords or confirmations to unauthenticated third-party APIs.
- Keep the real-time match indicator unintrusive (only display mismatch once the user has begun typing into the confirmation field).
