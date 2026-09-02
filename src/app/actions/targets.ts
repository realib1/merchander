'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { BusinessTarget, TargetProgress, TargetsIntelligenceSummary, CreateTargetInput } from '@/types/targets';
import {
  calculateTargetProgress,
  generateTargetsIntelligenceSummary,
  sortTargetsByPriority,
} from '@/utils/targets-engine';

async function getAdminOrUserClient() {
  try {
    return createAdminClient();
  } catch {
    return await createClient();
  }
}

/**
 * Loads and calculates live progress for all business targets
 */
export async function getBusinessTargets(): Promise<{
  targets: TargetProgress[];
  summary: TargetsIntelligenceSummary;
  availableProducts: Array<{ id: string; name: string }>;
  availableBatches: Array<{ id: string; name: string; code: string }>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const emptyResult = {
    targets: [],
    summary: generateTargetsIntelligenceSummary([]),
    availableProducts: [],
    availableBatches: [],
  };

  if (!user) return emptyResult;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const adminSupabase = await getAdminOrUserClient();

    // 1. Fetch settings, targets, products, and batches in parallel
    const [settingsRes, targetsTableRes, productsRes, batchesRes] = await Promise.all([
      supabase.from('tenant_settings').select('store_currency, settings_data').eq('tenant_id', tenantId).maybeSingle(),
      adminSupabase
        .from('business_targets')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false }),
      supabase.from('products').select('id, name').eq('tenant_id', tenantId).eq('is_active', true),
      supabase
        .from('preorder_batches')
        .select('id, name, code')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false }),
    ]);

    const currency = settingsRes.data?.store_currency || 'GHS';
    const availableProducts = (productsRes.data || []).map((p) => ({ id: p.id, name: p.name }));
    const availableBatches = (batchesRes.data || []).map((b) => ({
      id: b.id,
      name: b.name || `Batch ${b.code}`,
      code: b.code,
    }));

    // 2. Load stored targets (with fallback to settings_data)
    let rawTargets: BusinessTarget[] = [];
    if (targetsTableRes.data && targetsTableRes.data.length > 0) {
      rawTargets = targetsTableRes.data as unknown as BusinessTarget[];
    } else {
      const customData = (settingsRes.data?.settings_data as Record<string, unknown> | null) || {};
      rawTargets = (customData.business_targets as BusinessTarget[]) || [];
    }

    // 3. Fetch live commerce data to calculate target metrics
    const [ordersRes, customersRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id, total_amount, status, created_at, order_items(product_id, quantity, unit_price)')
        .eq('tenant_id', tenantId)
        .neq('status', 'cancelled'),
      supabase.from('customers').select('id, created_at').eq('tenant_id', tenantId),
    ]);

    const orders = ordersRes.data || [];
    const customers = customersRes.data || [];

    // 4. Compute progress for each target
    const calculatedList: TargetProgress[] = rawTargets.map((target) => {
      let currentValue = 0;
      const targetStart = new Date(target.start_date).getTime();
      const targetEnd = new Date(target.end_date).getTime();

      if (target.metric === 'revenue') {
        currentValue = orders
          .filter((o) => {
            const t = new Date(o.created_at).getTime();
            return t >= targetStart && t <= targetEnd;
          })
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      } else if (target.metric === 'orders') {
        currentValue = orders.filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= targetStart && t <= targetEnd;
        }).length;
      } else if (target.metric === 'customers') {
        currentValue = customers.length;
      } else if (target.metric === 'new_customers') {
        currentValue = customers.filter((c) => {
          const t = new Date(c.created_at).getTime();
          return t >= targetStart && t <= targetEnd;
        }).length;
      } else if (target.metric === 'product_sales' && target.product_id) {
        currentValue = orders
          .filter((o) => {
            const t = new Date(o.created_at).getTime();
            return t >= targetStart && t <= targetEnd;
          })
          .reduce((sum, o) => {
            const items = (o.order_items as Array<{ product_id: string; quantity: number }>) || [];
            const matching = items.filter((it) => it.product_id === target.product_id);
            return sum + matching.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
          }, 0);
      } else if (target.metric === 'preorder_customers' && target.batch_id) {
        // Pre-order customers associated with batch
        currentValue = orders.filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= targetStart && t <= targetEnd;
        }).length;
      } else if (target.metric === 'preorder_revenue' && target.batch_id) {
        currentValue = orders
          .filter((o) => {
            const t = new Date(o.created_at).getTime();
            return t >= targetStart && t <= targetEnd;
          })
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      }

      return calculateTargetProgress(target, currentValue, { currency });
    });

    const sorted = sortTargetsByPriority(calculatedList);
    const summary = generateTargetsIntelligenceSummary(sorted);

    return {
      targets: sorted,
      summary,
      availableProducts,
      availableBatches,
    };
  } catch (err) {
    console.error('Error in getBusinessTargets:', err);
    return emptyResult;
  }
}

/**
 * Creates a new business target
 */
export async function createBusinessTarget(payload: CreateTargetInput): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') {
      return { error: 'Insufficient permissions to manage business goals' };
    }

    const adminSupabase = await getAdminOrUserClient();
    const targetId = crypto.randomUUID();
    const newTarget: BusinessTarget = {
      id: targetId,
      tenant_id: tenantId,
      name: payload.name.trim(),
      metric: payload.metric,
      target_value: Number(payload.target_value),
      period: payload.period,
      start_date: payload.start_date,
      end_date: payload.end_date,
      product_id: payload.product_id || null,
      batch_id: payload.batch_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Try insert into business_targets table
    try {
      await adminSupabase.from('business_targets').insert(newTarget);
    } catch {
      // Fallback to settings_data
    }

    // 2. Persist in tenant_settings fallback
    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const existingTargets = (currentData.business_targets as BusinessTarget[]) || [];
    const updatedTargets = [newTarget, ...existingTargets.filter((t) => t.id !== newTarget.id)];

    await supabase.from('tenant_settings').upsert(
      {
        tenant_id: tenantId,
        settings_data: { ...currentData, business_targets: updatedTargets },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );

    revalidatePath('/dashboard/insights');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err) {
    console.error('Error creating business target:', err);
    return { error: 'Failed to create business target' };
  }
}

/**
 * Deletes a business target
 */
export async function deleteBusinessTarget(targetId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') {
      return { error: 'Insufficient permissions' };
    }

    const adminSupabase = await getAdminOrUserClient();

    // 1. Try delete from table
    try {
      await adminSupabase.from('business_targets').delete().eq('id', targetId).eq('tenant_id', tenantId);
    } catch {
      // Fallback
    }

    // 2. Delete from tenant_settings fallback
    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const existingTargets = (currentData.business_targets as BusinessTarget[]) || [];
    const updatedTargets = existingTargets.filter((t) => t.id !== targetId);

    await supabase.from('tenant_settings').upsert(
      {
        tenant_id: tenantId,
        settings_data: { ...currentData, business_targets: updatedTargets },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );

    revalidatePath('/dashboard/insights');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err) {
    console.error('Error deleting target:', err);
    return { error: 'Failed to delete target' };
  }
}
