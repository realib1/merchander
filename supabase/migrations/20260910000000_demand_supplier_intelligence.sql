-- Migration: 20260910000000_demand_supplier_intelligence.sql
-- Description: Add lead times and scoring to suppliers, delivery audits and defect counts to purchase orders, and reorder parameters to product variants.

-- 1. Suppliers Lead Times & Reliability
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS default_lead_days integer DEFAULT 14,
  ADD COLUMN IF NOT EXISTS sea_lead_days integer DEFAULT 45,
  ADD COLUMN IF NOT EXISTS air_lead_days integer DEFAULT 7,
  ADD COLUMN IF NOT EXISTS reliability_score numeric(5, 2) DEFAULT 100.00
    CHECK (reliability_score >= 0.00 AND reliability_score <= 100.00);

-- 2. Purchase Orders Fulfillment Audit & Quality
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS expected_delivery_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS actual_delivery_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS quality_rating smallint
    CHECK (quality_rating IS NULL OR (quality_rating >= 1 AND quality_rating <= 5)),
  ADD COLUMN IF NOT EXISTS defect_count integer DEFAULT 0
    CHECK (defect_count >= 0),
  ADD COLUMN IF NOT EXISTS fulfillment_accuracy numeric(5, 2) DEFAULT 100.00
    CHECK (fulfillment_accuracy >= 0.00 AND fulfillment_accuracy <= 100.00);

-- 3. Product Variants Reorder Rules & Preferred Supplier
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS reorder_point integer DEFAULT 10
    CHECK (reorder_point >= 0),
  ADD COLUMN IF NOT EXISTS reorder_quantity integer DEFAULT 20
    CHECK (reorder_quantity > 0),
  ADD COLUMN IF NOT EXISTS preferred_supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- 4. Helpful Performance Indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_preferred_supplier ON public.product_variants(preferred_supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_status ON public.purchase_orders(tenant_id, supplier_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_delivery_dates ON public.purchase_orders(tenant_id, expected_delivery_date, actual_delivery_date);
