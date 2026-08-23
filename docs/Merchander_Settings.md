# Merchander Settings — Product Specification

**Product:** Merchander  
**Company:** SHERO  
**Status:** Product Structure  
**Version:** 1.0

---

# 1. Purpose

Settings is the **control center for the merchant's workspace**.

It allows merchants to configure their:

- Business
- Store
- Commerce operations
- Social commerce channels
- Team
- Notifications
- AI and automation
- Data and security
- Integrations
- Subscription

Settings should configure **how Merchander operates**. It should not become a second dashboard.

For example:

> Low-stock threshold: **5 units**

belongs in Settings.

> **4 units remaining — restock soon**

belongs on the Dashboard.

Likewise:

> AI order capture: **Enabled**

belongs in Settings.

> **AI captured 12 orders today**

belongs on the Dashboard or Analytics.

---

# 2. Core Principle

Merchander is a **social-commerce operating system**, not a WhatsApp commerce application.

Therefore:

> **Social is the channel category. WhatsApp is only one possible channel.**

The product architecture must not hard-code WhatsApp as the primary identity of the channel layer.

---

# 3. Settings Information Architecture

```text
SETTINGS

ACCOUNT
├── Profile
├── Security
└── Notifications

BUSINESS
├── Business Profile
├── Store
├── Business Hours
└── Locations

COMMERCE
├── Orders
├── Products & Inventory
├── Pricing & Taxes
└── Payments

OPERATIONS
├── Suppliers
├── Shipments
├── Delivery & Fulfillment
└── Staff & Permissions

SOCIAL COMMERCE
├── Connected Channels
├── Conversations
├── Automation
└── Channel Preferences

INTELLIGENCE
├── AI Preferences
└── Automation

DATA & SECURITY
├── Data & Privacy
├── Audit Log
└── Export Data

SYSTEM
├── Integrations
├── Subscription
└── Advanced
```

---

# 4. Account

## 4.1 Profile

Personal account information.

### Fields

- Profile photo
- Full name
- Email
- Phone number
- Preferred language
- Time zone
- Password/security access

## 4.2 Security

- Change password
- Active sessions
- Sign out of other sessions
- Two-factor authentication when supported
- Login/security activity

Future:

- Passkeys
- Advanced authentication policies

## 4.3 Notifications

Notification categories:

- Orders
- Inventory
- Payments
- Shipments
- Social Commerce
- Intelligence

Delivery methods, where supported:

- In-app
- Email
- Social/channel notification

---

# 5. Business

## 5.1 Business Profile

Business-level identity separate from the individual user account.

### Fields

- Business name
- Business logo
- Business description
- Business category
- Country
- Region/city
- Business address
- Contact information
- Business registration information where applicable
- Default currency

## 5.2 Store

The merchant's storefront identity.

### Fields

- Store name
- Store logo
- Store description
- Store URL
- Store contact information
- Social links
- Store visibility
- Default catalog
- Store policies

Future:

- Custom domain
- Public storefront customization

## 5.3 Business Hours

Used by the social-commerce and automation layers.

Example:

```text
Monday       08:00 – 20:00
Tuesday      08:00 – 20:00
Wednesday    08:00 – 20:00
Thursday     08:00 – 20:00
Friday       08:00 – 20:00
Saturday     09:00 – 18:00
Sunday       Closed
```

These settings can control automated responses outside operating hours.

## 5.4 Locations

For merchants operating multiple physical locations.

Location types:

- Shop
- Warehouse
- Pickup point
- Branch
- Other merchant-defined location

Each location can eventually connect to:

- Inventory
- Fulfillment
- Orders
- Pickup
- Delivery

---

# 6. Commerce

## 6.1 Orders

Order behavior configuration.

### Settings

- Order numbering
- Order confirmation
- Order cancellation rules
- Order expiry
- Partial orders
- Pre-orders
- Default order status
- Customer notes
- Order modification permissions

Example:

```text
Order numbering

Prefix
ORD-

Starting number
1000
```

## 6.2 Products & Inventory

### Product settings

- SKU generation
- Product categories
- Product variants
- Units
- Default product status

### Inventory settings

- Low-stock threshold
- Out-of-stock behavior
- Inventory reservation
- Negative inventory policy
- Stock adjustment permissions
- Inventory locations
- Pre-order behavior

Merchander should preferably prevent negative inventory unless the merchant explicitly enables such behavior.

## 6.3 Pricing & Taxes

### Pricing

- Default currency
- Price display
- Customer-specific pricing
- Wholesale pricing
- Discount behavior

### Taxes

- Tax configuration
- Tax-inclusive pricing
- Tax-exclusive pricing
- Applicable tax categories

The initial implementation should remain simple and appropriate for the launch market rather than attempting to build a complete international tax engine.

## 6.4 Payments

Payments settings must distinguish between:

> **Recording payments**

and:

> **Processing payments**

### Current capabilities

Merchants can configure accepted payment methods such as:

- Mobile money
- Bank transfer
- Cash
- Card
- Other

They can also configure:

- Payment instructions
- Payment references
- Default payment method
- Partial-payment behavior

### Future

- Payment providers
- Payment links
- Automated reconciliation
- International payments
- Supplier payment integrations

Direct supplier payment is not part of the current MVP.

---

# 7. Operations

## 7.1 Suppliers

Procurement configuration.

### Settings

- Purchase numbering
- Default supplier currency
- Supplier payment terms
- Purchase approval
- Supplier categories
- Default purchase status

Merchander records supplier obligations and supplier payments in the current product scope.

## 7.2 Shipments

Shipment configuration.

### Settings

- Shipment numbering
- Default shipment statuses
- Default shipping method
- Units
- Weight
- Currency
- Expected arrival rules
- Shipping-cost recording preferences
- Import/other-cost recording preferences

Future:

- Landed-cost allocation preferences

## 7.3 Delivery & Fulfillment

### Settings

- Pickup
- Delivery
- Delivery zones
- Delivery fees
- Fulfillment statuses
- Default fulfillment method
- Delivery instructions
- Preferred delivery partners

Future:

- Delivery-provider integrations
- Live tracking

## 7.4 Staff & Permissions

### Initial roles

**Owner** — Full access.

**Admin / Manager** — Business and operational management access.

**Staff** — Restricted operational access.

### Permission areas

- Orders
- Customers
- Products
- Inventory
- Suppliers
- Shipments
- Payments
- Reports
- Social channels
- Settings

Example:

| Permission | Owner | Manager | Staff |
|---|---:|---:|---:|
| Orders | ✓ | ✓ | ✓ |
| Customers | ✓ | ✓ | ✓ |
| Inventory | ✓ | ✓ | ✓ |
| Suppliers | ✓ | ✓ | — |
| Payments | ✓ | ✓ | — |
| Reports | ✓ | ✓ | — |
| Settings | ✓ | — | — |

The final permission model must integrate with Merchander's multi-tenant security architecture and PostgreSQL RLS.

---

# 8. Social Commerce

## 8.1 Connected Channels

This is deliberately named **Social Commerce**, not WhatsApp.

Merchander should treat each social platform as a channel adapter.

Possible channels include:

- WhatsApp
- Instagram
- Facebook
- TikTok
- Telegram
- Other supported platforms

The exact supported channels should be determined by product validation and technical/API availability.

Example:

```text
Social Channels

✓ WhatsApp
✓ Instagram
○ Facebook
○ TikTok
○ Telegram

[Connect channel]
```

A channel must not become the definition of Merchander itself.

---

# 9. Social Channel Architecture

The conceptual architecture is:

```text
                    MERCHANDER
                         │
                  COMMERCE CORE
                         │
              ┌──────────┴──────────┐
              ↓                     ↓
       SOCIAL CHANNEL LAYER      DIRECT WEB
              │
     ┌────────┼────────┬─────────┐
     ↓        ↓        ↓         ↓
 WhatsApp Instagram Facebook  TikTok
```

Each channel is an adapter around the same Merchander commerce core.

The core should understand:

```text
Customer
   ↓
Conversation
   ↓
Product
   ↓
Order
   ↓
Payment
   ↓
Fulfillment
```

It should not depend on a single social platform.

---

# 10. Conversations

Conversation behavior across connected social channels.

### Settings

- Welcome message
- Away message
- Business hours behavior
- Human handoff
- AI assistance
- Conversation assignment
- Staff notifications
- Escalation rules

The merchant should be able to maintain consistent business behavior while allowing channel-specific differences where necessary.

---

# 11. Channel Preferences

Settings that determine how the merchant presents and operates commerce through each channel.

### Potential controls

- Product visibility
- Catalog visibility
- Price display
- Stock visibility
- Order capture
- Payment instructions
- Response behavior
- Customer notifications
- Channel-specific automation

Example:

```text
Instagram

Product visibility       ON
Price display            ON
Stock display            OFF
Order capture            ON
AI assistance             ON
```

---

# 12. Automation

Automation should be channel-independent where possible.

Example:

```text
WHEN
A customer asks about product availability

THEN
Check Merchander inventory

IF
Available

THEN
Respond with current availability
```

Another:

```text
WHEN
A shipment is received

THEN
Find customers with matching pre-orders

THEN
Notify them through their available channel
```

Another:

```text
WHEN
Stock falls below configured threshold

THEN
Create an inventory alert
```

---

# 13. Intelligence

## 13.1 AI Preferences

AI should be configurable without exposing unnecessary technical complexity.

### AI Assistant

```text
Enabled / Disabled
```

### What AI can do

#### Green — Automatic

- Answer product questions
- Check availability
- Provide product information
- Capture basic orders
- Provide order status

#### Yellow — Approval

- Apply discounts
- Modify unusual orders
- Handle exceptional payment arrangements
- Other merchant-defined sensitive actions

#### Red — Human

- Serious complaints
- Fraud concerns
- Complex disputes
- Sensitive negotiations

When uncertain, AI should escalate rather than fabricate.

---

# 14. Data & Security

## 14.1 Data & Privacy

Merchander stores commercially sensitive and potentially personal information.

Settings should eventually include:

- Data export
- Customer-data handling
- Privacy information
- Data retention
- Workspace deletion
- Data processing information

## 14.2 Audit Log

Important business actions should be visible to authorized users.

Example:

```text
Audit Log

10:42 AM
Ibrahim changed product price

Black Sandal
₵120 → ₵135

10:31 AM
Mariam recorded supplier payment

$500

09:54 AM
Abdul fulfilled order

#ORD-1042
```

Audit records should identify:

- Actor
- Action
- Timestamp
- Entity
- Previous value where appropriate
- New value where appropriate

## 14.3 Export Data

Potential export categories:

- Products
- Customers
- Orders
- Payments
- Suppliers
- Purchases
- Shipments
- Inventory
- Reports

Potential formats:

- CSV
- JSON
- Excel

This reinforces merchant ownership and reduces unnecessary platform lock-in.

---

# 15. System

## 15.1 Integrations

A central place for external services.

Example:

```text
Connected

✓ Social Channel
✓ Payment Provider
✓ Accounting
✓ Delivery Provider

Available

○ Payment Provider
○ Accounting Platform
○ Logistics Provider
○ Other
```

Integrations should be added based on validated merchant needs rather than filling the page with unnecessary integrations.

## 15.2 Subscription

Eventually:

```text
Your Plan

Starter
₵XXX / month

Orders
248 / 500

AI conversations
1,240 / 2,000

Storage
2.4 GB / 10 GB
```

Include:

- Current plan
- Usage
- Upgrade
- Downgrade
- Billing history
- Payment method
- Invoices
- Cancellation

## 15.3 Advanced

For configurations that should not clutter the standard merchant experience.

Potential future capabilities:

- API keys
- Webhooks
- Developer settings
- Data migration
- Experimental features
- Advanced system configuration

This section should be hidden or restricted for ordinary merchant users.

---

# 16. MVP Settings

We should **not build the entire settings architecture in the first release**.

The MVP should launch with approximately these sections:

```text
SETTINGS

Account
├── Profile
├── Security
└── Notifications

Business
├── Business Profile
├── Store
└── Business Hours

Commerce
├── Orders
├── Products & Inventory
└── Payments

Operations
├── Suppliers
├── Shipments
└── Fulfillment

Social Commerce
├── Connected Channels
├── Conversations
└── Automation

Team
└── Staff & Permissions

Data & Security
├── Privacy
├── Audit Log
└── Export Data

System
└── Subscription
```

Everything else can be introduced progressively.

---

# 17. What Settings Should NOT Become

Settings should not contain operational information that belongs elsewhere.

### Not Settings

> 12 orders awaiting fulfillment.

**Dashboard**

### Not Settings

> Shipment arriving tomorrow.

**Dashboard / Shipments**

### Not Settings

> Product is almost out of stock.

**Dashboard / Inventory**

### Not Settings

> ₵4,500 customer balance outstanding.

**Dashboard / Payments**

### Not Settings

> AI captured 18 orders this week.

**Dashboard / Analytics**

Settings controls **how the system behaves**.

The Dashboard shows **what is happening**.

---

# 18. Core Product Rule

The most important terminology decision is:

> **Merchander is social-first, not WhatsApp-first.**

Therefore:

- WhatsApp is a channel.
- Instagram is a channel.
- Facebook is a channel.
- TikTok can be a channel.
- Telegram can be a channel.
- Future platforms can become channels.

But Merchander itself is the **commerce operating system connecting them to the merchant's business**.

```text
                    SOCIAL
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
    WhatsApp      Instagram      Facebook
        │             │             │
        └─────────────┼─────────────┘
                      ↓
              MERCHANDER CORE
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
    Customers       Orders        Products
       ↓              ↓              ↓
   Payments       Fulfillment     Inventory
                      │
                      ↓
                   PROFIT
```

This keeps the product aligned with:

> **Open Path for Social-First Merchants.**

And prevents a critical architectural mistake: building Merchander around one social platform instead of building commerce infrastructure that can survive changes in the social-commerce ecosystem.
