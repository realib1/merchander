'use client';

import { FreightMode, ShipmentStatus } from '@/types/shipments';

interface ShipmentRouteSectionProps {
  trackingNumber: string;
  carrier: string;
  freightMode: FreightMode;
  originPort: string;
  destinationPort: string;
  departureDate: string;
  eta: string;
  status: ShipmentStatus;
  onTrackingNumberChange: (val: string) => void;
  onCarrierChange: (val: string) => void;
  onFreightModeChange: (val: FreightMode) => void;
  onOriginPortChange: (val: string) => void;
  onDestinationPortChange: (val: string) => void;
  onDepartureDateChange: (val: string) => void;
  onEtaChange: (val: string) => void;
  onStatusChange: (val: ShipmentStatus) => void;
}

export function ShipmentRouteSection({
  trackingNumber,
  carrier,
  freightMode,
  originPort,
  destinationPort,
  departureDate,
  eta,
  status,
  onTrackingNumberChange,
  onCarrierChange,
  onFreightModeChange,
  onOriginPortChange,
  onDestinationPortChange,
  onDepartureDateChange,
  onEtaChange,
  onStatusChange,
}: ShipmentRouteSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Tracking Number / Bill of Lading (BL)</label>
          <input
            type="text"
            placeholder="e.g. COSU638291048"
            value={trackingNumber}
            onChange={(e) => onTrackingNumberChange(e.target.value)}
            className="w-full text-sm rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-none font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Freight Forwarder / Carrier</label>
          <input
            type="text"
            placeholder="e.g. COSCO, MSC, DHL Global"
            value={carrier}
            onChange={(e) => onCarrierChange(e.target.value)}
            className="w-full text-sm rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Freight Mode *</label>
          <select
            value={freightMode}
            onChange={(e) => onFreightModeChange(e.target.value as FreightMode)}
            className="w-full text-sm rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-none"
          >
            <option value="sea">Sea Freight (Container)</option>
            <option value="air">Air Freight (Cargo)</option>
            <option value="express">Express Courier</option>
            <option value="road">Road Freight</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Origin Port / City</label>
          <input
            type="text"
            placeholder="e.g. Guangzhou, China"
            value={originPort}
            onChange={(e) => onOriginPortChange(e.target.value)}
            className="w-full text-sm rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Destination Port / Hub</label>
          <input
            type="text"
            placeholder="e.g. Tema Port, Ghana"
            value={destinationPort}
            onChange={(e) => onDestinationPortChange(e.target.value)}
            className="w-full text-sm rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Departure Date</label>
          <input
            type="date"
            value={departureDate}
            onChange={(e) => onDepartureDateChange(e.target.value)}
            className="w-full text-sm rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Estimated Arrival (ETA)</label>
          <input
            type="date"
            value={eta}
            onChange={(e) => onEtaChange(e.target.value)}
            className="w-full text-sm rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Current Status</label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as ShipmentStatus)}
            className="w-full text-sm rounded-xl bg-surface-elevated border border-separator px-3.5 py-2 text-foreground focus:ring-1 focus:ring-brand-primary focus:outline-none font-medium"
          >
            <option value="booked">Booked / Origin Staged</option>
            <option value="in_transit">In Transit (Sea/Air)</option>
            <option value="customs_hold">Customs Clearance / Hold</option>
            <option value="arrived">Arrived at Port</option>
            <option value="received">Received in Warehouse</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </div>
  );
}
