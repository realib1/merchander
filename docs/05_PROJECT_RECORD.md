# MERCHANDER: PROJECT RECORD
## All Decisions, Architecture, and Context

> **[STRATEGY RESET]** See docs/00_STRATEGY_RESET.md for the August 2026 pivot from a WhatsApp bot to a Social Commerce OS.

**Last Updated**: August 2026  
**Status**: Ready to Build (Week 1)

---

# WHAT WE'RE BUILDING

Merchander is the **Operating System for Social-First Merchants**, specifically targeting **Ghanaian importers and resellers**.

It empowers merchants who manage pre-orders, sea-freight shipments, and staggered inventory arrivals to turn their chaotic WhatsApp and Telegram conversations into organized, trackable commerce operations.

**Not** just another WhatsApp bot. It is a full commerce infrastructure (products, customers, orders, payments, shipments) where WhatsApp serves merely as a channel adapter.

---

# DECISIONS LOG

## Architecture Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Platform type | Multi-tenant SaaS | Vendors are isolated, not competing |
| Marketplace? | No | Vendors would lose customers to competitors on shared platform |
| Customer platform | WhatsApp/Telegram groups (existing) | Customers already there, no new app needed |
| Payment integration | Skip for MVP | Reduce complexity, vendors collect manually for now |
| Revenue model | Subscription only | No commission, simpler model |
| Data isolation | tenant_id on every table + RLS | Strict per-vendor isolation |
| Architecture Layers | 3-Layer OS | Core (Next.js), Intelligence (Python), Channels (Meta API) |
| Bot architecture | Human-in-the-Loop | GREEN (auto), YELLOW (approval), RED (human) |
| Architecture | Next.js Full Stack + Python Bot | Paradigm B chosen for simplicity, speed, and shared DB logic |
| ORM | Drizzle ORM | Better for RLS and Edge compatibility than Prisma |

## Tech Stack Decisions

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend + Dashboard | Next.js 15 | SSR, API routes, React ecosystem |
| Bot engine | Python + FastAPI | Python strength, better for automation/NLP |
| WhatsApp | WhatsApp Cloud API | SHERO is an approved Meta Tech Provider |
| Telegram | python-telegram-bot | Official API, stable |
| Database | PostgreSQL | Relational, supports RLS, reliable |
| Queue | Celery + Redis | Proven task queue for Python |
| Scheduler | APScheduler | Cron jobs per tenant |
| ORM (Next.js) | Drizzle ORM | Edge-compatible, allows RLS injection, SHERO Core standard |
| ORM (Python) | SQLAlchemy | Mature, flexible |
| Auth | NextAuth.js | JWT with tenantId embedded |
| State | TanStack Query + Zustand | React data fetching + local state |
| UI | TailwindCSS + shadcn/ui | Utility-first, fast to build |

## Business Decisions

| Decision | Choice |
|----------|--------|
| Pricing Strategy | To be validated | Testing Subscription, Usage, and Hybrid models |
| Free tier limits | 10 products, 50 orders/month, 1 store |
| Basic tier | 50 products, unlimited orders, 2 stores |
| Pro tier | Unlimited products, unlimited orders, 5 stores |
| Branch model | Same account, multiple stores, combined analytics with per-store breakdown |
| Payment config (future) | Each vendor provides own PayStack API key |
| Target market | Ghanaian social-commerce importers and resellers |

---

# WHAT EACH VENDOR GETS

```
On signup, each vendor gets:
├─ Isolated workspace (tenant_id)
├─ Dashboard (products, orders, analytics)
├─ WhatsApp bot (their number, their groups)
├─ Telegram bot (their token, their channels)
├─ Automation engine (scheduler, workflows)
├─ Analytics (their data only)
└─ Multi-store support (based on plan)
```

---

# TENANT ISOLATION (CRITICAL)

**Rule**: Every database query in the entire platform must include `tenant_id` in the WHERE clause.

```python
# CORRECT
orders = await db.select().from(orders_table).where(eq(orders_table.tenantId, tenantId))

# WRONG — data leak across tenants
orders = await db.select().from(orders_table)
```

**Enforcement layers**:
1. `middleware.ts` — blocks unauthenticated requests
2. `getTenantId()` — extracts tenant from JWT on every API call
3. API routes — always pass `tenantId` to DB queries
4. PostgreSQL RLS — last line of defense at DB level

---

# AUTOMATION SCOPE

Automation is a core feature, not an add-on. Vendors should do zero manual work after setup.

**Automated tasks**:
- Auto-post products to groups on a schedule
- Auto-parse customer replies as orders
- Auto-send confirmation when order is created
- Auto-broadcast status updates (confirmed, shipped, arrived)
- Auto-send payment reminders (24h after order if unpaid)
- Auto-send delivery follow-up (5 days after shipped)
- Auto-generate daily report to vendor (11pm)
- Auto-alert vendor when stock is zero

---

# PROJECT STRUCTURE

```
merchander/
├── web/              # Next.js (dashboard, API routes)
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── prisma/
└── bot/              # Python (WhatsApp, Telegram, automation)
    ├── api/
    ├── bots/
    ├── automation/
    ├── core/
    └── tasks/
```

---

# PLATFORM SUPPORT TIMELINE

| Platform | Timeline | Priority |
|----------|----------|---------|
| WhatsApp | Week 2 | P0 |
| Telegram | Week 3 | P0 |
| Instagram DM | Post-MVP | P2 |
| Web shop | Post-MVP | P2 |

---

# 6-WEEK TIMELINE

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Foundation | Tenant isolation, auth, DB |
| 2 | WhatsApp | Connect, post, capture orders |
| 3 | Telegram | Connect, post, capture orders |
| 4 | Automation | Scheduler, workflows, alerts |
| 5 | Dashboard | Orders, analytics, products |
| 6 | Launch | Multi-store, testing, deploy |

---

# POST-MVP BACKLOG

1. Payment integration (vendor's own PayStack key)
2. Instagram DM bot
3. Customer loyalty tracking
4. Bulk product upload (CSV)
5. Multi-user per tenant (invite staff)
6. Custom automation rules
7. Mobile app (PWA)
8. Custom domain per tenant

---

# DOCS INDEX

| File | Purpose |
|------|---------|
| `01_SPECIFICATION.md` | Full platform spec, architecture, flows |
| `02_IMPLEMENTATION_GUIDE.md` | Code examples, folder structure |
| `03_ROADMAP.md` | 6-week plan, daily tasks, checkpoints |
| `04_QUICK_START.md` | 30-minute setup guide |
| `05_PROJECT_RECORD.md` | This file — all decisions, context |

---

# CONTEXT: WHY THIS DESIGN

**Original idea**: Marketplace (like Jumia) where multiple vendors list products.

**Problem discovered**: If vendors share a marketplace, customers can compare prices and jump between vendors. A vendor could lose loyal customers to a competitor on the same platform.

**Competitor observed**: MerchBot (merchbot.vercel.app) — a WhatsApp-only automation bot.

**Final decision**: Multi-tenant SaaS where:
- Each vendor is completely isolated (no shared storefront)
- Customers stay in WhatsApp/Telegram (no new app)
- Automation handles everything (posting, capturing, updating)
- Telegram added as second platform (MerchBot only does WhatsApp)
- Platform makes money from monthly subscriptions

---

**Ready to build. Start with `04_QUICK_START.md`.**
