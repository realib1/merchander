import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProductForm, InitialProductData } from '../../components/ProductForm';

export const metadata = {
  title: 'Edit Product | Merchander',
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get tenant ID
  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

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
  const { data: variantsData } = await supabase.from('product_variants').select('*').eq('product_id', product.id);

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
  let basePrice: number | '' = '';
  let baseCostPrice: number | '' = '';

  if (variantsData && variantsData.length > 0) {
    basePrice = variantsData[0].price ?? '';
    baseCostPrice = variantsData[0].cost_price ?? '';
  }

  const initialData: InitialProductData = {
    id: product.id,
    name: product.name || '',
    description: product.description || '',
    isActive: product.is_active ?? true,
    categoryId: product.category_id || '',
    vendor: product.vendor || '',
    stockUnit: product.stock_unit || 'pcs',
    imageUrls: product.image_urls || [],
    basePrice: basePrice,
    baseCostPrice: baseCostPrice,
    availabilityStatus: product.availability_status || 'AVAILABLE',
    preorderShippingMode: product.preorder_shipping_mode || 'included',
    specifications: Array.isArray(product.specifications) ? product.specifications : [],
    variants:
      variantsData && variantsData.length > 0
        ? variantsData.map((v) => ({
            id: v.id,
            sku: v.sku || '',
            name: v.name || 'Default',
            price: v.price ?? basePrice,
            costPrice: v.cost_price ?? baseCostPrice,
            inventory: {},
          }))
        : [
            {
              id: 'default',
              sku: '',
              name: 'Default',
              price: basePrice,
              costPrice: baseCostPrice,
              inventory: {},
            },
          ],
  };

  return (
    <div className="min-h-full">
      <ProductForm stores={stores || []} categories={categories || []} initialData={initialData} />
    </div>
  );
}
