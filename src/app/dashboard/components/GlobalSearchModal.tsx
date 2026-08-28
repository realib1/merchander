'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Search, Package, ShoppingCart, Users, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { globalSearch, SearchResult } from '@/app/actions/search';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  // Debounced search effect
  useEffect(() => {
    if (!query || query.length < 2) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      const { data } = await globalSearch(query);
      setResults(data || []);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Basic mock quick links for now. In a real app, this would hit an API.
  const quickLinks = [
    { name: 'Products', href: '/dashboard/products', icon: Package },
    { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} size="lg">
      <div className="flex flex-col -m-5">
        <div className="flex items-center px-4 py-3 border-b border-separator">
          <Search size={20} className="text-muted mr-3 shrink-0" />
          <input
            type="text"
            className="flex-1 bg-transparent border-none focus:outline-none text-base text-foreground placeholder:text-muted"
            placeholder="Search products, orders, customers..."
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (!val || val.length < 2) {
                setResults([]);
                setIsSearching(false);
              } else {
                setIsSearching(true);
              }
            }}
            autoFocus
          />
          <div className="flex items-center gap-1 text-[10px] font-medium text-muted bg-surface px-1.5 py-0.5 rounded border border-separator ml-2">
            ESC
          </div>
        </div>

        <div className="p-2 max-h-100 overflow-y-auto">
          {query.length < 2 ? (
            <div className="px-2 py-2">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-2">Quick Links</p>
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.href}
                    onClick={() => {
                      router.push(link.href);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 hover:bg-surface-elevated rounded-lg transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                        <Icon size={18} />
                      </div>
                      <span className="text-sm font-medium text-foreground">{link.name}</span>
                    </div>
                    <ArrowRight size={16} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          ) : isSearching ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="animate-spin text-brand-primary" size={24} />
            </div>
          ) : results.length > 0 ? (
            <div className="px-2 py-2">
              {results.map((result) => {
                let Icon = Package;
                let colorClass = 'bg-brand-primary/10 text-brand-primary';

                if (result.type === 'order') {
                  Icon = ShoppingCart;
                  colorClass = 'bg-blue-500/10 text-blue-500';
                } else if (result.type === 'customer') {
                  Icon = Users;
                  colorClass = 'bg-emerald-500/10 text-emerald-500';
                }

                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      router.push(result.href);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 hover:bg-surface-elevated rounded-lg transition-colors group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-md transition-colors ${colorClass} group-hover:bg-brand-primary group-hover:text-white`}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground leading-snug">{result.title}</p>
                        <p className="text-xs text-muted leading-tight mt-0.5">{result.subtitle}</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <Search size={32} className="text-muted/50 mb-3" />
              <p className="text-sm text-foreground font-medium">No results found for &quot;{query}&quot;</p>
              <p className="text-xs text-muted mt-1">Try searching by name, sku, or order ID.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
