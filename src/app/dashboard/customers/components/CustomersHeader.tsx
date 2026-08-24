'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus } from 'lucide-react';
import Link from 'next/link';

export function CustomersHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('q') || '';
  const [search, setSearch] = useState(currentSearch);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) params.set('q', search);
      else params.delete('q');
      router.push(`?${params.toString()}`);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, router, searchParams]);

  return (
    <div className="mb-6 mt-6 space-y-6">
      {/* StudioGrid Single-Row Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={
              'w-full sm:max-w-md pl-9 pr-4 py-2 bg-surface border rounded-lg text-body-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all' +
              ' border-separator focus:border-brand-primary  placeholder:text-muted'
            }
          />
        </div>

        <div className="flex gap-2 shrink-0">
          <Link
            href="/dashboard/customers/new"
            className="flex justify-center items-center gap-1.5 bg-brand-primary hover:bg-brand-primary/80 text-white px-4 py-2 rounded-lg text-body-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Add customer
          </Link>
        </div>
      </div>
    </div>
  );
}
