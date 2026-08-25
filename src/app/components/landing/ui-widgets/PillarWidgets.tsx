import React from 'react';
import { ShoppingCart, Globe } from 'lucide-react';

export function SellMiniWidget() {
  return (
    <div className="rounded-xl border border-separator bg-surface p-4 shadow-xs space-y-3">
      {/* Storefront Link Bar */}
      <div className="flex items-center justify-between rounded-lg bg-surface-elevated px-2.5 py-1.5 border border-separator/60 text-xs">
        <div className="flex items-center gap-1.5 text-secondary truncate">
          <Globe className="h-3.5 w-3.5 text-brand-primary shrink-0" />
          <span className="font-mono text-[11px] truncate">yourstore.merchander.app</span>
        </div>
        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">Storefront</span>
      </div>

      {/* Recent Order */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-primary">Men&apos;s Smock</div>
            <div className="text-xs text-muted">2 units • Storefront WhatsApp Order</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-primary tabular-nums">GH₵ 520</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">MTN MoMo Paid</div>
        </div>
      </div>
    </div>
  );
}

export function StockMiniWidget() {
  return (
    <div className="rounded-xl border border-separator bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between text-xs text-muted font-bold uppercase tracking-wider mb-3">
        <span>Stock Status</span>
        <span className="text-primary font-medium">Main Store</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-primary">Ceramic Mug Set</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">42 in stock</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-primary">Linen Shirt (L)</span>
          <span className="text-amber-600 dark:text-amber-400 font-semibold">3 left (Reorder)</span>
        </div>
      </div>
    </div>
  );
}

export function CustomerMiniWidget() {
  return (
    <div className="rounded-xl border border-separator bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between text-xs text-muted font-bold uppercase tracking-wider mb-3">
        <span>Customer Account</span>
        <span className="text-brand-primary font-medium">Loyal Buyer</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-primary">Kofi Mensah</div>
          <div className="text-xs text-muted">18 orders completed</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">Credit Balance</div>
          <div className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">GH₵ 350.00</div>
        </div>
      </div>
    </div>
  );
}

export function SupplierMiniWidget() {
  return (
    <div className="rounded-xl border border-separator bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between text-xs text-muted font-bold uppercase tracking-wider mb-3">
        <span>Suppliers</span>
        <span className="text-primary font-medium">Inv #SUP-402</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-primary">China Supplier</div>
          <div className="text-xs text-muted">Batch arriving Friday</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-primary tabular-nums">GH₵ 3,200</div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">GH₵ 1,200 balance</div>
        </div>
      </div>
    </div>
  );
}

export function MoneyMiniWidget() {
  return (
    <div className="rounded-xl border border-separator bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between text-xs text-muted font-bold uppercase tracking-wider mb-3">
        <span>Cash & MoMo Flow</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Reconciled</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-surface-elevated p-2 border border-separator/60">
          <div className="text-muted">Inflow (Today)</div>
          <div className="text-sm font-bold text-primary tabular-nums">GH₵ 5,420</div>
        </div>
        <div className="rounded-lg bg-surface-elevated p-2 border border-separator/60">
          <div className="text-muted">Expenses</div>
          <div className="text-sm font-bold text-primary tabular-nums">GH₵ 860</div>
        </div>
      </div>
    </div>
  );
}

export function BusinessMiniWidget() {
  return (
    <div className="rounded-xl border border-separator bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between text-xs text-muted font-bold uppercase tracking-wider mb-3">
        <span>Landed Margins</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">28.4% Net</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div>
          <div className="font-bold text-primary">Top Category: Apparel</div>
          <div className="text-muted text-[11px]">Turnover speed: 4.2 days</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-extrabold text-brand-primary tabular-nums">GH₵ 18.2k</div>
          <div className="text-muted text-[10px]">Monthly Net</div>
        </div>
      </div>
    </div>
  );
}
