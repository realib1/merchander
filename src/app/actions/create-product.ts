'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { z } from 'zod';

const variantSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().optional(), // Variant name like 'Red / Large'
  price: z.number().min(0, 'Price must be non-negative'),
  costPrice: z.number().min(0, 'Cost Price must be non-negative').optional().nullable(),
  inventory: z.record(z.number()).optional(), // store_id -> quantity
});

const specificationSchema = z.object({
  key: z.string().min(1, 'Specification name cannot be empty'),
  value: z.string().min(1, 'Specification value cannot be empty'),
});

const createProductSchema = z.object({
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

import { generateProductSku } from '@/utils/sku';

export async function createProductAction(formData: FormData) {
  let rawData;
  try {
    const productName = (formData.get('name') as string) || 'Product';
    const parsedVariants = JSON.parse((formData.get('variants') as string) || '[]');
    const sanitizedVariants = parsedVariants.map((v: { sku?: string; name?: string }, idx: number) => ({
      ...v,
      sku:
        v.sku && v.sku.trim() !== ''
          ? v.sku.trim().toUpperCase()
          : generateProductSku({ productName, variantName: v.name, options: { sequenceNumber: idx + 1 } }),
    }));

    rawData = {
      name: productName,
      description: formData.get('description') || '',
      isActive: formData.get('isActive') === 'true',
      variants: sanitizedVariants,
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

  const validation = createProductSchema.safeParse(rawData);
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
      stock_unit: data.stockUnit,
      image_urls: data.imageUrls || [],
      specifications: data.specifications || [],
      availability_status: data.availabilityStatus,
      preorder_shipping_mode: data.preorderShippingMode,
    })
    .select('id')
    .single();

  if (productError || !product) {
    console.error('Error creating product:', productError);
    return { error: 'Failed to create product' };
  }

  // 2. Insert Variants
  const variantInserts = data.variants.map((v) => ({
    product_id: product.id,
    sku: v.sku,
    name: v.name || null,
    price: v.price,
    cost_price: v.costPrice || null,
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
  data.variants.forEach((v) => {
    if (v.inventory) {
      // Find the created variant ID
      const createdVariant = variants.find((cv) => cv.sku === v.sku);
      if (createdVariant) {
        Object.entries(v.inventory).forEach(([storeId, quantity]) => {
          if (quantity > 0) {
            inventoryInserts.push({
              variant_id: createdVariant.id,
              store_id: storeId,
              quantity: quantity,
            });
          }
        });
      }
    }
  });

  // 4. Handle Pre-Order Batch Association
  if (data.availabilityStatus === 'PRE_ORDER') {
    let targetBatchId = (formData.get('batchId') as string) || null;
    const customBatchRaw = formData.get('customBatch') as string;

    if (!targetBatchId && customBatchRaw) {
      try {
        const cb = JSON.parse(customBatchRaw);
        const { data: newBatch } = await supabase
          .from('preorder_batches')
          .insert({
            tenant_id: tenantId,
            name: cb.name || `${data.name} Batch`,
            code:
              (cb.code || cb.name || `${data.name}-B1`)
                .toUpperCase()
                .replace(/[^A-Z0-9-]/g, '')
                .slice(0, 16) || 'BATCH-1',
            status: 'OPEN',
            opens_at: new Date().toISOString(),
            closes_at: cb.closesAt ? new Date(`${cb.closesAt}T23:59:59Z`).toISOString() : new Date().toISOString(),
            supplier_order_date: cb.supplierOrderDate || undefined,
            expected_arrival_start: cb.expectedArrivalStart || undefined,
            expected_arrival_end: cb.expectedArrivalEnd || undefined,
            freight_mode: cb.freightMode || 'sea',
            origin_country: cb.originCountry || 'China',
          })
          .select('id')
          .single();

        if (newBatch) {
          targetBatchId = newBatch.id;
        }
      } catch (err) {
        console.error('Error creating custom preorder batch:', err);
      }
    }

    if (targetBatchId) {
      await supabase.from('product_preorder_batches').insert({
        tenant_id: tenantId,
        product_id: product.id,
        batch_id: targetBatchId,
        is_active: true,
      });
    }
  }

  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/inventory');
  revalidatePath('/dashboard/inventory/batches');
  revalidatePath('/dashboard/categories');
  redirect('/dashboard/products');
}
