# Extract testable row builders from profitabilityExport.ts

**Type:** Fix

**Status:** verified

**Fixes:** F-27

## The problem

`src/utils/profitabilityExport.ts` had three exporters -
`exportProfitabilityToExcel`, `exportProfitabilityToCSV`, `exportProfitabilityToPDF` -
that each built their tabular data inline and then immediately performed a side
effect (`XLSX.writeFile`, a `Blob` + anchor-click download, `window.open` +
`document.write` + `print`). No exported function returned just the rows, so the
`src/utils` test gate could not reach the row math:

- the `/ (data.metrics.grossRevenue || 1) * 100` percent-of-revenue guards
  (repeated across the Excel summary and the PDF income statement)
- the per-row `Number(x.toFixed(2))` / `x.toFixed(1)` rounding in the product,
  category, and channel tables
- the CSV `"` escaping (`p.name.replace(/"/g, '""')`) and comma/newline joining

## The fix

New pure module `src/utils/profitabilityRows.ts` (imports only
`ProfitabilityData`; no `xlsx`, no DOM):

- `percentOfRevenue(value, grossRevenue): string` - the
  `((value / (grossRevenue || 1)) * 100).toFixed(1) + '%'` expression, one place
  (dedupes ~9 call sites).
- `buildProfitabilitySummaryRows(data, businessName, generatedAt = new Date())` -
  the Excel "Executive Summary" AOA. `generatedAt` is an optional param so the
  exporter is unchanged but tests can pin it.
- `buildProductMarginRows(data)`, `buildCategoryRows(data)`,
  `buildChannelRows(data)` - the other three Excel AOAs.
- `buildProfitabilityCsv(data): string` - the full CSV document.

`profitabilityExport.ts` now calls these; the `XLSX.writeFile` / `Blob` /
`window.open` shells are unchanged. The extraction is byte-faithful - `git diff`
shows every migrated expression with the same operands, `toFixed` digits, and
header strings. Net -144/+105 lines in the exporter.

## Build steps

- [x] **Step 1 - extract the pure module and rewire the exporters.**
- [x] **Step 2 - unit-test profitabilityRows.ts** - `src/utils/profitabilityRows.test.ts`,
  11 cases.

## Verify

- `yarn lint`, `yarn check`, `yarn build` clean; `yarn test` **257 passed / 31
  files** (was 246 / 30) on a clean run.
- Manual: `/dashboard/profitability` -> Export -> Excel / CSV / PDF each produce a
  file whose numbers match the on-screen figures (unchanged).
- Code review: `grep -n "grossRevenue || 1" src/utils/profitabilityExport.ts`
  returns nothing; no inline `.replace(/"/g, '""')` remains there.

## Findings

### profitability-row-builders/F-27 [P3] closed - profitabilityExport.ts mixes pure row-building with I/O, so it cannot be unit-tested

**File:** src/utils/profitabilityExport.ts:5
**Found:** 2026-09-03 by /audit (scope: current; lens: tests)
**Why it matters:** `exportProfitabilityToExcel`, `exportProfitabilityToCSV`, and
`exportProfitabilityToPDF` each built their tabular data inline then immediately
performed a side effect, so no exported pure function returned the rows and the
`src/utils` test scope could not reach the `toFixed` rounding, the
`/ (grossRevenue || 1)` percentage guards, or the CSV `"` escaping - it was the
one F-14 listee left without coverage.
**Suggested fix:** Extract the pure parts as exported functions the three
exporters call, then unit-test those; leave the `writeFile` / `Blob` /
`window.open` shells untested.
**Resolution:** New `src/utils/profitabilityRows.ts` exports `percentOfRevenue`,
`buildProfitabilitySummaryRows` (optional `generatedAt`), `buildProductMarginRows`,
`buildCategoryRows`, `buildChannelRows`, `buildProfitabilityCsv`. All three
exporters call it. `src/utils/profitabilityRows.test.ts` adds 11 cases (257
total) covering the `(grossRevenue || 1)` guard (`0.0%` not `Infinity`/`NaN`),
2dp/1dp rounding, `sku` fallbacks, and CSV `"`-doubling. Re-reviewed 2026-09-03
by /audit (scope: current): extraction byte-faithful per `git diff`; the new
assertions check real outcomes, not shape; lint/check/build/test green. Closed.
