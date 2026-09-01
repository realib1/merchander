import React from 'react';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import { getTenantBranches } from '@/app/actions/branches';
import { BranchManagementClient } from './components/BranchManagementClient';
import { TransferableVariant } from './components/StockTransferModal';

export const metadata: Metadata = {
  title: 'Branches & Locations | Merchander',
  description: 'Manage your physical shops, warehouses, customer pickup desks, and stock distribution.',
};

export default async function BranchesSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { tenantId } = await getTenantInfo(supabase, user.id);
  const branches = await getTenantBranches();

  // Fetch product variants with inventory levels across stores for transfer modal
  const { data: rawProducts } = await supabase
    .from('products')
    .select(
      `
      id, name,
      variants:product_variants(
        id, sku, name,
        inventory:inventory_levels(store_id, quantity)
      )
    `
    )
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name');

  const transferableVariants: TransferableVariant[] = [];

  (rawProducts || []).forEach((p) => {
    const variants = Array.isArray(p.variants) ? p.variants : [];
    variants.forEach((v) => {
      const invMap: Record<string, number> = {};
      const invArray = Array.isArray(v.inventory) ? v.inventory : v.inventory ? [v.inventory] : [];
      invArray.forEach((inv: { store_id?: string; quantity?: number }) => {
        if (inv.store_id) {
          invMap[inv.store_id] = Number(inv.quantity) || 0;
        }
      });

      transferableVariants.push({
        id: v.id,
        sku: v.sku,
        name: v.name || '',
        productName: p.name,
        storeInventory: invMap,
      });
    });
  });

  return (
    <div className="max-w-5xl space-y-6 animate-fadeIn pb-12">
      <BranchManagementClient initialBranches={branches} variants={transferableVariants} />
    </div>
  );
}
