export type ShipmentStatus = 'draft' | 'booked' | 'in_transit' | 'customs' | 'cleared' | 'arrived' | 'delayed';

export type FreightMode = 'sea' | 'air' | 'road' | 'express';

export interface Shipment {
  id: string;
  tenant_id: string;
  supplier_id: string | null;
  purchase_order_id: string | null;
  title: string;
  tracking_number: string | null;
  carrier: string | null;
  freight_mode: FreightMode;
  origin_port: string | null;
  destination_port: string | null;
  departure_date: string | null;
  eta: string | null;
  status: ShipmentStatus;
  cbm: number;
  weight_kg: number;
  shipping_cost: number;
  customs_duty: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined relation fields
  supplier?: {
    id: string;
    name: string;
    contact_person?: string | null;
    phone?: string | null;
  } | null;
  purchase_order?: {
    id: string;
    po_number: string | null;
    status: string;
    total_cost: number;
  } | null;
}

export type CreateShipmentInput = Omit<
  Shipment,
  'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'supplier' | 'purchase_order'
>;

export type UpdateShipmentInput = Partial<CreateShipmentInput>;

export interface ShipmentMetrics {
  totalShipments: number;
  inTransitCount: number;
  customsCount: number;
  arrivedCount: number;
  totalCbm: number;
  totalWeight: number;
  totalShippingCost: number;
  totalDutyCost: number;
}
