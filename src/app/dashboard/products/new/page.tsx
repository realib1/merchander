import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProductForm } from './components/ProductForm';

export const metadata = {
  title: 'Add Product | Merchander',
};

export default async function NewProductPage() {
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

  // Fetch all stores for this tenant to display inventory input fields
  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, location')
    .eq('tenant_id', tenantUser.tenant_id);

  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name')
    .eq('tenant_id', tenantUser.tenant_id)
    .order('name');

  return (
    <div className="h-full">
      <ProductForm stores={stores || []} categories={categories || []} />
    </div>
  );
}
