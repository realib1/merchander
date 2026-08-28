'use client';

import React from 'react';
import { Ship, Anchor, PackageCheck, DollarSign } from 'lucide-react';
import type { Shipment } from '@/types/shipments';
import { MetricCard } from '@/components/ui/MetricCard';

interface ShipmentsTopMetricsProps {
  shipments: Shipment[];
}

export function ShipmentsTopMetrics({ shipments }: ShipmentsTopMetricsProps) {
  const activeShipments = shipments.filter(
    (s) => s.status === 'in_transit' || s.status === 'booked' || s.status === 'customs'
  );

  const customsCount = shipments.filter((s) => s.status === 'customs').length;
  const arrivedCount = shipments.filter((s) => s.status === 'arrived' || s.status === 'cleared').length;

  const totalCbm = shipments.reduce((sum, s) => sum + (Number(s.cbm) || 0), 0);
  const totalWeight = shipments.reduce((sum, s) => sum + (Number(s.weight_kg) || 0), 0);
  const totalFreightAndDuty = shipments.reduce(
    (sum, s) => sum + (Number(s.shipping_cost) || 0) + (Number(s.customs_duty) || 0),
    0
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Active Inbound"
        value={activeShipments.length}
        subtitle={`${shipments.filter((s) => s.status === 'in_transit').length} actively in transit`}
        icon={<Ship size={14} />}
        iconBg="bg-brand-primary/10 text-brand-primary"
      />
      <MetricCard
        title="Cargo Volume"
        value={totalCbm > 0 ? `${totalCbm.toFixed(2)} CBM` : `${totalWeight.toLocaleString()} KG`}
        subtitle={totalWeight > 0 ? `${totalWeight.toLocaleString()} kg gross weight` : 'Estimated shipment volume'}
        icon={<Anchor size={14} />}
        iconBg="bg-info/10 text-info"
      />
      <MetricCard
        title="Port & Customs"
        value={customsCount}
        subtitle={`${arrivedCount} cleared & received`}
        icon={<PackageCheck size={14} />}
        iconBg="bg-warning/10 text-warning"
      />
      <MetricCard
        title="Freight & Duties"
        value={`GHS ${totalFreightAndDuty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subtitle="Total shipping + duty allocation"
        icon={<DollarSign size={14} />}
        iconBg="bg-success/10 text-success"
      />
    </div>
  );
}
