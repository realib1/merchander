-- Add specifications JSONB column to products for dynamic attributes (Electronics, Fashion, Beauty, etc.)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Create GIN index for efficient JSON querying and filtering
CREATE INDEX IF NOT EXISTS idx_products_specifications ON public.products USING gin (specifications);
