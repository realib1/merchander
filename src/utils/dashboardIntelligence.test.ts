
import {
  computeDashboardIntelligence,
  DashboardIntelligenceInput,
} from './dashboardIntelligence';

describe('src/utils/dashboardIntelligence.ts', () => {
  const baseInput: DashboardIntelligenceInput = {
    isFreshTenant: false,
    lowStockList: [],
    purchaseOrdersList: [],
    outOfStockCount: 0,
    totalTrackedVariants: 15,
    lowStockThreshold: 10,
  };

  it('provides welcome onboarding insights for fresh tenant', () => {
    const result = computeDashboardIntelligence({
      ...baseInput,
      isFreshTenant: true,
    });

    expect(result.velocityInsight).toContain('Welcome to Merchander');
    expect(result.supplyInsight[0]).toContain('Store catalog and inventory tracking ready');
    expect(result.recommendation).toContain('Add your first products');
  });

  it('evaluates healthy stock without shipments dynamically without static strings', () => {
    const result = computeDashboardIntelligence(baseInput);

    expect(result.velocityInsight).toContain('No urgent stockout threats');
    expect(result.supplyInsight[0]).toContain('All 15 tracked catalog variants are stocked above minimum threshold (10 units)');
    expect(result.supplyInsight[1]).toContain('No active purchase orders or supplier shipments currently in transit');
    expect(result.recommendation).toContain('Catalog inventory is healthy');
  });

  it('dynamically reports incoming shipments when low-stock list is empty', () => {
    const result = computeDashboardIntelligence({
      ...baseInput,
      purchaseOrdersList: [
        {
          id: 'PO-2026-001',
          supplierName: 'Guangzhou Textiles Ltd',
          status: 'In Transit',
          origin: 'China',
          units: 500,
          preOrders: 50,
          eta: 'Sep 25',
        },
      ],
    });

    expect(result.supplyInsight[1]).toContain('1 incoming purchase order in transit (500 units total, next arrival ~Sep 25)');
    expect(result.supplyInsight[1]).not.toContain('No major shipments in transit');
    expect(result.recommendation).toContain('Track incoming shipment (PO-2026-001)');
  });

  it('flags depleted items when lowStockList has 0 velocity items and out-of-stock count > 0', () => {
    const result = computeDashboardIntelligence({
      ...baseInput,
      outOfStockCount: 3,
    });

    expect(result.velocityInsight).toContain('3 product variants have 0 inventory units but no sales recorded');
    expect(result.supplyInsight[0]).toContain('3 product variants are completely depleted (0 units in stock)');
    expect(result.supplyInsight[0]).not.toContain('Stock levels are generally stable');
    expect(result.recommendation).toContain('Review depleted items in Inventory and submit supplier purchase orders');
  });

  it('handles fast-moving low stock item with positive sales velocity and incoming buffer', () => {
    const result = computeDashboardIntelligence({
      ...baseInput,
      lowStockList: [
        {
          id: 'var-1',
          name: 'Silk Scrunchie',
          size: 'Pack of 3',
          remaining: 5,
          avgWeeklySales: 10,
          totalSoldLast30Days: 43,
        },
      ],
      purchaseOrdersList: [
        {
          id: 'PO-99',
          supplierName: 'Shenzhen Accessories',
          status: 'In Transit',
          origin: 'China',
          units: 200,
          preOrders: 20,
          eta: 'Sep 18',
        },
      ],
    });

    expect(result.velocityInsight).toContain('Silk Scrunchie (Pack of 3) is moving fast');
    expect(result.velocityInsight).toContain('sell out in ~3 days');
    expect(result.supplyInsight[0]).toContain('Incoming purchase order (PO-99) contains 200 units total');
    expect(result.supplyInsight[1]).toContain('20 are spoken for. Net available: 180 units');
    expect(result.recommendation).toContain('Do not place another restock order yet');
  });

  it('handles completely out of stock item (remaining <= 0) with zero sales without fabricating velocity', () => {
    const result = computeDashboardIntelligence({
      ...baseInput,
      lowStockList: [
        {
          id: 'var-zero',
          name: 'Linen Dress',
          size: 'M',
          remaining: 0,
          avgWeeklySales: 0,
          totalSoldLast30Days: 0,
        },
      ],
      outOfStockCount: 1,
    });

    expect(result.velocityInsight).toContain('Linen Dress (M) is completely out of stock with 0 units remaining');
    expect(result.velocityInsight).not.toContain('sell out in');
    expect(result.supplyInsight[0]).toContain('No active purchase orders or shipments contain this product');
    expect(result.supplyInsight[1]).toContain('0 units left in the warehouse');
    expect(result.recommendation).toContain('Place an urgent purchase order for Linen Dress');
  });

  it('handles low-stock item with zero sales velocity without claiming it is moving fast', () => {
    const result = computeDashboardIntelligence({
      ...baseInput,
      lowStockList: [
        {
          id: 'var-slow',
          name: 'Vintage Scarf',
          size: 'One Size',
          remaining: 4,
          avgWeeklySales: 0,
          totalSoldLast30Days: 0,
        },
      ],
    });

    expect(result.velocityInsight).toContain('Vintage Scarf (One Size) is low in stock (4 units remaining), with no orders recorded in the last 30 days');
    expect(result.velocityInsight).not.toContain('moving fast');
    expect(result.recommendation).toContain('Place a purchase order for Vintage Scarf immediately');
  });
});
