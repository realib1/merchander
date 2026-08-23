import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Edit, Package, BarChart2, Calendar, Tag, Layers } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { ProductVariant } from '@/types/product';

interface VariantWithStore extends Omit<ProductVariant, 'inventory'> {
  inventory?: { quantity: number; store?: { name: string } }[] | null;
}

export const metadata = {
  title: 'Product Details | Merchander',
};

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Fetch the product with its category and variants
  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      category:product_categories(id, name),
      variants:product_variants(
        *,
        inventory:inventory_levels(quantity, store:stores(name))
      )
    `)
    .eq('id', id)
    .eq('tenant_id', tenantUser.tenant_id)
    .single();

  if (!product) {
    redirect('/dashboard/products');
  }

  // Calculate totals
  const totalStock = product.variants?.reduce((acc: number, v: VariantWithStore) => {
    const inv = v.inventory?.reduce((iAcc: number, i: { quantity: number; store?: { name: string } }) => iAcc + (i.quantity || 0), 0) || 0;
    return acc + inv;
  }, 0) ?? 0;

  const prices = product.variants?.map((v: VariantWithStore) => v.price) || [0];
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const priceDisplay = prices.length > 1 && minPrice !== maxPrice 
    ? `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}` 
    : formatCurrency(minPrice);

  return (
    <div className="min-h-full flex flex-col max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/products" 
            className="p-2 -ml-2 hover:bg-surface-elevated rounded-lg text-muted hover:text-brand-primary transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary">{product.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted">SKU-{product.id.substring(0, 6).toUpperCase()}</span>
              <span className="w-1 h-1 rounded-full bg-separator mx-1" />
              {product.is_active ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-semibold bg-emerald-500/10 text-emerald-600">Active</span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-semibold bg-orange-500/10 text-orange-600">Archived</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/products/${product.id}/edit`}
            className="px-4 py-2 bg-surface border border-separator text-primary rounded-xl font-medium text-sm hover:bg-surface-elevated transition-colors flex items-center gap-2"
          >
            <Edit size={16} />
            Edit Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface border border-separator rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <Package size={18} className="text-brand-primary" />
              Product Information
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
              {product.image_urls && product.image_urls.length > 0 && (
                <div className="col-span-2 sm:col-span-1">
                  <div className="aspect-square rounded-xl overflow-hidden border border-separator bg-surface-elevated/30">
                    <img src={product.image_urls[0]} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
              
              <div className={`col-span-2 ${product.image_urls && product.image_urls.length > 0 ? 'sm:col-span-1' : ''} space-y-4`}>
                <div>
                  <div className="text-sm text-muted mb-1">Description</div>
                  <div className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
                    {product.description || <span className="italic text-secondary">No description provided.</span>}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted mb-1">Category</div>
                  <div className="text-sm font-medium text-primary flex items-center gap-2">
                    <Tag size={14} className="text-secondary" />
                    {product.category?.name || 'Uncategorized'}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted mb-1">Price</div>
                  <div className="text-lg font-bold text-primary">{priceDisplay}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Variants & Inventory */}
          <div className="bg-surface border border-separator rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-separator">
              <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                <Layers size={18} className="text-brand-primary" />
                Variants & Inventory
              </h2>
            </div>
            
            <div className="divide-y divide-separator">
              {product.variants?.map((variant: VariantWithStore) => {
                const variantStock = variant.inventory?.reduce((acc: number, i: { quantity: number }) => acc + (i.quantity || 0), 0) || 0;
                
                return (
                  <div key={variant.id} className="p-4 sm:p-6 hover:bg-surface-elevated/20 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                      <div>
                        <div className="font-semibold text-primary mb-1">{variant.name || product.name}</div>
                        <div className="text-xs font-mono text-muted bg-surface-elevated px-2 py-1 rounded inline-block">{variant.sku}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs text-muted mb-1">Price</div>
                          <div className="font-medium text-primary">{formatCurrency(variant.price)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted mb-1">Stock</div>
                          <div className={`font-bold ${variantStock === 0 ? 'text-red-500' : variantStock < 10 ? 'text-orange-500' : 'text-emerald-600'}`}>
                            {variantStock} {product.stock_unit || 'pcs'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {variant.inventory && variant.inventory.length > 0 && (
                      <div className="mt-4 bg-surface-elevated/30 rounded-xl p-3 border border-separator/50">
                        <div className="text-xs font-medium text-secondary mb-2 uppercase tracking-wider">Inventory Breakdown</div>
                        <div className="space-y-2">
                          {variant.inventory.map((inv: { quantity: number; store?: { name: string } }, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-muted">{inv.store?.name || 'Main Branch'}</span>
                              <span className="font-medium text-primary">{inv.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-surface border border-separator rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider text-muted">Summary</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                  <BarChart2 size={18} />
                </div>
                <div>
                  <div className="text-sm text-muted">Total Inventory</div>
                  <div className="font-bold text-primary">
                    {totalStock} {product.stock_unit || 'pcs'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-secondary shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <div className="text-sm text-muted">Created</div>
                  <div className="font-medium text-primary text-sm">
                    {new Date(product.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-secondary shrink-0">
                  <Layers size={18} />
                </div>
                <div>
                  <div className="text-sm text-muted">Variants</div>
                  <div className="font-medium text-primary text-sm">
                    {product.variants?.length || 0} variant(s)
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {product.vendor && (
            <div className="bg-surface border border-separator rounded-2xl p-6 shadow-sm">
               <h3 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider text-muted">Vendor</h3>
               <div className="font-medium text-primary">{product.vendor}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
