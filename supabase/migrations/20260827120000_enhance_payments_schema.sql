-- Migration: Enhance Payments Schema for Ghanaian Social Commerce Operations
-- Expands public.payments to support customer linkages, fee deductions, sender info, refunds, and extended payment providers.

-- 1. Modify constraints and columns on public.payments
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_provider_check;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- Make order_id nullable to allow direct customer payments or credit settlements
ALTER TABLE public.payments ALTER COLUMN order_id DROP NOT NULL;

-- Add new columns if they do not exist
ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS sender_phone TEXT,
  ADD COLUMN IF NOT EXISTS sender_name TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Add updated check constraints
ALTER TABLE public.payments 
  ADD CONSTRAINT payments_provider_check 
  CHECK (provider IN ('mtn_momo', 'telecel_cash', 'at_money', 'cash_on_delivery', 'cash', 'bank_transfer', 'card', 'hubtel', 'paystack'));

ALTER TABLE public.payments 
  ADD CONSTRAINT payments_status_check 
  CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));

-- Set default net_amount where amount exists and net_amount is 0
UPDATE public.payments SET net_amount = amount - fee WHERE net_amount = 0.00 AND amount > 0;

-- 2. Create indexes for high-speed multi-tenant querying & filtering
CREATE INDEX IF NOT EXISTS idx_payments_tenant_date ON public.payments(tenant_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_provider ON public.payments(tenant_id, provider);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_status ON public.payments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_customer ON public.payments(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_order ON public.payments(tenant_id, order_id);

-- 3. Update RLS policies to allow delete/update operations for tenant users
DROP POLICY IF EXISTS "Users can update payments of their tenant." ON public.payments;
CREATE POLICY "Users can update payments of their tenant." ON public.payments
  FOR UPDATE USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));

DROP POLICY IF EXISTS "Users can delete payments of their tenant." ON public.payments;
CREATE POLICY "Users can delete payments of their tenant." ON public.payments
  FOR DELETE USING (tenant_id IN (SELECT public.get_auth_user_tenant_ids()));
