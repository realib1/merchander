# Current Feature

**Title:** Backfill unit tests for untested src/utils logic modules

**Type:** Fix

**Status:** verified

**Fixes:** F-14

**Source:** `/audit full` finding F-14. The Vitest gate is on and scoped to pure
logic in `src/utils/`, but five modules there had no test file. This fix adds
focused coverage, `backup-codes.ts` first (its untested edge cases have a
security consequence).

## The problem

`src/utils/` modules with no `*.test.ts`:

| Module | Exports | Testability |
|---|---|---|
| `backup-codes.ts` | `normalizeBackupCode`, `hashBackupCode`, `generateSingleBackupCode`, `generateBackupCodeBatch` | pure / deterministic (hash) + format-assertable (random) |
| `insightRules.ts` | `evaluateInventoryInsights`, `evaluateMarginInsights`, `evaluateCustomerCreditInsights`, `evaluateLogisticsAndVipInsights` | pure; all take explicit data (and `now: Date` where time matters) |
| `conversationsMath.ts` | `computeConversationsMetrics`, `filterConversationThreads`, `getDefaultQuickReplies`, `getChannelBadgeDetails` | pure |
| `analyticsMath.ts` | `computeAnalyticsData` (one big pure reducer over an orders array) | pure, but timeline/peak-trading buckets read local-time `getHours`/`getDay` |
| `profitabilityExport.ts` | `exportProfitabilityToExcel/CSV/PDF` | **not unit-testable as written** - all three are I/O side effects (`XLSX.writeFile`, a DOM `Blob` download, `window.open`+print); no pure row-builder is exported |

## The fix

Add one `*.test.ts` next to each of the first four modules, following the
existing `src/utils/*.test.ts` style (plain `describe`/`it`, `expect`, no
harness, `node` env). Cover the real branch behaviour, not just happy paths:
thresholds, empty inputs, division-by-zero guards, dedupe/uniqueness.

`analyticsMath.ts`: assert only timezone-independent outputs - GMV, order
counts, AOV, period-over-period change (incl. the `undefined` when prior is 0),
fulfilment rate, customer cohorts (new vs returning split, repeat rate, VIP
sort/slice), channel and payment distribution, status funnel, top
products/categories. For the timeline and peak-trading sections assert shape
(array lengths, shares) not exact hour/day buckets, so the suite does not depend
on the runner's timezone.

`profitabilityExport.ts` is deliberately left out - see Out of scope. If review
wants it covered, that is a small refactor (extract the pure row arrays), not a
test-only change.

### Must not break

- No production code changes. This fix only adds `*.test.ts` files.
- `yarn test` stays green and the count goes up by the new cases.
- No new dependency, no config change, no `TZ` pinning in `vitest.config.ts`
  (the analytics tests are written to not need it).
- `yarn lint` / `yarn check` clean (test files are linted and type-checked).

## Build steps

- [x] 1. **`backup-codes.test.ts`.** `normalizeBackupCode` strips spaces/hyphens
  and upper-cases; `hashBackupCode` is a stable 64-char hex SHA-256 and is
  normalization-invariant (`"ab cd-ef"` and `"ABCDEF"` hash equal);
  `generateSingleBackupCode` matches `/^[2-9A-HJ-NP-Z]{5}-[2-9A-HJ-NP-Z]{5}$/`
  and never contains `0/O/1/I`; `generateBackupCodeBatch(n)` returns `n`
  unique plaintext codes with `hashedCodes[i] === hashBackupCode(plaintextCodes[i])`,
  default `n = 8`. 9 cases.
  **Evidence:** `yarn test src/utils/backup-codes.test.ts` passes.

- [x] 2. **`insightRules.test.ts`.** `evaluateInventoryInsights`: `daysOfSupply <= 4`
  -> `critical` `stockout-critical-*`; `<= 9` -> `warning`; `currentStock === 0`
  with no sales -> `critical` `stockout-zero-*`; healthy stock -> `[]`.
  `evaluateMarginInsights`: `profit < 0` -> `critical`; `marginPct < 15` ->
  `warning`; `price` or `cost` of 0 -> skipped. `evaluateCustomerCreditInsights`:
  only `credit_balance > 0`, capped at 3, `debt > 500` -> `critical` else
  `warning`, phone present -> `whatsapp` action else `internal_link`.
  `evaluateLogisticsAndVipInsights` with a fixed `now`: shipment `>= 10` days ->
  `warning`; `total_spent >= 1000` and `>= 25` days idle -> `opportunity`, capped
  at 2. 19 cases.
  **Evidence:** `yarn test src/utils/insightRules.test.ts` passes.

- [x] 3. **`conversationsMath.test.ts`.** `computeConversationsMetrics`: active
  excludes `resolved`, per-channel counts, `conversionRatePct` from
  `ordersCount > 0` threads, 0-thread guard -> `0`. `filterConversationThreads`:
  each `filter` value (`whatsapp`/`telegram`/`instagram`/`unread`/`orders`/`bot`),
  case-insensitive query across name/phone/lastMessage/intent, empty query ->
  filter-only. `getDefaultQuickReplies` interpolates `storeName` and returns 4
  templates; `getChannelBadgeDetails` maps each channel and falls back to `Chat`.
  13 cases.
  **Evidence:** `yarn test src/utils/conversationsMath.test.ts` passes.

- [x] 4. **`analyticsMath.test.ts`.** Built a small `RawAnalyticsInput` fixture
  (five orders across statuses/channels/payment methods, one repeat customer,
  two products/categories, non-empty `priorOrders`). Asserts the
  timezone-independent outputs: cancelled/draft excluded from GMV; `gmvChange`
  `undefined` when `priorGmv` is 0; repeat-rate and new/returning revenue split;
  `statusFunnel` always the 5 fixed rows; `topProducts`/`categories` sorted by
  revenue desc and sliced. `timeline` and `peakTrading` asserted by shape
  (lengths) and invariant totals only. 15 cases.
  **Evidence:** `yarn test src/utils/analyticsMath.test.ts` passes;
  `TZ=America/Los_Angeles` and `TZ=Pacific/Kiritimati` (UTC+14) both green.

- [x] 5. **Full verify.** `yarn test` 246 passed / 30 files (was 190 / 26),
  `yarn lint` 0, `yarn check` 0, `yarn build` 0.

## Verify

- `yarn test` green, file count 26 -> 30, test count 190 -> 246.
- `yarn lint` / `yarn check` / `yarn build` clean.
- Re-run `yarn test` and, for the analytics file, with a non-local `TZ` to
  confirm it is not timezone-flaky.

## Out of scope

- `profitabilityExport.ts`: every export is an I/O side effect with no pure
  seam. Covering it means extracting the row-array builders into pure exported
  functions first - a production refactor, tracked separately (F-27), not
  part of this test backfill.
- Pinning `TZ` in `vitest.config.ts` or adding coverage reporting - not needed
  and out of scope for `/tests`-style work.
- F-13 (platform overview query fan-out).

## Findings

### utils-test-backfill/F-14 [P2] closed - Pure logic modules ship with no tests despite the declared test gate

**File:** src/utils/analyticsMath.ts:1
**Found:** 2026-09-03 by /audit (scope: full; lens: tests)
**Why it matters:** The test gate is declared on in `AGENTS.md` and
`coding-standards.md` scopes it to pure logic in `src/utils/`. Five such modules
had no test file: `analyticsMath.ts` (487 lines), `insightRules.ts` (226),
`profitabilityExport.ts` (274), `conversationsMath.ts` (105), and
`backup-codes.ts` (51). `backup-codes.ts` generates and verifies MFA backup
codes, so it is the one where an untested edge case has a security consequence.
**Resolution:** Fixed on `fix/utils-test-backfill` (spec steps 1-4). Four test
files added, no production changes: `backup-codes.test.ts` (9),
`insightRules.test.ts` (19), `conversationsMath.test.ts` (13),
`analyticsMath.test.ts` (15). Suite 190 -> 246 tests, 26 -> 30 files;
`yarn lint` / `check` / `build` exit 0. Re-reviewed by /audit (scope: current;
lens: tests + all four) 2026-09-03: fresh per-case fixture factories (no shared
mutable state), a fixed injected `now` for the time-aware insight rules, exact
assertions on real branch behaviour not implementation mirroring, no
`.only`/`.skip`/placeholders, no mocking, no swallowed failures. Timezone
independence confirmed at `TZ=Pacific/Kiritimati` (UTC+14) and
`TZ=America/Los_Angeles`. The four modules F-14 prioritised are covered; the
gap for testable `src/utils` logic is closed. `profitabilityExport.ts` has no
pure seam and is tracked as F-27. Closed.

### Still open at completion (not part of this fix)

- **F-27 [P3] open** - `profitabilityExport.ts` mixes pure row-building with I/O
  (`XLSX.writeFile` / `Blob` download / `window.open`+print), so its row math,
  percentage guards, and CSV escaping cannot be unit-tested without extracting a
  pure seam. Raised by this fix's audit.
- **F-13 [P2] open** - platform overview query fan-out (whole-table scans +
  `listUsers({ perPage: 1000 })` cap).
