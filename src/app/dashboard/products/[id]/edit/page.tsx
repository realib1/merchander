import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProductForm, InitialProductData } from '../../components/ProductForm';

export const metadata = {
  title: 'Edit Product | Merchander',
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get tenant ID
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantUser) {
    redirect('/dashboard/products');
  }

  // Fetch the product
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantUser.tenant_id)
    .single();

  if (!product) {
    redirect('/dashboard/products'); // Not found or not authorized
  }

  // Fetch product variants
  const { data: variantsData } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', product.id);

  // Fetch all stores for this tenant
  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, location')
    .eq('tenant_id', tenantUser.tenant_id);

  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name')
    .eq('tenant_id', tenantUser.tenant_id)
    .order('name');

  // Transform data for the form
  // We need to calculate basePrice and baseCostPrice from variants
  // If there's only 1 variant, or all variants have the same price, we can use that as base.
  // For simplicity, we just use the first variant's price as base, or 0.
  let basePrice: number | '' = '';
  let baseCostPrice: number | '' = '';
  
  if (variantsData && variantsData.length > 0) {
    // If all variants share the same price, extract it to basePrice
    const allPricesSame = variantsData.every(v => v.price === variantsData[0].price);
    if (allPricesSame) {
      basePrice = variantsData[0].price;
    }
    
    // Do the same for costPrice
    const allCostPricesSame = variantsData.every(v => v.cost_price === variantsData[0].cost_price);
    if (allCostPricesSame) {
      baseCostPrice = variantsData[0].cost_price ?? '';
    }
  }

  const initialData: InitialProductData = {
    id: product.id,
    name: product.name,
    description: product.description || '',
    isActive: product.is_active,
    categoryId: product.category_id,
    vendor: product.vendor,
    stockUnit: product.stock_unit,
    imageUrls: product.image_urls || [],
    basePrice,
    baseCostPrice,
    variants: (variantsData || []).map(v => ({
      id: v.id,
      sku: v.sku,
      name: v.name || '',
      price: v.price === basePrice ? '' : v.price,
      costPrice: v.cost_price === baseCostPrice ? '' : (v.cost_price || ''),
      inventory: {} // Ignore inventory for edit mode
    }))
  };

  return (
    <div className="min-h-full">
      <ProductForm 
        stores={stores || []} 
        categories={categories || []} 
        initialData={initialData} 
      />
    </div>
  );
}
