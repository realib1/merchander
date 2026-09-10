'use client';

import React from 'react';
import { Ship, Plane, Truck, Zap, Calendar, MapPin, Eye, Pencil, Trash2, ArrowRight } from 'lucide-react';
import type { Shipment, FreightMode, ShipmentStatus } from '@/types/shipments';

export function getModeBadge(mode: FreightMode) {
  switch (mode) {
    case 'sea':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <Ship size={12} /> Sea Freight
        </span>
      );
    case 'air':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20">
          <Plane size={12} /> Air Cargo
        </span>
      );
    case 'road':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Truck size={12} /> Road
        </span>
      );
    case 'express':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <Zap size={12} /> Express
        </span>
      );
  }
}

export function getStatusBadge(status: ShipmentStatus) {
  switch (status) {
    case 'draft':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-elevated text-muted border border-separator">
          Draft
        </span>
      );
    case 'booked':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
          Booked
        </span>
      );
    case 'in_transit':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 animate-pulse">
          In Transit
        </span>
      );
    case 'customs':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
          Customs Hold
        </span>
      );
    case 'cleared':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          Cleared
        </span>
      );
    case 'arrived':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          Arrived
        </span>
      );
    case 'delayed':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
          Delayed
        </span>
      );
  }
}

interface ShipmentsTableRowProps {
  shipment: Shipment;
  onViewDetails: (s: Shipment) => void;
  onEdit: (s: Shipment) => void;
  onDelete: (id: string, trackingNumber: string) => void;
}

export function ShipmentsTableRow({ shipment, onViewDetails, onEdit, onDelete }: ShipmentsTableRowProps) {
  return (
    <tr className="hover:bg-surface-elevated/30 transition-colors">
      <td className="px-6 py-4">
        <div>
          <button
            onClick={() => onViewDetails(shipment)}
            className="font-bold text-sm text-foreground hover:text-brand-primary transition-colors text-left cursor-pointer"
          >
            {shipment.tracking_number || shipment.title || 'Untitled Shipment'}
          </button>
          <div className="text-xs text-muted mt-0.5">{shipment.carrier || 'Carrier Unspecified'}</div>
        </div>
      </td>

      <td className="px-6 py-4">{getModeBadge(shipment.freight_mode)}</td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <MapPin size={13} className="text-muted shrink-0" />
          <span>{shipment.origin_port || 'Origin'}</span>
          <ArrowRight size={12} className="text-muted shrink-0" aria-hidden="true" />
          <span>{shipment.destination_port || 'Ghana'}</span>
        </div>
      </td>

      <td className="px-6 py-4 text-xs text-muted">
        {shipment.supplier?.name || <span className="italic text-muted/60">No Supplier Linked</span>}
      </td>

      <td className="px-6 py-4">
        {shipment.eta ? (
          <div className="flex items-center gap-1 text-xs font-medium text-foreground">
            <Calendar size={13} className="text-muted shrink-0" />
            {new Date(shipment.eta).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        ) : (
          <span className="text-xs text-muted/60 italic">TBD</span>
        )}
      </td>

      <td className="px-6 py-4">{getStatusBadge(shipment.status)}</td>

      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onViewDetails(shipment)}
            className="p-1.5 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => onEdit(shipment)}
            className="p-1.5 text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors cursor-pointer"
            title="Edit Shipment"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(shipment.id, shipment.tracking_number || shipment.title || shipment.id)}
            className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
            title="Delete Shipment"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}
