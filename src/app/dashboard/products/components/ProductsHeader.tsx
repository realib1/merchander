'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, List, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

export function ProductsHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('q') || '';
  const currentStatus = searchParams.get('status') || 'all';
  const currentView = searchParams.get('view') || 'table';

  const [search, setSearch] = useState(currentSearch);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all' && value !== 'table') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) params.set('q', search);
      else params.delete('q');

      // Only push if changed to avoid unnecessary re-renders
      if (searchParams.get('q') !== search && (search !== '' || searchParams.has('q'))) {
        router.push(`?${params.toString()}`);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, router, searchParams]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Products</h1>
          <p className="text-sm text-secondary">Your catalogue, what it is worth, and what is running out.</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-primary-hover"
        >
          <Plus size={15} strokeWidth={2.5} />
          New product
        </Link>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={15} />
          <input
            type="text"
            placeholder="Search products, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-separator bg-surface-elevated px-3 pl-9 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 placeholder:text-muted"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            disabled
            className="h-9 min-w-32 rounded-md border border-separator bg-surface px-3 text-sm font-medium outline-none focus:ring-1 focus:ring-brand-primary"
          >
            <option>All categories</option>
          </select>

          <select
            value={currentStatus}
            onChange={(e) => updateParam('status', e.target.value)}
            className="h-9 min-w-32 rounded-md border border-separator bg-surface px-3 text-sm font-medium outline-none focus:ring-1 focus:ring-brand-primary"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>

          <div className="flex shrink-0 gap-1 rounded-md bg-surface-elevated p-1">
            <button
              type="button"
              aria-label="Table view"
              onClick={() => updateParam('view', 'table')}
              className={`rounded-md p-1.5 transition-colors ${currentView === 'table' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'}`}
            >
              <List size={16} />
            </button>
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => updateParam('view', 'grid')}
              className={`rounded-md p-1.5 transition-colors ${currentView === 'grid' ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
