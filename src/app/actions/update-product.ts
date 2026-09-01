'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const variantSchema = z.object({
  id: z.string().optional(), // Existing variant UUID, or local temporary ID
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  costPrice: z.number().min(0, 'Cost Price must be non-negative').optional().nullable(),
  inventory: z.record(z.number()).optional(),
});

const specificationSchema = z.object({
  key: z.string().min(1, 'Specification name cannot be empty'),
  value: z.string().min(1, 'Specification value cannot be empty'),
});

const updateProductSchema = z.object({
  id: z.string().uuid('Invalid product ID'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  isActive: z.boolean(),
  variants: z.array(variantSchema).min(1, 'At least one variant is required'),
  categoryId: z.string().uuid().optional().nullable(),
  vendor: z.string().optional().nullable(),
  stockUnit: z.string().optional().nullable(),
  imageUrls: z.array(z.string()).optional(),
  specifications: z.array(specificationSchema).optional().default([]),
  availabilityStatus: z.string().optional(),
  preorderShippingMode: z.enum(['included', 'tbd']).optional().default('included'),
});

export async function updateProductAction(formData: FormData) {
  let rawData;
  try {
    rawData = {
      id: formData.get('id'),
      name: formData.get('name'),
      description: formData.get('description') || '',
      isActive: formData.get('isActive') === 'true',
      variants: JSON.parse((formData.get('variants') as string) || '[]'),
      categoryId: formData.get('categoryId') || null,
      vendor: formData.get('vendor') || null,
      stockUnit: formData.get('stockUnit') || 'pcs',
      imageUrls: JSON.parse((formData.get('imageUrls') as string) || '[]'),
      specifications: JSON.parse((formData.get('specifications') as string) || '[]'),
      availabilityStatus: formData.get('availabilityStatus') || 'in_stock',
      preorderShippingMode: formData.get('preorderShippingMode') || 'included',
    };
  } catch {
    return { error: 'Invalid product data format' };
  }

  const validation = updateProductSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }
  const data = validation.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // 1. Update Base Product
  const { error: productError } = await supabase
    .from('products')
    .update({
      name: data.name,
      description: data.description,
      is_active: data.isActive,
      category_id: data.categoryId,
      vendor: data.vendor,
      stock_unit: data.stockUnit,
      image_urls: data.imageUrls || [],
      specifications: data.specifications || [],
      availability_status: data.availabilityStatus,
      preorder_shipping_mode: data.preorderShippingMode,
    })
    .eq('id', data.id)
    .eq('tenant_id', tenantId); // ensure tenant isolation

  if (productError) {
    console.error('Error updating product:', productError);
    return { error: 'Failed to update product' };
  }

  // 2. Diff Variants
  // First, fetch existing variants
  const { data: existingVariants, error: fetchVariantsError } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', data.id);

  if (fetchVariantsError) {
    console.error('Error fetching existing variants:', fetchVariantsError);
    return { error: 'Failed to sync variants' };
  }

  const existingVariantIds = new Set(existingVariants?.map((v) => v.id) || []);
  const incomingVariantIds = new Set(
    data.variants.map((v) => v.id).filter((id) => id && id.length === 36 && id.includes('-')) // very basic UUID check
  );

  // Determine which to delete
  const idsToDelete = [...existingVariantIds].filter((id) => !incomingVariantIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase.from('product_variants').delete().in('id', idsToDelete);

    if (deleteError) {
      console.error('Error deleting variants:', deleteError);
      return { error: 'Failed to delete removed variants' };
    }
  }

  // Determine which to update or insert
  const variantsToInsert = [];

  for (const v of data.variants) {
    const isExistingUUID = v.id && v.id.length === 36 && v.id.includes('-');

    if (isExistingUUID && existingVariantIds.has(v.id as string)) {
      // Update existing
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({
          sku: v.sku,
          name: v.name || null,
          price: v.price,
          cost_price: v.costPrice || null,
        })
        .eq('id', v.id);

      if (updateError) {
        console.error('Error updating variant:', updateError);
        return { error: 'Failed to update variant details' };
      }
    } else {
      // Insert new
      variantsToInsert.push({
        product_id: data.id,
        sku: v.sku,
        name: v.name || null,
        price: v.price,
        cost_price: v.costPrice || null,
      });
    }
  }

  if (variantsToInsert.length > 0) {
    const { error: insertError } = await supabase.from('product_variants').insert(variantsToInsert);

    if (insertError) {
      console.error('Error inserting variants:', insertError);
      return { error: 'Failed to add new variants' };
    }
  }

  // Note: we intentionally skip inventory handling here as discussed in the implementation plan.
  // Inventory updates should be done via the Inventory tab/system to avoid race conditions.

  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/inventory');
  revalidatePath('/dashboard/categories');
  redirect('/dashboard/products');
}
