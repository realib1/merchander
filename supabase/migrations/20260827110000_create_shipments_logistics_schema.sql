-- Migration: Create dedicated Shipments & Inbound Logistics Table
-- Designed for Ghanaian social commerce merchants tracking Sea/Air freight consignments

CREATE TABLE IF NOT EXISTS public.shipments (
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for fast tenant filtering, status lookup, and date range queries
CREATE INDEX IF NOT EXISTS idx_shipments_tenant_id ON public.shipments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_shipments_freight_mode ON public.shipments(tenant_id, freight_mode);
CREATE INDEX IF NOT EXISTS idx_shipments_eta ON public.shipments(tenant_id, eta);
CREATE INDEX IF NOT EXISTS idx_shipments_supplier_id ON public.shipments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_purchase_order_id ON public.shipments(purchase_order_id);

-- Enable PostgreSQL Row Level Security (RLS)
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS "Users can view shipments of their tenant." ON public.shipments;
DROP POLICY IF EXISTS "Users can insert shipments for their tenant." ON public.shipments;
DROP POLICY IF EXISTS "Users can update shipments of their tenant." ON public.shipments;
DROP POLICY IF EXISTS "Users can delete shipments of their tenant." ON public.shipments;
DROP POLICY IF EXISTS "Superadmins can view all shipments." ON public.shipments;

CREATE POLICY "Users can view shipments of their tenant." ON public.shipments
    FOR SELECT USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));

CREATE POLICY "Users can insert shipments for their tenant." ON public.shipments
    FOR INSERT WITH CHECK (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));

CREATE POLICY "Users can update shipments of their tenant." ON public.shipments
    FOR UPDATE USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));

CREATE POLICY "Users can delete shipments of their tenant." ON public.shipments
    FOR DELETE USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));

CREATE POLICY "Superadmins can view all shipments." ON public.shipments
    FOR ALL USING (public.is_superadmin());

-- Permissions Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;
