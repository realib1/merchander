'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, LayoutList, KanbanSquare, Plus, ChevronDown, Check } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

export function OrdersHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get('status') || 'all';
  const currentSearch = searchParams.get('q') || '';

  const [search, setSearch] = useState(currentSearch);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const setStatus = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === 'all') params.delete('status');
    else params.set('status', status);
    router.push(`?${params.toString()}`);
    setIsMobileMenuOpen(false);
  };

  const handleExport = () => {
    // Simple stub for export
    alert('Export functionality will generate a CSV of the current view.');
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'New / Draft' },
    { id: 'pending_payment', label: 'Awaiting Payment' },
    { id: 'paid', label: 'Paid / To Pack' },
    { id: 'dispatched', label: 'Dispatched' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Mobile Tabs Dropdown */}
      <div className="block sm:hidden relative">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-surface border border-separator rounded-lg text-body font-medium"
        >
          <span>{tabs.find((t) => t.id === currentStatus)?.label || 'All'}</span>
          <ChevronDown
            size={16}
            className={`text-muted transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMobileMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 bg-surface border border-separator rounded-lg shadow-lg z-20 overflow-hidden"
              >
                <div className="p-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatus(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-body rounded-md transition-colors ${currentStatus === tab.id
                          ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                          : ' hover:bg-surface-elevated hover:text-brand-primary'
                        }`}
                    >
                      {tab.label}
                      {currentStatus === tab.id && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Tabs Row */}
      <div className="hidden sm:flex gap-6 border-b border-separator overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatus(tab.id)}
            className={`pb-3 text-body font-medium whitespace-nowrap border-b-2 transition-colors ${currentStatus === tab.id
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent  hover:text-brand-primary'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar Row */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center w-full mb-6">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            type="text"
            placeholder="Search order, customer or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary   placeholder:text-muted transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-separator rounded-lg text-sm font-medium  hover:bg-surface-elevated transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Export
          </button>

          <div className="h-6 w-px bg-separator mx-1" />

          {/* View Toggles */}
          <div className="hidden sm:flex bg-surface border border-separator rounded-lg p-1">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete('view');
                router.push(`?${params.toString()}`);
              }}
              className={`p-1.5 rounded-md transition-colors ${!searchParams.get('view') || searchParams.get('view') === 'table' ? 'bg-brand-primary text-white shadow-sm' : 'text-muted hover:text-brand-primary'}`}
              title="Table View"
            >
              <LayoutList size={14} />
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('view', 'kanban');
                router.push(`?${params.toString()}`);
              }}
              className={`p-1.5 rounded-md transition-colors ${searchParams.get('view') === 'kanban' ? 'bg-brand-primary text-white shadow-sm' : 'text-muted hover:text-brand-primary'}`}
              title="Kanban View"
            >
              <KanbanSquare size={14} />
            </button>
          </div>

          <Link
            href="/dashboard/orders/new"
            className="flex justify-center items-center gap-1.5 bg-brand-primary hover:bg-brand-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Create order
          </Link>
        </div>
      </div>
    </div>
  );
}
