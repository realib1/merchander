ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_provider_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_provider_check CHECK (provider in ('momo', 'cash_on_delivery', 'card_payment', 'cash_payment'));
