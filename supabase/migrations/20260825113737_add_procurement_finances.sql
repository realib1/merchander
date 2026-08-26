-- 1. Add financial columns to shipments
ALTER TABLE public.shipments 
  ADD COLUMN supplier_cost decimal(12, 2) DEFAULT 0.00,
  ADD COLUMN shipping_cost decimal(12, 2) DEFAULT 0.00,
  ADD COLUMN import_cost decimal(12, 2) DEFAULT 0.00,
  ADD COLUMN amount_paid decimal(12, 2) DEFAULT 0.00;

-- 2. Create supplier_payments table
CREATE TABLE public.supplier_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  supplier_id uuid references public.suppliers(id) on delete cascade not null,
  shipment_id uuid references public.shipments(id) on delete set null,
  amount decimal(12, 2) not null check (amount > 0),
  currency text default 'GHS' not null,
  payment_date date not null default current_date,
  payment_method text not null,
  reference_number text,
  notes text,
  receipt_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view supplier_payments of their tenant." ON public.supplier_payments
  FOR SELECT USING (tenant_id in (select public.get_auth_user_tenant_ids()));

CREATE POLICY "Users can insert supplier_payments for their tenant." ON public.supplier_payments
  FOR INSERT WITH CHECK (tenant_id in (select public.get_auth_user_tenant_ids()));

CREATE POLICY "Users can update supplier_payments of their tenant." ON public.supplier_payments
  FOR UPDATE USING (tenant_id in (select public.get_auth_user_tenant_ids()));

CREATE POLICY "Users can delete supplier_payments of their tenant." ON public.supplier_payments
  FOR DELETE USING (tenant_id in (select public.get_auth_user_tenant_ids()));

-- Superadmin override
CREATE POLICY "Superadmins can view all supplier_payments." ON public.supplier_payments 
  FOR SELECT USING (public.is_superadmin());
