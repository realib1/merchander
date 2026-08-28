'use client';

import React, { useState } from 'react';
import { CategoryAnalytics, TopProductAnalytics } from '@/types/analytics';
import { formatCurrency } from '@/utils/format';
import { Package, FolderTree, Search, ArrowUpDown } from 'lucide-react';

interface AnalyticsProductRankingsProps {
  topProducts: TopProductAnalytics[];
  categories: CategoryAnalytics[];
}

export function AnalyticsProductRankings({ topProducts, categories }: AnalyticsProductRankingsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'revenue' | 'unitsSold'>('revenue');

  const filteredProducts = topProducts
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => (sortKey === 'revenue' ? b.revenue - a.revenue : b.unitsSold - a.unitsSold));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* 1. Best Selling Products Table (2 Cols) */}
      <div className="lg:col-span-2 bg-surface border border-separator rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                <Package size={15} className="text-brand-primary" /> Top Best Selling Products
              </h3>
              <p className="text-xs text-muted mt-0.5">Ranked by overall sales performance</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-surface-elevated border border-separator rounded-lg pl-7 pr-3 py-1 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition w-36 sm:w-44"
                />
              </div>

              {/* Sort switcher */}
              <button
                type="button"
                onClick={() => setSortKey((prev) => (prev === 'revenue' ? 'unitsSold' : 'revenue'))}
                className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-separator text-xs font-semibold text-muted hover:text-foreground cursor-pointer transition flex items-center gap-1 shrink-0"
              >
                <ArrowUpDown size={12} /> {sortKey === 'revenue' ? 'Revenue' : 'Units'}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-separator/60 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-elevated/80 border-b border-separator text-muted font-semibold text-[11px] uppercase tracking-wider">
                  <th className="px-3.5 py-2.5">Product</th>
                  <th className="px-3.5 py-2.5">Category</th>
                  <th className="px-3.5 py-2.5 text-right">Units</th>
                  <th className="px-3.5 py-2.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator/40">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-surface-elevated/40 transition">
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted font-mono w-4">#{idx + 1}</span>
                          <div>
                            <div className="font-semibold text-foreground truncate max-w-40 sm:max-w-50">{p.name}</div>
                            {p.sku && <div className="text-[10px] text-muted font-mono">{p.sku}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-muted truncate max-w-25">{p.categoryName}</td>
                      <td className="px-3.5 py-2.5 text-right font-medium text-foreground tabular-nums">
                        {p.unitsSold.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-foreground tabular-nums">
                        {formatCurrency(p.revenue, 'GHS')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Category Distribution Share */}
      <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
              <FolderTree size={15} className="text-info" /> Category Performance
            </h3>
            <span className="text-[11px] text-muted font-medium">GMV Share</span>
          </div>

          <div className="space-y-4">
            {categories.length === 0 ? (
              <div className="text-xs text-muted text-center py-6">No categories recorded</div>
            ) : (
              categories.slice(0, 6).map((cat) => (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-semibold text-foreground truncate max-w-35">{cat.name}</span>
                    <div className="text-right">
                      <span className="font-bold text-foreground">{formatCurrency(cat.revenue, 'GHS')}</span>
                      <span className="text-muted text-[11px] ml-1.5">({cat.sharePct.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-info rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(cat.sharePct, cat.revenue > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-muted flex items-center justify-between">
                    <span>{cat.productCount} products</span>
                    <span>{cat.unitsSold} units sold</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
