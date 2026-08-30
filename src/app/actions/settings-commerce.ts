'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { OrderSettings, InventorySettings, PaymentSettings } from '@/types/settings';

const DEFAULT_ORDERS: OrderSettings = {
  orderConfirmationEmail: true,
  staffOrderNotifications: true,
  orderPrefix: '#ORD-',
  orderSuffix: '',
  abandonedRecoveryEnabled: true,
  abandonedSendAfterHours: 12,
};

const DEFAULT_INVENTORY: InventorySettings = {
  stopSellingWhenOutOfStock: true,
  trackInventoryByDefault: true,
  enableLowStockAlerts: true,
  lowStockThreshold: 5,
  autoGenerateSkus: false,
};

const DEFAULT_PAYMENTS: PaymentSettings = {
  enableMtnMomo: true,
  enableTelecelCash: true,
  enableAtMoney: true,
  enableCards: true,
  enableCod: false,
  codMaxOrderAmount: 500,
};

export async function getOrderSettings(): Promise<OrderSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_ORDERS;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase.from('tenant_settings').select('settings_data').eq('tenant_id', tenantId).single();
    const custom = (data?.settings_data as Record<string, unknown> | null)?.order_settings;
    if (custom && typeof custom === 'object') {
      return custom as unknown as OrderSettings;
    }
  } catch (err) {
    console.error('Error fetching order settings:', err);
  }
  return DEFAULT_ORDERS;
}

export async function updateOrderSettings(payload: OrderSettings) {
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
    const updatedData = { ...currentData, order_settings: payload };

    const { error } = await supabase
      .from('tenant_settings')
      .update({ settings_data: updatedData })
      .eq('tenant_id', tenantId);

    if (error) throw error;
    revalidatePath('/dashboard/settings/orders');
    return { success: true };
  } catch (err) {
    console.error('Error updating order settings:', err);
    return { error: 'Failed to update order settings' };
  }
}

export async function getInventorySettings(): Promise<InventorySettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_INVENTORY;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase
      .from('tenant_settings')
      .select('low_stock_threshold, settings_data')
      .eq('tenant_id', tenantId)
      .single();

    const custom = (data?.settings_data as Record<string, unknown> | null)?.inventory_settings;
    if (custom && typeof custom === 'object') {
      return {
        ...(custom as unknown as InventorySettings),
        lowStockThreshold: Number(data?.low_stock_threshold) || (custom as InventorySettings).lowStockThreshold || 5,
      };
    }
    if (data?.low_stock_threshold) {
      return { ...DEFAULT_INVENTORY, lowStockThreshold: data.low_stock_threshold };
    }
  } catch (err) {
    console.error('Error fetching inventory settings:', err);
  }
  return DEFAULT_INVENTORY;
}

export async function updateInventorySettings(payload: InventorySettings) {
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
    const updatedData = { ...currentData, inventory_settings: payload };

    const { error } = await supabase
      .from('tenant_settings')
      .update({
        low_stock_threshold: payload.lowStockThreshold,
        settings_data: updatedData,
      })
      .eq('tenant_id', tenantId);

    if (error) throw error;
    revalidatePath('/dashboard/settings/inventory');
    return { success: true };
  } catch (err) {
    console.error('Error updating inventory settings:', err);
    return { error: 'Failed to update inventory settings' };
  }
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_PAYMENTS;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase.from('tenant_settings').select('settings_data').eq('tenant_id', tenantId).single();
    const custom = (data?.settings_data as Record<string, unknown> | null)?.payment_settings;
    if (custom && typeof custom === 'object') {
      return custom as unknown as PaymentSettings;
    }
  } catch (err) {
    console.error('Error fetching payment settings:', err);
  }
  return DEFAULT_PAYMENTS;
}

export async function updatePaymentSettings(payload: PaymentSettings) {
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
    const updatedData = { ...currentData, payment_settings: payload };

    const { error } = await supabase
      .from('tenant_settings')
      .update({ settings_data: updatedData })
      .eq('tenant_id', tenantId);

    if (error) throw error;
    revalidatePath('/dashboard/settings/payments');
    return { success: true };
  } catch (err) {
    console.error('Error updating payment settings:', err);
    return { error: 'Failed to update payment settings' };
  }
}
