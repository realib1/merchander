# Current Feature: 44. Settings Reorganization & Contextual Configuration

**Status:** in progress

## Goal
Decentralize the global Settings section by moving domain-specific configurations out of the master Settings area and directly into the operational pages they govern (as tabs). The global Settings will now only contain genuinely cross-cutting configurations (Profile, Security, Notifications, Business Profile, Business Modules, Branches & Locations, Payments Setup, Connected Channels, Privacy & Retention, Audit Log, Plan & Billing).

## Scope
### In Scope
- Creating a unified tabbed layout on operational pages to accommodate both the primary view (e.g. "Orders") and the configuration view (e.g. "Preferences").
- Moving existing settings forms and components to their new contextual homes without breaking their functionality.
- Relocating settings routes and updating navigation structures.
- Consolidating "Export Data" into the "Privacy & Retention" settings page.
- Relocating "Business Hours" directly into the "Business Profile" settings page.

### Out of Scope
- Rewriting or changing the underlying behavior of the settings themselves.
- Adding new configuration options.
- Building the "Payments & Cashflow" feature (we will move the Checkout settings stub into the closest existing payments/cashflow route, or leave it in settings if that page doesn't exist yet, but the user requested moving it).

## Data & Contracts
- The structure of `tenant_settings` in the database remains unchanged.
- Routing paths will change for several configuration pages, e.g. `/dashboard/settings/orders` will move to a tab under `/dashboard/orders` (e.g. `/dashboard/orders/settings` or similar URL structure).

## Files & Areas
- `src/app/dashboard/settings/...` (the current homes of the settings)
- `src/app/dashboard/orders/...`
- `src/app/dashboard/inventory/...`
- `src/app/dashboard/suppliers/...`
- `src/app/dashboard/shipments/...`
- `src/app/dashboard/conversations/...` (Approvals & Inquiries)
- `src/app/dashboard/staff/...`
- `src/components/layout/...` (Sidebar navigation and page headers)

## Testing
- Ensure all forms continue to save configuration successfully.
- Verify that permissions applied to settings (e.g., if a user has "manage orders" but not "manage settings") correctly reflect the new contextual location. 
- Run standard build and linter checks (`yarn check`, `yarn lint`, `yarn build`).

## Build Steps

- [x] **Step 1: Relocate Order & Fulfillment Settings**
  - **Action:** Move "Order Preferences" and "Fulfillment & Slips" out of `dashboard/settings` and into `dashboard/orders` as tabs.
  - **Done when:** The Orders page features a tabbed navigation (e.g. Orders | Preferences | Fulfillment) and the settings save successfully from the new location.

- [x] **Step 2: Relocate Inventory, Supplier, and Shipment Settings**
  - **Action:** Move "Products & Inventory" settings to a tab in `dashboard/inventory`. Move "Suppliers & POs" settings to a tab in `dashboard/suppliers`. Move "Shipments & Zones" to a tab in `dashboard/shipments`.
  - **Done when:** Navigating to these three operational pages shows the respective settings tabs, and the forms load and save correctly.

- [x] **Step 3: Relocate Intelligence/Conversation Settings**
  - **Action:** Move "Chat Routing & SLA" and "Automation & Bots" to tabs inside the Approvals & Inquiries page (`dashboard/conversations`).
  - **Done when:** The conversational settings govern the GREEN/YELLOW/RED classifier and routing directly from the queue page.

- [x] **Step 4: Relocate Staff Permissions & Checkout Configuration**
  - **Action:** Move "Roles & Permissions" into `dashboard/staff` as a tab. Relocate "Checkout" to the Payments page (as a tab or sub-section).
  - **Done when:** Permissions are managed contextually on the Staff page, and Checkout configuration is in the Payments section.

- [x] **Step 5: Consolidate Global Settings & Clean Up Navigation**
  - **Action:** Move "Business Hours" fields directly into the "Business Profile" settings page. Move "Export Data" into the "Privacy & Retention" settings page. Remove the relocated dead links from the global Settings navigation menu and update the sidebar navigation if needed.
  - **Done when:** Business Hours and Export Data are consolidated into their respective pages. The Settings layout only lists the 11 cross-cutting configuration sections, and clicking through them works without 404s.

## Notes for AI
- Use the project's existing tab UI components (e.g., Shadcn `Tabs` or standard route-based layouts) to handle the sub-navigation on the operational pages.
- Ensure that the server actions backing the settings forms still have the correct permissions assertions if the URL structure changes.
