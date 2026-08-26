-- Add short_id to expenses table
ALTER TABLE public.expenses ADD COLUMN short_id VARCHAR(50);

-- Generate short IDs for existing expenses
UPDATE public.expenses 
SET short_id = public.generate_short_id('EXP')
WHERE short_id IS NULL;

-- Enforce NOT NULL and UNIQUE constraints
ALTER TABLE public.expenses ALTER COLUMN short_id SET NOT NULL;
ALTER TABLE public.expenses ADD CONSTRAINT uq_expenses_tenant_short_id UNIQUE (tenant_id, short_id);

-- Add default value for future inserts
ALTER TABLE public.expenses ALTER COLUMN short_id SET DEFAULT public.generate_short_id('EXP');
