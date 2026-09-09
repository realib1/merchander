'use client';

import React from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Ship, Plane, Truck, Zap, Calendar, MapPin, Building2, FileText, DollarSign, CheckCircle2 } from 'lucide-react';
import { updateShipmentStatus } from '@/app/actions/shipments';
import { toast } from 'sonner';
import type { Shipment, ShipmentStatus } from '@/types/shipments';

export interface ShipmentDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  onEdit: (shipment: Shipment) => void;
}

const STATUS_STEPS: { status: ShipmentStatus; label: string }[] = [
  { status: 'booked', label: 'Origin Booking' },
  { status: 'in_transit', label: 'In Transit' },
  { status: 'customs', label: 'Port Customs' },
  { status: 'arrived', label: 'Arrived at Hub' },
];

export function ShipmentDetailsDrawer({ isOpen, onClose, shipment, onEdit }: ShipmentDetailsDrawerProps) {
  if (!shipment) return null;

  const getStatusStepIndex = (currentStatus: ShipmentStatus) => {
    switch (currentStatus) {
      case 'draft':
      case 'booked':
        return 0;
      case 'in_transit':
      case 'delayed':
        return 1;
      case 'customs':
      case 'cleared':
        return 2;
      case 'arrived':
        return 3;
      default:
        return 0;
    }
  };

  const currentIndex = getStatusStepIndex(shipment.status);

  const handleStatusChange = async (newStatus: ShipmentStatus) => {
    try {
      const res = await updateShipmentStatus(shipment.id, newStatus);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      onClose();
    } catch {
      toast.error('Failed to update shipment status');
    }
  };

  const ModeIcon =
    shipment.freight_mode === 'sea'
      ? Ship
      : shipment.freight_mode === 'air'
        ? Plane
        : shipment.freight_mode === 'road'
          ? Truck
          : Zap;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={shipment.title}
      icon={<ModeIcon className="text-brand-primary" size={20} />}
      description="Consignment tracking details & freight logistics."
      size="lg"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-muted font-medium shrink-0">Quick Advance:</span>
            {shipment.status === 'booked' && (
              <Button variant="outline" size="sm" onClick={() => handleStatusChange('in_transit')} className="text-xs shrink-0">
                Mark In Transit
              </Button>
            )}
            {shipment.status === 'in_transit' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('customs')}
                className="text-xs text-amber-500 border-amber-500/30 shrink-0"
              >
                Mark at Customs
              </Button>
            )}
            {shipment.status === 'customs' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('arrived')}
                className="text-xs text-emerald-500 border-emerald-500/30 shrink-0"
              >
                Mark Arrived
              </Button>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(shipment);
              }}
            >
              Edit Details
            </Button>
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Progress Stepper */}
        <div className="bg-surface border border-separator rounded-2xl p-4">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
            Transit & Clearance Progress
          </div>
          <div className="grid grid-cols-4 gap-2 relative">
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              return (
                <div key={step.status} className="flex flex-col items-center text-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-2 ${
                      isPast
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                          ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20'
                          : 'bg-surface-elevated text-muted border border-separator'
                    }`}
                  >
                    {isPast ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? 'text-brand-primary font-bold' : isPast ? 'text-foreground' : 'text-muted'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Core Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface border border-separator rounded-xl p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
              <ModeIcon size={20} />
            </div>
            <div>
              <p className="text-xs text-muted font-medium">Carrier & Tracking</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{shipment.carrier || 'No carrier specified'}</p>
              <p className="text-xs font-mono text-secondary mt-0.5">{shipment.tracking_number || 'No tracking #'}</p>
            </div>
          </div>

          <div className="bg-surface border border-separator rounded-xl p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-xs text-muted font-medium">Route & Ports</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {shipment.origin_port || 'Origin'} → {shipment.destination_port || 'Tema Port'}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {shipment.cbm > 0 ? `${shipment.cbm} CBM` : ''}{' '}
                {shipment.weight_kg > 0 ? `• ${shipment.weight_kg} KG` : ''}
              </p>
            </div>
          </div>

          <div className="bg-surface border border-separator rounded-xl p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs text-muted font-medium">Departure & ETA</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                ETA: {shipment.eta ? new Date(shipment.eta).toLocaleDateString() : 'Pending'}
              </p>
              <p className="text-xs text-muted mt-0.5">
                Departed: {shipment.departure_date ? new Date(shipment.departure_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="bg-surface border border-separator rounded-xl p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs text-muted font-medium">Freight & Clearing Costs</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                GHS{' '}
                {(Number(shipment.shipping_cost) + Number(shipment.customs_duty)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-muted mt-0.5">
                Freight: GHS {Number(shipment.shipping_cost).toLocaleString()} • Duty: GHS{' '}
                {Number(shipment.customs_duty).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Linked Supplier & PO */}
        {(shipment.supplier || shipment.purchase_order) && (
          <div className="bg-surface-elevated/20 border border-separator rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between">
            {shipment.supplier && (
              <div className="flex items-center gap-2.5">
                <Building2 size={18} className="text-muted" />
                <div>
                  <span className="text-xs text-muted block">Supplier</span>
                  <span className="text-sm font-semibold text-foreground">{shipment.supplier.name}</span>
                </div>
              </div>
            )}
            {shipment.purchase_order && (
              <div className="flex items-center gap-2.5">
                <FileText size={18} className="text-muted" />
                <div>
                  <span className="text-xs text-muted block">Linked Purchase Order</span>
                  <span className="text-sm font-semibold font-mono text-brand-primary">
                    {shipment.purchase_order.po_number}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {shipment.notes && (
          <div className="bg-surface border border-separator rounded-xl p-4">
            <p className="text-xs font-semibold text-muted mb-1">Logistics Notes</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{shipment.notes}</p>
          </div>
        )}
      </div>
    </Drawer>
  );
}
