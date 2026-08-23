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
    <div className="mb-6 space-y-6">
      {/* StudioGrid Single-Row Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input 
            type="text"
            placeholder="Search products or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={"w-full pl-9 pr-4 py-2 bg-surface border rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all" + " border-separator focus:border-brand-primary text-text-primary placeholder:text-text-muted"}
          />
        </div>
        
        <div className="flex gap-2 shrink-0">
          <select 
            disabled
            className="px-3 py-2 bg-surface border border-separator rounded-lg text-[13px] font-medium text-text-primary outline-none focus:ring-1 focus:ring-brand-primary min-w-30"
          >
            <option>All categories</option>
          </select>
          
          <select
            value={currentStatus}
            onChange={(e) => updateParam('status', e.target.value)}
            className="px-3 py-2 bg-surface border border-separator rounded-lg text-[13px] font-medium text-text-primary outline-none focus:ring-1 focus:ring-brand-primary min-w-30"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>

          <div className="flex bg-surface border border-separator rounded-lg p-1">
            <button 
              onClick={() => updateParam('view', 'table')}
              className={`p-1 rounded-md transition-colors ${currentView === 'table' ? 'bg-brand-primary text-white shadow-sm' : 'text-text-muted hover:text-brand-primary'}`}
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => updateParam('view', 'grid')}
              className={`p-1 rounded-md transition-colors ${currentView === 'grid' ? 'bg-brand-primary text-white shadow-sm' : 'text-text-muted hover:text-brand-primary'}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <Link href="/dashboard/products/new" className="flex justify-center items-center gap-1.5 bg-brand-primary hover:opacity-90 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-opacity ml-2">
            <Plus size={16} />
            Add product
          </Link>
        </div>
      </div>
    </div>
  );
}
