'use client';

import React from 'react';
import { Package, TrendingUp, ShoppingBag, BadgeCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { StorefrontOverviewData } from '@/app/actions/storefront-dashboard';

interface StorefrontAnalyticsCardProps {
  data: StorefrontOverviewData | null;
}

export function StorefrontAnalyticsCard({ data }: StorefrontAnalyticsCardProps) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Catalog Products */}
      <div className="p-4 rounded-2xl bg-surface border border-separator shadow-xs flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
          <Package size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Catalog Linked</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{data.productsCount} Products</p>
          <p className="text-[10px] text-muted truncate">Live on public storefront</p>
        </div>
      </div>

      {/* 2. Total Store GMV */}
      <div className="p-4 rounded-2xl bg-surface border border-separator shadow-xs flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
          <TrendingUp size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Store Revenue</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{formatCurrency(data.totalGmv, data.currency)}</p>
          <p className="text-[10px] text-muted truncate">Across all store checkouts</p>
        </div>
      </div>

      {/* 3. Orders Received */}
      <div className="p-4 rounded-2xl bg-surface border border-separator shadow-xs flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
          <ShoppingBag size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Orders Processed</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{data.ordersCount} Orders</p>
          <p className="text-[10px] text-muted truncate">Self-serve & WhatsApp</p>
        </div>
      </div>

      {/* 4. Payment Gateway Health */}
      <div className="p-4 rounded-2xl bg-surface border border-separator shadow-xs flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary shrink-0">
          <BadgeCheck size={20} />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Checkout Gateway</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                data.isHubtelConnected
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {data.isHubtelConnected ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
              Hubtel MoMo
            </span>
            {data.isPaystackConnected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <CheckCircle2 size={10} />
                Paystack
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
