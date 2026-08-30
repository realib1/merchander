'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Shipment, CreateShipmentInput, UpdateShipmentInput, ShipmentStatus } from '@/types/shipments';

const shipmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  tracking_number: z.string().nullable().optional(),
  carrier: z.string().nullable().optional(),
  freight_mode: z.enum(['sea', 'air', 'road', 'express']),
  origin_port: z.string().nullable().optional(),
  destination_port: z.string().nullable().optional(),
  departure_date: z.string().nullable().optional(),
  eta: z.string().nullable().optional(),
  status: z.enum(['draft', 'booked', 'in_transit', 'customs', 'cleared', 'arrived', 'delayed']),
  cbm: z.number().min(0).default(0),
  weight_kg: z.number().min(0).default(0),
  shipping_cost: z.number().min(0).default(0),
  customs_duty: z.number().min(0).default(0),
  currency: z.string().default('GHS'),
  supplier_id: z.string().uuid().nullable().optional(),
  purchase_order_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function getShipments(): Promise<{ data: Shipment[] | null; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: null };
  }

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) {
    return { data: [], error: null };
  }

  const tenantId = tenantUser.tenant_id;

  // 1. Fetch shipments for tenant
  const { data: rawShipments, error: shipmentsError } = await supabase
    .from('shipments')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (shipmentsError) {
    // Graceful warning when table migration is pending on remote Supabase
    if (shipmentsError.code === 'PGRST205' || shipmentsError.message?.includes('schema cache')) {
      console.warn(
        'Notice: public.shipments table is pending migration on Supabase. Run 20260827110000_create_shipments_logistics_schema.sql'
      );
    } else {
      console.warn('Shipments query notice:', shipmentsError.message);
    }
    return { data: [], error: null };
  }

  if (!rawShipments || rawShipments.length === 0) {
    return { data: [], error: null };
  }

  // 2. Resilient memory stitching for foreign tables
  const supplierIds = Array.from(new Set(rawShipments.map((s) => s.supplier_id).filter(Boolean))) as string[];
  const poIds = Array.from(new Set(rawShipments.map((s) => s.purchase_order_id).filter(Boolean))) as string[];

  const supplierMap = new Map<
    string,
    { id: string; name: string; contact_person?: string | null; phone?: string | null }
  >();
  const poMap = new Map<string, { id: string; po_number: string; status: string; total_cost: number }>();

  if (supplierIds.length > 0) {
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('id, name, contact_person, phone')
      .in('id', supplierIds)
      .eq('tenant_id', tenantId);
    if (suppliers) {
      suppliers.forEach((sup) => supplierMap.set(sup.id, sup));
    }
  }

  if (poIds.length > 0) {
    const { data: pos } = await supabase
      .from('purchase_orders')
      .select('id, po_number, status, supplier_cost, shipping_cost, import_cost')
      .in('id', poIds)
      .eq('tenant_id', tenantId);
    if (pos) {
      pos.forEach((po) =>
        poMap.set(po.id, {
          id: po.id,
          po_number: po.po_number || `PO-${po.id.slice(0, 6)}`,
          status: po.status,
          total_cost: (Number(po.supplier_cost) || 0) + (Number(po.shipping_cost) || 0) + (Number(po.import_cost) || 0),
        })
      );
    }
  }

  const stitchedShipments: Shipment[] = rawShipments.map((s) => ({
    ...s,
    supplier: s.supplier_id ? supplierMap.get(s.supplier_id) || null : null,
    purchase_order: s.purchase_order_id ? poMap.get(s.purchase_order_id) || null : null,
  }));

  return { data: stitchedShipments, error: null };
}

export async function getShipmentById(id: string): Promise<{ data: Shipment | null; error: string | null }> {
  if (!id) return { data: null, error: 'Shipment ID required' };
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) {
    return { data: null, error: 'Tenant not found' };
  }

  const tenantId = tenantUser.tenant_id;

  const { data: rawShipment, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !rawShipment) {
    if (error && error.code !== 'PGRST205' && !error.message?.includes('schema cache')) {
      console.warn('Shipment fetch notice:', error.message);
    }
    return { data: null, error: error?.message || 'Shipment not found' };
  }

  let supplier = null;
  let purchase_order = null;

  if (rawShipment.supplier_id) {
    const { data: supData } = await supabase
      .from('suppliers')
      .select('id, name, contact_person, phone')
      .eq('id', rawShipment.supplier_id)
      .eq('tenant_id', tenantId)
      .single();
    supplier = supData || null;
  }

  if (rawShipment.purchase_order_id) {
    const { data: poData } = await supabase
      .from('purchase_orders')
      .select('id, po_number, status, supplier_cost, shipping_cost, import_cost')
      .eq('id', rawShipment.purchase_order_id)
      .eq('tenant_id', tenantId)
      .single();
    if (poData) {
      purchase_order = {
        id: poData.id,
        po_number: poData.po_number || `PO-${poData.id.slice(0, 6)}`,
        status: poData.status,
        total_cost:
          (Number(poData.supplier_cost) || 0) + (Number(poData.shipping_cost) || 0) + (Number(poData.import_cost) || 0),
      };
    }
  }

  const shipment: Shipment = {
    ...rawShipment,
    supplier,
    purchase_order,
  };

  return { data: shipment, error: null };
}

export async function createShipment(
  data: CreateShipmentInput
): Promise<{ data: Shipment | null; error: string | null }> {
  const parsed = shipmentSchema.safeParse(data);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message || 'Invalid input data' };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) {
    return { data: null, error: 'Tenant not found' };
  }

  const tenantId = tenantUser.tenant_id;

  const payload = {
    ...parsed.data,
    tenant_id: tenantId,
  };

  const { data: created, error } = await supabase.from('shipments').insert([payload]).select().single();

  if (error) {
    console.error('Error creating shipment:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/dashboard/shipments');
  return { data: created, error: null };
}

export async function updateShipment(id: string, data: UpdateShipmentInput) {
  if (!id) return { error: 'Shipment ID required' };
  const parsed = shipmentSchema.partial().safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input data' };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) return { error: 'Tenant not found' };

  const payload = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('shipments').update(payload).eq('id', id).eq('tenant_id', tenantUser.tenant_id);

  if (error) {
    console.error('Error updating shipment:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/shipments');
  return { success: true };
}

export async function updateShipmentStatus(id: string, status: ShipmentStatus) {
  if (!id) return { error: 'Shipment ID required' };
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) return { error: 'Tenant not found' };

  const { error } = await supabase
    .from('shipments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantUser.tenant_id);

  if (error) {
    console.error('Error updating shipment status:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/shipments');
  return { success: true };
}

export async function deleteShipment(id: string) {
  if (!id) return { error: 'Shipment ID required' };
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) return { error: 'Tenant not found' };

  const { error } = await supabase.from('shipments').delete().eq('id', id).eq('tenant_id', tenantUser.tenant_id);

  if (error) {
    console.error('Error deleting shipment:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/shipments');
  return { success: true };
}
