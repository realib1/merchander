# MERCHANDER: Multi-Tenant Architecture & Data Isolation Specification

## 1. Executive Summary

**Merchander** is a specialized, multi-tenant B2B Social Commerce Operating System designed for West African merchants (starting with Ghanaian importers, resellers, and social-first businesses). It connects the merchant's supply-side (suppliers, purchases, sea/air shipments, landed costs) and sales-side (products, inventory, multi-channel customers, conversational orders, payments, fulfillment) into an isolated, secure multi-tenant architecture.

---

## 2. Multi-Tenancy Model & Principles

```text
                              ┌────────────────────────┐
                              │     Internet / CDN     │
                              └───────────┬────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  │                                               │
      ┌───────────▼───────────┐                       ┌───────────▼───────────┐
      │   Merchant Dashboard  │                       │   Social Chat Inbound │
      │   (Next.js 15 SaaS)   │                       │  (WhatsApp/Instagram) │
      └───────────┬───────────┘                       └───────────┬───────────┘
                  │                                               │
                  │   Authorization: Supabase Auth / JWT          │   Webhook Payload
                  │                                               │   (channel token/id)
                  └───────────────────────┬───────────────────────┘
                                          │
                              ┌───────────▼───────────┐
                              │  Tenant Gatekeeper /  │
                              │  Next.js Middleware   │
                              └───────────┬────────────┘
                                          │
                    RLS Context: get_auth_user_tenant_ids()
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  │                                               │
      ┌───────────▼───────────┐                       ┌───────────▼───────────┐
      │  PostgreSQL with RLS  │                       │ Redis Per-Tenant      │
      │  (Row-Level Security) │                       │ Celery Queues         │
      └───────────────────────┘                       └───────────────────────┘
```

### 2.1 Logical Isolation Strategy
- **Shared Application, Shared Database (Pool-based Multi-Tenancy)**:
  - All tenants share the same PostgreSQL database cluster and application servers.
  - Every tenant-scoped database table includes an indexed `tenant_id: UUID NOT NULL` foreign key pointing to `tenants(id)`.
  - **Zero Cross-Tenant Leakage Guarantee**: PostgreSQL **Row-Level Security (RLS)** is enforced at the database engine level. Functions like `get_auth_user_tenant_ids()` match the current `auth.uid()` against tenant membership in `tenant_users`.

---

## 3. The 3-Layer OS Architecture

1. **Layer 1: Commerce Core (Next.js 15 + PostgreSQL / Supabase)**: The merchant's central source of truth. Handles products, inventory, customers, orders, pre-orders, shipments, suppliers, purchase orders, and payments. Completely channel-agnostic.
2. **Layer 2: Intelligence (Python + AI)**: Multimodal image comprehension ("Do you have this?"), intent detection, and safe human-in-the-loop action controls (GREEN / YELLOW / RED).
3. **Layer 3: Channel Adapters**: Handles raw I/O for Official WhatsApp Cloud API (Meta Tech Provider integration), Telegram, Instagram, Facebook, and Web Storefront.

---

## 4. Complete Database Architecture & DDL Specification

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tenants Table (Global Workspace)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    currency VARCHAR(10) DEFAULT 'GHS',
    subscription_tier VARCHAR(50) DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'BASIC', 'PRO', 'ENTERPRISE')),
    subscription_status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (subscription_status IN ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING')),
    subscription_expires_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tenant Users & Roles
CREATE TABLE public.tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_tenant_user UNIQUE (tenant_id, user_id)
);
CREATE INDEX idx_tenant_users_user ON public.tenant_users(user_id);
CREATE INDEX idx_tenant_users_tenant ON public.tenant_users(tenant_id);

-- 3. Stores / Branches
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_stores_tenant ON public.stores(tenant_id);

-- 4. Product Categories
CREATE TABLE public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_tenant_category_name UNIQUE (tenant_id, name)
);
CREATE INDEX idx_product_categories_tenant ON public.product_categories(tenant_id);

-- 5. Products & Availability
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    vendor VARCHAR(255),
    image_urls TEXT[] DEFAULT '{}'::TEXT[],
    stock_unit VARCHAR(50) DEFAULT 'pcs',
    availability_status VARCHAR(50) DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE', 'PRE_ORDER', 'OUT_OF_STOCK')),
    preorder_shipping_mode VARCHAR(50) DEFAULT 'sea' CHECK (preorder_shipping_mode IN ('sea', 'air', 'none')),
    short_id VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_products_tenant ON public.products(tenant_id, is_active);

-- 6. Product Variants & Multi-Branch Inventory
CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255),
    price NUMERIC(10, 2) NOT NULL,
    compare_at_price NUMERIC(10, 2),
    cost_price NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_product_variant_sku UNIQUE (product_id, sku)
);
CREATE INDEX idx_variants_product ON public.product_variants(product_id);

CREATE TABLE public.inventory_levels (
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    quantity INT DEFAULT 0 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (variant_id, store_id)
);

-- 7. Suppliers (Supply Side)
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    country VARCHAR(100) DEFAULT 'Ghana',
    outstanding_balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    short_id VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_suppliers_tenant ON public.suppliers(tenant_id);

-- 8. Purchase Orders (Procurement)
CREATE TABLE public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    po_number VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'ordered' CHECK (status IN ('draft', 'ordered', 'partially_received', 'received', 'cancelled')),
    supplier_cost NUMERIC(12, 2) DEFAULT 0.00,
    shipping_cost NUMERIC(12, 2) DEFAULT 0.00,
    import_cost NUMERIC(12, 2) DEFAULT 0.00,
    amount_paid NUMERIC(12, 2) DEFAULT 0.00,
    tracking_number VARCHAR(100),
    eta TIMESTAMPTZ,
    short_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_purchase_orders_tenant ON public.purchase_orders(tenant_id);

CREATE TABLE public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    quantity INT DEFAULT 1 NOT NULL CHECK (quantity > 0),
    cost_price NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_po_items_po ON public.purchase_order_items(purchase_order_id);

-- 9. Supplier Payments
CREATE TABLE public.supplier_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) DEFAULT 'GHS' NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    reference_number VARCHAR(150),
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_supplier_payments_tenant ON public.supplier_payments(tenant_id);

-- 10. Shipments & Inbound Logistics
CREATE TABLE public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    tracking_number VARCHAR(100),
    carrier VARCHAR(150),
    freight_mode VARCHAR(50) NOT NULL DEFAULT 'sea' CHECK (freight_mode IN ('sea', 'air', 'road', 'express')),
    origin_port VARCHAR(150),
    destination_port VARCHAR(150) DEFAULT 'Tema Port, Ghana',
    departure_date DATE,
    eta DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'booked' CHECK (status IN ('draft', 'booked', 'in_transit', 'customs', 'cleared', 'arrived', 'delayed')),
    cbm NUMERIC(10, 3) DEFAULT 0.000,
    weight_kg NUMERIC(10, 2) DEFAULT 0.00,
    shipping_cost NUMERIC(12, 2) DEFAULT 0.00,
    customs_duty NUMERIC(12, 2) DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'GHS',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_shipments_tenant ON public.shipments(tenant_id, status);

-- 11. Unified Customers & Multi-Channel Identities
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    delivery_address TEXT,
    short_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_tenant_customer_phone UNIQUE (tenant_id, phone)
);
CREATE INDEX idx_customers_tenant ON public.customers(tenant_id, phone);

CREATE TABLE public.customer_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'facebook', 'telegram', 'storefront')),
    identifier VARCHAR(255) NOT NULL, -- e.g. Phone number/JID, IGID, Telegram ID
    profile_data JSONB DEFAULT '{}'::jsonb,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_tenant_channel_identifier UNIQUE (tenant_id, channel, identifier)
);
CREATE INDEX idx_customer_identities_lookup ON public.customer_identities(tenant_id, channel, identifier);

-- 12. Orders & Order Items
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'pending_payment', 'paid', 'dispatched', 'delivered', 'cancelled')),
    total_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    delivery_address TEXT,
    delivery_fee NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    shipping_tbd BOOLEAN DEFAULT FALSE,
    short_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_orders_tenant ON public.orders(tenant_id, status);

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    quantity INT DEFAULT 1 NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- 13. Enhanced Customer Payments
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('mtn_momo', 'telecel_cash', 'at_money', 'cash_on_delivery', 'cash', 'bank_transfer', 'card', 'hubtel', 'paystack')),
    transaction_ref VARCHAR(150),
    amount NUMERIC(10, 2) NOT NULL,
    fee NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    net_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    sender_phone VARCHAR(50),
    sender_name VARCHAR(150),
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    refund_reason TEXT,
    refunded_at TIMESTAMPTZ,
    payment_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_tenant_payment_ref UNIQUE (tenant_id, transaction_ref)
);
CREATE INDEX idx_payments_tenant ON public.payments(tenant_id, status, payment_date DESC);

-- 14. Channel Connections & Connectors
CREATE TABLE public.channel_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('whatsapp_cloud', 'telegram', 'instagram', 'facebook')),
    status VARCHAR(50) NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending_verification')),
    credentials JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{"auto_reply": true, "human_escalation": true}'::jsonb,
    last_health_check TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_tenant_channel_connection UNIQUE (tenant_id, channel)
);

-- 15. Workflow & Audit Logs
CREATE TABLE public.workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    source VARCHAR(50) NOT NULL CHECK (source IN ('system', 'ai_agent', 'user', 'webhook')),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_workflow_logs_tenant ON public.workflow_logs(tenant_id, created_at DESC);

-- 16. Product Flyer Attribution
CREATE TABLE public.flyer_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    short_code VARCHAR(50) UNIQUE NOT NULL,
    channel_target VARCHAR(50) DEFAULT 'general',
    views_count INT DEFAULT 0,
    scans_count INT DEFAULT 0,
    orders_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_flyer_shares_tenant ON public.flyer_shares(tenant_id, product_id);
```

---

## 5. Row-Level Security (RLS) Policy Architecture

All tenant-scoped tables enforce RLS via the `get_auth_user_tenant_ids()` security helper function:

```sql
-- Helper function to fetch tenant IDs associated with the authenticated user
CREATE OR REPLACE FUNCTION public.get_auth_user_tenant_ids() RETURNS SETOF uuid
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid();
$$;

-- Generic Policy Pattern applied across all tenant tables:
ALTER TABLE public.customer_identities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view customer_identities of their tenant." ON public.customer_identities
    FOR SELECT USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Users can insert customer_identities for their tenant." ON public.customer_identities
    FOR INSERT WITH CHECK (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Users can update customer_identities of their tenant." ON public.customer_identities
    FOR UPDATE USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Users can delete customer_identities of their tenant." ON public.customer_identities
    FOR DELETE USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));

ALTER TABLE public.channel_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage channel_connections of their tenant." ON public.channel_connections
    FOR ALL USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));

ALTER TABLE public.workflow_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view workflow_logs of their tenant." ON public.workflow_logs
    FOR SELECT USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
CREATE POLICY "Users can insert workflow_logs for their tenant." ON public.workflow_logs
    FOR INSERT WITH CHECK (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));

ALTER TABLE public.flyer_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage flyer_shares of their tenant." ON public.flyer_shares
    FOR ALL USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
```
