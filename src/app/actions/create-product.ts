'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { z } from 'zod';

const variantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().optional(), // Variant name like 'Red / Large'
  price: z.number().min(0, "Price must be non-negative"),
  inventory: z.record(z.number()).optional(), // store_id -> quantity
});

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
  categoryId: z.string().uuid().optional().nullable(),
  vendor: z.string().optional().nullable(),
  imageUrls: z.array(z.string()).optional(),
});

export async function createProductAction(formData: FormData) {
  let rawData;
  try {
    rawData = {
      name: formData.get('name'),
      description: formData.get('description') || '',
      isActive: formData.get('isActive') === 'true',
      variants: JSON.parse(formData.get('variants') as string || '[]'),
      categoryId: formData.get('categoryId') || null,
      vendor: formData.get('vendor') || null,
      imageUrls: JSON.parse(formData.get('imageUrls') as string || '[]'),
    };
  } catch (_e) {
    return { error: 'Invalid product data format' };
  }

  const validation = createProductSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }
  const data = validation.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { data: tenantUsers, error: tenantUserError } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (tenantUserError || !tenantUsers) {
    return { error: 'Tenant not found' };
  }
  const tenantId = tenantUsers.tenant_id;

  // 1. Insert Base Product
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      description: data.description,
      is_active: data.isActive,
      category_id: data.categoryId,
      vendor: data.vendor,
      image_urls: data.imageUrls || []
    })
    .select('id')
    .single();

  if (productError || !product) {
    console.error('Error creating product:', productError);
    return { error: 'Failed to create product' };
  }

  // 2. Insert Variants
  const variantInserts = data.variants.map(v => ({
    product_id: product.id,
    sku: v.sku,
    name: v.name || null,
    price: v.price
  }));

  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .insert(variantInserts)
    .select('id, sku');

  if (variantsError || !variants) {
    console.error('Error creating variants:', variantsError);
    return { error: 'Failed to create product variants' };
  }

  // 3. Insert Initial Inventory Levels
  const inventoryInserts: unknown[] = [];
  data.variants.forEach(v => {
    if (v.inventory) {
      // Find the created variant ID
      const createdVariant = variants.find(cv => cv.sku === v.sku);
      if (createdVariant) {
        Object.entries(v.inventory).forEach(([storeId, quantity]) => {
          if (quantity > 0) {
            inventoryInserts.push({
              variant_id: createdVariant.id,
              store_id: storeId,
              quantity: quantity
            });
          }
        });
      }
    }
  });

  if (inventoryInserts.length > 0) {
    const { error: invError } = await supabase
      .from('inventory_levels')
      .insert(inventoryInserts);

    if (invError) {
      console.error('Failed to set initial inventory:', invError);
      return { error: 'Failed to set initial inventory' };
    }
  }

  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/inventory');
  redirect('/dashboard/products');
}
