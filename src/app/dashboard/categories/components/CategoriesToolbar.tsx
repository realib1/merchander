'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter, useSearchParams } from 'next/navigation';

interface CategoriesToolbarProps {
  statuses: string[];
  onAddCategory: () => void;
}

export function CategoriesToolbar({ statuses, onAddCategory }: CategoriesToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('q') || '';
  const currentStatus = searchParams.get('status') || 'all';

  const [search, setSearch] = useState(currentSearch);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
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

      if (searchParams.get('q') !== search && (search !== '' || searchParams.has('q'))) {
        router.push(`?${params.toString()}`);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, router, searchParams]);

  return (
    <div className="p-4 border-b border-separator flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface-elevated/20">
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-separator rounded-lg text-sm  placeholder-muted focus:outline-none focus:ring-1 focus:ring-brand-primary  transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <select
              value={currentStatus}
              onChange={(e) => updateParam('status', e.target.value.toLowerCase())}
              className="w-full sm:w-auto appearance-none bg-surface border border-separator rounded-lg pl-4 pr-10 py-2 text-sm  focus:outline-none  shadow-sm"
            >
              {statuses.map((s) => (
                <option key={s} value={s.toLowerCase()}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              size={16}
            />
          </div>
        </div>
      </div>

      <Button variant="primary" className="w-full sm:w-auto whitespace-nowrap" onClick={onAddCategory}>
        <Plus size={16} className="mr-2" />
        Add Category
      </Button>
    </div>
  );
}
