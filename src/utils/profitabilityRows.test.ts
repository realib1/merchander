import { describe, it, expect } from 'vitest';
import {
  percentOfRevenue,
  buildProfitabilitySummaryRows,
  buildProductMarginRows,
  buildCategoryRows,
  buildChannelRows,
  buildProfitabilityCsv,
} from './profitabilityRows';
import type {
  ProfitabilityData,
  ProfitabilityMetrics,
  ProductProfitability,
  CategoryProfitability,
  ChannelProfitability,
} from '@/types/profitability';

function metrics(overrides: Partial<ProfitabilityMetrics> = {}): ProfitabilityMetrics {
  return {
    grossRevenue: 1000,
    cogs: 400,
    grossProfit: 600,
    grossMarginPct: 60,
    operatingExpenses: 150,
    logisticsFreightCost: 50,
    gatewayFees: 20,
    totalExpenses: 220,
    netProfit: 380,
    netMarginPct: 38,
    totalOrdersCount: 12,
    totalUnitsSold: 40,
    ...overrides,
  };
}

function data(overrides: Partial<ProfitabilityData> = {}): ProfitabilityData {
  return {
    period: '30d',
    dateRange: { from: '2026-01-01', to: '2026-01-31' },
    metrics: metrics(),
    products: [],
    categories: [],
    channels: [],
    timeline: [],
    ...overrides,
  };
}

function product(overrides: Partial<ProductProfitability> = {}): ProductProfitability {
  return {
    productId: 'p1',
    name: 'Widget',
    categoryName: 'Tools',
    sku: null,
    unitsSold: 40,
    averageSellingPrice: 20,
    averageCostPrice: 12.4,
    totalRevenue: 800,
    totalCogs: 496,
    grossProfit: 304,
    marginPct: 38,
    healthStatus: 'healthy',
    ...overrides,
  };
}

function category(overrides: Partial<CategoryProfitability> = {}): CategoryProfitability {
  return {
    categoryId: 'c1',
    categoryName: 'Tools',
    productCount: 3,
    unitsSold: 40,
    totalRevenue: 800,
    totalCogs: 496,
    grossProfit: 304,
    marginPct: 38,
    profitSharePct: 55,
    ...overrides,
  };
}

function channel(overrides: Partial<ChannelProfitability> = {}): ChannelProfitability {
  return {
    channel: 'whatsapp',
    label: 'WhatsApp',
    orderCount: 9,
    totalRevenue: 600,
    grossProfit: 240,
    marginPct: 40,
    ...overrides,
  };
}

const rowByLabel = (rows: (string | number)[][], label: string) => rows.find((r) => r[0] === label);

describe('percentOfRevenue', () => {
  it('formats a share of gross revenue to one decimal place', () => {
    expect(percentOfRevenue(400, 1000)).toBe('40.0%');
    expect(percentOfRevenue(1, 3)).toBe('33.3%');
  });

  it('guards a zero gross revenue instead of producing Infinity or NaN', () => {
    expect(percentOfRevenue(0, 0)).toBe('0.0%');
    const nonZeroOverZero = percentOfRevenue(100, 0);
    expect(nonZeroOverZero).not.toMatch(/Infinity|NaN/);
    expect(nonZeroOverZero).toBe('10000.0%'); // 100 / (0 || 1) * 100
  });
});

describe('buildProfitabilitySummaryRows', () => {
  const generatedAt = new Date('2026-02-01T12:00:00.000Z');

  it('lays out the statement header and the key-metrics block', () => {
    const rows = buildProfitabilitySummaryRows(data(), 'Kente Corner', generatedAt);

    expect(rows[0]).toEqual(['FINANCIAL PROFITABILITY STATEMENT']);
    expect(rows[1]).toEqual(['Business Name:', 'Kente Corner']);
    expect(rows[2]).toEqual(['Period:', '30D']);
    expect(rows[4]).toEqual(['Generated At:', generatedAt.toLocaleString()]);
    expect(rowByLabel(rows, 'Gross Revenue')).toEqual(['Gross Revenue', 1000, '100.0%']);
    expect(rowByLabel(rows, 'Cost of Goods Sold (COGS)')).toEqual(['Cost of Goods Sold (COGS)', 400, '40.0%']);
    expect(rowByLabel(rows, 'Gateway & Payment Fees')).toEqual(['Gateway & Payment Fees', 20, '2.0%']);
    expect(rowByLabel(rows, 'NET PROFIT')).toEqual(['NET PROFIT', 380, '38.0%']);
    expect(rowByLabel(rows, 'Total Units Sold:')).toEqual(['Total Units Sold:', 40]);
  });

  it('defaults generatedAt to now when omitted', () => {
    const rows = buildProfitabilitySummaryRows(data(), 'Business');
    expect(typeof rows[4][1]).toBe('string');
    expect((rows[4][1] as string).length).toBeGreaterThan(0);
  });

  it('uses the pre-computed margin percentages for the profit rows', () => {
    const rows = buildProfitabilitySummaryRows(
      data({ metrics: metrics({ grossMarginPct: 61.25, netMarginPct: 12.05 }) }),
      'Business',
      generatedAt
    );
    expect(rowByLabel(rows, 'Gross Profit')?.[2]).toBe('61.3%');
    expect(rowByLabel(rows, 'NET PROFIT')?.[2]).toBe('12.1%');
  });
});

describe('buildProductMarginRows', () => {
  it('emits the header then one rounded row per product', () => {
    const rows = buildProductMarginRows(data({ products: [product({ sku: 'SKU-1' }), product({ productId: 'p2' })] }));

    expect(rows[0]).toHaveLength(11);
    expect(rows[0][0]).toBe('Product Name');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toEqual(['Widget', 'Tools', 'SKU-1', 40, 12.4, 20, 800, 496, 304, 38, 'HEALTHY']);
  });

  it('falls back to a dash for a missing SKU and rounds cost/price to 2dp, margin to 1dp', () => {
    const rows = buildProductMarginRows(
      data({ products: [product({ sku: null, averageCostPrice: 12.409, marginPct: 33.35 })] })
    );
    expect(rows[1][2]).toBe('-');
    expect(rows[1][4]).toBe(12.41);
    expect(rows[1][9]).toBe(33.4);
  });
});

describe('buildCategoryRows', () => {
  it('emits an 8-column header then a rounded row per category', () => {
    const rows = buildCategoryRows(data({ categories: [category({ profitSharePct: 54.96 })] }));
    expect(rows[0]).toHaveLength(8);
    expect(rows[0][0]).toBe('Category Name');
    expect(rows[1]).toEqual(['Tools', 3, 40, 800, 496, 304, 38, 55]);
  });
});

describe('buildChannelRows', () => {
  it('emits the channel header then a labelled row per channel', () => {
    const rows = buildChannelRows(data({ channels: [channel({ label: 'In-store', marginPct: 41.44 })] }));
    expect(rows[0]).toEqual(['Sales Channel', 'Orders Count', 'Total Revenue (GHS)', 'Gross Profit (GHS)', 'Margin %']);
    expect(rows[1]).toEqual(['In-store', 9, 600, 240, 41.4]);
  });
});

describe('buildProfitabilityCsv', () => {
  it('quotes and escapes free-text columns and keeps one line per product plus a header', () => {
    const csv = buildProfitabilityCsv(
      data({ products: [product({ name: 'Ann\'s "Big", Bag' }), product({ productId: 'p2', name: 'Plain' })] })
    );
    const lines = csv.split('\n');

    expect(lines).toHaveLength(3);
    expect(lines[0].startsWith('Product Name,Category,SKU,Units Sold')).toBe(true);
    // CSV wraps an absent SKU as an empty quoted field (the Excel sheet uses "-").
    expect(lines[1].startsWith('"Ann\'s ""Big"", Bag","Tools","",40,')).toBe(true);
    expect(lines[1].endsWith(',38.0%,healthy')).toBe(true);
  });

  it('returns just the header row when there are no products', () => {
    const csv = buildProfitabilityCsv(data({ products: [] }));
    expect(csv.split('\n')).toHaveLength(1);
  });
});
