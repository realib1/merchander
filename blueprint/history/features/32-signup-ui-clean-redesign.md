# Feature 32: Signup UI Clean Redesign (Cardless Wizard & Streamlined Step Flow)

**From build-plan:** 32
**Branch:** feature/signup-ui-clean-redesign
**Status:** verified

## Goal

Redesign the merchant `/signup` onboarding experience into a clean, cardless, edge-to-edge layout matching `/login` and `docs/image ref/signin-signup desktop.png`. Eliminate the heavy outer container box (`bg-surface`, `border`, `shadow-xl`) so form fields sit directly on the clean page background, replace the bulky step progress bar with a sleek, minimalist indicator, and polish all 4 wizard steps and navigation controls.

## Design reference

- **Image Reference**: [`docs/image ref/signin-signup desktop.png`](file:///c:/Users/sherohq/Documents/projects/web/merchander/docs/image%20ref/signin-signup%20desktop.png) (right side signup screen)
- **Sibling Route Reference**: [`src/app/login/page.tsx`](file:///c:/Users/sherohq/Documents/projects/web/merchander/src/app/login/page.tsx)
- **Design Tokens**: Standard Merchander design tokens (`brand-primary`, `bg-background`, `text-foreground`, `text-muted`, `border-separator`).

## In scope

1. **Cardless Container & Layout (`src/app/signup/page.tsx` & `src/app/signup/components/SignupWizardClient.tsx`)**:
   - Remove the heavy card wrapper (`bg-surface rounded-2xl border border-separator shadow-xl p-5 sm:p-7`).
   - Allow the wizard form content to sit directly on the clean `bg-background` canvas with max-w-md / max-w-xl container symmetry matching `/login`.
   - Update `page.tsx` padding, scrolling, and footer spacing.
2. **Minimalist Step Progress Header (`src/app/signup/components/SignupProgressHeader.tsx`)**:
   - Streamline the progress indicator into a slim, refined bar with a clean right-aligned step counter (e.g. `Step 1 of 4`).
   - Remove chunky pill badges and oversized headers.
3. **Wizard Steps Polish (Steps 1–4 & `WizardControls.tsx`)**:
   - Step 1 (`StepAccountCredentials.tsx`): Title, subtitle, clean inputs, and primary action button matching the right pane of `signin-signup desktop.png`.
   - Step 2 (`StepBusinessProfile.tsx`): Flat form fields with clear section typography.
   - Step 3 (`StepArchetypeSelection.tsx`): Flat, modern archetype selection tiles without nested card drop-shadows.
   - Step 4 (`StepReviewLaunch.tsx`): Clean review summary section and launch confirmation.
   - Navigation (`WizardControls.tsx`): Streamlined back/continue buttons anchored cleanly at the bottom of the step.
4. **Component Constraints**:
   - Every modified component must remain strictly under 150 LOC.

## Out of scope

- Modifying backend signup logic, Supabase database schemas, or `selfServiceSignupAction`.
- Changing login page styles or reset password flows.
- Adding third-party OAuth providers (e.g. Google auth button is a visual placeholder if present).

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Cardless Container & Streamlined Progress Header** - Remove the outer card container in `SignupWizardClient.tsx`, streamline `SignupProgressHeader.tsx` into a minimal progress bar with right-aligned step count, and polish layout in `src/app/signup/page.tsx`. *Done when:* `/signup` renders cardless directly on the background with a sleek progress header, and `yarn check` and `yarn lint` pass.
- [x] **Step 2 - Streamline Wizard Steps & Controls (Steps 1–4 & WizardControls)** - Refine `StepAccountCredentials.tsx`, `StepBusinessProfile.tsx`, `StepArchetypeSelection.tsx`, `StepReviewLaunch.tsx`, and `WizardControls.tsx` for cardless aesthetics, ensure all components stay < 150 LOC, and verify across full test suite and build. *Done when:* All 4 onboarding steps render cleanly without card encapsulation, step controls flow naturally, component line counts are < 150 LOC, and `yarn check`, `yarn lint`, `yarn test`, and `yarn build` pass with 0 errors.

## Files / areas

- `src/app/signup/page.tsx` (MODIFY) - clean layout container and spacing
- `src/app/signup/components/SignupWizardClient.tsx` (MODIFY) - remove outer card container, refine error banner
- `src/app/signup/components/SignupProgressHeader.tsx` (MODIFY) - sleek progress indicator with right step count
- `src/app/signup/components/StepAccountCredentials.tsx` (MODIFY) - title and action polish matching reference image
- `src/app/signup/components/StepBusinessProfile.tsx` (MODIFY) - clean cardless input grouping
- `src/app/signup/components/StepArchetypeSelection.tsx` (MODIFY) - flat archetype selector tiles
- `src/app/signup/components/StepReviewLaunch.tsx` (MODIFY) - clean review layout
- `src/app/signup/components/WizardControls.tsx` (MODIFY) - streamlined button bar

## Testing

- Automated: `yarn test` runs full unit test suite (84+ test files, 750+ tests).
- Typecheck: `yarn check` passes with 0 errors.
- Lint: `yarn lint` passes with 0 errors.
- Manual check:
  1. Open `/signup` on desktop and mobile: verify no heavy card container or drop-shadow wraps the form.
  2. Inspect Step 1: verify inputs sit directly on `bg-background` matching `/login`.
  3. Inspect progress indicator: verify sleek progress bar with right-aligned "Step X of 4".
  4. Step through Steps 2, 3, and 4: verify archetype tiles and review blocks render flat and clean without card nesting.

## Notes for the AI

- Maintain component size strictly under 150 LOC for all signup components.
- Preserve all existing form validation, state management, and backend submission capabilities.
