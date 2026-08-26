# Merchander Dashboard — Page Structure & Content Guide

## Purpose

This document defines what each major Merchander dashboard page should contain.

The goal is not to put every possible feature into every page.

Each page should have:

1. A clear purpose
2. A small set of primary actions
3. The information the merchant needs most often
4. Deeper information accessible without cluttering the main view

---

# 1. COMMAND

## 1.1 Overview

### Purpose

The merchant's command centre.

It should answer:

> "How is my business doing right now?"

### Primary Content

#### Business Snapshot

- Today's sales
- Revenue
- Expenses
- Gross profit
- Net profit
- Orders
- Customers
- Outstanding customer credit

#### Sales Performance

- Today's sales
- Sales trend
- Comparison with previous period
- Number of transactions
- Average order value

#### Inventory Alerts

- Low-stock products
- Out-of-stock products
- Products approaching reorder level

#### Money

- Revenue
- Expenses
- Profit
- Customer credit
- Supplier obligations

#### Business Activity

- Recent orders
- Recent payments
- Recent purchases
- Recent stock movements

#### Insights

A small number of high-value insights.

Examples:

- Sales are up 18% this week.
- Product X is selling faster than usual.
- 5 products need reordering.
- Customer credit increased this month.

### Quick Actions

- New Order / Sale
- Add Product
- Add Customer
- Add Supplier
- Record Expense
- Create Purchase Order

### Design Principle

Do not turn Overview into a page containing every report.

It should provide the business picture and direct the merchant to deeper pages.

---

# 1.2 Orders

### Purpose

Manage customer orders and the order lifecycle.

### Primary Content

- Order list
- Search
- Filters
- Order status
- Payment status
- Customer
- Order value
- Date
- Sales channel
- Staff member

### Order Status

Potentially:

- Draft
- Pending
- Confirmed
- Processing
- Ready
- Completed
- Cancelled
- Returned

Only use statuses that are actually needed by Merchander's workflow.

### Order Details

- Order number
- Customer
- Products
- Quantities
- Prices
- Discounts
- Taxes
- Total
- Payment
- Delivery/fulfilment
- Staff member
- Notes
- Activity history

### Actions

- Create order
- Edit order
- Cancel
- Refund
- Return
- Print receipt
- Send receipt
- Update status

---

# 1.3 Customers

### Purpose

Manage customer relationships and purchasing history.

### Main Content

- Customer list
- Search
- Customer groups
- Total customers
- Active customers
- Customers with outstanding credit

### Customer Profile

- Name
- Phone
- Email
- Address
- Customer group
- Purchase history
- Total spent
- Average order value
- Last purchase
- Outstanding credit
- Payment history
- Favourite products
- Notes
- Activity

### Customer Actions

- Add customer
- Edit customer
- Create order
- Record payment
- Record credit
- View history
- Export

### Customer Intelligence

Eventually:

- Frequent customers
- High-value customers
- Inactive customers
- Customer purchasing patterns

---

# 2. COMMERCE

# 2.1 Products

### Purpose

Manage the product catalogue.

### Main Content

- Product list
- Search
- Filters
- Categories
- Availability
- Stock status
- Price
- Cost
- SKU
- Supplier
- Product type

### Product Status

#### Availability

- Available
- Pre-order
- Unavailable

#### Lifecycle

- Active
- Archived

#### Inventory

- In stock
- Low stock
- Out of stock

These are separate concepts.

### Product Details

- Product image
- Name
- Description
- Category
- Brand
- SKU
- Barcode
- Product type
- Cost price
- Selling price
- Profit
- Margin
- Availability
- Stock
- Reorder level
- Supplier
- Variants
- Tax information
- Notes

### Product Actions

- Add product
- Edit
- Adjust stock
- Change price
- Duplicate
- Archive
- Delete where appropriate

### Product Intelligence

Eventually:

- Sales velocity
- Profitability
- Stock trend
- Reorder prediction
- Supplier price changes

---

# 2.2 Categories

### Purpose

Organise products.

### Main Content

- Category list
- Number of products
- Category status
- Search

### Category Details

- Category name
- Description
- Image
- Parent category
- Products
- Sales performance

### Actions

- Add category
- Edit
- Archive
- Delete where safe

### Important

Categories should remain lightweight.

Do not create a full management system for something that mainly exists to organise products.

---

# 2.3 Inventory

### Purpose

Give the merchant control over physical stock.

### Main Content

- Total products
- Total units
- Stock value
- Low-stock products
- Out-of-stock products
- Inventory list

### Inventory List

- Product
- SKU
- Location
- Current stock
- Available stock
- Reserved stock
- Reorder level
- Stock value
- Status

### Stock Operations

- Adjust stock
- Receive stock
- Stock count
- Transfer stock
- Return stock
- Record damaged stock

### Stock Movements

Track:

- Sale
- Purchase
- Adjustment
- Transfer
- Return
- Stock count

### Locations

Eventually:

- Main shop
- Warehouse
- Branches
- Other locations

### Inventory Intelligence

- Reorder recommendations
- Slow-moving products
- Fast-moving products
- Overstock
- Stockout risk

---

# 2.4 Purchasing

### Purpose

Manage what the business buys from suppliers.

### Main Content

- Purchase orders
- Purchase history
- Pending purchases
- Receiving
- Purchase returns
- Purchase costs

### Purchase Order

- PO number
- Supplier
- Products
- Quantity
- Unit cost
- Total
- Expected delivery
- Status
- Notes
- Created by

### Purchase Status

- Draft
- Ordered
- Partially received
- Received
- Cancelled

### Receiving

When stock arrives:

- Purchase order
- Product
- Ordered quantity
- Received quantity
- Damaged quantity
- Outstanding quantity
- Actual cost
- Date received
- Received by

### Costs

Allow the purchase record to eventually capture:

- Product cost
- Shipping
- Import fees
- Other procurement costs

This is important for Merchander's eventual true-cost and profitability calculations.

---

# 2.5 Suppliers

### Purpose

Manage supplier relationships and obligations.

### Main Content

- Supplier list
- Search
- Supplier status
- Products supplied
- Outstanding balances

### Supplier Profile

- Supplier name
- Contact person
- Phone
- Email
- Address
- Products
- Purchase history
- Total purchases
- Amount paid
- Amount outstanding
- Payment history
- Notes
- Activity

### Supplier Actions

- Add supplier
- Edit supplier
- Create purchase order
- Record purchase
- Record payment
- View history

### Supplier Intelligence

Eventually:

- Price changes
- Delivery performance
- Purchase frequency
- Supplier reliability
- Cost comparisons

---

# 2.6 Shipments

### Important

This page needs a clear definition before development.

There are potentially two shipment concepts:

1. Customer shipments
2. Supplier/import shipments

They should not be mixed carelessly.

### If Customer Fulfilment

Contain:

- Shipment list
- Order
- Customer
- Delivery address
- Carrier
- Tracking number
- Shipping cost
- Status
- Expected delivery
- Delivery history

### If Supplier Logistics

Contain:

- Purchase order
- Supplier
- Shipment
- Tracking
- Shipping method
- Shipping cost
- Import fees
- Expected arrival
- Received status

### Recommendation

Do not build both models until the business requirements are settled.

---

# 2.7 Online Store

### Purpose

Manage Merchander's online selling channel.

### Store Overview

- Store status
- Orders
- Revenue
- Visitors, if supported
- Conversion, if supported
- Best-selling products

### Store Management

- Storefront
- Products
- Categories
- Collections
- Store appearance
- Store URL
- Domain
- Store settings

### Orders

Online orders should feed into the same order system as other Merchander sales.

### Checkout

- Payment methods
- Customer information
- Delivery options
- Checkout settings

### Delivery

- Delivery zones
- Delivery charges
- Delivery options

### Store Customers

Should use the same customer records as Merchander.

### Important Principle

The Online Store should NOT maintain its own:

- Product database
- Inventory database
- Customer database
- Order database

It should use Merchander's existing business data.

One business system.

Multiple sales channels.

---

# 3. MONEY

# 3.1 Payments

### Purpose

Track money received and paid through transactions.

### Main Content

- Payment history
- Payment status
- Payment method
- Amount
- Date
- Related order
- Customer
- Staff member

### Payment Methods

Depending on supported integrations:

- Cash
- Mobile Money
- Card
- Bank transfer
- Other

### Payment Status

- Paid
- Partially paid
- Pending
- Failed
- Refunded

### Actions

- Record payment
- Refund
- View transaction
- Reconcile

### Important

Payments should connect to:

- Orders
- Customer credit
- Expenses
- Purchases

---

# 3.2 Expenses

### Purpose

Track business spending.

### Main Content

- Total expenses
- Expense trends
- Recent expenses
- Expense categories

### Expense Record

- Amount
- Category
- Date
- Payment method
- Description
- Staff member
- Receipt
- Notes

### Categories

Examples:

- Rent
- Utilities
- Transport
- Marketing
- Salaries
- Repairs
- Delivery
- Bank charges
- Other

Categories should be customizable.

---

# 3.3 Profitability

### Purpose

Answer:

> "Is the business actually making money?"

### Main Content

- Revenue
- Cost of goods sold
- Gross profit
- Operating expenses
- Net profit
- Gross margin
- Net margin

### Breakdowns

- By product
- By category
- By order
- By sales channel
- By period

### Trends

- Daily
- Weekly
- Monthly
- Yearly

### Important

Profitability should use existing Merchander records.

The merchant should not have to enter sales and expenses again just to see profit.

---

# 4. INTELLIGENCE

# 4.1 Insights

### Purpose

Tell the merchant what matters.

### Main Content

- Important business observations
- Alerts
- Opportunities
- Risks
- Recommendations

### Examples

> Sales are 18% higher than last week.

> 5 products may run out within 7 days.

> Your gross margin fell by 4% this month.

> Customer credit increased significantly.

> Supplier X increased the cost of Product Y.

### Insight Types

- Sales
- Inventory
- Product
- Customer
- Supplier
- Financial

### Important

Insights should not simply repeat dashboard numbers.

They should explain:

**What happened → Why it matters → What you could do.**

---

# 4.2 Analytics

### Purpose

Let the merchant explore the business data themselves.

### Main Content

- Sales analytics
- Product analytics
- Inventory analytics
- Customer analytics
- Supplier analytics
- Financial analytics
- Order analytics

### Filters

- Date
- Product
- Category
- Customer
- Supplier
- Staff
- Location
- Sales channel

### Visualisations

- Trends
- Comparisons
- Rankings
- Distribution
- Performance tables

### Export

Where appropriate:

- CSV
- Excel
- PDF

### Difference From Insights

Analytics:

> "Here is the data. Explore it."

Insights:

> "Here is what appears important."

---

# 5. SYSTEM

# 5.1 Conversations

### Purpose

This needs to be clearly defined before it becomes a major module.

Potential uses:

- Customer conversations
- Supplier conversations
- Staff conversations
- Order conversations
- AI business assistant

### If retained

The page should contain:

- Conversation list
- Search
- Conversation type
- Participants
- Related customer/order/supplier
- Messages
- Attachments
- Notes
- Activity

### Important

Do not build Conversations simply because messaging is expected in modern software.

It must solve a real Merchander workflow.

---

# 5.2 Staff

### Purpose

Manage people who access the business.

### Main Content

- Staff list
- Active staff
- Invited staff
- Disabled staff
- Roles
- Permissions

### Staff Profile

- Name
- Email
- Phone
- Role
- Permissions
- Status
- Date joined
- Activity
- Sales performance where appropriate

### Roles

Initial roles:

- Owner
- Manager
- Sales Staff
- Inventory Staff
- Finance

Potential later roles:

- Procurement
- Supervisor
- Custom roles

### Permissions

Control access to:

- Orders
- Products
- Inventory
- Customers
- Suppliers
- Purchasing
- Payments
- Expenses
- Profitability
- Analytics
- Staff
- Settings

---

# 5.3 Settings

### Purpose

Configure the business and Merchander account.

## Business

- Business profile
- Business name
- Logo
- Business type
- Address
- Phone
- Email
- Currency
- Timezone
- Locations

## Commerce

- Sales settings
- Order settings
- Product settings
- Inventory settings
- Supplier settings
- Shipping settings

## Money

- Payment methods
- Expense categories
- Tax settings
- Financial preferences

## Team & Access

- Roles
- Permissions
- Staff access
- Security

## Notifications

- Business alerts
- Inventory alerts
- Payment alerts
- Customer credit alerts
- System notifications

## Audit & Activity

- Audit log
- Staff activity
- Product changes
- Stock changes
- Price changes
- Order changes
- Payment changes
- Settings changes

## Data

- Import
- Export
- Data management
- Backup, if supported

## Account

- Profile
- Password
- Subscription
- Billing
- Plan

---

# 6. HELP & SUPPORT

This sits outside the operational navigation.

### Contains

- Help Centre
- Getting Started
- Guides
- FAQs
- Tutorials
- Contact Support
- Report a Problem
- Feature Requests
- System Status
- What's New

---

# 7. Cross-Module Relationships

The most important thing is not the individual pages.

It is how the pages connect.

## Product

```text
Product
├── Inventory
├── Sales
├── Orders
├── Purchases
├── Supplier
├── Profitability
└── Insights
```

## Customer

```text
Customer
├── Orders
├── Payments
├── Credit
├── Products purchased
├── Profitability
└── Conversations
```

## Supplier

```text
Supplier
├── Purchases
├── Products
├── Receiving
├── Payments
├── Shipping
└── Obligations
```

## Order

```text
Order
├── Customer
├── Products
├── Inventory
├── Payment
├── Shipment
├── Profitability
└── Activity
```

---

# 8. Core Data Flow

Merchander should behave like one connected system.

```text
                    CUSTOMER
                       │
                       ↓
                    ORDER
                       │
             ┌─────────┼─────────┐
             ↓         ↓         ↓
          PRODUCT   PAYMENT   SHIPMENT
             │
             ↓
         INVENTORY
             ↑
             │
         PURCHASING
             │
             ↓
          SUPPLIER
             │
             ↓
          EXPENSES
             │
             └──────────┐
                        ↓
                  PROFITABILITY
                        ↓
                    ANALYTICS
                        ↓
                     INSIGHTS
```

---

# 9. What Should Not Become Separate Top-Level Pages

To avoid an unnecessarily complicated dashboard:

## Keep inside Products

* Categories
* Brands
* Variants
* Archived products

## Keep inside Inventory

* Stock movements
* Stock adjustments
* Stock counts
* Locations
* Transfers

## Keep inside Orders

* Returns
* Refunds
* Order status
* Order activity

## Keep inside Customers

* Customer credit
* Customer payments
* Customer groups

## Keep inside Suppliers / Purchasing

* Purchase orders
* Receiving
* Supplier balances
* Supplier payments
* Purchase returns

## Keep inside Settings

* Audit log
* Roles
* Permissions
* Business configuration

## Keep inside Analytics / Profitability

* Reports

---

# 10. MVP Boundary

Not everything above needs to exist in the first release.

## Core MVP

* Overview
* Orders
* Customers
* Products
* Categories
* Inventory
* Suppliers
* Purchasing
* Payments
* Expenses
* Profitability
* Staff
* Settings

## Next Layer

* Shipments
* Online Store
* Analytics
* Insights
* Conversations
* Advanced customer credit
* Advanced supplier management

## Later Intelligence

* Demand forecasting
* Stockout prediction
* Product recommendations
* Customer behaviour insights
* Supplier intelligence
* Automated business recommendations

---

# 11. Final Navigation

The current recommended navigation is:

**COMMAND**

* Overview
* Orders
* Customers

**COMMERCE**

* Products
* Categories
* Inventory
* Purchasing
* Suppliers
* Shipments
* Online Store

**MONEY**

* Payments
* Expenses
* Profitability

**INTELLIGENCE**

* Insights
* Analytics

**SYSTEM**

* Conversations
* Staff
* Settings

---

# 12. Design Principle

Every page should answer one primary question.

| Page           | Primary Question                              |
| -------------- | --------------------------------------------- |
| Overview       | How is my business doing?                     |
| Orders         | What am I selling and what needs attention?   |
| Customers      | Who are my customers and what are they doing? |
| Products       | What do I sell?                               |
| Categories     | How are my products organised?                |
| Inventory      | What do I have right now?                     |
| Purchasing     | What am I buying?                             |
| Suppliers      | Who do I buy from?                            |
| Shipments      | Where are my goods going/coming from?         |
| Online Store   | How am I selling online?                      |
| Payments       | Where is money moving?                        |
| Expenses       | What am I spending?                           |
| Profitability  | Am I making money?                            |
| Insights       | What should I know?                           |
| Analytics      | What does the data show?                      |
| Conversations  | Who am I communicating with?                  |
| Staff          | Who can operate the business?                 |
| Settings       | How is Merchander configured?                 |
| Help & Support | Where can I get help?                         |

---

# 13. The Standard for Every Page

Before adding anything to a page, ask:

1. **Does the merchant actually need this information here?**
2. **Is this something they act on frequently?**
3. **Does it belong to this module?**
4. **Can it be derived from existing data instead of manually entered?**
5. **Does it help the merchant understand or operate the business?**
6. **Could it be a detail page, filter, tab, or setting instead of another top-level feature?**

If the answer is no, it probably doesn't belong on the page.

---

# 14. Merchander's Product Principle

The dashboard should not feel like a collection of independent modules.

It should feel like:

> **One business, understood from different angles.**

Products explain what is being sold.

Inventory explains what is available.

Purchasing explains what is being acquired.

Suppliers explain where it comes from.

Orders explain what customers are buying.

Payments explain the movement of money.

Expenses explain where money goes.

Profitability explains what remains.

Analytics explains the patterns.

Insights explain what matters.

And Merchander's ultimate value is connecting all of them.
