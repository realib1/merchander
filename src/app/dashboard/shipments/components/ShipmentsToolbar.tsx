'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Ship, Plane, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShipmentFormDrawer } from './ShipmentFormDrawer';

interface SupplierOption {
  id: string;
  name: string;
}

interface PurchaseOrderOption {
  id: string;
  po_number: string | null;
}

interface ShipmentsToolbarProps {
  suppliers: SupplierOption[];
  purchaseOrders: PurchaseOrderOption[];
}

export function ShipmentsToolbar({ suppliers, purchaseOrders }: ShipmentsToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('q') || '';
  const currentMode = searchParams.get('mode') || 'all';
  const currentStatus = searchParams.get('status') || 'all';

  const [search, setSearch] = useState(currentSearch);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) params.set('q', search);
      else params.delete('q');

      if (searchParams.get('q') !== search && (search !== '' || searchParams.has('q'))) {
        router.push(`?${params.toString()}`);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [search, router, searchParams]);

  return (
    <>
      <div className="p-4 border-b border-separator flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-surface-elevated/20">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type="text"
              placeholder="Search by BL / Tracking #, title, carrier..."
              aria-label="Search shipments"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-separator rounded-xl text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <div className="inline-flex bg-surface border border-separator rounded-xl p-0.5 shadow-xs shrink-0">
              <button
                onClick={() => updateParam('mode', 'all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentMode === 'all' ? 'bg-brand-primary text-white shadow-xs' : 'text-muted hover:text-foreground'
                }`}
              >
                All Modes
              </button>
              <button
                onClick={() => updateParam('mode', 'sea')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  currentMode === 'sea' ? 'bg-brand-primary text-white shadow-xs' : 'text-muted hover:text-foreground'
                }`}
              >
                <Ship size={13} /> Sea Freight
              </button>
              <button
                onClick={() => updateParam('mode', 'air')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  currentMode === 'air' ? 'bg-brand-primary text-white shadow-xs' : 'text-muted hover:text-foreground'
                }`}
              >
                <Plane size={13} /> Air Cargo
              </button>
              <button
                onClick={() => updateParam('mode', 'express')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  currentMode === 'express'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <Zap size={13} /> Express
              </button>
            </div>

            <select
              value={currentStatus}
              onChange={(e) => updateParam('status', e.target.value)}
              aria-label="Filter by shipment status"
              className="bg-surface border border-separator rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/40 shadow-xs shrink-0"
            >
              <option value="all">All Statuses</option>
              <option value="booked">Booked</option>
              <option value="in_transit">In Transit</option>
              <option value="customs">Customs Clearance</option>
              <option value="cleared">Cleared</option>
              <option value="arrived">Arrived at Hub</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
        </div>

        <Button
          variant="primary"
          className="whitespace-nowrap rounded-xl shadow-xs"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} className="mr-1.5" />
          Add Shipment
        </Button>
      </div>

      <ShipmentFormDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        suppliers={suppliers}
        purchaseOrders={purchaseOrders}
      />
    </>
  );
}
