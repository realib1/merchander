export type OrderFulfillmentMode = 'delivery' | 'pickup';

export interface AssignRiderPayload {
  orderId: string;
  tenantId?: string;
  fulfillmentMode?: OrderFulfillmentMode;
  riderName?: string;
  riderPhone?: string;
  courierName?: string;
  trackingNumber?: string;
  dispatchNotes?: string;
  pickupStoreId?: string;
  deliveryZoneId?: string;
  deliveryZoneName?: string;
}

export interface MarkDeliveredPayload {
  orderId: string;
  tenantId?: string;
  notes?: string;
}

export interface OrderDispatchRecord {
  orderId: string;
  shortId: string;
  fulfillmentMode: OrderFulfillmentMode;
  riderName: string | null;
  riderPhone: string | null;
  courierName: string | null;
  trackingNumber: string | null;
  dispatchNotes: string | null;
  pickupStoreId: string | null;
  pickupStoreName?: string | null;
  deliveryZoneId: string | null;
  deliveryZoneName: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  status: string;
}
