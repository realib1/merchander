# Fix: Signup UI Consistency and Card Styling for Step 1

**Type:** Fix  
**Status:** verified  

---

## The Problem

In `src/app/signup/components/SignupWizardClient.tsx`, Step 1 conditionally rendered with an unstyled wrapper (`className="w-full"`), lacking the card background, border, rounded corners, and shadow that Steps 2, 3, and 4 have (`bg-surface rounded-2xl border border-separator shadow-xl p-5 sm:p-7`).

This caused:
1. **Visual inconsistency**: Step 1 looked disconnected and uncontained compared to subsequent steps.
2. **Width jumping**: Step 1 constrained to `max-w-md` jumped to `max-w-xl` when navigating between Step 1 and Step 2.
3. **Responsive misalignment**: The top logo lockup and card borders did not align smoothly across viewports.

---

## The Fix

1. **Unify Card Styling**: Made the card container (`bg-surface rounded-2xl border border-separator shadow-xl p-5 sm:p-7`) unconditional across all 4 steps in `SignupWizardClient.tsx`.
2. **Consistent Container Sizing**: Standardized the wizard container on `w-full max-w-xl mx-auto` across all steps so the wizard does not shift width between steps.
3. **Align Header & Layout in `SignupPage`**: Aligned the top logo lockup and bottom spacer in `src/app/signup/page.tsx` to `max-w-xl` for seamless visual alignment across viewports.
4. **Preserve LOC & Component Limits**: Kept every component strictly under 150 LOC (`SignupWizardClient.tsx` at 88 LOC) and ensured zero regressions in tests, lint, or typecheck.

---

## Build Steps

- [x] **Step 1: Apply consistent card background, border, and container width to all signup steps**  
  Update `SignupWizardClient.tsx` to render `bg-surface rounded-2xl border border-separator shadow-xl p-5 sm:p-7` unconditionally across steps 1 through 4, standardize container width at `max-w-xl`, and align `SignupPage`'s logo lockup.  
  *Done when:* Step 1 renders with the identical card background, border, padding, and shadow as Steps 2–4, container width is stable across transitions, and `yarn check`, `yarn lint`, and `yarn test` pass cleanly.

---

## Verify

1. Run `yarn check` and `yarn lint` to confirm zero type or lint regressions. (Passed with 0 errors/warnings)
2. Run `yarn test` to confirm all 75 test suites remain green. (75/75 files passed, 657/657 tests green)
3. Verified `/signup` in browser at 375px (mobile) and 1280px (desktop): confirmed Step 1 card has background, border, shadow, and padding identical to Steps 2–4.
4. Verified smooth transition between Step 1 and Step 2 with no layout jumping or viewport scroll issues.
