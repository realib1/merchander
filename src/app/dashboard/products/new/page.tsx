import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProductForm } from '../components/ProductForm';
import { getTenantPreorderBatches } from '@/app/actions/preorder-batches';

export const metadata = {
  title: 'Add Product | Merchander',
};

export default async function NewProductPage() {
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

  const [{ data: stores }, { data: categories }, batches] = await Promise.all([
    supabase.from('stores').select('id, name, location').eq('tenant_id', tenantUser.tenant_id),
    supabase.from('product_categories').select('id, name').eq('tenant_id', tenantUser.tenant_id).order('name'),
    getTenantPreorderBatches(tenantUser.tenant_id),
  ]);

  return (
    <div className="min-h-full">
      <ProductForm stores={stores || []} categories={categories || []} batches={batches} />
    </div>
  );
}
