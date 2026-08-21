# MERCHANDER: Product Roadmap

**Status**: Strategy Reset (August 2026)
**Objective**: Build a Social Commerce Operating System for Ghanaian Importers and Resellers.

## The New Strategic Sequence

We are abandoning the previous 6-week timeline in favor of a validation-driven rollout focused on solving the core operations of social-first merchants.

---

### Phase 1: Competitive Intelligence (Completed)
- Deep teardown of highest-threat competitors (Clerk, Ordermate, MerchBot).
- Identification of gaps (Import/Pre-order lifecycle).

### Phase 2: Merchant Validation
- Interview actual Ghanaian importers/resellers.
- Validate assumptions on pre-orders, sea-freight tracking, and customer deposits.
- Test pricing models (Subscription vs. Usage vs. Hybrid).

### Phase 3: Problem Ranking
- Identify the three operational problems merchants will actually pay to solve.

### Phase 4: Product Strategy (Completed)
- PRD v2.0 finalized.

### Phase 5: Architecture Redesign (In Progress)
- Shift to the 3-Layer OS Architecture (Commerce Core, Intelligence, Channel Adapters).
- Ensure strict multi-tenant isolation via PostgreSQL RLS.
- Initialize Next.js, Python, and the massive Day 1 Database schema (Suppliers, Purchases, Shipments, Pre-orders).

### Phase 6: MVP Development (The True MVP)

The MVP must prove one central hypothesis: **Can Merchander reliably turn social conversations into organized commerce operations for a real merchant?**

*Note: The MVP relies on manual data recording for payments, leaving payment gateway integrations for Post-MVP.*

- **Merchant & Workspace**: Registration, store setup, products (with availability variants: AVAILABLE, PRE_ORDER, OUT_OF_STOCK), inventory, customers, suppliers.
- **Procurement**: Purchases, supplier costs, supplier payment records, outstanding balances, shipping fees, import costs.
- **Shipments**: Shipment creation, supplier association, products, quantities, ETAs, arrival statuses.
- **Pre-orders**: Pre-order products, customer reservations, shipment association, payment statuses.
- **Orders**: Order creation, status, customer/product association, customer payment records.
- **Conversational Commerce**: WhatsApp integration, product questions, availability checks, basic order capture, and human escalation.
- **Dashboard**: Orders, inventory, customers, suppliers, shipments, payments, and attention items.

### Phase 7: Post-MVP Roadmap (Expansion)

Following a successful MVP launch and validation, we will execute the following expansions:

- **Post-MVP Phase 2 (Payments)**: Payment provider integration, customer payment links, automated confirmations, payment reminders.
- **Post-MVP Phase 3 (Import Commerce)**: Advanced shipment management, landed-cost allocation, better pre-order workflows, supplier performance.
- **Post-MVP Phase 4 (Fulfillment)**: Delivery integrations, pickup, delivery zones, rider tracking.
- **Post-MVP Phase 5 (Intelligence)**: Demand forecasting, restock recommendations, product profitability, customer segmentation, supplier insights.
- **Post-MVP Phase 6 (Cross-Border Commerce)**: International customer payments, multi-currency pricing, international delivery.
- **Post-MVP Phase 7 (Supplier Payments)**: China payment infrastructure, CIPS integrations, FX, settlement.
