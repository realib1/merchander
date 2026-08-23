-- 1. Create a dummy Auth User (Merchant)
-- Password is 'password123'
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
values 
('a1b2c3d4-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'merchant@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('f9e8d7c6-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'superadmin@merchander.com', crypt('superadmin123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"], "is_superadmin": true}', '{}', now(), now(), '', '', '', '');

-- 1b. Create matching auth.identities (required by GoTrue for signInWithPassword)
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values
('a1b2c3d4-0000-0000-0000-000000000000', 'a1b2c3d4-0000-0000-0000-000000000000', '{"sub":"a1b2c3d4-0000-0000-0000-000000000000","email":"merchant@example.com"}', 'email', 'a1b2c3d4-0000-0000-0000-000000000000', now(), now(), now()),
('f9e8d7c6-0000-0000-0000-000000000000', 'f9e8d7c6-0000-0000-0000-000000000000', '{"sub":"f9e8d7c6-0000-0000-0000-000000000000","email":"superadmin@merchander.com"}', 'email', 'f9e8d7c6-0000-0000-0000-000000000000', now(), now(), now());

-- 2. Create a Tenant
insert into public.tenants (id, name)
values ('11000000-0000-0000-0000-000000000000', 'Afia''s Boutique');

-- 3. Link User to Tenant
insert into public.tenant_users (tenant_id, user_id, role)
values ('11000000-0000-0000-0000-000000000000', 'a1b2c3d4-0000-0000-0000-000000000000', 'owner');

-- 4. Create Stores
insert into public.stores (id, tenant_id, name, location)
values 
('21000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000000', 'Accra Central Branch', 'Makola Market'),
('22000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000000', 'Kumasi Branch', 'Kejetia');

-- 5. Create Customers
insert into public.customers (id, tenant_id, name, phone)
values 
('31000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000000', 'Kwame Mensah', '+233244111222'),
('32000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000000', 'Ama Osei', '+233555222333');

-- 6. Create Products
insert into public.products (id, tenant_id, name, description)
values 
('41000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000000', 'Authentic Kente Cloth', 'Handwoven Kente from Bonwire'),
('42000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000000', 'Shero T-Shirt', 'Premium oversized streetwear');

-- 7. Create Product Variants
insert into public.product_variants (id, product_id, name, sku, price)
values 
('51100000-0000-0000-0000-000000000000', '41000000-0000-0000-0000-000000000000', 'Red/Gold 6 Yards', 'KENTE-RG-6Y', 850.00),
('51200000-0000-0000-0000-000000000000', '41000000-0000-0000-0000-000000000000', 'Blue/White 6 Yards', 'KENTE-BW-6Y', 850.00),
('52100000-0000-0000-0000-000000000000', '42000000-0000-0000-0000-000000000000', 'Large - Black', 'SHERO-L-BLK', 120.00);

-- 8. Setup Inventory Levels
insert into public.inventory_levels (variant_id, store_id, quantity)
values 
('51100000-0000-0000-0000-000000000000', '21000000-0000-0000-0000-000000000000', 12),
('51100000-0000-0000-0000-000000000000', '22000000-0000-0000-0000-000000000000', 4),
('51200000-0000-0000-0000-000000000000', '21000000-0000-0000-0000-000000000000', 8),
('52100000-0000-0000-0000-000000000000', '21000000-0000-0000-0000-000000000000', 45);

-- 9. Create Mock Orders (Populating the Kanban Board)
insert into public.orders (id, tenant_id, store_id, customer_id, status, total_amount, delivery_address, delivery_fee)
values 
-- New Draft Order (AI Ingested)
('61000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000000', '21000000-0000-0000-0000-000000000000', '31000000-0000-0000-0000-000000000000', 'draft', 970.00, 'East Legon, near KFC', 120.00),
-- Pending Payment Order
('62000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000000', '21000000-0000-0000-0000-000000000000', '32000000-0000-0000-0000-000000000000', 'pending_payment', 140.00, 'Osu, Oxford St', 20.00),
-- Paid Order (Ready for dispatch)
('63000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000000', '22000000-0000-0000-0000-000000000000', '31000000-0000-0000-0000-000000000000', 'paid', 850.00, 'KNUST Campus', 0.00);

-- 10. Order Items
insert into public.order_items (order_id, variant_id, quantity, unit_price)
values 
('61000000-0000-0000-0000-000000000000', '51100000-0000-0000-0000-000000000000', 1, 850.00),
('62000000-0000-0000-0000-000000000000', '52100000-0000-0000-0000-000000000000', 1, 120.00),
('63000000-0000-0000-0000-000000000000', '51200000-0000-0000-0000-000000000000', 1, 850.00);


-- 11. Update product_variants with cost_price
update public.product_variants set cost_price = price * 0.6;

-- 12. Create Suppliers
insert into public.suppliers (id, tenant_id, name, contact_name, outstanding_balance, country)
values 
('71000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000000', 'Guangzhou Fashion Co.', 'Mr. Wang', 900.00, 'China'),
('72000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000000', 'Accra Weavers Guild', 'Kwasi Yeboah', 0.00, 'Ghana');

-- 13. Create Shipments
insert into public.shipments (id, tenant_id, supplier_id, tracking_number, status, eta)
values 
('81000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000000', '71000000-0000-0000-0000-000000000000', 'SHP-024', 'in_transit', timezone('utc'::text, now() + interval '2 days')),
('82000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000000', '72000000-0000-0000-0000-000000000000', 'SHP-025', 'pending', timezone('utc'::text, now() + interval '10 days'));

-- 14. Create Shipment Items
insert into public.shipment_items (shipment_id, variant_id, quantity, cost_price)
values 
('81000000-0000-0000-0000-000000000000', '52100000-0000-0000-0000-000000000000', 86, 72.00),
('82000000-0000-0000-0000-000000000000', '51100000-0000-0000-0000-000000000000', 100, 510.00);

