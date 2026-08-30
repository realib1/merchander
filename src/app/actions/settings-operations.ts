'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { SupplierSettings, ShipmentSettings, FulfillmentSettings } from '@/types/settings';

const DEFAULT_SUPPLIERS: SupplierSettings = {
  procurementEmail: 'purchasing@merchander.com',
  enableAutoPos: false,
  receivingInstructions: 'Deliveries accepted Monday - Friday, 9:00 AM to 4:00 PM. Please use the back entrance.',
};

const DEFAULT_SHIPMENTS: ShipmentSettings = {
  allowCustomerTracking: true,
  originWarehouse: 'Main Warehouse - Accra, Ghana',
  zones: [
    { id: 'accra', name: 'Greater Accra', eta: 'Standard Delivery (1-2 Days)', fee: 30, isActive: true },
    { id: 'kumasi', name: 'Ashanti Region (Kumasi)', eta: 'Inter-city Transport (2-3 Days)', fee: 50, isActive: true },
    {
      id: 'takoradi',
      name: 'Western Region (Takoradi)',
      eta: 'Inter-city Transport (2-3 Days)',
      fee: 60,
      isActive: true,
    },
    { id: 'tamale', name: 'Northern Region (Tamale)', eta: 'Regional Express (3-4 Days)', fee: 80, isActive: true },
  ],
};

const DEFAULT_FULFILLMENT: FulfillmentSettings = {
  autoFulfillDigital: true,
  requireScanning: false,
  packingSlipShowPrices: false,
  packingSlipReturnPolicy: true,
  handlingTimeDays: 'Same business day',
};

export async function getSupplierSettings(): Promise<SupplierSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_SUPPLIERS;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase.from('tenant_settings').select('settings_data').eq('tenant_id', tenantId).single();
    const custom = (data?.settings_data as Record<string, unknown> | null)?.supplier_settings;
    if (custom && typeof custom === 'object') {
      return custom as unknown as SupplierSettings;
    }
  } catch (err) {
    console.error('Error fetching supplier settings:', err);
  }
  return DEFAULT_SUPPLIERS;
}

export async function updateSupplierSettings(payload: SupplierSettings) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') return { error: 'Insufficient permissions' };

    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .single();
    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const updatedData = { ...currentData, supplier_settings: payload };

    const { error } = await supabase
      .from('tenant_settings')
      .update({ settings_data: updatedData })
      .eq('tenant_id', tenantId);

    if (error) throw error;
    revalidatePath('/dashboard/settings/suppliers');
    return { success: true };
  } catch (err) {
    console.error('Error updating supplier settings:', err);
    return { error: 'Failed to update supplier settings' };
  }
}

export async function getShipmentSettings(): Promise<ShipmentSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_SHIPMENTS;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase.from('tenant_settings').select('settings_data').eq('tenant_id', tenantId).single();
    const custom = (data?.settings_data as Record<string, unknown> | null)?.shipment_settings;
    if (custom && typeof custom === 'object') {
      return custom as unknown as ShipmentSettings;
    }
  } catch (err) {
    console.error('Error fetching shipment settings:', err);
  }
  return DEFAULT_SHIPMENTS;
}

export async function updateShipmentSettings(payload: ShipmentSettings) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') return { error: 'Insufficient permissions' };

    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .single();
    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const updatedData = { ...currentData, shipment_settings: payload };

    const { error } = await supabase
      .from('tenant_settings')
      .update({ settings_data: updatedData })
      .eq('tenant_id', tenantId);

    if (error) throw error;
    revalidatePath('/dashboard/settings/shipments');
    return { success: true };
  } catch (err) {
    console.error('Error updating shipment settings:', err);
    return { error: 'Failed to update shipment settings' };
  }
}

export async function getFulfillmentSettings(): Promise<FulfillmentSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_FULFILLMENT;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase.from('tenant_settings').select('settings_data').eq('tenant_id', tenantId).single();
    const custom = (data?.settings_data as Record<string, unknown> | null)?.fulfillment_settings;
    if (custom && typeof custom === 'object') {
      return custom as unknown as FulfillmentSettings;
    }
  } catch (err) {
    console.error('Error fetching fulfillment settings:', err);
  }
  return DEFAULT_FULFILLMENT;
}

export async function updateFulfillmentSettings(payload: FulfillmentSettings) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') return { error: 'Insufficient permissions' };

    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .single();
    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const updatedData = { ...currentData, fulfillment_settings: payload };

    const { error } = await supabase
      .from('tenant_settings')
      .update({ settings_data: updatedData })
      .eq('tenant_id', tenantId);

    if (error) throw error;
    revalidatePath('/dashboard/settings/fulfillment');
    return { success: true };
  } catch (err) {
    console.error('Error updating fulfillment settings:', err);
    return { error: 'Failed to update fulfillment settings' };
  }
}
