-- Add payment_method column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash';
