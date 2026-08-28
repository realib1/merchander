'use client';

import React, { useState } from 'react';
import { AnalyticsData } from '@/types/analytics';
import { formatCurrency } from '@/utils/format';
import { Table as TableIcon, Search, ArrowUpDown, Package, FolderTree, Globe, Wallet, Users } from 'lucide-react';

interface AnalyticsDataExplorerProps {
  data: AnalyticsData;
}

type ExplorerDimension = 'products' | 'categories' | 'channels' | 'payments' | 'customers';

export function AnalyticsDataExplorer({ data }: AnalyticsDataExplorerProps) {
  const [dimension, setDimension] = useState<ExplorerDimension>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  const renderTableRows = () => {
    switch (dimension) {
      case 'categories': {
        const items = data.categories
          .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .sort((a, b) => (sortAsc ? a.revenue - b.revenue : b.revenue - a.revenue));

        return (
          <>
            <thead>
              <tr className="bg-surface-elevated/80 border-b border-separator text-muted font-semibold text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3">Category Name</th>
                <th className="px-4 py-3 text-right">Products Count</th>
                <th className="px-4 py-3 text-right">Units Sold</th>
                <th className="px-4 py-3 text-right">Revenue (GHS)</th>
                <th className="px-4 py-3 text-right">GMV Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator/40 text-xs">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No categories found
                  </td>
                </tr>
              ) : (
                items.map((cat) => (
                  <tr key={cat.id} className="hover:bg-surface-elevated/40 transition">
                    <td className="px-4 py-3 font-semibold text-foreground">{cat.name}</td>
                    <td className="px-4 py-3 text-right text-muted">{cat.productCount}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {cat.unitsSold.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      {formatCurrency(cat.revenue, 'GHS')}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-info">{cat.sharePct.toFixed(1)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </>
        );
      }

      case 'channels': {
        const items = data.channels
          .filter((c) => c.label.toLowerCase().includes(searchQuery.toLowerCase()))
          .sort((a, b) => (sortAsc ? a.gmv - b.gmv : b.gmv - a.gmv));

        return (
          <>
            <thead>
              <tr className="bg-surface-elevated/80 border-b border-separator text-muted font-semibold text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3">Sales Channel</th>
                <th className="px-4 py-3 text-right">Orders Count</th>
                <th className="px-4 py-3 text-right">GMV Revenue (GHS)</th>
                <th className="px-4 py-3 text-right">Channel Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator/40 text-xs">
              {items.map((ch) => (
                <tr key={ch.channel} className="hover:bg-surface-elevated/40 transition">
                  <td className="px-4 py-3 font-semibold text-foreground">{ch.label}</td>
                  <td className="px-4 py-3 text-right text-muted">{ch.ordersCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">{formatCurrency(ch.gmv, 'GHS')}</td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-primary">{ch.sharePct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </>
        );
      }

      case 'payments': {
        const items = data.paymentMethods
          .filter((p) => p.label.toLowerCase().includes(searchQuery.toLowerCase()))
          .sort((a, b) => (sortAsc ? a.volume - b.volume : b.volume - a.volume));

        return (
          <>
            <thead>
              <tr className="bg-surface-elevated/80 border-b border-separator text-muted font-semibold text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3 text-right">Settled Transactions</th>
                <th className="px-4 py-3 text-right">Volume (GHS)</th>
                <th className="px-4 py-3 text-right">Cashflow Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator/40 text-xs">
              {items.map((pm) => (
                <tr key={pm.method} className="hover:bg-surface-elevated/40 transition">
                  <td className="px-4 py-3 font-semibold text-foreground">{pm.label}</td>
                  <td className="px-4 py-3 text-right text-muted">{pm.count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">{formatCurrency(pm.volume, 'GHS')}</td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-secondary">{pm.sharePct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </>
        );
      }

      case 'customers': {
        const items = data.customerCohorts.topVipCustomers
          .filter(
            (c) =>
              c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.phone.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .sort((a, b) => (sortAsc ? a.totalSpent - b.totalSpent : b.totalSpent - a.totalSpent));

        return (
          <>
            <thead>
              <tr className="bg-surface-elevated/80 border-b border-separator text-muted font-semibold text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Phone / Contact</th>
                <th className="px-4 py-3 text-right">Completed Orders</th>
                <th className="px-4 py-3 text-right">Total Spent (GHS)</th>
                <th className="px-4 py-3 text-right">Last Purchase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator/40 text-xs">
              {items.map((cust) => (
                <tr key={cust.id} className="hover:bg-surface-elevated/40 transition">
                  <td className="px-4 py-3 font-semibold text-foreground">{cust.name}</td>
                  <td className="px-4 py-3 text-muted font-mono">{cust.phone}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">{cust.ordersCount}</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">
                    {formatCurrency(cust.totalSpent, 'GHS')}
                  </td>
                  <td className="px-4 py-3 text-right text-muted">
                    {cust.lastOrderDate ? new Date(cust.lastOrderDate).toLocaleDateString('en-GB') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </>
        );
      }

      case 'products':
      default: {
        const items = data.topProducts
          .filter(
            (p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .sort((a, b) => (sortAsc ? a.revenue - b.revenue : b.revenue - a.revenue));

        return (
          <>
            <thead>
              <tr className="bg-surface-elevated/80 border-b border-separator text-muted font-semibold text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Units Sold</th>
                <th className="px-4 py-3 text-right">Avg Unit Price</th>
                <th className="px-4 py-3 text-right">Total Revenue (GHS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator/40 text-xs">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No products found
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-elevated/40 transition">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <div>{p.name}</div>
                      {p.sku && <div className="text-[10px] text-muted font-mono mt-0.5">{p.sku}</div>}
                    </td>
                    <td className="px-4 py-3 text-muted">{p.categoryName}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{p.unitsSold.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-muted">{formatCurrency(p.avgPrice, 'GHS')}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      {formatCurrency(p.revenue, 'GHS')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </>
        );
      }
    }
  };

  return (
    <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs mb-6">
      {/* Dimension Switcher & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
            <TableIcon size={15} className="text-brand-primary" /> Multi-Dimensional Data Explorer
          </h3>
          <p className="text-xs text-muted mt-0.5">Explore granular performance records sliced across your catalog</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dimension Selector */}
          <div className="inline-flex bg-surface-elevated border border-separator rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setDimension('products')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                dimension === 'products' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'
              }`}
            >
              <Package size={12} /> Products
            </button>
            <button
              type="button"
              onClick={() => setDimension('categories')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                dimension === 'categories' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'
              }`}
            >
              <FolderTree size={12} /> Categories
            </button>
            <button
              type="button"
              onClick={() => setDimension('channels')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                dimension === 'channels' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'
              }`}
            >
              <Globe size={12} /> Channels
            </button>
            <button
              type="button"
              onClick={() => setDimension('payments')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                dimension === 'payments' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'
              }`}
            >
              <Wallet size={12} /> Payments
            </button>
            <button
              type="button"
              onClick={() => setDimension('customers')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                dimension === 'customers' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'
              }`}
            >
              <Users size={12} /> VIPs
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder={`Search ${dimension}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-elevated border border-separator rounded-xl pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition w-36 sm:w-48"
            />
          </div>

          {/* Sort order toggle */}
          <button
            type="button"
            onClick={() => setSortAsc(!sortAsc)}
            className="px-2.5 py-1.5 rounded-xl bg-surface-elevated border border-separator text-xs font-semibold text-muted hover:text-foreground cursor-pointer transition flex items-center gap-1"
            title="Toggle sort order"
          >
            <ArrowUpDown size={12} /> {sortAsc ? 'Asc' : 'Desc'}
          </button>
        </div>
      </div>

      {/* Explorer Table */}
      <div className="overflow-x-auto border border-separator/60 rounded-xl">
        <table className="w-full text-left border-collapse">{renderTableRows()}</table>
      </div>
    </div>
  );
}
