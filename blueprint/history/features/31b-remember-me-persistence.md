# Feature 31b: Remember Me Persistence

**From build-plan:** 31b
**Branch:** feature/auth-remember-me
**Status:** verified

## Goal

Enable client-side persistence of the user login identifier (email or phone number) on `/login` across browser sessions. When a user checks "Remember me" and logs in, store their identifier safely in client storage. Upon subsequent visits to `/login`, prefill the identifier field and check the "Remember me" box. If the user unchecks the box, clear the stored identifier upon form submission.

## Design reference

- **Component**: `src/app/login/components/LoginForm.tsx`
- **Design Tokens**: Standard Merchander design tokens (`brand-primary`, `accent-brand-primary`, `border-separator`, `text-muted`).

## In scope

1. **Pure Storage Utilities (`src/utils/remember-me.ts`)**:
   - `getRememberedIdentifier()`: Safely retrieves the stored login identifier from `localStorage`, with SSR protection and error handling.
   - `saveRememberedIdentifier(identifier: string)`: Safely stores the trimmed identifier in `localStorage`.
   - `clearRememberedIdentifier()`: Removes the stored identifier from `localStorage`.
   - Unit tests in `src/utils/remember-me.test.ts` verifying storage lifecycle.
2. **LoginForm Integration (`src/app/login/components/LoginForm.tsx`)**:
   - Add controlled `rememberMe` boolean state.
   - On component mount (`useEffect`), check for a remembered identifier and prefill `identifier` and `rememberMe = true`.
   - On form submission (`handleSubmit`), persist identifier if `rememberMe` is checked, or remove it if unchecked.
   - Keep component LOC strictly under 150 lines.

## Out of scope

- Storing authentication tokens or passwords in localStorage (tokens are managed via secure cookies by Supabase).
- Multi-account switcher / profile chooser.
- Signup confirmation & terms agreement (deferred to Feature 31c).

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Remember Me Persistence Utilities & Unit Tests** - Create `src/utils/remember-me.ts` with safe browser `localStorage` retrieval, persistence, and removal functions. Write unit tests in `src/utils/remember-me.test.ts`. *Done when:* `yarn test src/utils/remember-me.test.ts` passes with 100% coverage and `yarn check` passes.
- [x] **Step 2 - Integrate Remember Me into LoginForm & Verification** - Connect `rememberMe` state and mount prefill in `src/app/login/components/LoginForm.tsx`. Persist or clear storage upon form submission while keeping LOC < 150. *Done when:* Returning to `/login` with stored data prefills identifier and checks the box, unchecking and submitting clears storage, and `yarn check`, `yarn lint`, and `yarn test` pass with 0 errors.

## Files / areas

- `src/utils/remember-me.ts` (NEW) - pure storage helpers for remembered login identifier
- `src/utils/remember-me.test.ts` (NEW) - unit tests for remember-me utilities
- `src/app/login/components/LoginForm.tsx` (MODIFY) - wire controlled rememberMe state, mount prefill, and submission persistence

## Data / contracts

- Storage key: `'merchander_remembered_identifier'`
- Storage value: trimmed email string (e.g. `'merchant@example.com'`) or trimmed phone string (e.g. `'024 123 4567'`)
- Never stores passwords, secrets, or auth tokens.

## Testing

- Automated: `yarn test src/utils/remember-me.test.ts` tests get, save, clear, and SSR fallback.
- Typecheck: `yarn check` passes with 0 errors.
- Lint: `yarn lint` passes with 0 errors.
- Manual check:
  1. Open `/login`, type email `test@merchander.com`, check "Remember me", submit.
  2. Reload `/login` -> verify `test@merchander.com` is prefilled and "Remember me" is checked.
  3. Uncheck "Remember me", submit -> reload `/login` -> verify field is empty and checkbox is unchecked.

## Notes for the AI

- Always wrap `localStorage` access in try/catch and check `typeof window !== 'undefined'` for SSR safety.
- Strictly adhere to component size under 150 LOC for `LoginForm.tsx`.
