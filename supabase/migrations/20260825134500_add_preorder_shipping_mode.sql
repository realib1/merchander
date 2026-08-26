-- Add preorder_shipping_mode to products ('included' or 'tbd')
ALTER TABLE public.products 
ADD COLUMN preorder_shipping_mode text DEFAULT 'included' NOT NULL;

-- Add constraint to ensure it's a valid mode
ALTER TABLE public.products 
ADD CONSTRAINT products_preorder_shipping_mode_check 
CHECK (preorder_shipping_mode IN ('included', 'tbd'));

-- Add shipping_tbd flag to orders
ALTER TABLE public.orders 
ADD COLUMN shipping_tbd boolean DEFAULT false NOT NULL;
