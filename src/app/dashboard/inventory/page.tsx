import { createClient } from '@/lib/supabase/server';
import { PackageSearch, Warehouse, AlertCircle, Save } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { updateStock } from '@/app/actions/inventory';

interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  product?: { name: string } | null;
  inventory?: { quantity: number; store?: { id: string; name: string } | null }[] | null;
}

export const metadata = {
  title: 'Inventory | Merchander',
};

export default async function InventoryPage() {
  const supabase = await createClient();

  // Fetch variants and their inventory levels
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select(`
      id,
      sku,
      name,
      price,
      product:products(name),
      inventory:inventory_levels(quantity, store:stores(id, name))
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inventory:', error);
  }

  return (
    <div className="h-full flex flex-col max-w-5xl">
      <div className="bg-surface border border-separator rounded-2xl shadow-sm overflow-hidden mt-6">
        <div className="grid grid-cols-12 gap-4 p-4 font-semibold text-text-secondary text-sm border-b border-separator bg-surface-elevated/50">
          <div className="col-span-5">SKU / Item</div>
          <div className="col-span-3">Branch</div>
          <div className="col-span-4 text-right">Available Stock</div>
        </div>

        <div className="divide-y divide-gray-50">
          {(variants as unknown as ProductVariant[])?.map((variant) => {
            const hasInventory = variant.inventory && variant.inventory.length > 0;
            const productName = variant.product?.name || 'Unknown Product';
            const displayName = variant.name ? `${productName} - ${variant.name}` : productName;

            // If no inventory levels are set up yet
            if (!hasInventory) {
              return (
                <div key={variant.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-surface-elevated/50 transition-colors">
                  <div className="col-span-5">
                    <div className="font-mono text-xs text-text-muted font-medium mb-1">{variant.sku}</div>
                    <div className="font-semibold text-text-primary">{displayName}</div>
                    <div className="text-xs font-medium text-text-secondary mt-0.5">{formatCurrency(variant.price)}</div>
                  </div>
                  <div className="col-span-3 text-sm text-text-muted flex items-center gap-2">
                    <AlertCircle size={14} />
                    Unassigned
                  </div>
                  <div className="col-span-4 text-right">
                    <span className="text-sm font-semibold text-text-muted">0</span>
                  </div>
                </div>
              );
            }

            // Render each store's inventory for this variant
            return variant.inventory?.map((inv, idx: number) => (
              <div key={`${variant.id}-${idx}`} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-surface-elevated/50 transition-colors">
                <div className="col-span-5">
                  <div className="font-mono text-xs text-text-muted font-medium mb-1">{variant.sku}</div>
                  <div className="font-semibold text-text-primary">{displayName}</div>
                  <div className="text-xs font-medium text-text-secondary mt-0.5">{formatCurrency(variant.price)}</div>
                </div>
                
                <div className="col-span-3 flex items-center gap-2 text-sm font-medium text-text-secondary">
                  <Warehouse size={16} className="text-text-muted" />
                  {inv.store?.name || 'Main Branch'}
                </div>

                <div className="col-span-4 flex items-center justify-end gap-3">
                  <div className="w-full max-w-37.5 bg-surface-elevated rounded-full h-1.5 overflow-hidden">
                    {/* Visual indicator bar */}
                    <div 
                      className={`h-full rounded-full ${inv.quantity > 20 ? 'bg-green-500' : inv.quantity > 5 ? 'bg-orange-500' : 'bg-red-500'}`} 
                      style={{ width: `${Math.min((inv.quantity / 50) * 100, 100)}%` }}
                    />
                  </div>
                  <form action={async (formData) => {
                    "use server";
                    await updateStock(formData);
                  }} className="flex items-center gap-1 group/form">
                    <input type="hidden" name="variantId" value={variant.id} />
                    <input type="hidden" name="storeId" value={inv.store?.id || ''} />
                    <input 
                      type="number" 
                      name="quantity" 
                      defaultValue={inv.quantity} 
                      min="0"
                      className={`w-16 text-right px-2 py-1 text-sm font-bold border rounded-md outline-none transition-all ${inv.quantity === 0 ? 'text-red-500' : inv.quantity < 10 ? 'text-orange-500' : 'text-text-primary'}` + " border-transparent focus:border-brand-primary bg-transparent focus:bg-surface"}
                    />
                    <button type="submit" className={"p-1.5 text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-md transition-all cursor-pointer" + " opacity-0 focus:opacity-100 group-hover/form:opacity-100"}>
                      <Save size={14} />
                    </button>
                  </form>
                </div>
              </div>
            ));
          })}

          {(!variants || variants.length === 0) && (
            <div className="p-12 text-center text-text-secondary">
              <PackageSearch size={48} className="mx-auto mb-4 text-text-muted" />
              <p className="font-medium text-text-primary">No inventory to track</p>
              <p className="text-sm mt-1">Add items to your catalog to track stock.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
