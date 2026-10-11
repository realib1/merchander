# Current Feature

## Title
UI Primitives Alignment with Design System Specifications

**Type:** Fix  
**Status:** verified  

---

### The problem
While `globals.css` and the navigation sidebar were aligned in the previous fix, core UI primitives in `src/components/ui/` continue to diverge from the specifications in `docs/design_systems_extracted/Merchander Design System.dc.html`:
1. **Buttons & Controls (`Button.tsx`, `FormField.tsx`):**
   - Design System §06 mandates controls 36px high (`h-9`), whereas `Button` sizes were oversized (`sm: 40px`, `md: 48px`, `lg: 56px`) and `FormField` used 40px (`h-10`).
   - Design System §04 mandates 8px radius (`rounded-lg`) for controls ("Radius — three values: 8 control, 12 card, full pill"), whereas `Button` used `rounded-md` (6px) and `FormField` used `rounded-xl` (12px).
   - Primary button fill requires Orange 700 (`oklch(0.55 0.19 46)` / `bg-primary`) with white text (clearing 5.2:1 contrast) and 3px orange focus ring (`focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2`).
2. **Cards & Elevation (`Card.tsx`):**
   - Design System §04 & §09 mandate "Borders, not shadows: in-page panel — 1px border, no shadow". `Card` currently adds `shadow-md` on `elevated` and `interactive` variants.
   - Radius must be strictly 12px (`rounded-xl`), padding 20px (`p-5`).
   - `CardTitle` should use `font-heading` (Plus Jakarta Sans, 20px / 700) and `CardDescription` 13px (`text-[13px] text-muted-foreground`).
3. **Status Badges (`Badge.tsx`):**
   - Design System §06 status pills specify text carrying meaning, color confirming it: 12px font-weight 600 (`text-xs font-semibold`), 6px indicator dot (`w-1.5 h-1.5 rounded-full`), `px-2.5 py-1` padding, and `rounded-full`.
   - Badges must map cleanly to the 5 semantic states (Success/Paid, Warning/Pending, Destructive/Failed, Info/Draft, Neutral/Cancelled) with exact OKLCH tokens and dark mode counterparts.
4. **Data Tables & Overlays (`DataTable.tsx`, `Modal.tsx`):**
   - Design System §06 requires table rows with 44px min-height (`min-h-[44px]`), 11px uppercase header cells (`text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground`), container radius 12px (`rounded-xl`), and tabular numbers right-aligned.
   - `Modal` should enforce 12px radius (`rounded-xl`) and overlay-specific elevation (`shadow-2xl`).

---

### The fix
Refactor the reusable UI components in `src/components/ui/` to precisely match the design system tokens, heights, radii, and semantic states while preserving prop interfaces and full backward compatibility:
- Standardize control heights to 36px (`h-9`), radius to 8px (`rounded-lg`), and focus rings to 3px orange with 2px offset (`focus-visible:ring-[3px] focus-visible:ring-brand-primary focus-visible:ring-offset-2`).
- Synchronize `--brand-primary` with the official Merchander logo mark (`stroke="#FC5100"` / `#FC5100`) across light and dark modes, restoring vibrant flame orange buttons and consistent focus rings.
- Eliminate in-page shadows on `Card.tsx`, enforcing 1px borders and 12px card radii.
- Refine `Badge.tsx` into design system status pills with 6px status dots and verified semantic color ramps.
- Update `DataTable.tsx` for 44px rows, 11px uppercase column headers, and 12px container radius.
- Ensure all components render cleanly in both light and dark navy modes.

---

### Build steps

#### [x] Step 1: Controls & Form Primitives (`Button.tsx`, `FormField.tsx`, `Checkbox.tsx`, `Switch.tsx`)
- In `Button.tsx`:
  - Update `SIZE_STYLES` so standard `md` is 36px high (`h-9 px-4 text-sm min-h-9`), `sm` is 32px (`h-8 px-3 text-xs min-h-8`), and `lg` is 40px (`h-10 px-5 text-sm min-h-10`).
  - Set control radius to `rounded-lg` (8px).
  - Update focus ring to `focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2`.
  - Ensure variant colors match the design system: primary uses `bg-primary text-white hover:bg-primary/90 font-semibold`, outline uses `border border-border bg-card text-foreground hover:bg-muted`, ghost uses `bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground`, destructive uses `bg-destructive text-white hover:bg-destructive/90`.
- In `FormField.tsx`:
  - Set default input height to 36px (`h-9`) with `rounded-lg` (8px).
  - Set label to 13px font-semibold (`text-[13px] font-semibold text-foreground`).
  - Set helper text and error messages to 12px (`text-xs`).
  - Update focus ring to `focus-visible:ring-3 focus-visible:ring-primary/40 focus-visible:ring-offset-1`.
- In `Checkbox.tsx` & `Switch.tsx`:
  - Ensure focus ring and active colors use `brand-primary` / `primary` without extraneous borders.
- **Done when:** `Button` and `FormField` controls render at 36px height with 8px radius and 3px orange focus rings, and `yarn check` + `yarn test` pass.

#### [x] Step 2: Surface, Status & Data Primitives (`Card.tsx`, `Badge.tsx`, `DataTable.tsx`, `Modal.tsx`)
- In `Card.tsx`:
  - Enforce "borders, not shadows": remove `shadow-md` from `elevated` and `interactive` variants (in-page panels use 1px border and no shadow).
  - Enforce 12px radius (`rounded-xl`) and 20px padding (`p-5`).
  - Set `CardTitle` font to `font-heading font-bold text-xl` (20px / 700).
  - Set `CardDescription` to `text-[13px] text-muted-foreground`.
- In `Badge.tsx`:
  - Enforce full pill radius (`rounded-full`), `px-2.5 py-1` padding, and `text-xs font-semibold`.
  - Ensure 6px dot indicator (`w-1.5 h-1.5 rounded-full`) is properly supported and styled for all variants: `success`, `warning`, `destructive`, `info`, and `default`/`neutral`.
- In `DataTable.tsx`:
  - Set container radius to `rounded-xl` (12px).
  - Set table header cells to `text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground bg-muted/40`.
  - Set data rows to minimum height of 44px (`min-h-[44px]`).
- In `Modal.tsx`:
  - Ensure dialog container enforces 12px radius (`rounded-xl`), overlay shadow (`shadow-2xl`), and header title uses `font-heading font-semibold text-lg`.
- **Done when:** Cards and data tables render with clean 1px borders and no in-page shadows, badges display standardized 6px dots and semantic styles, table rows meet 44px minimum height, and `yarn check` + `yarn test` pass.

---

### Verify
1. **Typecheck & Tests:**
   - Run `yarn check` (`tsc --noEmit`) to verify zero TypeScript errors.
   - Run `yarn test` (`vitest run`) to verify all 786+ unit tests pass.
   - Run `yarn lint` to ensure zero ESLint errors or warnings.
2. **Visual Inspection:**
   - Run `yarn dev` and inspect dashboard screens (Overview, Orders, Payments, Settings).
   - Check buttons: 36px height, 8px radius, crisp 3px orange focus outline on keyboard tab.
   - Check status badges: full pill with 6px semantic dot indicator.
   - Check cards & tables: border-driven elevation without muddy box shadows, 12px corner radius.
   - Check dark mode: surfaces, borders, and controls retain proper contrast.
