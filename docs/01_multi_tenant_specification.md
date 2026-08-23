# MERCHANDER: Multi-Tenant Architecture & Data Isolation Specification

## 1. Executive Summary

**Merchander** is a specialized, multi-tenant B2B SaaS platform designed as the "Shopify for West African Social Commerce Merchants" (starting with Ghana). It empowers independent retail merchants who operate primarily via social media and chat communities (WhatsApp groups, Telegram channels) to automate catalog broadcasting, order capture, payment tracking, inventory management, and multi-branch analytics in a unified, strictly isolated multi-tenant architecture.

---

## 2. Multi-Tenancy Model & Principles

```
                              ┌────────────────────────┐
                              │     Internet / CDN     │
                              └───────────┬────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  │                                               │
      ┌───────────▼───────────┐                       ┌───────────▼───────────┐
      │   Merchant Dashboard  │                       │   Social Chat Inbound │
      │   (Next.js 15 SaaS)   │                       │  (WhatsApp/Telegram)  │
      └───────────┬───────────┘                       └───────────┬───────────┘
                  │                                               │
                  │   Authorization: Bearer JWT (tenant_id)       │   Webhook Payload
                  │                                               │   (tenant token/id)
                  └───────────────────────┬───────────────────────┘
                                          │
                              ┌───────────▼───────────┐
                              │  Tenant Gatekeeper /  │
                              │  Next.js Middleware   │
                              └───────────┬────────────┘
                                          │
                    Sets Session Context: SET LOCAL app.tenant_id = :id
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  │                                               │
      ┌───────────▼───────────┐                       ┌───────────▼───────────┐
      │  PostgreSQL with RLS  │                       │ Redis Per-Tenant      │
      │  (Row-Level Security) │                       │ Message Queues        │
      └───────────────────────┘                       └───────────────────────┘
```

### 2.1 Logical Isolation Strategy
- **Shared Application, Shared Database (Pool-based Multi-Tenancy)**:
  - All tenants share the same PostgreSQL database cluster and application servers.
  - Every tenant-scoped database table includes an indexed `tenant_id: UUID NOT NULL` column.
  - **Zero Cross-Tenant Leakage Guarantee**: PostgreSQL **Row-Level Security (RLS)** is enforced at the database engine level in addition to application-level query scoping. Even if an application bug omits a `WHERE tenant_id = ...` clause, PostgreSQL blocks access to rows outside the active session's tenant context.

---


## 3. The 3-Layer OS Architecture

1. **Layer 1: Commerce Core (Next.js + PostgreSQL)**: The merchant's central source of truth. Handles products, inventory, customers, orders, pre-orders, and payments. Completely channel-agnostic.
2. **Layer 2: Intelligence (Python + AI)**: Processes intent detection, product matching, and human-in-the-loop escalation.
3. **Layer 3: Channel Adapters**: Handles raw I/O for WhatsApp Cloud API (Official Meta Tech Provider integration), Telegram, etc.

---

## 4. Database Architecture & Row-Level Security (RLS)

### 3.1 PostgreSQL Tenant Session Context
Every database connection transaction sets a local session configuration variable:
```sql
SET LOCAL app.current_tenant_id = '01912345-6789-7abc-def0-123456789abc';
```

### 3.2 Core Database Schema (DDL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tenants Table (Global context)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'accra-kicks'
    currency VARCHAR(10) DEFAULT 'GHS',
    subscription_tier VARCHAR(50) DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'BASIC', 'PRO', 'ENTERPRISE')),
    subscription_status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (subscription_status IN ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING')),
    subscription_expires_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tenant Users (Authentication & Roles)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    role VARCHAR(50) DEFAULT 'OWNER' CHECK (role IN ('OWNER', 'MANAGER', 'STAFF', 'ANALYST')),
    is_active BOOLEAN DEFAULT TRUE,
    availability_status VARCHAR(50) DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE', 'PRE_ORDER', 'OUT_OF_STOCK')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_user_email UNIQUE (tenant_id, email)
);
CREATE INDEX idx_users_tenant ON users(tenant_id);

-- 3. Stores / Branches (Multi-Branch support per tenant)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- e.g. "Osu Branch", "Kumasi Central"
    location VARCHAR(255),
    contact_phone VARCHAR(50),
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_stores_tenant ON stores(tenant_id);

-- 4. Products & Inventory
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL, -- NULL means available across all branches
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    compare_at_price NUMERIC(12, 2),
    cost_price NUMERIC(12, 2),
    stock_quantity INT DEFAULT 0,
    media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    availability_status VARCHAR(50) DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE', 'PRE_ORDER', 'OUT_OF_STOCK')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_products_tenant ON products(tenant_id, is_active);
CREATE INDEX idx_products_store ON products(tenant_id, store_id);

-- 5. Customers (Per-Tenant CRM)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    phone_number VARCHAR(50) NOT NULL, -- Unique per tenant, not globally
    name VARCHAR(255),
    social_handle VARCHAR(100),
    channel_source VARCHAR(50) CHECK (channel_source IN ('WHATSAPP', 'TELEGRAM', 'MANUAL_WEB')),
    delivery_address TEXT,
    total_orders_count INT DEFAULT 0,
    total_spent NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_customer_phone UNIQUE (tenant_id, phone_number)
);
CREATE INDEX idx_customers_tenant_phone ON customers(tenant_id, phone_number);

-- 6. Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_number VARCHAR(50) NOT NULL, -- e.g. "ORD-00124" scoped per tenant
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('WHATSAPP', 'TELEGRAM', 'DASHBOARD_MANUAL')),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    delivery_address TEXT,
    subtotal NUMERIC(12, 2) NOT NULL,
    delivery_fee NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'FAILED')),
    payment_method VARCHAR(50) DEFAULT 'MANUAL_MOMO' CHECK (payment_method IN ('MANUAL_MOMO', 'CASH_ON_DELIVERY', 'BANK_TRANSFER', 'PAYSTACK')),
    fulfillment_status VARCHAR(50) DEFAULT 'UNFULFILLED' CHECK (fulfillment_status IN ('UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    raw_message_text TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_order_number UNIQUE (tenant_id, order_number)
);
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, payment_status, fulfillment_status);
CREATE INDEX idx_orders_tenant_created ON orders(tenant_id, created_at DESC);

-- 7. Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_order_items_tenant_order ON order_items(tenant_id, order_id);


-- 11. Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    contact_person VARCHAR(255),
    contact_info TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id);

-- 12. Purchases (Procurement)
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    reference_number VARCHAR(100),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_status VARCHAR(50) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_purchases_tenant ON purchases(tenant_id);

-- 13. Purchase Items
CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_purchase_items_tenant ON purchase_items(tenant_id);

-- 14. Shipments & Pre-Orders
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
    shipping_cost NUMERIC(12, 2) DEFAULT 0.00,
    import_cost NUMERIC(12, 2) DEFAULT 0.00,
    name VARCHAR(255) NOT NULL, -- e.g. "SEA-042"
    status VARCHAR(50) DEFAULT 'IN_TRANSIT' CHECK (status IN ('ORDERED', 'IN_TRANSIT', 'CUSTOMS', 'ARRIVED')),
    eta TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_shipments_tenant ON shipments(tenant_id);

-- 15. Deliveries
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rider_name VARCHAR(100),
    rider_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED')),
    delivery_fee NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_deliveries_tenant ON deliveries(tenant_id);

-- 16. Bot Configurations (Per-Tenant Social Credentials & Channels)
CREATE TABLE bot_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    whatsapp_phone_number VARCHAR(50),
    whatsapp_status VARCHAR(50) DEFAULT 'DISCONNECTED' CHECK (whatsapp_status IN ('CONNECTED', 'PAIRING', 'DISCONNECTED')),
    whatsapp_monitored_groups JSONB DEFAULT '[]'::jsonb, -- Array of group JIDs
    telegram_bot_token VARCHAR(255),
    telegram_bot_username VARCHAR(100),
    telegram_status VARCHAR(50) DEFAULT 'DISCONNECTED' CHECK (telegram_status IN ('CONNECTED', 'INVALID_TOKEN', 'DISCONNECTED')),
    telegram_monitored_channels JSONB DEFAULT '[]'::jsonb, -- Array of channel/chat IDs
    auto_post_catalog BOOLEAN DEFAULT FALSE,
    auto_reply_orders BOOLEAN DEFAULT TRUE,
    payment_instructions_message TEXT DEFAULT 'Please send Mobile Money (MoMo) to 024XXXXXXX (Merchant Name) and reply with your transaction reference.',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Scheduled Auto-Posts
CREATE TABLE scheduled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_ids UUID[] NOT NULL,
    target_channels TEXT[] NOT NULL, -- e.g. ['WHATSAPP:12036302@g.us', 'TELEGRAM:-100192838']
    message_caption TEXT NOT NULL,
    cron_expression VARCHAR(100), -- e.g. '0 9 * * 1-5' (Mon-Fri at 9 AM)
    scheduled_for TIMESTAMPTZ,
    last_posted_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_scheduled_posts_tenant ON scheduled_posts(tenant_id, status);

-- 10. Audit & Workflow Logs
CREATE TABLE workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- e.g. 'WHATSAPP_ORDER_DETECTED', 'ORDER_STATUS_CHANGED'
    source VARCHAR(50) NOT NULL, -- 'SYSTEM', 'BOT', 'USER'
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_workflow_logs_tenant ON workflow_logs(tenant_id, created_at DESC);
```

### 3.3 Row-Level Security (RLS) Policy Definitions

```sql
-- Enable RLS on all tenant-isolated tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;

-- Helper policy function: match row tenant_id with PostgreSQL session variable
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create policies for each table
CREATE POLICY tenant_isolation_users ON users
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_stores ON stores
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_products ON products
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_customers ON customers
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_orders ON orders
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_order_items ON order_items
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_bot_configs ON bot_configs
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_suppliers ON suppliers
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_purchases ON purchases
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_purchase_items ON purchase_items
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_shipments ON shipments
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_deliveries ON deliveries
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_scheduled_posts ON scheduled_posts
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_workflow_logs ON workflow_logs
    FOR ALL USING (tenant_id = current_tenant_id());
```

---

## 5. Intelligence & Human-in-the-Loop Bot Architecture

### 5.1 WhatsApp (Official Cloud API)
- **Tech Provider Integration**: Since SHERO is an approved Meta Tech Provider, Merchander uses the official WhatsApp Cloud API. Unofficial Baileys connections are deprecated for core production to ensure business continuity.
- **Human-in-the-Loop Classifications**:
  - **GREEN**: Safe to automate (e.g., Price/Stock questions, basic order capture).
  - **YELLOW**: Request merchant approval (e.g., Large discounts, order modifications).
  - **RED**: Human intervention only (e.g., Complaints, fraud, sensitive disputes).

### 5.2 Telegram (Bot Engine)
- **Multi-Bot Dispatcher**:
  - Each merchant creates their own bot via `@BotFather` and inputs their `telegram_bot_token` in the Merchander dashboard.
  - Merchander registers a tenant webhook: `https://api.merchander.app/v1/bots/telegram/webhook/{tenant_id}`.
  - Inbound updates to that endpoint immediately acquire the corresponding `tenant_id` context and dispatch background Celery tasks.

---

## 6. Subscription & Quota Enforcement (To Be Revalidated)

| Feature / Limit | Free Tier (GHS 0) | Basic Tier (GHS 75 / $5) | Pro Tier (GHS 300 / $20) |
| :--- | :--- | :--- | :--- |
| **Max Products** | 10 | Unlimited | Unlimited |
| **Monthly Orders** | 100 | Unlimited | Unlimited |
| **Connected Stores/Branches**| 1 Branch | 2 Branches | 5 Branches |
| **WhatsApp Automation** | Manual confirmation | Auto-post + Auto-confirm | Full auto-pilot + Multi-group |
| **Telegram Automation** | 1 Channel | 3 Channels | Unlimited Channels |
| **Analytics History** | 7 Days | 90 Days | Lifetime + CSV/PDF export |
| **Support** | Community | Email (24h SLA) | Priority WhatsApp Support |

---

## 7. Security & Anti-Leak Checklist
1. **Never Trust Client Tenant ID**: `tenant_id` is always extracted from the cryptographically signed JWT in the authorization header or validated session token.
2. **Zero Naked SELECTs**: Every database query must either rely on database RLS context (automatically handled by Supabase Auth integration) or explicitly filter by `eq('tenant_id', currentTenantId)` using the Supabase client.
3. **Queue Isolation**: Celery message tasks always carry explicit `tenant_id` in their payload and immediately initialize the tenant context upon task execution.
4. **Media Isolation**: File uploads (product photos, payment receipts) are stored under S3/Cloud Storage prefixes: `s3://merchander-assets/{tenant_id}/products/...`.
