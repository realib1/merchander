# Fix: Unit Tests for Color Utilities & Vercel Yarn 4 Repair

**Type:** Fix
**Status:** verified
**Fixes:** F-10, F-11

## The problem

The utility module `src/utils/color.ts` provides pure functions for hex code validation (`isValidHex`), 3-digit to 6-digit hex expansion (`normalizeHex`), and YIQ perceptual brightness contrast calculation (`getContrastTextColor`). While used for brand colors and accessibility across themes and dynamic backgrounds, the module lacked a companion `src/utils/color.test.ts`.

Separately, Vercel deployments failed with exit code 1 because Vercel defaulted to legacy Yarn 1 (`v1.22.19`) which cannot parse Berry lockfile metadata (`__metadata: version: 10`), crashing when resolving platform-specific optional dependencies (`@rolldown/binding-openharmony-arm64`), and a stray `package-lock.json` was tracked in git (`F-11`).

## The fix

1. Created `src/utils/color.test.ts` using Vitest with 16 test cases asserting all functions in `src/utils/color.ts`.
2. Removed `package-lock.json` from git and vendored the Yarn 4 binary via `yarn set version 4.18.0 --yarn-path`, storing `.yarn/releases/yarn-4.18.0.cjs` and configuring `yarnPath` in `.yarnrc.yml`.

## Build steps

- [x] **Step 1 - Add unit test suite for color utilities** - Create `src/utils/color.test.ts` with comprehensive test coverage for `isValidHex`, `normalizeHex`, and `getContrastTextColor`.
- [x] **Repair F-11 - Remove package-lock.json and vendor Yarn 4 binary** - Remove stray package-lock.json from git, run `yarn set version 4.18.0 --yarn-path` to bundle `.yarn/releases/yarn-4.18.0.cjs`, and configure `yarnPath` in `.yarnrc.yml`.

## Verify

- `yarn -v`: Resolves cleanly to `4.18.0`.
- `yarn test src/utils/color.test.ts`: 16 tests passing.
- `yarn test`: 59 test files, 517 tests passing.
- `yarn check`: Zero TypeScript errors.
- `yarn lint`: Zero ESLint errors or warnings.

## Findings

### color-tests-and-vercel-repair/F-05 [P2] closed - sendChatMessage is a no-op that reports success

**File:** src/app/actions/conversations.ts:121
**Found:** 2026-09-03 by /audit (scope: full; lens: quality)
**Why it matters:** `sendChatMessage` called `revalidatePath` and returned success without persisting anything or calling any channel API.
**Suggested fix:** Wire to real outbound path or decommission fake composer.
**Resolution:** Closed on 2026-09-09 by /audit (scope: full). Re-examined `src/app/actions/conversations.ts` and confirmed `sendChatMessage` and `ChatStreamView.tsx` have been deleted. Merchant outbound responses are now handled via `approveAction` in `src/app/actions/approvals.ts` dispatching real WhatsApp messages with audit logging.

### color-tests-and-vercel-repair/F-06 [P3] closed - duplicate WhatsApp signature helper and unused outbound module

**File:** src/lib/channels/whatsapp/webhook.ts:11
**Found:** 2026-09-03 by /audit (scope: full; lens: quality)
**Why it matters:** `verifyWhatsAppSignature` duplicated `verifyMetaSignature`.
**Suggested fix:** Delete duplicate signature helper and wire outbound module.
**Resolution:** Closed on 2026-09-09 by /audit (scope: full). Re-examined `src/lib/channels/whatsapp/webhook.ts` and confirmed `verifyWhatsAppSignature` was deleted. Confirmed `sendOutboundWhatsAppMessage` in `src/lib/channels/whatsapp/service.ts` is actively wired and imported across `src/app/actions/approvals.ts`, `src/app/actions/fulfilment.ts`, `src/lib/payments/confirmation.ts`, and `src/lib/intelligence/outreach.ts`.

### color-tests-and-vercel-repair/F-07 [P3] closed - product.ts and waybill.ts logic has no unit tests

**File:** src/utils/product.ts:6
**Found:** 2026-09-03 by /audit (scope: full; lens: tests)
**Why it matters:** Pure logic in `product.ts` and `waybill.ts` had no unit tests.
**Suggested fix:** Add focused `*.test.ts` for both.
**Resolution:** Closed on 2026-09-09 by /audit (scope: full). Re-examined `src/utils/product.test.ts` (13 tests) and `src/utils/waybill.test.ts` (10 tests). Both test suites are green and cover stock summing, variant price ranges, SKU formatting, and dispatch slips.

### color-tests-and-vercel-repair/F-08 [P3] closed - customer message content written to application logs in cleartext

**File:** src/lib/intelligence/extract.ts:10
**Found:** 2026-09-03 by /audit (scope: full; lens: security)
**Why it matters:** Customer message content landed in platform application logs.
**Suggested fix:** Drop message body from log line; log sanitized metadata only.
**Resolution:** Closed on 2026-09-09 by /audit (scope: full). Re-examined `src/lib/intelligence/extract.ts:27-29` and confirmed `extractCartFromChat` logs only sanitized metadata (platform, external ID, message length, tenant ID) without customer message content or PII.

### color-tests-and-vercel-repair/F-11 [P0] closed - Vercel deployment fails due to Yarn Classic (v1.x) fallback and package-lock.json conflict

**File:** package.json:49
**Found:** 2026-09-09 by /audit (scope: deployment; lens: quality)
**Why it matters:** Vercel build runners default to Yarn 1 (`v1.22.19`) which cannot parse Yarn 4 Berry lockfiles, crashing on `@rolldown/binding-openharmony-arm64` resolution.
**Suggested fix:** Remove `package-lock.json` and vendor Yarn 4 release binary in `.yarn/releases/yarn-4.18.0.cjs` with `yarnPath` in `.yarnrc.yml`.
**Resolution:** Closed on 2026-09-09 by /audit (scope: current). Re-examined repair in fix/color-tests-f10. Removed stray `package-lock.json` from git. Vendored Yarn 4.18.0 release binary in `.yarn/releases/yarn-4.18.0.cjs` and registered `yarnPath` in `.yarnrc.yml`. Confirmed `yarn -v` outputs 4.18.0 and test suite passes.
