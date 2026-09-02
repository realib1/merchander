-- Migration: Create Pre-Order Batches & Procurement Lifecycle System
-- Separates Product catalog entries from time-bound Pre-Order Batches

-- 1. Create preorder_batches table
CREATE TABLE IF NOT EXISTS preorder_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                         -- e.g. "Batch A — August Wave"
  code TEXT NOT NULL,                         -- e.g. "BATCH-A", "SEP-W1"
  status TEXT NOT NULL DEFAULT 'OPEN',        -- OPEN, CLOSING_SOON, CLOSED, ORDER_SUBMITTED, IN_TRANSIT, ARRIVED, FULFILLING, COMPLETED
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  supplier_order_date DATE,
  expected_arrival_start DATE NOT NULL,
  expected_arrival_end DATE NOT NULL,
  actual_arrival_date DATE,
  freight_mode TEXT DEFAULT 'sea',            -- 'sea', 'air', 'express', 'road'
  origin_country TEXT DEFAULT 'China',        -- 'China', 'Turkey', 'UK', 'USA', 'UAE'
  cargo_tracking_number TEXT,                 -- Container number or Air Waybill
  max_capacity INTEGER,                       -- Optional max order slots
  min_moq_target INTEGER,                     -- Optional MOQ target
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create product_preorder_batches junction table (Many-to-Many mapping)
CREATE TABLE IF NOT EXISTS product_preorder_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES preorder_batches(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, batch_id)
);

-- 3. Add batch_id to orders and order_items
ALTER TABLE orders ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES preorder_batches(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES preorder_batches(id) ON DELETE SET NULL;

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_preorder_batches_tenant ON preorder_batches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_preorder_batches_status ON preorder_batches(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_product_batches_product ON product_preorder_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_batch ON product_preorder_batches(batch_id);
CREATE INDEX IF NOT EXISTS idx_orders_batch ON orders(batch_id);
CREATE INDEX IF NOT EXISTS idx_order_items_batch ON order_items(batch_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE preorder_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_preorder_batches ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Public storefront read for active batches
CREATE POLICY "Public read preorder batches"
  ON preorder_batches FOR SELECT
  USING (true);

CREATE POLICY "Public read product preorder batches"
  ON product_preorder_batches FOR SELECT
  USING (true);

-- Authenticated tenant management policies
CREATE POLICY "Tenant manage preorder batches"
  ON preorder_batches FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Tenant manage product preorder batches"
  ON product_preorder_batches FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));
