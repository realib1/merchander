-- Add description and is_active to product_categories table
ALTER TABLE product_categories
ADD COLUMN description TEXT,
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
