# MERCHANDER: PROJECT RECORD
## Strategic Baseline, Architecture & Decision Log

> **[STRATEGY RESET]** See docs/00_STRATEGY_RESET.md and docs/Merchander_PRD_v2.1.md for the pivot from a WhatsApp bot to a Social Commerce OS.

**Last Updated**: August 2026  
**Status**: Pre-Development / Schema & Foundations Ready (v2.1 Baseline)

---

# 1. WHAT WE'RE BUILDING

Merchander is the **Operating System for Social-First Merchants**, specifically targeting **Ghanaian importers and resellers**.

It empowers merchants who manage pre-orders, sea/air-freight shipments, supplier balances, and staggered inventory arrivals to turn their multi-channel conversations (WhatsApp, Instagram, Telegram) into organized, trackable commerce operations.

**Not** just another WhatsApp bot. It is a full commerce infrastructure (products, multi-store inventory, customers, unified identities, orders, payments, suppliers, purchase orders, shipments & landed costs) where social channels serve as decoupled adapters.

---

# 2. DECISION LOG

## Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| **Platform Type** | Multi-tenant SaaS | Merchants operate in isolated workspaces (`tenants`) |
| **Marketplace?** | No | Prevents customer leakage across competing merchants |
| **Customer Touchpoints** | Multi-Channel (WhatsApp, IG, FB, Telegram, Storefront) | Customers interact on channels they already use |
| **Unified Identity** | `customer_identities` table mapping to `customers` | Single customer profile across multiple channels without false merges |
| **Payment Flow** | Record-First (MTN MoMo, Telecel, COD, Bank, Card) | Records obligations & settlements accurately without requiring Merchander to be intermediate escrow |
| **Supply Side** | Procurement & Inbound Logistics | Tracks purchase orders, supplier balances, sea/air consignments, and estimated landed cost |
| **Data Isolation** | `tenant_id` on every table + Supabase RLS | Strict per-vendor isolation enforced at database engine level |
| **Architecture Layers** | 3-Layer OS | Core (Next.js 15), Intelligence (Python/FastAPI), Channels (Official Meta API) |
| **Bot Safety** | Human-in-the-Loop | GREEN (auto), YELLOW (approval), RED (human only) |

## Tech Stack Decisions

| Layer | Choice | Reason |
|---|---|---|
| **Frontend + Dashboard** | Next.js 15 (App Router + Server Actions) | SSR, Server Actions, high performance |
| **Database & Auth** | Supabase (PostgreSQL + RLS + Supabase Auth) | Native RLS, security definer helpers, Edge-ready |
| **Design System** | TailwindCSS v4 + shadcn/ui primitives | Token-based theming, accessible components |
| **Bot & Intelligence** | Python + FastAPI + Celery + Redis | Asynchronous queues, multimodal image search |
| **Channels** | Official WhatsApp Cloud API (Meta Tech Provider) | Stable business integration, zero risk of Baileys ban |

---

# 3. TENANT ISOLATION (CRITICAL)

**Rule**: Every database table must include `tenant_id` and enforce Row Level Security via `get_auth_user_tenant_ids()`.

**Enforcement layers**:
1. `src/proxy.ts` / Middleware — blocks unauthenticated sessions.
2. `src/lib/supabase/server.ts` — passes cookies to Supabase for RLS evaluation.
3. Server Actions (`src/app/actions/`) — explicitly scope inserts/queries by `tenant_id`.
4. PostgreSQL RLS — database engine-level barrier preventing cross-tenant leakage.

---

# 4. DOCS INDEX

| File | Purpose |
|---|---|
| `Merchander_PRD_v2.1.md` | Authoritative Product Requirements Document (v2.1) |
| `00_STRATEGY_RESET.md` | Strategic teardown and repositioning |
| `01_multi_tenant_specification.md` | Multi-tenant schema, DDL, and RLS specifications |
| `02_implementation_guide.md` | Full stack implementation guide and code examples |
| `03_ROADMAP.md` | Product roadmap and development phases |
| `04_Page_Structure_Guide.md` | Dashboard page content and UX structure guide |
| `05_PROJECT_RECORD.md` | This file — all decisions, architecture, and context |
