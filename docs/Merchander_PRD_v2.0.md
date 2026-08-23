# Merchander — Product Requirements Document (PRD)

**Company:** SHERO  
**Product:** Merchander  
**Document Type:** Product Requirements Document  
**Version:** 2.0  
**Status:** Strategic Revision — Pre-Development  
**Market:** Ghana, with future international expansion  
**Primary Beachhead:** Importers, resellers, and growing social-commerce merchants

---

# 1. Product Overview

Merchander is a **social-commerce operating system** designed to help merchants manage the business behind their customer conversations.

The product begins with Ghanaian importers, resellers, and social-first merchants who currently rely heavily on WhatsApp, social media, spreadsheets, manual records, and disconnected tools to run their businesses.

Merchander connects the merchant's **supply side and sales side** into one operational system.

### Core business lifecycle

```text
SUPPLIER
   ↓
PROCUREMENT
   ↓
SHIPMENT
   ↓
INVENTORY
   ↓
CUSTOMER
   ↓
ORDER
   ↓
PAYMENT
   ↓
FULFILLMENT
   ↓
DELIVERY
   ↓
PROFIT
```

The system should allow the merchant to understand this entire lifecycle without requiring Merchander itself to move money between parties.

---

# 2. Product Vision

> **Give social-first merchants the infrastructure to operate and scale their businesses without being overwhelmed by the complexity behind every customer conversation.**

Merchander should eventually become the place where a merchant understands:

- What they are buying
- What is coming
- What they have
- What they are selling
- Who is buying
- Who has paid
- Who still owes
- What they owe suppliers
- What shipping costs them
- What needs fulfillment
- What is actually profitable
- What they should do next

---

# 3. Product Mission

> **To make organized commerce accessible to growing social-first merchants by turning fragmented conversations, purchases, orders, payments, inventory, and fulfillment into one connected business operation.**

---

# 4. Problem Statement

Social-first merchants have already adopted platforms such as WhatsApp as part of their sales process.

However, WhatsApp was not designed to operate a complete business.

As a merchant grows, they may have to manually manage:

- Product catalogs
- Customer conversations
- Orders
- Inventory
- Pre-orders
- Supplier purchases
- Shipments
- Supplier balances
- Shipping costs
- Customer payments
- Delivery
- Customer follow-ups
- Business records

This creates fragmented operations.

A merchant may know:

> "I sold 50 bags."

but not easily know:

> "How much did those bags actually cost me after supplier, shipping and import costs?"

Or:

> "Which customers already paid for the shipment arriving next week?"

Or:

> "How much do I still owe my supplier?"

Merchander should connect these pieces.

---

# 5. Core Product Insight

The problem is not simply:

> **"Merchants need a better WhatsApp bot."**

The deeper problem is:

> **Merchants have built businesses around social conversations, but the operational infrastructure behind those conversations is fragmented and manual.**

Therefore:

**WhatsApp is a channel.**

**Commerce operations are the product.**

---

# 6. Product Positioning

### Category

**Social Commerce Operating System**

### Initial market

**Ghana**

### Beachhead

**Importers, resellers, and growing social-commerce merchants**

### Primary customer channel

**WhatsApp**

### Future channels

- Telegram
- Instagram
- Web
- Other supported channels

### Core promise

> **Turn conversations into organized commerce.**

### Extended promise

> **From the first customer conversation to the final delivery, Merchander keeps your business organized.**

---

# 7. Target Users

## 7.1 Primary User — Merchant

The merchant owns or operates the business.

They need to:

- Manage products
- Manage suppliers
- Record purchases
- Track shipments
- Track inventory
- Manage customers
- Manage orders
- Record payments
- Track fulfillment
- Understand profitability

## 7.2 Secondary User — Staff

Staff may assist with:

- Order processing
- Inventory
- Customer support
- Fulfillment
- Delivery
- Supplier records

Staff access must be permission-based.

## 7.3 External User — Customer

Customers interact primarily through the merchant's sales channels.

They should be able to:

- Ask about products
- Check availability
- Place orders
- Receive payment instructions
- Receive order updates
- Receive delivery/pickup information

Customers should not need to understand Merchander.

## 7.4 External Entity — Supplier

Suppliers are not Merchander users in the initial MVP.

They are represented as business entities within the merchant's workspace.

The merchant can record:

- Supplier information
- Purchases
- Supplier invoices
- Amount paid
- Amount outstanding
- Shipment information
- Shipping costs
- Import costs

Direct supplier payment through Merchander is **not part of the current scope**.

---

# 8. Ideal Customer Profile

The ideal first merchant is already selling actively through social channels and is beginning to lose operational control.

Typical characteristics:

- Multiple products
- Frequent customer conversations
- Multiple WhatsApp groups/channels
- Manual order records
- Repeated customer questions
- Inventory challenges
- Pre-orders
- Imported products
- Supplier relationships
- Customer deposits or balances
- Delivery requirements
- Returning customers

The strongest initial fit is a merchant who feels:

> **"My business has grown beyond WhatsApp and spreadsheets, but I am not ready for complicated enterprise software."**

---

# 9. Product Principles

## 9.1 Simple by Default

The merchant should not need technical expertise.

## 9.2 Business First

Every feature must solve a real business problem.

## 9.3 Automation With Control

Automation should reduce repetitive work without taking away important merchant decisions.

## 9.4 Channel Agnostic

Merchander must not depend architecturally on one communication platform.

## 9.5 Connected Operations

Supplier, inventory, customer, order, payment and fulfillment data should connect.

## 9.6 Progressive Complexity

The product should remain simple for small merchants while becoming more powerful as their business grows.

---

# 10. Product Pillars

Merchander consists of seven major product pillars.

## 10.1 Commerce Core

The central business system.

Includes:

- Stores
- Products
- Product variants
- Pricing
- Inventory
- Customers
- Orders
- Staff
- Business settings

## 10.2 Conversational Commerce

The system converts customer conversations into structured commerce actions.

It should eventually understand requests such as:

> "Do you have size 42?"

> "How much is the black one?"

> "Give me two."

> "Reserve one for me."

> "When will the next shipment arrive?"

The conversation should be connected to the merchant's actual:

- Products
- Inventory
- Orders
- Customer records
- Pre-orders
- Availability

## 10.3 Supplier & Procurement Management

Merchander must support the merchant's supply side.

This includes:

- Suppliers
- Purchases
- Purchase records
- Supplier invoices
- Supplier costs
- Amount paid
- Outstanding balance
- Payment records
- Shipment association

Direct supplier payment is not currently required.

## 10.4 Shipment & Import Management

For importers and resellers, products often exist before they physically arrive.

Merchander must therefore support:

- Shipments
- Shipment batches
- Expected arrival date
- Supplier association
- Products within shipment
- Quantities
- Shipping fees
- Import-related costs
- Pre-orders attached to shipment
- Arrival status

## 10.5 Inventory Management

Inventory must connect to procurement and sales.

The system should understand:

```text
Purchased
   ↓
In Shipment
   ↓
Received
   ↓
Available
   ↓
Reserved
   ↓
Sold
```

Inventory should not be treated as an isolated number.

## 10.6 Orders, Payments & Fulfillment

Merchander must connect:

```text
ORDER
  ↓
PAYMENT
  ↓
FULFILLMENT
  ↓
DELIVERY / PICKUP
  ↓
COMPLETED
```

Customer payments are recorded separately from supplier payments.

The initial system should support payment records and payment status.

## 10.7 Business Intelligence

Merchander should eventually turn operational data into useful decisions.

Examples:

- Sales performance
- Inventory performance
- Supplier costs
- Shipping costs
- Outstanding customer payments
- Outstanding supplier balances
- Product profitability
- Demand trends
- Restock recommendations

---

# 11. Supplier Management Requirements

## 11.1 Supplier Profile

A merchant must be able to create a supplier.

### Required information

- Supplier name
- Country
- Contact person
- Contact information
- Supplier notes

### Optional information

- Address
- Payment details/reference information
- Supplier category
- Internal notes

---

# 12. Purchase Management

A merchant must be able to record a purchase from a supplier.

A purchase should contain:

- Supplier
- Purchase reference
- Date
- Products
- Quantity
- Unit cost
- Total supplier cost
- Currency
- Payment status
- Amount paid
- Outstanding balance
- Notes

---

# 13. Supplier Payment Recording

Merchander must support **recording supplier payments**.

It should not initially execute the payment.

A payment record should contain:

- Supplier
- Related purchase
- Amount
- Currency
- Date
- Payment method
- Reference
- Notes
- Attachment/receipt where supported

Example:

```text
Supplier:
Guangzhou Fashion Co.

Purchase:
PO-0042

Invoice:
$2,400

Paid:
$1,500

Outstanding:
$900
```

The system should automatically calculate the outstanding amount.

---

# 14. Shipping & Import Cost Recording

Shipping fees must be recorded as part of the procurement/shipment lifecycle.

A shipment may include:

- Supplier cost
- Shipping fee
- Customs/import cost
- Handling fee
- Other documented costs

Example:

```text
Supplier purchase      $2,000
Shipping                 $400
Import costs             $200
-----------------------------
Total landed cost      $2,600
```

Where the quantity is known, Merchander should be able to calculate an estimated **landed cost per unit**.

Example:

```text
100 units
Total landed cost = $2,600

Estimated landed cost/unit = $26
```

This becomes important for future profitability calculations.

---

# 15. Shipment Management

A shipment should be connected to:

- Supplier
- Purchase
- Products
- Quantity
- Shipping costs
- Import costs
- Expected arrival
- Actual arrival
- Status

Possible statuses:

- PREPARING
- IN_TRANSIT
- ARRIVING
- RECEIVED
- CANCELLED

---

# 16. Pre-Order Management

Pre-orders are a core requirement for the initial target market.

Products should support:

```text
AVAILABLE
PRE_ORDER
OUT_OF_STOCK
```

A pre-order should be connected to:

- Customer
- Product
- Quantity
- Shipment
- Expected arrival
- Price
- Payment status
- Fulfillment status

When the shipment arrives, Merchander should know which customers are waiting for the product.

---

# 17. Product Requirements

A product must support:

- Name
- Description
- Images
- Category
- SKU
- Variants
- Price
- Cost
- Availability
- Inventory quantity
- Pre-order capability
- Supplier relationship

Variants may include:

- Size
- Color
- Model
- Other merchant-defined attributes

---

# 18. Inventory Requirements

The system must track inventory changes.

Inventory should be affected by:

### Incoming

- Purchase received
- Shipment received

### Reserved

- Pre-order
- Confirmed order

### Outgoing

- Fulfilled order
- Damaged/lost stock
- Manual adjustment

The system should maintain an audit trail of important inventory changes.

---

# 19. Customer Management

Each merchant should have a customer record containing, where available:

- Name
- Phone number
- Contact/channel identifier
- Orders
- Payment history
- Outstanding balance
- Purchase history
- Delivery information
- Notes

The customer record should connect to conversations and orders.

---

# 20. Conversational Commerce Requirements

The conversational layer should be capable of:

### Product questions

> "How much?"

### Availability

> "Do you have it?"

### Variants

> "Do you have 42?"

### Quantity

> "Give me three."

### Pre-orders

> "When is it coming?"

### Order creation

> "I'll take two."

### Order status

> "Has my order arrived?"

The system must use actual merchant data rather than inventing:

- Prices
- Stock
- Product information
- Delivery details
- Order status

---

# 21. AI Safety Requirements

AI should not automatically perform every action.

## GREEN — Automatic

- Product information
- Price
- Availability
- Basic order capture
- Order status

## YELLOW — Approval

- Discounts
- Refunds
- Unusual orders
- Order modifications
- Exceptional payment arrangements

## RED — Human

- Serious complaints
- Fraud concerns
- Complex disputes
- Sensitive negotiations

When uncertain, the system should escalate rather than fabricate an answer.

---

# 22. Order Management

Orders should contain:

- Order number
- Customer
- Products
- Quantities
- Prices
- Discounts where applicable
- Delivery/pickup information
- Payment status
- Fulfillment status
- Dates
- Notes

### Initial order states

```text
PENDING
CONFIRMED
PROCESSING
COMPLETED
CANCELLED
```

---

# 23. Customer Payment Recording

Merchander should track:

- Total order amount
- Amount paid
- Amount outstanding
- Payment status
- Payment method
- Payment reference
- Payment date

Possible payment states:

```text
UNPAID
PARTIALLY_PAID
PAID
REFUNDED
```

The initial product may record payments without becoming the payment processor itself.

---

# 24. Supplier vs Customer Money

This distinction is important.

### Customer side

```text
Customer
   ↓
Order
   ↓
Payment
   ↓
Merchant
```

### Supplier side

```text
Merchant
   ↓
Purchase
   ↓
Supplier obligation
   ↓
Recorded payment
```

Merchander currently **records both sides**.

It does not need to move supplier money.

---

# 25. Profitability

Merchander should eventually calculate actual product economics.

For an imported product:

```text
Supplier Cost
+
Shipping
+
Import Costs
+
Other Allocated Costs
=
Landed Cost
```

Then:

```text
Selling Price
-
Landed Cost
=
Gross Profit
```

This should be treated as an important future capability, while the underlying cost data should be captured from the beginning.

---

# 26. Dashboard Requirements

The dashboard should focus on **what needs attention**, not merely display statistics.

### Primary sections

#### Orders

- New
- Pending
- Processing
- Completed

#### Inventory

- Low stock
- Out of stock
- Incoming
- Reserved

#### Payments

- Customer balances
- Recent payments

#### Suppliers

- Outstanding supplier balances
- Recent purchases

#### Shipments

- In transit
- Arriving
- Recently received

#### Intelligence

- Sales trends
- Important alerts
- Recommended actions

---

# 27. Attention Center

Merchander should eventually generate actionable alerts such as:

> 12 orders are awaiting fulfillment.

> 8 customers have outstanding balances.

> Shipment SHP-042 is expected tomorrow.

> Supplier ABC has GHS 4,500 outstanding.

> Product X has only 5 units remaining.

> 18 customers have pre-ordered the incoming shipment.

This is more valuable than simply showing charts.

---

# 28. Multi-Tenancy

Merchander remains a multi-tenant SaaS platform.

Each merchant operates within an isolated workspace.

The existing architectural principle of:

- `tenant_id`
- tenant-scoped data
- PostgreSQL Row-Level Security

should remain.

---

# 29. Roles & Permissions

Initial roles should include:

### Owner

Full access.

### Admin

Business management access.

### Staff

Restricted operational access.

Future permissions may cover:

- Orders
- Inventory
- Customers
- Suppliers
- Payments
- Reports
- Settings

---

# 30. Channel Architecture

WhatsApp should **not** be embedded into the commerce core.

Instead:

```text
                  MERCHANDER CORE
                        │
        ┌───────────────┼────────────────┐
        ↓               ↓                ↓
    WhatsApp         Telegram          Web
     Adapter          Adapter          Adapter
```

This allows channels to change without rebuilding the underlying commerce system.

---

# 31. WhatsApp

WhatsApp is the primary initial conversational channel.

The first implementation may support the existing WhatsApp automation approach for validation.

However:

> **The long-term architecture must not depend on an unofficial WhatsApp connection.**

The commerce core must remain independent from the specific WhatsApp integration technology.

---

# 32. Payments Architecture

Payments should use an abstraction layer.

```text
              MERCHANDER
                   │
            PAYMENT SERVICE
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
   Provider A             Provider B
```

This prevents the product from becoming dependent on a single payment provider.

### Current scope

- Record customer payments
- Record supplier payments
- Track balances
- Track references
- Track payment status

### Future scope

- Payment initiation
- International customer payments
- Supplier payment integrations
- Cross-border payment rails
- Multi-currency capabilities

Direct supplier payment is **not current MVP scope**.

---

# 33. International Supplier Payments

International supplier payment is explicitly a **future exploration area**.

Potential future routes may include China-focused payment infrastructure such as the CIPS-related capability available through Stanbic Ghana.

However, Merchander should not build around a specific payment rail until:

- Availability is verified
- Eligibility is understood
- Regulatory requirements are understood
- API/integration capability is confirmed
- Merchant demand is validated
- Economics are understood

For now:

> **Record the obligation. Record the payment. Record the shipping/import costs.**

---

# 34. Security Requirements

Merchander will process commercially sensitive and potentially personal information.

The system must provide:

- Tenant isolation
- Authentication
- Authorization
- Secure credential storage
- Encryption where appropriate
- Audit logging
- Secure API design
- Input validation
- Rate limiting
- Backup strategy
- Data recovery procedures

Payment credentials should not be stored directly unless absolutely required and appropriately secured.

---

# 35. Auditability

Important business actions should be auditable.

Examples:

- Product created
- Product price changed
- Inventory adjusted
- Purchase created
- Supplier payment recorded
- Order created
- Order modified
- Payment recorded
- Refund recorded
- Staff action performed

The audit trail should identify:

- Actor
- Action
- Timestamp
- Relevant entity
- Previous value where appropriate
- New value where appropriate

---

# 36. Notifications

Merchander should eventually support:

### Customer notifications

- Order confirmation
- Payment confirmation
- Shipment arrival
- Order ready
- Delivery updates

### Merchant notifications

- New order
- Low stock
- Supplier balance
- Shipment arrival
- Payment received
- AI escalation

---

# 37. Analytics

Initial analytics should remain practical.

### Sales

- Revenue
- Orders
- Average order value
- Top products

### Customers

- New customers
- Returning customers
- Customer purchase history

### Inventory

- Stock levels
- Fast-moving products
- Slow-moving products

### Procurement

- Supplier spending
- Purchase history
- Outstanding balances
- Shipping costs

### Future

- Product profitability
- Demand forecasting
- Supplier performance
- Customer lifetime value

---

# 38. MVP Scope

The MVP should prove one central hypothesis:

> **Can Merchander reliably turn social conversations into organized commerce operations for a real merchant?**

### MVP includes

#### Merchant

- Registration
- Workspace
- Store
- Products
- Inventory
- Customers
- Suppliers

#### Procurement

- Purchases
- Supplier costs
- Supplier payment records
- Outstanding balances
- Shipping fees
- Import/other cost records

#### Shipments

- Shipment creation
- Supplier association
- Products
- Quantities
- ETA
- Shipping costs
- Arrival status

#### Pre-orders

- Pre-order products
- Customer reservations
- Shipment association
- Payment status

#### Orders

- Order creation
- Order status
- Customer association
- Product association
- Payment records

#### Conversational commerce

- WhatsApp
- Product questions
- Availability
- Basic order capture
- Human escalation

#### Dashboard

- Orders
- Inventory
- Customers
- Suppliers
- Shipments
- Payments
- Attention items

---

# 39. Explicit MVP Exclusions

The MVP will **not** include:

- Direct supplier payments
- Cross-border supplier payments
- CIPS integration
- Merchant financing
- Supplier marketplace
- Full accounting
- Full ERP functionality
- Delivery network ownership
- Advanced predictive AI
- Multi-country tax engine
- Complex multi-currency treasury
- Every social channel

These may be considered later based on evidence.

---

# 40. Post-MVP Roadmap

## Phase 2 — Payments

- Payment provider integration
- Customer payment links
- Automated payment confirmation
- Payment reminders
- More payment methods

## Phase 3 — Import Commerce

- Advanced shipment management
- Landed-cost allocation
- Better pre-order workflows
- Supplier performance

## Phase 4 — Fulfillment

- Delivery integrations
- Pickup
- Delivery zones
- Tracking

## Phase 5 — Intelligence

- Demand forecasting
- Restock recommendations
- Product profitability
- Customer segmentation
- Supplier insights

## Phase 6 — Cross-Border Commerce

- International customer payments
- Multi-currency pricing
- International delivery
- Cross-border merchant workflows

## Phase 7 — Supplier Payments

Explore:

- China payment infrastructure
- CIPS-related integrations
- Other international supplier-payment providers
- FX
- Settlement
- Compliance

Only after validating the opportunity and requirements.

---

# 41. Non-Goals

Merchander is not initially intended to become:

- A bank
- A payment processor
- A logistics company
- A marketplace
- A supplier marketplace
- A full accounting platform
- A generic ERP
- A social network

Merchander should integrate with these ecosystems where appropriate rather than attempt to own everything.

---

# 42. Competitive Requirements

Merchander must assume that competitors already provide:

- WhatsApp automation
- AI customer responses
- Order capture
- Analytics
- Payments
- Basic CRM
- Delivery capabilities

Therefore, simply matching those features is insufficient.

The product must differentiate through the **connected merchant operation**:

```text
Supplier
   ↓
Purchase
   ↓
Shipment
   ↓
Landed Cost
   ↓
Inventory
   ↓
Customer
   ↓
Order
   ↓
Payment
   ↓
Fulfillment
   ↓
Profit
```

---

# 43. Competitive Advantage

The strongest initial differentiation is:

### 1. Importer/reseller focus

Designed around their actual operational workflow.

### 2. Supply + sales in one system

Not just customer-facing automation.

### 3. Pre-order and shipment intelligence

Products can be sold before they physically arrive.

### 4. Connected costs

Supplier + shipping + import costs can eventually become true landed cost.

### 5. Conversational commerce

Customers can continue using familiar channels.

### 6. Merchant intelligence

The system eventually tells merchants what requires attention and what they should consider doing next.

---

# 44. Success Metrics

## Activation

- Time to create first product
- Time to connect first channel
- Time to first customer interaction
- Time to first order

## Commerce

- Orders captured
- Successful orders
- Order completion rate
- Payment completion rate

## Automation

- AI resolution rate
- Human escalation rate
- Incorrect automation rate
- Order extraction accuracy

## Operations

- Inventory accuracy
- Shipment tracking usage
- Supplier records created
- Payment records created
- Orders fulfilled

## Retention

- Weekly active merchants
- Monthly active merchants
- Merchant retention
- Orders per merchant

## Business

- MRR
- ARPU
- CAC
- Churn
- Gross margin

---

# 45. North Star Metric

The primary long-term metric should be:

> **Successful commerce transactions processed through Merchander.**

Secondary metrics can measure:

- Orders
- Revenue
- Active merchants
- Automation
- Retention

But messages sent or AI responses generated should never become the primary measure of product success.

---

# 46. Technical Architecture Direction

The architecture should be organized around the commerce core.

```text
                    CLIENTS
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
       Web App      Channels      APIs
                       │
                       ↓
              CHANNEL ADAPTERS
                       │
                       ↓
              COMMERCE CORE
                       │
       ┌───────────────┼────────────────┐
       ↓               ↓                ↓
  Procurement       Commerce       Fulfillment
       │               │                │
 Suppliers         Products          Delivery
 Purchases         Customers         Status
 Shipments         Orders
 Costs             Payments
       │               │
       └───────────────┼────────────────┘
                       ↓
                  INTELLIGENCE
                       │
              AI + Analytics
                       │
                       ↓
                   DATABASE
```

---

# 47. Core Data Model

At a high level:

```text
Tenant
 ├── Users
 ├── Stores
 ├── Suppliers
 │    └── Purchases
 │         └── Purchase Items
 │
 ├── Shipments
 │    ├── Shipment Items
 │    ├── Shipping Costs
 │    └── Import Costs
 │
 ├── Products
 │    ├── Variants
 │    └── Inventory
 │
 ├── Customers
 │    └── Orders
 │         ├── Order Items
 │         ├── Payments
 │         └── Fulfillment
 │
 ├── Conversations
 ├── Automation
 └── Audit Logs
```

The exact schema should be finalized during technical design.

---

# 48. Data Relationships That Matter

The system must preserve relationships between:

### Supplier → Purchase

Who supplied the product?

### Purchase → Shipment

Which shipment contains it?

### Shipment → Product

What is arriving?

### Shipment → Costs

How much did getting it here cost?

### Shipment → Pre-orders

Who is waiting for it?

### Product → Inventory

How much is available?

### Customer → Order

Who bought it?

### Order → Payment

Has it been paid?

### Order → Fulfillment

Has it been delivered?

These relationships are fundamental to Merchander's value.

---

# 49. Future Intelligence

Once enough operational data exists, Merchander can eventually answer:

### Inventory

> "You may run out of this product in six days."

### Procurement

> "Your last three shipments of this product sold out within two weeks."

### Supplier

> "Supplier A is currently costing you less per landed unit than Supplier B."

### Customers

> "Customers who bought this product frequently also bought this one."

### Profitability

> "Your selling price increased, but your shipping cost has reduced your margin."

This is the eventual intelligence layer.

---

# 50. Product Evolution

The product should evolve through four levels.

### Level 1 — Record

Merchander records what happened.

### Level 2 — Organize

Merchander connects the information.

### Level 3 — Automate

Merchander performs repetitive work.

### Level 4 — Advise

Merchander helps the merchant make decisions.

The MVP should primarily establish **Levels 1 and 2**, with carefully selected Level 3 capabilities.

Level 4 comes after enough reliable data exists.

---

# 51. Final Product Definition

> **Merchander is a social-commerce operating system for growing merchants, beginning with Ghanaian importers and resellers. It connects suppliers, purchases, shipments, inventory, customers, conversations, orders, payments and fulfillment in one system, allowing merchants to move beyond manually managing their businesses through messaging apps and spreadsheets.**

---

# 52. Final Strategic Boundary

For the current product:

### We will:

- Record supplier obligations.
- Record supplier payments.
- Record shipping fees.
- Record import-related costs.
- Connect these costs to purchases and shipments.
- Track customer payments.
- Connect sales to inventory and fulfillment.

### We will not yet:

- Move money to suppliers.
- Integrate CIPS.
- Become a cross-border payment provider.

Those capabilities remain future opportunities once Merchander has validated the underlying merchant workflow.

---

# 53. Product North Star

Merchander should ultimately answer one question for the merchant:

> **"Do I understand what is happening in my business, and do I know what needs to happen next?"**

If the answer becomes **yes**, Merchander is doing its job.

---

# 54. Approval Gate Before Development

Development should begin only after the following are validated:

- [ ] Target merchant confirmed
- [ ] Core problems confirmed
- [ ] Supplier workflow confirmed
- [ ] Shipment/pre-order workflow confirmed
- [ ] Customer ordering workflow confirmed
- [ ] Payment-recording workflow confirmed
- [ ] Shipping-cost workflow confirmed
- [ ] MVP scope frozen
- [ ] Technical architecture reviewed
- [ ] WhatsApp/channel strategy reviewed
- [ ] Security requirements reviewed
- [ ] Pricing hypothesis defined
- [ ] Pilot merchants identified

**This PRD is the authoritative product baseline for Merchander v2.0.**

---

# 55. UI/UX Design References

- **Dashboard & Core UI Aesthetic:** [StudioGrid Pro E-commerce](https://studiogrid-pro-ecommerce.netlify.app/)
  - Use as the primary benchmark for KPI widgets, layout architecture, and overall modern aesthetic.
