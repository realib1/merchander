'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  RestockRecommendation,
  DemandForecastSummary,
  SupplierPerformanceScore,
  SupplierScorecardSummary,
  CreateDraftPOFromRestockPayload,
  RecordPODeliveryPayload,
} from '@/types/intelligence-demand';
import {
  calculateDailyVelocity,
  calculateRunOutDate,
  calculateDynamicReorderPoint,
  calculateSuggestedReorderQty,
  classifyStockHealth,
} from '@/utils/demand-forecast';
import {
  calculatePunctualityRate,
  calculateLeadTimeVariance,
  calculateFulfillmentAccuracy,
  calculateQualityMetrics,
  calculateCompositeSupplierScore,
} from '@/utils/supplier-scoring';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Aggregates inventory levels, historical sales velocity, and supplier lead times
 * to generate prioritized restock recommendations and stockout forecasts.
 */
export async function getRestockRecommendationsAction(
  storeId?: string
): Promise<ActionResult<{ recommendations: RestockRecommendation[]; summary: DemandForecastSummary }>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();
    if (!tenantUser) return { success: false, error: 'Tenant not found' };

    const tenantId = tenantUser.tenant_id;

    // 1. Fetch variants with products, inventory levels, and preferred suppliers
    const { data: variantsData, error: variantsError } = await supabase
      .from('product_variants')
      .select(
        `
        id,
        name,
        sku,
        price,
        cost_price,
        reorder_point,
        reorder_quantity,
        preferred_supplier_id,
        product:products!inner(
          id,
          name,
          tenant_id
        ),
        inventory:inventory_levels(
          store_id,
          quantity
        ),
        supplier:suppliers!product_variants_preferred_supplier_id_fkey(
          id,
          name,
          default_lead_days,
          sea_lead_days,
          air_lead_days,
          reliability_score
        )
      `
      )
      .eq('product.tenant_id', tenantId);

    if (variantsError) {
      console.error('Error fetching variants for restock:', variantsError);
      return { success: false, error: variantsError.message };
    }

    const variants = variantsData || [];
    if (variants.length === 0) {
      return {
        success: true,
        data: {
          recommendations: [],
          summary: {
            totalVariantsTracked: 0,
            criticalStockoutsCount: 0,
            warningStockoutsCount: 0,
            healthyStockCount: 0,
            totalSuggestedCapitalGhs: 0,
            averageVelocity: 0,
          },
        },
      };
    }

    const variantIds = variants.map((v) => v.id);

    // 2. Fetch past 30 days of sales order items for these variants
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: orderItemsData, error: ordersError } = await supabase
      .from('order_items')
      .select(
        `
        variant_id,
        quantity,
        order:orders!inner(
          status,
          created_at,
          tenant_id
        )
      `
      )
      .in('variant_id', variantIds)
      .eq('order.tenant_id', tenantId)
      .gte('order.created_at', thirtyDaysAgo);

    if (ordersError) {
      console.warn('Error fetching sales history for velocity:', ordersError);
    }

    // Group order items by variant_id
    const salesByVariant = new Map<string, Array<{ quantity: number; orderStatus: string }>>();
    (orderItemsData || []).forEach((item) => {
      const vId = item.variant_id;
      if (!vId) return;
      const order = Array.isArray(item.order) ? item.order[0] : item.order;
      const arr = salesByVariant.get(vId) || [];
      arr.push({
        quantity: item.quantity,
        orderStatus: order?.status || 'paid',
      });
      salesByVariant.set(vId, arr);
    });

    const recommendations: RestockRecommendation[] = [];
    let criticalCount = 0;
    let warningCount = 0;
    let healthyCount = 0;
    let totalSuggestedCapital = 0;
    let totalVelocity = 0;

    for (const v of variants) {
      const rawProduct = Array.isArray(v.product) ? v.product[0] : v.product;
      const rawSupplier = Array.isArray(v.supplier) ? v.supplier[0] : v.supplier;
      const invList = (v.inventory || []) as Array<{ store_id: string; quantity: number }>;

      // Filter by store if provided, otherwise sum across all branches
      const relevantInv = storeId ? invList.filter((i) => i.store_id === storeId) : invList;
      const currentStock = relevantInv.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

      const sales = salesByVariant.get(v.id) || [];
      const dailyVelocity = calculateDailyVelocity(sales, 30);
      totalVelocity += dailyVelocity;

      const supplierLeadDays = rawSupplier?.default_lead_days || 14;
      const leadTime = supplierLeadDays;
      const reorderPoint =
        v.reorder_point && v.reorder_point > 0
          ? v.reorder_point
          : calculateDynamicReorderPoint(dailyVelocity, leadTime, 5);

      const healthStatus = classifyStockHealth(currentStock, reorderPoint, leadTime, dailyVelocity);
      const { daysOfStockRemaining, projectedRunOutDate } = calculateRunOutDate(currentStock, dailyVelocity);

      const suggestedReorderQuantity = calculateSuggestedReorderQty(
        currentStock,
        reorderPoint,
        30,
        dailyVelocity,
        v.reorder_quantity || 20
      );

      const unitCost = Number(v.cost_price) || Number(v.price) * 0.6 || 0;
      const totalEstimatedCost = suggestedReorderQuantity * unitCost;

      if (healthStatus === 'critical') {
        criticalCount++;
        totalSuggestedCapital += totalEstimatedCost;
      } else if (healthStatus === 'warning') {
        warningCount++;
        totalSuggestedCapital += totalEstimatedCost;
      } else {
        healthyCount++;
      }

      recommendations.push({
        variantId: v.id,
        productId: rawProduct?.id || '',
        productName: rawProduct?.name || 'Unnamed Product',
        variantName: v.name || 'Standard',
        sku: v.sku || null,
        currentStock,
        dailyVelocity,
        daysOfStockRemaining,
        projectedRunOutDate,
        reorderPoint,
        suggestedReorderQuantity,
        healthStatus,
        preferredSupplier: rawSupplier
          ? {
              id: rawSupplier.id,
              name: rawSupplier.name,
              defaultLeadDays: rawSupplier.default_lead_days || 14,
              seaLeadDays: rawSupplier.sea_lead_days || 45,
              airLeadDays: rawSupplier.air_lead_days || 7,
              reliabilityScore: Number(rawSupplier.reliability_score) || 100.0,
            }
          : null,
        estimatedUnitCost: unitCost,
        totalEstimatedCost,
      });
    }

    // Sort order: critical first, then warning, then healthy / no_sales
    const priorityOrder: Record<string, number> = {
      critical: 0,
      warning: 1,
      no_sales: 2,
      healthy: 3,
      overstocked: 4,
    };

    recommendations.sort((a, b) => {
      const prioDiff = (priorityOrder[a.healthStatus] ?? 99) - (priorityOrder[b.healthStatus] ?? 99);
      if (prioDiff !== 0) return prioDiff;
      return a.daysOfStockRemaining - b.daysOfStockRemaining;
    });

    const summary: DemandForecastSummary = {
      totalVariantsTracked: variants.length,
      criticalStockoutsCount: criticalCount,
      warningStockoutsCount: warningCount,
      healthyStockCount: healthyCount,
      totalSuggestedCapitalGhs: Math.round(totalSuggestedCapital * 100) / 100,
      averageVelocity: Math.round((totalVelocity / Math.max(1, variants.length)) * 100) / 100,
    };

    return {
      success: true,
      data: {
        recommendations,
        summary,
      },
    };
  } catch (err: unknown) {
    console.error('getRestockRecommendationsAction error:', err);
    return { success: false, error: 'Failed to retrieve restock recommendations' };
  }
}

/**
 * Creates a draft Purchase Order from selected restock recommendations in a single operation.
 */
export async function createDraftPOFromRestockAction(
  payload: CreateDraftPOFromRestockPayload
): Promise<ActionResult<{ purchaseOrderId: string; poNumber?: string }>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();
    if (!tenantUser) return { success: false, error: 'Tenant not found' };

    const tenantId = tenantUser.tenant_id;

    if (!payload.supplierId) return { success: false, error: 'Supplier ID is required' };
    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'At least one item is required to generate a purchase order' };
    }

    // Verify supplier belongs to tenant
    const { data: supplier, error: supErr } = await supabase
      .from('suppliers')
      .select('id, name, default_lead_days')
      .eq('id', payload.supplierId)
      .eq('tenant_id', tenantId)
      .single();

    if (supErr || !supplier) {
      return { success: false, error: 'Supplier not found' };
    }

    const leadDays = supplier.default_lead_days || 14;
    const expectedDelivery = new Date(Date.now() + leadDays * 24 * 60 * 60 * 1000).toISOString();

    // 1. Create Purchase Order
    const { data: po, error: poErr } = await supabase
      .from('purchase_orders')
      .insert({
        tenant_id: tenantId,
        supplier_id: payload.supplierId,
        status: 'draft',
        eta: expectedDelivery,
        expected_delivery_date: expectedDelivery,
      })
      .select('id, po_number')
      .single();

    if (poErr || !po) {
      console.error('Failed to create purchase order:', poErr);
      return { success: false, error: 'Failed to create purchase order' };
    }

    // 2. Create Purchase Order Items
    const itemsToInsert = payload.items.map((it) => ({
      purchase_order_id: po.id,
      variant_id: it.variantId,
      quantity: Math.max(1, it.quantity),
      cost_price: it.costPrice || 0,
    }));

    const { error: itemsErr } = await supabase.from('purchase_order_items').insert(itemsToInsert);

    if (itemsErr) {
      console.error('Failed to insert purchase order items:', itemsErr);
      return { success: false, error: 'Failed to insert line items' };
    }

    revalidatePath('/dashboard/purchasing');
    revalidatePath('/dashboard/inventory');

    return {
      success: true,
      data: {
        purchaseOrderId: po.id,
        poNumber: po.po_number || undefined,
      },
    };
  } catch (err: unknown) {
    console.error('createDraftPOFromRestockAction error:', err);
    return { success: false, error: 'Failed to create draft purchase order' };
  }
}

/**
 * Computes supplier reliability scorecards, punctuality ratings, and defect ratios.
 */
export async function getSupplierScorecardsAction(): Promise<
  ActionResult<{ scorecards: SupplierPerformanceScore[]; summary: SupplierScorecardSummary }>
> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();
    if (!tenantUser) return { success: false, error: 'Tenant not found' };

    const tenantId = tenantUser.tenant_id;

    // 1. Fetch all suppliers
    const { data: suppliers, error: supErr } = await supabase
      .from('suppliers')
      .select('id, name, country, outstanding_balance, default_lead_days, reliability_score')
      .eq('tenant_id', tenantId)
      .order('name');

    if (supErr) {
      console.error('Failed to fetch suppliers for scorecards:', supErr);
      return { success: false, error: supErr.message };
    }

    if (!suppliers || suppliers.length === 0) {
      return {
        success: true,
        data: {
          scorecards: [],
          summary: {
            totalSuppliers: 0,
            averageOnTimeRate: 100,
            gradeACount: 0,
            needsAttentionCount: 0,
          },
        },
      };
    }

    // 2. Fetch purchase orders with items
    const { data: pos, error: posErr } = await supabase
      .from('purchase_orders')
      .select(
        `
        id,
        supplier_id,
        status,
        expected_delivery_date,
        actual_delivery_date,
        quality_rating,
        defect_count,
        fulfillment_accuracy,
        items:purchase_order_items(
          quantity
        )
      `
      )
      .eq('tenant_id', tenantId);

    if (posErr) {
      console.error('Failed to fetch POs for scoring:', posErr);
    }

    // Group POs by supplier_id
    const posBySupplier = new Map<string, typeof pos>();
    (pos || []).forEach((po) => {
      const supId = po.supplier_id;
      const list = posBySupplier.get(supId) || [];
      list.push(po);
      posBySupplier.set(supId, list);
    });

    const scorecards: SupplierPerformanceScore[] = [];
    let gradeACount = 0;
    let needsAttentionCount = 0;
    let totalOnTimeRateSum = 0;

    for (const s of suppliers) {
      const supplierPOs = posBySupplier.get(s.id) || [];
      const completed = supplierPOs.filter((p) => p.status === 'received' || p.actual_delivery_date);

      const hasHistory = completed.length > 0;

      const formattedPOs = supplierPOs.map((p) => {
        const items = (p.items || []) as Array<{ quantity: number }>;
        const totalQty = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
        return {
          id: p.id,
          expectedDeliveryDate: p.expected_delivery_date,
          actualDeliveryDate: p.actual_delivery_date,
          status: p.status,
          orderedQty: totalQty,
          receivedQty: totalQty, // Standard unless partial
          defectCount: p.defect_count || 0,
          qualityRating: p.quality_rating,
        };
      });

      const punctualityRate = calculatePunctualityRate(formattedPOs);
      const leadTimeVariance = calculateLeadTimeVariance(formattedPOs);
      const fulfillmentAccuracy = calculateFulfillmentAccuracy(formattedPOs);
      const { averageQualityRating, defectRate } = calculateQualityMetrics(formattedPOs);

      const { compositeScore, grade } = calculateCompositeSupplierScore({
        hasHistory,
        punctualityRate,
        fulfillmentAccuracy,
        defectRate,
        qualityRating: averageQualityRating,
      });

      if (grade === 'A') gradeACount++;
      if (grade === 'Needs Attention') needsAttentionCount++;
      totalOnTimeRateSum += punctualityRate;

      const avgLeadDays =
        s.default_lead_days || (leadTimeVariance > 0 ? 14 + leadTimeVariance : 14);

      scorecards.push({
        supplierId: s.id,
        supplierName: s.name,
        country: s.country || null,
        totalPOs: supplierPOs.length,
        completedPOs: completed.length,
        onTimeDeliveryRate: punctualityRate,
        averageLeadTimeDays: Math.round(avgLeadDays),
        fulfillmentAccuracy,
        defectCount: formattedPOs.reduce((acc, p) => acc + p.defectCount, 0),
        averageQualityRating,
        compositeScore,
        grade,
        outstandingBalance: Number(s.outstanding_balance) || 0,
      });
    }

    const summary: SupplierScorecardSummary = {
      totalSuppliers: suppliers.length,
      averageOnTimeRate: Math.round((totalOnTimeRateSum / Math.max(1, suppliers.length)) * 10) / 10,
      gradeACount,
      needsAttentionCount,
    };

    return {
      success: true,
      data: {
        scorecards,
        summary,
      },
    };
  } catch (err: unknown) {
    console.error('getSupplierScorecardsAction error:', err);
    return { success: false, error: 'Failed to retrieve supplier scorecards' };
  }
}

/**
 * Records actual delivery receipt, quality rating, and defect count on a purchase order.
 */
export async function recordPODeliveryAction(
  payload: RecordPODeliveryPayload
): Promise<ActionResult<{ purchaseOrderId: string }>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();
    if (!tenantUser) return { success: false, error: 'Tenant not found' };

    const tenantId = tenantUser.tenant_id;

    if (!payload.purchaseOrderId) {
      return { success: false, error: 'Purchase Order ID is required' };
    }

    const rating = Math.min(5, Math.max(1, Math.round(payload.qualityRating || 5)));
    const defects = Math.max(0, Math.round(payload.defectCount || 0));
    const deliveryDate = payload.actualDeliveryDate || new Date().toISOString();

    const { data: updatedPO, error: updateErr } = await supabase
      .from('purchase_orders')
      .update({
        status: 'received',
        actual_delivery_date: deliveryDate,
        quality_rating: rating,
        defect_count: defects,
      })
      .eq('id', payload.purchaseOrderId)
      .eq('tenant_id', tenantId)
      .select('id, supplier_id')
      .single();

    if (updateErr || !updatedPO) {
      console.error('Error recording PO delivery:', updateErr);
      return { success: false, error: 'Failed to record PO delivery' };
    }

    revalidatePath('/dashboard/purchasing');
    revalidatePath('/dashboard/suppliers');

    return {
      success: true,
      data: { purchaseOrderId: updatedPO.id },
    };
  } catch (err: unknown) {
    console.error('recordPODeliveryAction error:', err);
    return { success: false, error: 'Failed to record PO delivery' };
  }
}
