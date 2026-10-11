# Fix: Design System Alignment from Extracted Specifications (@design_systems_extracted)

## Overview
- **Type:** Fix
- **Status:** verified
- **Scope:** Global CSS tokens, dark mode navy surfaces, typography scale enforcement, sidebar navigation 4-group restructure, and elevation/shadow cleanup

## The Problem
The dashboard implementation has diverged from the locked design foundations documented in `docs/design_systems_extracted/Merchander Design System.dc.html`:
1. **Divergent Color & Surface Tokens (`src/app/globals.css`):**
   - Contains retired prototype tokens (`--color-brand-emerald`, `--color-brand-amber`, `--color-brand-indigo`, `--shadow-glow`), allowing decorative card accents that violate §02 ("A hue on screen must mean a state, or it means nothing").
   - Dark mode uses generic slate/charcoal tones (`#111318`, `#181b22`) instead of the locked Navy surfaces (`oklch(0.18 0.02 260)` background, `oklch(0.22 0.02 260)` surface, `oklch(0.26 0.02 260)` elevated, `oklch(0.35 0.02 260)` separator/border).
   - In dark mode, text orange rules require orange 500 (`#FF6A00`) for text contrast on dark grounds (§08).
2. **Sub-Scale Typography & Noise (`globals.css`, `Sidebar.tsx`, `SidebarUserProfile.tsx`):**
   - The design system locks exactly six font steps: Display (44px), Metric (30px), Panel (20px), Body (15px), Small (13px), and Label/eyebrow (11px).
   - The dashboard chrome introduces sub-scale text sizes (`text-[8px]`, `text-[9px]`, `text-[10px]`) in sidebar badges, group labels, and user cards, creating visual clutter explicitly flagged for retirement in §03 and §09.
   - `Sidebar.tsx:129` contains a broken CSS utility class typo: `text- font-medium`.
3. **Sidebar Architecture & Density (`Sidebar.tsx`, `sidebarNavigation.ts`):**
   - Navigation currently spreads across 5 groups with 18 items. §07 mandates: "Four groups, six items maximum each. Staff and Settings leave the list and move to the account menu at the foot of the rail. Group labels at 11px, not 10. Active state: orange 700 text on orange 50 fill - drop the second right-edge indicator bar."
   - The sidebar container uses `backdrop-blur-xl` (scheduled for retirement in §09).
   - Active links display double active indicators: active background plus an unnecessary right-edge vertical bar.
4. **Card Elevation & Ambient Shadows (`MetricCard.tsx`):**
   - In-page cards use ambient box shadows (`shadow-2xs`, `shadow-xs`) and glow effects. §04 & §09 require: "borders, not shadows" for in-page panels; box shadows are strictly reserved for floating overlays (dialogs, menus, toasts).

## The Fix
1. **Design Tokens & Dark Mode Hierarchy (`src/app/globals.css`):**
   - Retire deprecated decorative tokens (`--color-brand-emerald`, `--color-brand-amber`, `--color-brand-indigo`, `--shadow-glow`).
   - Align dark mode surfaces to navy OKLCH tokens (`oklch(0.18 0.02 260)` background, `oklch(0.22 0.02 260)` surface, `oklch(0.26 0.02 260)` elevated, `oklch(0.35 0.02 260)` border).
   - Verify orange shades align with design system (§02): Orange 500 (`#FF6A00`) for graphics/focus rings and dark-mode text; Orange 700 (`oklch(0.55 0.19 46)`) for filled buttons and light-mode text.
2. **Sidebar Restructure & Typography Normalization (`Sidebar.tsx`, `sidebarNavigation.ts`, `SidebarUserProfile.tsx`):**
   - Restructure `navGroups` into exactly 4 groups: `COMMAND`, `COMMERCE & INVENTORY`, `FINANCES`, and `INTELLIGENCE` (all <= 6 items).
   - Remove `MANAGEMENT` from the main rail; provide Staff and Settings access through the account/profile area at the foot of the rail.
   - Remove `backdrop-blur-xl` on the sidebar rail.
   - Fix class typo `text- font-medium` to `text-sm font-medium`.
   - Normalize group headers to `text-[11px] font-bold tracking-wider uppercase`.
   - Remove the duplicate right-edge vertical active bar indicator.
   - Modernize nav active state to Orange 700 text on Orange 50 background (light) / Orange 500 text on subtle fill (dark).
   - Remove `text-[8px]`, `text-[9px]`, and `text-[10px]` sub-scale classes; replace with 11px uppercase or 12px pill badges.
3. **Elevation & Card Cleanup (`MetricCard.tsx`):**
   - Eliminate card ambient shadows in favor of clean 1px border (`border-separator`).
   - Align MetricCard title to 11px uppercase label and metric number to 30px display font.
4. **Regression & Test Safety:**
   - Update `src/app/dashboard/components/sidebar/sidebarNavigation.test.ts` to assert the 4 navigation groups and module filtering.
   - Ensure all 90 test suites and TypeScript checks pass.

## Build Steps
### Step 1: Design Tokens, Dark Mode Palette, and Elevation Alignment
- [x] In `src/app/globals.css`, retire prototype tokens (`--color-brand-emerald`, `--color-brand-amber`, `--color-brand-indigo`, `--shadow-glow`).
- [x] In `src/app/globals.css`, align dark mode background, surface, elevated, and separator tokens to the navy OKLCH specifications (§08).
- [x] In `src/components/ui/MetricCard.tsx`, remove ambient shadows (`shadow-2xs`), standardize on 1px border, 11px label, and 30px display metric value.
- **Done when:** `yarn check` passes, `globals.css` reflects the design system tokens, and `MetricCard.test.tsx` passes.

### Step 2: Sidebar 4-Group Restructure, Sub-Scale Typography Removal & Nav Cleanup
- [x] In `src/app/dashboard/components/sidebar/sidebarNavigation.ts`, consolidate navigation into 4 groups (`COMMAND`, `COMMERCE & INVENTORY`, `FINANCES`, `INTELLIGENCE`), removing the 5th `MANAGEMENT` group.
- [x] In `src/app/dashboard/components/sidebar/SidebarUserProfile.tsx` and `Sidebar.tsx`, provide direct Settings and Staff links in the footer/account section.
- [x] In `src/app/dashboard/components/Sidebar.tsx`, remove `backdrop-blur-xl`, fix class typo `text- font-medium`, remove right-edge indicator bar, and update active state styling.
- [x] Replace `text-[8px]`, `text-[9px]`, and `text-[10px]` with standardized 11px label or 12px pill badges in sidebar components.
- [x] Update `src/app/dashboard/components/sidebar/sidebarNavigation.test.ts` to match the 4 groups.
- **Done when:** `yarn test` passes all tests (including `sidebarNavigation.test.ts`), `yarn check` has 0 errors, and the sidebar renders the 4-group structure cleanly.

## Verify
- `yarn test`: all 90 test files and 785+ tests pass cleanly.
- `yarn check`: TypeScript typecheck passes with 0 errors.
- `yarn lint`: ESLint passes with 0 warnings or errors.
- Visual inspection: Dashboard sidebar displays 4 groups without sub-scale text, backdrop-blur, or double active indicators.
