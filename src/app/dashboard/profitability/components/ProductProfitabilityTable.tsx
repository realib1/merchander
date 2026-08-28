'use client';

import React, { useState, useMemo } from 'react';
import { ProductProfitability, MarginHealthStatus } from '@/types/profitability';
import { ProductProfitabilityRow } from './ProductProfitabilityRow';
import { Search, ArrowUpDown } from 'lucide-react';

interface ProductProfitabilityTableProps {
  products: ProductProfitability[];
}

type SortField = 'grossProfit' | 'totalRevenue' | 'marginPct' | 'unitsSold';

export function ProductProfitabilityTable({ products }: ProductProfitabilityTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MarginHealthStatus>('all');
  const [sortField, setSortField] = useState<SortField>('grossProfit');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || p.healthStatus === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [products, searchTerm, statusFilter, sortField, sortAsc]);

  return (
    <div className="bg-surface border border-separator rounded-2xl flex flex-col overflow-hidden shadow-xs">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-separator/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search product name, category, or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-surface-elevated/60 border border-separator rounded-xl text-foreground focus:ring-2 focus:ring-brand-primary/40 focus:outline-none"
          />
        </div>

        {/* Health Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'healthy', 'moderate', 'warning', 'negative'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all capitalize whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted hover:text-foreground hover:bg-surface-elevated'
              }`}
            >
              {st === 'all' ? 'All Margins' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto min-h-75">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-elevated/70 border-b border-separator text-[11px] font-semibold text-muted uppercase tracking-wider">
              <th className="px-4 py-3">Product</th>
              <th
                onClick={() => handleSort('unitsSold')}
                className="px-4 py-3 text-right cursor-pointer hover:text-foreground select-none"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Units</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-4 py-3 text-right">Avg Price</th>
              <th className="px-4 py-3 text-right">Avg Cost</th>
              <th
                onClick={() => handleSort('totalRevenue')}
                className="px-4 py-3 text-right cursor-pointer hover:text-foreground select-none"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Revenue</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-4 py-3 text-right">Total COGS</th>
              <th
                onClick={() => handleSort('grossProfit')}
                className="px-4 py-3 text-right cursor-pointer hover:text-foreground select-none"
              >
                <div className="inline-flex items-center gap-1 text-brand-primary">
                  <span>Gross Profit</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th
                onClick={() => handleSort('marginPct')}
                className="px-4 py-3 text-right cursor-pointer hover:text-foreground select-none"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Margin %</span>
                  <ArrowUpDown size={11} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator/40">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-muted text-xs">
                  No product sales or margins found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredProducts.map((prod) => <ProductProfitabilityRow key={prod.productId} product={prod} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
