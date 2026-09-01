import React from 'react';
import Link from 'next/link';
import { getTenantPreorderBatches } from '@/app/actions/preorder-batches';
import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { BatchesOverviewClient } from './components/BatchesOverviewClient';
import { Layers, Boxes } from 'lucide-react';

export const metadata = {
  title: 'Pre-Order Batches | Merchander',
};

export default async function PreorderBatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let availableProducts: Array<{ id: string; name: string }> = [];
  let currency = 'GHS';
  let batches: import('@/types/preorder').PreorderBatch[] = [];

  if (user) {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    if (tenantId) {
      const [batchesData, productsRes, settingsRes] = await Promise.all([
        getTenantPreorderBatches(tenantId),
        supabase.from('products').select('id, name').eq('tenant_id', tenantId).order('name'),
        supabase.from('tenant_settings').select('settings_data').eq('tenant_id', tenantId).maybeSingle(),
      ]);

      batches = batchesData;
      availableProducts = productsRes.data || [];
      const rawSettings = settingsRes.data?.settings_data as Record<string, unknown> | null;
      currency = (rawSettings?.currency as string) || 'GHS';
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full animate-fadeIn pb-12">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-separator/80 pb-4">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">Pre-Order &amp; Procurement Batches</h1>
          <p className="text-xs text-muted mt-0.5">
            Manage procurement cycles, batch cutoffs, supplier orders, and customer arrival countdowns.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-elevated border border-separator/80">
          <Link
            href="/dashboard/inventory"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground transition flex items-center gap-1.5"
          >
            <Boxes size={14} />
            <span>Stock Levels</span>
          </Link>
          <Link
            href="/dashboard/inventory/batches"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-surface text-foreground shadow-2xs border border-separator/60 flex items-center gap-1.5"
          >
            <Layers size={14} className="text-brand-primary" />
            <span>Pre-Order Batches</span>
          </Link>
        </div>
      </div>

      <BatchesOverviewClient batches={batches} availableProducts={availableProducts} currency={currency} />
    </div>
  );
}
