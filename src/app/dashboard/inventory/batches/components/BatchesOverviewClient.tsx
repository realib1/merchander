'use client';

import React, { useState } from 'react';
import { PreorderBatch } from '@/types/preorder';
import {
  getBatchStatusLabel,
  getBatchStatusColor,
  getBatchCountdown,
  formatArrivalWindow,
} from '@/utils/preorder-batch';
import { BatchFormModal } from './BatchFormModal';
import { BatchLifecycleModal } from './BatchLifecycleModal';
import { SupplierPOExportModal } from './SupplierPOExportModal';
import { Plus, Search, Layers, Clock, FileText, Plane, Ship, Edit3, CheckCircle2 } from 'lucide-react';

interface BatchesOverviewClientProps {
  batches: PreorderBatch[];
  availableProducts: Array<{ id: string; name: string }>;
  currency?: string;
}

export function BatchesOverviewClient({ batches, availableProducts, currency = 'GHS' }: BatchesOverviewClientProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<PreorderBatch | null>(null);

  const [lifecycleModalBatch, setLifecycleModalBatch] = useState<PreorderBatch | null>(null);
  const [poModalBatch, setPoModalBatch] = useState<PreorderBatch | null>(null);

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) || b.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Hub */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search batches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-xl bg-surface-elevated border border-separator pl-8 pr-3 py-2 text-foreground focus:ring-1 focus:ring-brand-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl bg-surface-elevated border border-separator px-3 py-2 text-foreground"
          >
            <option value="all">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
            <option value="ORDER_SUBMITTED">Supplier PO Submitted</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="ARRIVED">Arrived</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingBatch(null);
            setFormModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary/90 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus size={15} />
          <span>New Batch</span>
        </button>
      </div>

      {/* Batches Grid */}
      {filteredBatches.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface-elevated border border-separator space-y-3">
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
            className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary/90 cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} />
            <span>Create First Batch</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.map((batch) => {
            const statusColor = getBatchStatusColor(batch.status);
            const countdown = getBatchCountdown(batch.closes_at);
            const arrivalWindow = formatArrivalWindow(batch.expected_arrival_start, batch.expected_arrival_end);
            const isAir = batch.freight_mode === 'air' || batch.freight_mode === 'express';

            return (
              <div
                key={batch.id}
                className="p-5 rounded-3xl bg-surface-elevated border border-separator shadow-xs space-y-4 hover:border-separator/90 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-brand-primary px-1.5 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20">
                        {batch.code}
                      </span>
                      <h3 className="text-sm font-bold text-foreground mt-1 truncate">{batch.name}</h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                    >
                      {getBatchStatusLabel(batch.status)}
                    </span>
                  </div>

                  {/* Milestones Info */}
                  <div className="space-y-1.5 text-xs text-muted pt-1 border-t border-separator/60">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Clock size={12} /> Cutoff
                      </span>
                      <span className="font-semibold text-foreground">{countdown.label}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        {isAir ? <Plane size={12} /> : <Ship size={12} />} Estimated Arrival
                      </span>
                      <span className="font-bold text-foreground">{arrivalWindow}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]">Assigned Products</span>
                      <span className="font-semibold text-foreground">{batch.product_count || 0} items</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-3 border-t border-separator/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setLifecycleModalBatch(batch)}
                    className="px-2.5 py-1.5 rounded-lg bg-surface border border-separator text-[11px] font-bold text-foreground hover:bg-surface-elevated transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <CheckCircle2 size={12} className="text-brand-primary" />
                    <span>Lifecycle</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPoModalBatch(batch)}
                      className="p-1.5 rounded-lg bg-surface border border-separator text-muted hover:text-foreground transition cursor-pointer"
                      title="View Supplier PO"
                    >
                      <FileText size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBatch(batch);
                        setFormModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-surface border border-separator text-muted hover:text-foreground transition cursor-pointer"
                      title="Edit Batch"
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

      {/* Modals */}
      <BatchFormModal
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
    </div>
  );
}
