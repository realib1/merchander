-- 1. Rename tables
ALTER TABLE public.shipments RENAME TO purchase_orders;
ALTER TABLE public.shipment_items RENAME TO purchase_order_items;

-- 2. Rename columns in other tables
ALTER TABLE public.supplier_payments RENAME COLUMN shipment_id TO purchase_order_id;
ALTER TABLE public.purchase_order_items RENAME COLUMN shipment_id TO purchase_order_id;

-- Rename foreign key constraints for clarity (ignoring error if names are slightly different)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.purchase_order_items RENAME CONSTRAINT shipment_items_shipment_id_fkey TO purchase_order_items_purchase_order_id_fkey;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  
  BEGIN
    ALTER TABLE public.supplier_payments RENAME CONSTRAINT supplier_payments_shipment_id_fkey TO supplier_payments_purchase_order_id_fkey;
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 3. Update status check constraint on purchase_orders
ALTER TABLE public.purchase_orders DROP CONSTRAINT shipments_status_check;

-- Data migration
UPDATE public.purchase_orders SET status = 'ordered' WHERE status = 'pending';
UPDATE public.purchase_orders SET status = 'ordered' WHERE status = 'in_transit';
UPDATE public.purchase_orders SET status = 'received' WHERE status = 'delivered';

ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_status_check 
  CHECK (status IN ('draft', 'ordered', 'partially_received', 'received', 'cancelled'));

-- 4. Add po_number sequence and trigger
CREATE SEQUENCE IF NOT EXISTS purchase_order_seq START 1000;

ALTER TABLE public.purchase_orders ADD COLUMN po_number text UNIQUE;

-- Backfill existing rows with a temp sequence just to avoid nulls violating uniqueness initially
-- But we can just use the function directly on existing rows
CREATE OR REPLACE FUNCTION set_po_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.po_number IS NULL THEN
    NEW.po_number := 'PO-' || nextval('purchase_order_seq')::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_purchase_orders_po_number
BEFORE INSERT ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION set_po_number();

-- Backfill existing records
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.purchase_orders WHERE po_number IS NULL LOOP
    UPDATE public.purchase_orders SET po_number = 'PO-' || nextval('purchase_order_seq')::text WHERE id = r.id;
  END LOOP;
END $$;

-- 5. Drop old RLS policies and recreate them with new names
DROP POLICY IF EXISTS "Users can view shipments of their tenant." ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can insert shipments for their tenant." ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can update shipments of their tenant." ON public.purchase_orders;
DROP POLICY IF EXISTS "Superadmins can view all shipments." ON public.purchase_orders;

CREATE POLICY "Users can view purchase_orders of their tenant." ON public.purchase_orders
  FOR SELECT USING (tenant_id in (select public.get_auth_user_tenant_ids()));
CREATE POLICY "Users can insert purchase_orders for their tenant." ON public.purchase_orders
  FOR INSERT WITH CHECK (tenant_id in (select public.get_auth_user_tenant_ids()));
CREATE POLICY "Users can update purchase_orders of their tenant." ON public.purchase_orders
  FOR UPDATE USING (tenant_id in (select public.get_auth_user_tenant_ids()));
CREATE POLICY "Superadmins can view all purchase_orders." ON public.purchase_orders FOR SELECT USING (public.is_superadmin());

DROP POLICY IF EXISTS "Users can view shipment_items of their tenant's shipments." ON public.purchase_order_items;
DROP POLICY IF EXISTS "Users can insert shipment_items to their tenant's shipments." ON public.purchase_order_items;
DROP POLICY IF EXISTS "Users can update shipment_items of their tenant's shipments." ON public.purchase_order_items;
DROP POLICY IF EXISTS "Superadmins can view all shipment_items." ON public.purchase_order_items;

CREATE POLICY "Users can view purchase_order_items of their tenant's orders." ON public.purchase_order_items
  FOR SELECT USING (purchase_order_id in (select id from public.purchase_orders where tenant_id in (select public.get_auth_user_tenant_ids())));
CREATE POLICY "Users can insert purchase_order_items to their tenant's orders." ON public.purchase_order_items
  FOR INSERT WITH CHECK (purchase_order_id in (select id from public.purchase_orders where tenant_id in (select public.get_auth_user_tenant_ids())));
CREATE POLICY "Users can update purchase_order_items of their tenant's orders." ON public.purchase_order_items
  FOR UPDATE USING (purchase_order_id in (select id from public.purchase_orders where tenant_id in (select public.get_auth_user_tenant_ids())));
CREATE POLICY "Superadmins can view all purchase_order_items." ON public.purchase_order_items FOR SELECT USING (public.is_superadmin());
