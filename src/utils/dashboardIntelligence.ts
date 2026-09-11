export interface IntelligenceLowStockItem {
  id: string;
  name: string;
  size: string;
  remaining: number;
  avgWeeklySales: number;
  totalSoldLast30Days: number;
}

export interface IntelligencePurchaseOrder {
  id: string;
  supplierName: string;
  status: 'Received' | 'In Transit' | 'Delayed' | string;
  origin: string;
  units: number;
  preOrders: number;
  eta: string;
}

export interface DashboardIntelligenceInput {
  isFreshTenant: boolean;
  lowStockList: IntelligenceLowStockItem[];
  purchaseOrdersList: IntelligencePurchaseOrder[];
  outOfStockCount: number;
  totalTrackedVariants: number;
  lowStockThreshold: number;
}

export interface DashboardIntelligenceOutput {
  velocityInsight: string;
  supplyInsight: string[];
  recommendation: string;
}

/**
 * Pure evaluation engine for Merchander Dashboard Intelligence.
 * Evaluates real inventory levels, sales velocity, and incoming shipments
 * without hardcoding mock stability strings.
 */
export function computeDashboardIntelligence(
  input: DashboardIntelligenceInput
): DashboardIntelligenceOutput {
  // 1. Fresh Onboarding Tenant
  if (input.isFreshTenant) {
    return {
      velocityInsight:
        'Welcome to Merchander! Add your first products and record orders to activate sales velocity analysis.',
      supplyInsight: [
        '• Store catalog and inventory tracking ready.',
        '• Connect suppliers to monitor purchase orders and transit times.',
      ],
      recommendation: 'Add your first products in Catalog to begin generating automated intelligence.',
    };
  }

  const nextPurchaseOrder = input.purchaseOrdersList.length > 0 ? input.purchaseOrdersList[0] : null;
  const totalInTransitUnits = input.purchaseOrdersList.reduce((sum, po) => sum + (po.units || 0), 0);

  // 2. Active Low-Stock Alerts Exist
  if (input.lowStockList.length > 0) {
    const topLow = input.lowStockList[0];
    let velocityInsight = '';

    if (topLow.remaining <= 0) {
      if (topLow.totalSoldLast30Days > 0) {
        velocityInsight = `${topLow.name} (${topLow.size}) is currently out of stock (prior velocity ~${topLow.avgWeeklySales} units/week).`;
      } else {
        velocityInsight = `${topLow.name} (${topLow.size}) is completely out of stock with 0 units remaining.`;
      }
    } else {
      if (topLow.totalSoldLast30Days > 0) {
        const daysRemaining = Math.max(1, Math.floor((topLow.remaining / topLow.avgWeeklySales) * 7));
        velocityInsight = `Your ${topLow.name} (${topLow.size}) is moving fast. At the current rate of ${topLow.avgWeeklySales} units/week, it will likely sell out in ~${daysRemaining} days.`;
      } else {
        velocityInsight = `Your ${topLow.name} (${topLow.size}) is low in stock (${topLow.remaining} units remaining), with no orders recorded in the last 30 days.`;
      }
    }

    let supplyInsight: string[] = [];
    let recommendation = '';

    if (nextPurchaseOrder) {
      supplyInsight = [
        `• Incoming purchase order (${nextPurchaseOrder.id}) contains ${nextPurchaseOrder.units} units total (ETA ~${nextPurchaseOrder.eta}).`,
        nextPurchaseOrder.preOrders > 0
          ? `• Based on current momentum, ${nextPurchaseOrder.preOrders} are spoken for. Net available: ${nextPurchaseOrder.units - nextPurchaseOrder.preOrders} units.`
          : `• Net available after delivery: ${nextPurchaseOrder.units} units.`,
      ];
      if (input.outOfStockCount > 1) {
        supplyInsight.push(`• ${input.outOfStockCount} total product variants currently have 0 units in stock.`);
      }
      recommendation = `Do not place another restock order yet. The incoming purchase order from ${nextPurchaseOrder.origin || nextPurchaseOrder.supplierName} provides a solid buffer. Re-evaluate after delivery.`;
    } else {
      supplyInsight = [
        `• No active purchase orders or shipments contain this product.`,
        topLow.remaining <= 0
          ? `• 0 units left in the warehouse.`
          : `• Only ${topLow.remaining} unit${topLow.remaining === 1 ? '' : 's'} left in the warehouse.`,
      ];
      if (input.outOfStockCount > 0 && topLow.remaining > 0) {
        supplyInsight.push(
          `• ${input.outOfStockCount} other product variant${input.outOfStockCount === 1 ? ' is' : 's are'} completely out of stock.`
        );
      }
      recommendation =
        topLow.remaining <= 0
          ? `Place an urgent purchase order for ${topLow.name} to restore depleted inventory.`
          : `Place a purchase order for ${topLow.name} immediately to prevent a stockout event.`;
    }

    return {
      velocityInsight,
      supplyInsight,
      recommendation,
    };
  }

  // 3. No Low-Stock Alert Items
  let velocityInsight = '';
  let stockInsightLine = '';
  let shipmentInsightLine = '';
  let recommendation = '';

  if (input.outOfStockCount > 0) {
    velocityInsight = `${input.outOfStockCount} product variant${input.outOfStockCount === 1 ? ' has' : 's have'} 0 inventory units but no sales recorded in the past 30 days.`;
    stockInsightLine = `• ${input.outOfStockCount} product variant${input.outOfStockCount === 1 ? ' is' : 's are'} completely depleted (0 units in stock).`;
  } else if (input.totalTrackedVariants > 0) {
    velocityInsight = 'No urgent stockout threats or negative sales anomalies detected in recent activity.';
    stockInsightLine = `• All ${input.totalTrackedVariants} tracked catalog variants are stocked above minimum threshold (${input.lowStockThreshold} units).`;
  } else {
    velocityInsight = 'No immediate trends detected in your recent sales data.';
    stockInsightLine = '• Catalog inventory levels are currently tracked and stable.';
  }

  if (input.purchaseOrdersList.length > 0) {
    shipmentInsightLine = `• ${input.purchaseOrdersList.length} incoming purchase order${input.purchaseOrdersList.length === 1 ? '' : 's'} in transit (${totalInTransitUnits} units total, next arrival ~${nextPurchaseOrder?.eta}).`;
  } else {
    shipmentInsightLine = '• No active purchase orders or supplier shipments currently in transit.';
  }

  if (input.outOfStockCount > 0) {
    recommendation =
      'Review depleted items in Inventory and submit supplier purchase orders to restore catalog stock.';
  } else if (nextPurchaseOrder) {
    recommendation = `Track incoming shipment (${nextPurchaseOrder.id}) and prepare warehouse receiving.`;
  } else {
    recommendation = 'Catalog inventory is healthy. Maintain current sales pace and reorder schedules.';
  }

  return {
    velocityInsight,
    supplyInsight: [stockInsightLine, shipmentInsightLine],
    recommendation,
  };
}
