# Fix: UI Tokens, Typography & Help Center Modernization (Issues 4, 5, 11, 12, 15)

## Overview
- **Type:** Fix
- **Status:** verified
- **Scope:** Markdown Rendering, Native Select Font Inheritance, Button/Input Height Sync, and Business Modules Card Layout

## The Problem
1. **Issue 12 (Help Markdown Rendering):** The `/dashboard/help` page displays guide articles using an incomplete homegrown parser that fails on nested lists, tables, links, and blockquotes.
2. **Issue 11 (Native Select Serif Font):** On Windows, native `<select>` and `<option>` elements in settings pages (currency, language, privacy, profile) default to Times New Roman (Serif) because `globals.css` does not explicitly force `font-family: inherit` on form control children.
3. **Issue 15 (Button vs Input Height Mismatch):** `Button` size `md` sets `h-10 min-h-11` (44px), while `FormField` inputs use `py-2` (~38-40px). When placed side-by-side in forms and filter bars, buttons are visibly taller than companion text inputs.
4. **Issues 4 & 5 (Business Modules Layout & Density):** In `/dashboard/settings/modules`, modules are rendered as a dense, unorganized flat list with ad-hoc nested `div`s rather than cohesive design system `<Card>` components grouped by business domain.

## The Fix
1. **Rich Markdown Rendering (Issue 12):**
   - Upgrade `src/components/ui/MarkdownRenderer.tsx` using `react-markdown` and `remark-gfm` with full support for headings, formatted lists, GitHub tables, code blocks, blockquotes, and external links.
2. **Universal Form Font Inheritance (Issue 11):**
   - In `src/app/globals.css`, add explicit font-family inheritance in `@layer base` for `input`, `select`, `option`, `optgroup`, and `textarea`.
3. **Button & Input Height Alignment (Issue 15):**
   - In `src/components/ui/Button.tsx`, normalize `md` size to `h-10 min-h-10` (40px) and ensure `FormField.tsx` enforces `h-10` on single-line inputs for exact pixel alignment.
4. **Business Modules Categorical Cards (Issues 4 & 5):**
   - In `src/app/dashboard/settings/modules/components/ModuleCustomizerClient.tsx`, organize modules into 3 structured `<Card>` sections:
     - **Supply Chain & Logistics** (`shipments`, `batches`, `suppliers`)
     - **Digital Commerce & Automation** (`storefront`, `intelligence`)
     - **Financial Margins** (`profitability`)
   - Add clean category headers, descriptions, and sleek toggle cards.
5. **Unit Tests:**
   - Add test coverage in `src/components/ui/MarkdownRenderer.test.tsx` verifying rendered output for headings, lists, tables, and code snippets.

## Build Steps
### Step 1: Implement Rich Markdown, Font Inheritance, Height Sync, and Module Cards
- [x] Update `src/components/ui/MarkdownRenderer.tsx` with `react-markdown` and `remark-gfm`.
- [x] Update `src/app/globals.css` with font inheritance for selects and options.
- [x] Update `src/components/ui/Button.tsx` and `src/components/ui/FormField.tsx` to align on `h-10` (40px).
- [x] Refactor `ModuleCustomizerClient.tsx` into categorical `<Card>` sections.
- [x] Create unit test suite in `src/components/ui/MarkdownRenderer.test.tsx`.
- **Done when:** `yarn test` passes all tests, `yarn check` and `yarn lint` report 0 errors, and `/dashboard/help` renders rich formatted markdown with proper typography.

## Verify
- `yarn test`: verify all unit tests pass including the new MarkdownRenderer test suite.
- `yarn check`: TypeScript typecheck passes with 0 errors.
- `yarn lint`: ESLint passes with 0 errors, 0 warnings.
- `yarn build`: Next.js production build completes successfully.
