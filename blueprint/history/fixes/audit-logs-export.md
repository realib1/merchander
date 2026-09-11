# Current Feature

- **Title:** Add Date Filters and CSV Export to Audit Logs
- **Type:** Fix
- **Status:** verified

## The Problem
The Platform Admin Audit Logs page (`/platform/audit-logs`) is fully functional with pagination and filtering by staff email or target type. However, it lacks a **date-range filter** and a **CSV export** mechanism, which are critical for compliance and security reviews (a P3 gap from our Platform Admin analysis). 

## The Fix
1. **Extend API capabilities:**
   - Update `getPlatformAuditLogsAction` in `src/app/actions/platform-audit.ts` to accept `startDate` and `endDate` parameters (ISO date strings).
   - Use Supabase `.gte('created_at', startDate)` and `.lte('created_at', endDate)` for filtering.

2. **Update the Frontend UI:**
   - Add "Start Date" and "End Date" input fields of type `date` to the filter form in `src/app/platform/audit-logs/page.tsx`.
   - Forward these new query parameters in `searchParams` and the `buildQueryString` helper.

3. **Add CSV Export:**
   - Add a "Download CSV" button (or link) next to the filter controls on the page.
   - Create a new API route `src/app/api/platform/audit-logs/export/route.ts` that enforces `verifyPlatformStaff` permissions.
   - The route should fetch all logs matching the current filter (without pagination limit, or high limit like 10000) and return them as a `text/csv` stream or string.

## Build Steps
- [x] **Step 1: Extend Data Access Action**
  - Add `startDate` and `endDate` to `getPlatformAuditLogsAction` signature and Supabase query.
- [x] **Step 2: Add Filters to UI**
  - Update `page.tsx` to read `startDate` and `endDate` from `searchParams` and pass them to the action.
  - Render date inputs in the filter form and update `buildQueryString`.
- [x] **Step 3: Build CSV Export Endpoint**
  - Create `route.ts` export endpoint. Use `createAdminClient` for the fetch. 
  - Format the response with CSV headers and rows, returning a `NextResponse` with `Content-Type: text/csv`.
- [x] **Step 4: Add Export Button to UI**
  - Add an export button to `page.tsx` that links to the new API endpoint, passing the current filter query parameters.

## Verify
1. Run `yarn check` and `yarn test` to ensure typings remain strictly sound.
2. Manually test filtering logs by a specific date.
3. Click "Download CSV" and verify the downloaded file opens correctly and respects the applied filters.
