# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-13 [P2] open - Platform overview fetches whole tables on every page load

**File:** src/app/actions/platform.ts:88
**Found:** 2026-09-03 by /audit (scope: full; lens: performance)
**Why it matters:** `getPlatformOverviewData` selects every row of `orders`,
`products`, `tenant_users`, `channel_connections`, `tenant_subscriptions`, and
`tenant_settings` including the full `settings_data` jsonb, then joins in memory.
It runs on `/platform`, `/platform/merchants`, and again inside
`getPlatformRevenueMetricsAction`, all `force-dynamic`, so nothing is cached.
`auth.admin.listUsers({ perPage: 1000 })` is a hard cap: past 1000 users, tenant
owner emails silently go missing. `coding-standards.md` calls for an RPC or view
once an aggregation fans out this far.
**Suggested fix:** Move the counts and sums into a Postgres RPC returning one
aggregate row, and page or drop `listUsers` in favour of a targeted lookup.
**Resolution:**

### F-27 [P3] open - profitabilityExport.ts mixes pure row-building with I/O, so it cannot be unit-tested

**File:** src/utils/profitabilityExport.ts:5
**Found:** 2026-09-03 by /audit (scope: current; lens: tests)
**Why it matters:** `exportProfitabilityToExcel`, `exportProfitabilityToCSV`, and
`exportProfitabilityToPDF` each build their tabular data inline and then
immediately perform a side effect (`XLSX.writeFile` to disk, a DOM `Blob`
anchor-click download, `window.open` + `document.write` + `print`). There is no
exported pure function that returns the rows, so `coding-standards.md`'s
`src/utils` test scope cannot reach any of it - the module is the one F-14
listee left without coverage. The row math (per-line `toFixed`, the
`/ (grossRevenue || 1)` percentage guards, the CSV `"` escaping) is exactly the
kind of logic the gate exists for, and it is currently unverified.
**Suggested fix:** Extract the pure parts - e.g. `buildProfitabilitySummaryRows(data)`,
`buildProductMarginRows(data)`, `buildProfitabilityCsv(data): string` - as
exported functions the three exporters call, then unit-test those. The
`writeFile` / `Blob` / `window.open` shells stay untested (thin I/O). Small,
mechanical refactor; no behaviour change.
**Resolution:**
