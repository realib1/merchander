# Fix: Optimize Auth Hero Images and Next.js Image Config

**Type:** Fix  
**Status:** completed  

## The Problem
The Sign In and Sign Up desktop hero images were stored as uncompressed PNG files:
- `public/images/auth/signin-hero.png` was **2.05 MB**
- `public/images/auth/signup-hero.png` was **1.70 MB**

PNG is suboptimal for photographic imagery, creating unnecessary repository bloat and slow cold-cache load times. Additionally, `next.config.ts` did not configure modern format negotiation (`image/avif`, `image/webp`), and the `<Image />` components did not utilize `placeholder="blur"` for progressive loading.

## The Fix
1. **Convert Hero Images to High-Efficiency WebP**:
   - Converted `signin-hero.png` to `signin-hero.webp` (133 KB, a **93.3% reduction**).
   - Converted `signup-hero.png` to `signup-hero.webp` (93 KB, a **94.4% reduction**).
   - Removed legacy uncompressed PNG files from the repository.
2. **Update Auth Page Components**:
   - Updated `src/app/login/page.tsx` to import `signinHero` from `signin-hero.webp` and added `placeholder="blur"`.
   - Updated `src/app/signup/page.tsx` to import `signupHero` from `signup-hero.webp` and added `placeholder="blur"`.
3. **Configure Modern Image Formats in Next.js**:
   - Added `formats: ['image/avif', 'image/webp']` to `next.config.ts` images configuration.
4. **Preserve Responsive Layout & Accessibility**:
   - Maintained `priority`, `fill`, `sizes="50vw"`, `object-cover`, and accessible alt text.

## Build Steps
- [x] **Step 1: Convert Images, Update Auth Pages, and Configure Next.js Formats**:
  - Generate optimized WebP hero images using `sharp` and remove old PNG files.
  - Update imports and add `placeholder="blur"` in `src/app/login/page.tsx` and `src/app/signup/page.tsx`.
  - Add `formats: ['image/avif', 'image/webp']` to `next.config.ts`.
  - _Done when:_ `yarn check`, `yarn lint`, `yarn test`, and `yarn build` pass cleanly.

## Verification
- Verified file sizes of `public/images/auth/*`: total hero size reduced from 3.76 MB to 226 KB (>93% savings).
- `yarn check`: passed with 0 errors.
- `yarn lint`: passed with 0 errors, 0 warnings.
- `yarn test`: 81 files passed, 719 tests passed.
- `yarn build`: 59 routes compiled & optimized in 7.2s with Turbopack.
