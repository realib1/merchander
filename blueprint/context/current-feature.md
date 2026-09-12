# Current Feature

> **Generated file.** Managed by `/fix`, `/implement`, and `/complete`.

## Title: NotFound component client boundary, theme token drift, and image DOM deduplication

**Type:** Fix
**Status:** verified
**Fixes:** F-07, F-08, F-09

---

## The problem

Three defects identified by `/audit @[src/app/not-found.tsx]` in `src/components/layout/NotFound.tsx`:

| ID | Severity | Summary |
|---|---|---|
| F-07 | P3 | Root NotFound component is marked `'use client'` despite zero client-side interactivity |
| F-08 | P3 | Hardcoded hex focus ring color (`#FC5302`) drifts from brand theme tokens |
| F-09 | P3 | Duplicate `<Image>` elements rendered in DOM for mobile and desktop viewports |

---

## The fix

In `src/components/layout/NotFound.tsx`:
1. Remove `'use client';` directive so `NotFound` and `src/app/not-found.tsx` render as zero-JS Server Components.
2. Replace `focus:ring-[#FC5302]` with `focus:ring-brand-primary` to restore design token alignment with `src/app/globals.css`.
3. Refactor the grid container layout to use responsive layout ordering so a single `<Image src="/images/404-woman.png" ... />` element serves both mobile and desktop viewports, eliminating redundant DOM nodes.

---

## Build steps

- [x] 1. Refactor NotFound component to Server Component with unified image layout and theme token alignment
  - Remove `'use client'` directive from `src/components/layout/NotFound.tsx`.
  - Replace `focus:ring-[#FC5302]` with `focus:ring-brand-primary`.
  - Consolidate the mobile (`md:hidden`) and desktop (`hidden md:flex`) image declarations into a single responsive `<Image>` component positioned with grid/flex layout order.
  - Done when: `src/components/layout/NotFound.tsx` has no `'use client'` directive, no hardcoded `#FC5302` token, a single `<Image src="/images/404-woman.png">` element, and passes `yarn check` and `yarn lint`.

---

## Verify

- `yarn check` (`tsc --noEmit`) passes with 0 errors.
- `yarn lint` (`eslint src`) passes with 0 warnings/errors.
- Visual layout on 404 page matches the design across mobile and desktop breakpoints without DOM duplication.

