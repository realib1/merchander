'use client';

import React, { useState } from 'react';
import { PreorderBatch } from '@/types/preorder';
import {
  getBatchStatusLabel,
  getBatchStatusColor,
  getBatchCountdown,
  formatArrivalWindow,
} from '@/utils/preorder-batch';
import { BatchFormDrawer } from './BatchFormDrawer';
import { BatchLifecycleModal } from './BatchLifecycleModal';
import { SupplierPOExportModal } from './SupplierPOExportModal';
import { BatchBroadcastModal } from './BatchBroadcastModal';
import { BatchLifecycleStepper } from './BatchLifecycleStepper';
import { MetricCard } from '@/components/ui/MetricCard';
import {
  Plus,
  Search,
  Layers,
  Clock,
  FileText,
  Plane,
  Ship,
  Edit3,
  CheckCircle2,
  Package,
  Calendar,
  Truck,
  MessageSquare,
} from 'lucide-react';

interface BatchesOverviewClientProps {
  batches: PreorderBatch[];
  availableProducts: Array<{ id: string; name: string }>;
  currency?: string;
}

export function BatchesOverviewClient({
  batches,
  availableProducts,
  currency = 'GHS',
}: BatchesOverviewClientProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<PreorderBatch | null>(null);

  const [lifecycleModalBatch, setLifecycleModalBatch] = useState<PreorderBatch | null>(null);
  const [poModalBatch, setPoModalBatch] = useState<PreorderBatch | null>(null);
  const [broadcastModalBatch, setBroadcastModalBatch] = useState<PreorderBatch | null>(null);

  const activeBatches = batches.filter(
    (b) =>
      b.status === 'OPEN' ||
      b.status === 'CLOSING_SOON' ||
      b.status === 'ORDER_SUBMITTED' ||
      b.status === 'IN_TRANSIT'
  );
  const inTransitBatches = batches.filter((b) => b.status === 'IN_TRANSIT');
  const arrivedBatches = batches.filter((b) => b.status === 'ARRIVED' || b.status === 'FULFILLING');

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 4 Summary MetricCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Procurement"
          value={activeBatches.length}
          subtitle={`${batches.length} total cycles on record`}
          icon={<Layers size={16} className="text-brand-primary" />}
          iconBg="bg-brand-primary/10"
        />

        <MetricCard
          title="Cargo In Transit"
          value={inTransitBatches.length}
          subtitle="Sea & Air shipments en route"
          icon={<Ship size={16} className="text-blue-500" />}
          iconBg="bg-blue-500/10"
        />

        <MetricCard
          title="Landed at Hub"
          value={arrivedBatches.length}
          subtitle="Sorting & dispatching in Ghana"
          icon={<Truck size={16} className="text-purple-500" />}
          iconBg="bg-purple-500/10"
        />

        <MetricCard
          title="Catalog Assigned"
          value={`${batches.reduce((acc, b) => acc + (b.product_count || 0), 0)} Products`}
          subtitle="Linked pre-order items"
          icon={<Package size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />
      </div>

      {/* Controls Hub */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-separator shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search batches by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-xl bg-surface-elevated border border-separator pl-8 pr-3 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-hidden"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl bg-surface-elevated border border-separator px-3 py-2 text-foreground cursor-pointer focus:outline-hidden font-medium"
          >
            <option value="all">All Milestones</option>
            <option value="OPEN">Open</option>
            <option value="CLOSING_SOON">Closing Soon</option>
            <option value="CLOSED">Closed (PO Prep)</option>
            <option value="ORDER_SUBMITTED">Supplier PO Placed</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="ARRIVED">Arrived at Hub</option>
            <option value="FULFILLING">Fulfilling / Dispatch</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingBatch(null);
            setFormModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-brand-primary text-brand-primary-foreground text-xs font-bold hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
        >
          <Plus size={15} />
          <span>New Procurement Batch</span>
        </button>
      </div>

      {/* Batches Grid */}
      {filteredBatches.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface border border-separator space-y-3 shadow-xs">
          <Layers size={40} className="mx-auto text-muted opacity-40" />
          <div>
            <h3 className="text-sm font-bold text-foreground">No Pre-Order Batches Found</h3>
            <p className="text-xs text-muted mt-1">
              Create your first procurement batch to offer pre-orders to customers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-primary text-brand-primary-foreground text-xs font-bold hover:opacity-90 cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} />
            <span>Create First Batch</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBatches.map((batch) => {
            const statusColor = getBatchStatusColor(batch.status);
            const countdown = getBatchCountdown(batch.closes_at);
            const arrivalWindow = formatArrivalWindow(
              batch.expected_arrival_start,
              batch.expected_arrival_end
            );
            const isAir = batch.freight_mode === 'air' || batch.freight_mode === 'express';

            return (
              <div
                key={batch.id}
                className="p-5 rounded-3xl bg-surface border border-separator shadow-xs space-y-4 hover:border-brand-primary/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-brand-primary px-2 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20">
                        {batch.code}
                      </span>
                      <h3 className="text-sm font-bold text-foreground mt-1 truncate font-display">
                        {batch.name}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                    >
                      {getBatchStatusLabel(batch.status)}
                    </span>
                  </div>

                  {/* Compact 8-State Progress Stepper */}
                  <div className="py-1">
                    <BatchLifecycleStepper
                      currentStatus={batch.status}
                      freightMode={batch.freight_mode}
                      compact={true}
                    />
                  </div>

                  {/* Milestones Info */}
                  <div className="space-y-2 text-xs text-muted pt-2 border-t border-separator/60">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Clock size={12} className="text-brand-primary" /> Cutoff Window
                      </span>
                      <span className="font-semibold text-foreground font-mono">{countdown.label}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        {isAir ? (
                          <Plane size={12} className="text-blue-400" />
                        ) : (
                          <Ship size={12} className="text-indigo-400" />
                        )}{' '}
                        Expected Arrival
                      </span>
                      <span className="font-bold text-foreground font-mono">{arrivalWindow}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Calendar size={12} className="text-purple-400" /> Freight Mode
                      </span>
                      <span className="font-semibold text-foreground capitalize font-mono">
                        {batch.freight_mode || 'Sea Freight'} ({batch.origin_country || 'China'})
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px]">Assigned Products</span>
                      <span className="font-semibold text-foreground font-mono">
                        {batch.product_count || 0} catalog items
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-3 border-t border-separator/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setLifecycleModalBatch(batch)}
                    className="px-3 py-1.5 rounded-xl bg-surface-elevated border border-separator text-xs font-bold text-foreground hover:border-brand-primary transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle2 size={13} className="text-brand-primary" />
                    <span>Lifecycle</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBroadcastModalBatch(batch)}
                      className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                      title="Broadcast Milestone Update to Customers"
                    >
                      <MessageSquare size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoModalBatch(batch)}
                      className="p-2 rounded-xl bg-surface-elevated border border-separator text-muted hover:text-foreground transition-colors cursor-pointer"
                      title="View Consolidated Supplier PO"
                    >
                      <FileText size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBatch(batch);
                        setFormModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-surface-elevated border border-separator text-muted hover:text-foreground transition-colors cursor-pointer"
                      title="Edit Batch Parameters"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawers & Modals */}
      <BatchFormDrawer
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingBatch(null);
        }}
        batch={editingBatch}
        availableProducts={availableProducts}
      />

      {lifecycleModalBatch && (
        <BatchLifecycleModal
          isOpen={Boolean(lifecycleModalBatch)}
          onClose={() => setLifecycleModalBatch(null)}
          batch={lifecycleModalBatch}
        />
      )}

      {poModalBatch && (
        <SupplierPOExportModal
          isOpen={Boolean(poModalBatch)}
          onClose={() => setPoModalBatch(null)}
          batch={poModalBatch}
          currency={currency}
        />
      )}

      {broadcastModalBatch && (
        <BatchBroadcastModal
          isOpen={Boolean(broadcastModalBatch)}
          onClose={() => setBroadcastModalBatch(null)}
          batch={broadcastModalBatch}
        />
      )}
    </div>
  );
}
