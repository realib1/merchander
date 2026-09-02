# Merchander - Project Overview

<!-- blueprint:source-hash 344b474c458a9bf459b4e6cb0817d9e7c067f9ce1ac4abdca0a5ce99a1de6a2a -->

> A social-commerce operating system that connects the supply side and sales side
> of Ghanaian import/resale businesses into one operational system.

## Problem

Social-first merchants run real businesses out of WhatsApp, Instagram, Telegram,
and spreadsheets. WhatsApp is a good sales channel but a poor operations system,
so a growing merchant ends up hand-tracking catalogs, orders, inventory,
pre-orders, supplier purchases, freight shipments, supplier balances, import
costs, customer payments, and delivery across disconnected tools. The result is
fragmented operations: a merchant knows "I sold 50 bags" but not what they cost
after supplier and freight and import costs, which customers already paid for
next week's shipment, or how much they still owe a supplier. Merchander connects
these pieces without moving money between parties (payments are recorded, not
escrowed).

## Users

- **Merchants (primary):** Ghanaian importers and resellers selling via social
  channels, managing pre-orders, freight consignments, supplier balances, and
  staggered inventory arrivals. Signed in, scoped to one tenant workspace; roles
  `owner` / `admin` / `member` plus permission strings.
- **Merchant staff:** additional `tenant_users` with narrower permissions.
- **Platform staff (SHERO internal):** `platform_staff_users` with roles
  `platform_owner`, `platform_admin`, `operations`, `support`, `finance`,
  `tech_admin`, `compliance`. Operate every tenant through `/platform`. Strictly
  separated from merchant accounts (never in `tenant_users`).
- **End customers:** anonymous visitors to a merchant's public storefront
  (`/store/[slug]`); passwordless order tracking by token or phone. Future:
  identified via connected social channels.

## Features

Build-plan order. Items 1-15 are shipped; 16-25 are the roadmap. The headline
capability is turning fragmented social-commerce operations into one connected
system. The current build frontier is the **Intelligence layer acting on the
social channels** (16-21): Merchander does not rebuild a chat inbox - the
conversation stays on WhatsApp/IG where the customer already is - it connects
its Intelligence to the channel to decide what to say or do, and when, grounded
in real commerce data, under Green/Yellow/Red controls with human handoff.

1. **Multi-tenant workspace & auth** - tenant registration, Supabase Auth, MFA +
   backup codes, tenant roles/permissions, `tenant_id` + RLS isolation.
2. **Product catalog** - products, variants, categories, specifications, images,
   availability states.
3. **Multi-store inventory** - stores/branches, inventory levels, low-stock
   thresholds, adjustments.
4. **Customers CRM** - records, unified cross-channel identities, acquisition
   attribution.
5. **Orders** - creation, Kanban status lifecycle, line items, customer payment
   records.
6. **Suppliers & procurement** - suppliers, purchase orders, balances,
   procurement finances, import/shipping cost capture.
7. **Shipments / inbound logistics** - shipment creation, supplier link, freight
   mode, ETAs, arrival status.
8. **Pre-order batches** - batch lifecycle open->completed, per-product batches,
   supplier PO export, milestone customer broadcasts.
9. **Expenses & profitability** - expense tracking, profitability view, analytics
   and insights dashboards, dashboard metrics + attention items.
10. **Merchant storefront** - public catalog, product pages, cart, wishlist,
    passwordless order tracking, subdomain + custom domain, branding/hero/colors,
    announcement banner.
11. **Payments recording + provider scaffolding** - record-first payments;
    Paystack / Hubtel / MTN MoMo / Telecel config; webhook routes; subscription
    upgrade checkout.
12. **Business settings surface** - profile, hours, channels, checkout,
    fulfilment, notifications, privacy, export, subscription, branches, staff,
    permissions, audit log.
13. **Goals & Targets engine** - business targets, progress calculation,
    intelligence summary.
14. **Help & Support hub** - merchant ticket submission, case threads, system
    status/telemetry, support-access delegation grants.
15. **Platform / Superadmin console** - merchants, single-merchant context,
    revenue, plans & billing, domains, system health/incidents, communications,
    audit logs, staff RBAC, cross-tenant support inbox.
16. **Official WhatsApp Cloud API connector** - Meta Tech Provider on the
    merchant's existing business number: verified sender, inbound + outbound,
    templates, media, delivery receipts, human-takeover coexistence. Normalizes
    inbound events into a common model and resolves a channel identity to a
    `customer` via reliable signals only (no forced merges).
17. **Merchander Intelligence service** - stand up the Python/FastAPI + queue
    service; move extraction / grounded reasoning / multimodal off the
    `src/lib/intelligence/extract.ts` and `src/app/actions/conversations.ts`
    stubs.
18. **Grounded product Q&A and availability replies** - answer price / variant /
    stock / pre-order-ETA / order-status questions from real merchant data,
    never fabricated; reply is sent back on the originating channel.
19. **Green/Yellow/Red action safety and human handoff** - Green auto-send,
    Yellow to a merchant approval queue, Red human-only; escalate on
    uncertainty. Merchant touchpoint is an approval & exceptions queue, not a
    chat view.
20. **Conversation-to-order capture** - turn an agreed cart from a channel
    exchange into a draft order against real inventory/pricing; Yellow-gated.
    Replaces the `extractCartFromChat` stub.
21. **Proactive customer outreach** - the Intelligence decides when to message a
    customer and sends via the channel: payment reminders, pre-order batch
    milestones, back-in-stock, delivery updates. Respects Green/Yellow/Red and
    notification-volume limits.
22. **Live payment links & confirmations** - customer payment links, automated
    confirmation, reminders.
23. **Fulfilment & delivery** - zones, pickup, rider assignment and tracking.
24. **Demand & supplier intelligence** - forecasting, restock recommendations,
    supplier performance scoring.
25. **Deployment readiness** - Vercel config, env review, production build +
    smoke-test path.

## Data model

PostgreSQL via Supabase. **Every tenant-owned table carries `tenant_id` and an
RLS policy scoping rows to the caller's tenant** (`tenant_users` by `auth.uid()`).
Platform-plane tables are guarded by `is_platform_staff()`. Shapes below are
locked - later features build on them.

### tenants / access

- **tenants**: `id` (uuid), `name`, `created_at`.
- **tenant_users**: `tenant_id` -> tenants, `user_id` -> auth.users, `role`
  (`owner` | `admin` | `member`); unique `(tenant_id, user_id)`.
- **tenant_roles**: `tenant_id`, `name`, `permissions` (text[]).
- **tenant_settings**: `tenant_id` (unique), `store_name`, `slug`, `store_email`,
  `business_phone`, `business_country`, `store_currency`, `custom_domain`,
  `low_stock_threshold`, `settings_data` (jsonb - storefront config, business
  hours, channels, and legacy embedded `support_tickets`).
- **tenant_subscriptions**: `tenant_id` (unique), `tier` (`free` | `starter` |
  `growth` | `business` | `enterprise`), `billing_cycle` (`monthly` | `annual`),
  `status` (`active` | `past_due` | `canceled` | `trialing`), `price_monthly`,
  `renewal_date`, `payment_method` (jsonb).
- **tenant_notifications**: `tenant_id`, `title`, `message`, `type`, `is_read`.
- **user_backup_codes**: `user_id`, `code_hash`, `used_at`.

### catalog & inventory

- **stores**: `id`, `tenant_id`, `name`, `location`, `is_primary`.
- **products**: `id`, `tenant_id`, `name`, `description`, `availability_status`
  (`AVAILABLE` | `PRE_ORDER` | `OUT_OF_STOCK`), category link, images.
- **product_variants**: `id`, `product_id`, `name`, `sku`, `price`,
  `cost_price`.
- **product_categories**: `id`, `tenant_id`, `name`, fields.
- **product_specifications**: `product_id`, spec key/value rows.
- **inventory_levels**: `variant_id`, `store_id`, `quantity`.
- **product_waitlist**: `product_id`, customer interest rows.

### customers

- **customers**: `id`, `tenant_id`, `name`, `phone`, `first_touch_source`
  (attribution channel), timestamps.
- **customer_identities**: maps a channel handle (WhatsApp/IG/FB/Telegram/
  storefront) to one `customer_id` - unified identity without false merges.

### orders & payments

- **orders**: `id`, `tenant_id`, `store_id`, `customer_id`, `order_number`,
  `status` (Kanban: `draft` | `pending_payment` | `paid` | `completed` |
  `delivered` | `cancelled` ...), `total_amount`, `delivery_address`,
  `delivery_fee`, `batch_id` (nullable -> preorder_batches),
  `attribution_source`.
- **order_items**: `order_id`, `variant_id`, `quantity`, `unit_price`.
- **payments**: `order_id`, `tenant_id`, amount, method (`momo` | `card` | `cod`
  | `bank` ...), provider, status, recorded-vs-settled.

### procurement & logistics

- **suppliers**: `id`, `tenant_id`, `name`, `contact_name`,
  `outstanding_balance`, `country`.
- **purchase_orders**: `id`, `tenant_id`, `supplier_id`, `po_number`, `status`
  (`ordered` | `partially_received` | ...), `eta`, `tracking_number`; plus
  procurement finance columns (import cost, shipping fee).
- **purchase_order_items**: `purchase_order_id`, `variant_id`, `quantity`,
  `cost_price`.
- **shipments**: `id`, `tenant_id`, `supplier_id`, `purchase_order_id`, `title`,
  `tracking_number`, `status`, `freight_mode` (`sea` | `air` | `road` |
  `express`), `eta`.

### pre-orders

- **preorder_batches**: `id`, `tenant_id`, `name`, `code`, `status` (`OPEN` |
  `CLOSING_SOON` | `CLOSED` | `ORDER_SUBMITTED` | `IN_TRANSIT` | `ARRIVED` |
  `FULFILLING` | `COMPLETED`), `freight_mode`, `expected_arrival_start/end`.
- **product_preorder_batches**: `tenant_id`, `batch_id`, `product_id` join.
- **preorder_batch_notifications**: `tenant_id`, `batch_id`, `milestone`,
  `channel` (`whatsapp` | `sms` | `email`), `recipient_count`,
  `message_template`, `status` (`queued` | `sent` | `failed`), `sent_by`.

### expenses & targets

- **expenses**: `id`, `tenant_id`, `short_id`, amount, category, `payment_method`.
- **business targets**: `id`, `tenant_id`, `name`, `metric`, target value,
  period, progress (see `src/types/targets.ts`).

### platform plane (staff-only, service-role writes)

- **platform_staff_users**: `user_id` (unique) -> auth.users, `email`, `role`
  (7 roles above), `is_active`, `mfa_enabled`.
- **platform_audit_logs**: append-only. `actor_id`, `actor_email`, `actor_role`,
  `action`, `target_type` (enum: tenant | subscription | plan | connector |
  domain | support_ticket | broadcast | incident | staff_role | security_event |
  system_config), `target_id`, `reason`, `metadata` (jsonb), `ip_address`.
- **platform_plans**: `slug` (unique), `name`, `price_ghs`, `price_usd`,
  `billing_cycle`, `entitlements` (jsonb: max_products, max_monthly_orders,
  max_staff_seats, custom_domain_allowed, ai_queries_monthly, priority_support),
  `is_active`, `sort_order`.
- **platform_announcements**: `title`, `message`, `type`, `target_tier`,
  `target_country`, `action_label/url`, `is_pinned`, `is_active`, `starts_at`,
  `expires_at`.
- **platform_incidents**: `service`, `status` (`investigating` | `identified` |
  `monitoring` | `resolved`), `title`, `message`, `affected_areas` (text[]),
  `is_active`.
- **platform_support_access_grants**: `tenant_id`, `granted_by`, `ticket_id`,
  `token`, `reason`, `duration_hours`, `status` (`active` | `revoked` |
  `expired`), `expires_at`. RLS: tenant members SELECT, tenant owner/admin write,
  platform staff SELECT.

### helpers

- `is_platform_staff()` - security-definer; true for an active
  `platform_staff_users` row. Used by platform-plane RLS.
- RPCs: `get_dashboard_metrics`, inventory and customer-page metrics.
- App-side auth: `src/lib/auth/platform-staff.ts` and `verifyPlatformStaff()` in
  `src/app/actions/platform.ts`.

## Tech stack

- **Next.js 16 (App Router) + React 19 + TypeScript (strict)** - dashboard,
  storefront, platform console; SSR + Server Actions; Turbopack.
- **Server Actions** (`src/app/actions/*`, ~60 modules) - default data/mutation
  path. API routes only for webhooks + auth reset. Edge middleware `src/proxy.ts`.
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`) - PostgreSQL, Row Level
  Security, Supabase Auth with MFA. Two clients: anon (RLS) and service-role
  (admin, must authorize first).
- **Zod** - input validation in actions.
- **Tailwind CSS v4** (CSS-first `@theme` tokens, no config file) + hand-rolled
  `src/components/ui` primitives + `next-themes` + `lucide-react` + `motion` +
  `sonner`.
- **recharts** (charts), **xlsx** (export), **date-fns**.
- **Yarn 4**, ESLint 9, Prettier, **Vitest** (pure `src/utils` logic only),
  Husky pre-commit (lint + typecheck).
- **Planned, not in repo:** Python/FastAPI + Celery/Redis Merchander Intelligence
  service (feature 17); official channel connectors, WhatsApp Cloud API first
  (feature 16).

## Monetization

Tiered subscription SaaS. Plans `free` / `starter` / `growth` / `business` /
`enterprise` priced in GHS and USD, monthly or annual, with per-tier
`entitlements` (product / order / staff-seat / AI-query limits, custom-domain and
priority-support flags). Managed from `/platform`; merchant upgrades run through
the online-payments checkout.

> TODO: roadmap floated usage-based / hybrid pricing (Phase 2 validation); only
> flat tiered subscription is implemented.

## UI/UX

Token-driven theme (brand primary scale, semantic surfaces, external brand
colors) as `@theme` variables in `globals.css`. DM Sans (body) + Plus Jakarta
Sans (display). Dark mode first, light optional. Dense operational dashboard
(Kanban order board, data tables, metric cards, modal/drawer edit flows); the
merchant storefront is a separate customer-facing surface with per-merchant
branding.

Main routes:

- `/login`, `/auth/callback`, `/auth/signout` - auth + MFA.
- `/dashboard` - overview (metrics, attention items).
- `/dashboard/{orders,products,inventory,inventory/batches,customers,suppliers,purchasing,shipments,expenses,profitability,analytics,insights,conversations,categories,online-store,staff,help}` and `/dashboard/settings/*`.
- `/store/[slug]` - public storefront; `/store/[slug]/products/[productId]`,
  `/store/[slug]/orders/[orderId]` (token/phone tracking). `/s/[code]` - short
  links.
- `/platform` and `/platform/{merchants,merchants/[id],revenue,plans-billing,domains,system-health,communications,audit-logs,security,support}`.
- `/api/webhooks/{paystack,hubtel,whatsapp,telegram}`, `/api/auth/reset`.

## Deployment

- **Target:** Vercel. App type: Next.js 16 server (SSR + Server Actions + edge
  middleware). Build `yarn build`, start Vercel-managed.
- **Env vars by name:** `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `NEXT_PUBLIC_APP_URL`, payment-provider keys (Paystack, Hubtel), channel
  webhook verify tokens (WhatsApp, Telegram). See `.env.example`.
- **Database:** hosted Supabase project already linked (`jzwrfeclfnzxwmodwlfs`);
  migrations applied with the Supabase CLI. Local demo data in
  `supabase/seed.sql` only.
- **Security headers + CSP:** `next.config.ts`. No cron/workers/health-check
  defined.

> TODO: no `vercel.json` committed yet; run `/release vercel` when deployment is
> actually on the table.

## Open questions

> - Package manager: `package-lock.json` still present alongside `yarn.lock`;
>   yarn is canonical and the npm lockfile should be removed.
> - Pricing model: tiered subscription is built; usage/hybrid was only floated.
> - The Merchander Intelligence service (feature 17) is "in scope, not yet
>   built" - confirm whether it lives in this repo or a sibling repo.
> - A `/dashboard/conversations` scaffold ships today but is derived from order
>   data, not real messages. The 16-21 rework reframes it as an approval &
>   exceptions queue rather than a chat client; confirm the shipped view is
>   reworked, not kept as-is.
> - `tenant_settings.settings_data` still carries legacy embedded
>   `support_tickets`; the Help hub and platform support inbox read from there.
>   Whether to normalize into a real `support_tickets` table is undecided.
