import { ProfitabilityData } from '@/types/profitability';

/**
 * Pure row builders for the profitability exporters. `profitabilityExport.ts`
 * pairs each of these with an I/O shell (XLSX.writeFile / Blob download /
 * window.open + print); keeping the row construction here makes it testable
 * under the `src/utils` unit-test scope.
 */

/** `value` as a share of gross revenue, one decimal place, e.g. `"42.0%"`. */
export function percentOfRevenue(value: number, grossRevenue: number): string {
  return `${((value / (grossRevenue || 1)) * 100).toFixed(1)}%`;
}

/** AOA for the Excel "Executive Summary" sheet. */
export function buildProfitabilitySummaryRows(
  data: ProfitabilityData,
  businessName: string,
  generatedAt: Date = new Date(),
  currency: string = 'GHS'
): (string | number)[][] {
  const { metrics } = data;
  return [
    ['FINANCIAL PROFITABILITY STATEMENT'],
    ['Business Name:', businessName],
    ['Period:', data.period.toUpperCase()],
    ['Date Range:', `${data.dateRange.from} to ${data.dateRange.to}`],
    ['Generated At:', generatedAt.toLocaleString()],
    [],
    ['KEY FINANCIAL METRICS', `AMOUNT (${currency})`, '% OF REVENUE'],
    ['Gross Revenue', metrics.grossRevenue, '100.0%'],
    ['Cost of Goods Sold (COGS)', metrics.cogs, percentOfRevenue(metrics.cogs, metrics.grossRevenue)],
    ['Gross Profit', metrics.grossProfit, `${metrics.grossMarginPct.toFixed(1)}%`],
    [
      'Operating Expenses (OPEX)',
      metrics.operatingExpenses,
      percentOfRevenue(metrics.operatingExpenses, metrics.grossRevenue),
    ],
    [
      'Inbound Freight & Customs',
      metrics.logisticsFreightCost,
      percentOfRevenue(metrics.logisticsFreightCost, metrics.grossRevenue),
    ],
    ['Gateway & Payment Fees', metrics.gatewayFees, percentOfRevenue(metrics.gatewayFees, metrics.grossRevenue)],
    ['Total Operating Outlays', metrics.totalExpenses, percentOfRevenue(metrics.totalExpenses, metrics.grossRevenue)],
    ['NET PROFIT', metrics.netProfit, `${metrics.netMarginPct.toFixed(1)}%`],
    [],
    ['Total Orders:', metrics.totalOrdersCount],
    ['Total Units Sold:', metrics.totalUnitsSold],
  ];
}

/** AOA for the Excel "Product Margins" sheet. */
export function buildProductMarginRows(data: ProfitabilityData): (string | number)[][] {
  return [
    [
      'Product Name',
      'Category',
      'SKU',
      'Units Sold',
      'Avg Cost (GHS)',
      'Avg Price (GHS)',
      'Total Revenue (GHS)',
      'Total COGS (GHS)',
      'Gross Profit (GHS)',
      'Margin %',
      'Health Status',
    ],
    ...data.products.map((p) => [
      p.name,
      p.categoryName,
      p.sku || '-',
      p.unitsSold,
      Number(p.averageCostPrice.toFixed(2)),
      Number(p.averageSellingPrice.toFixed(2)),
      Number(p.totalRevenue.toFixed(2)),
      Number(p.totalCogs.toFixed(2)),
      Number(p.grossProfit.toFixed(2)),
      Number(p.marginPct.toFixed(1)),
      p.healthStatus.toUpperCase(),
    ]),
  ];
}

/** AOA for the Excel "Categories" sheet. */
export function buildCategoryRows(data: ProfitabilityData): (string | number)[][] {
  return [
    [
      'Category Name',
      'Products Count',
      'Units Sold',
      'Total Revenue (GHS)',
      'Total COGS (GHS)',
      'Gross Profit (GHS)',
      'Margin %',
      'Profit Share %',
    ],
    ...data.categories.map((c) => [
      c.categoryName,
      c.productCount,
      c.unitsSold,
      Number(c.totalRevenue.toFixed(2)),
      Number(c.totalCogs.toFixed(2)),
      Number(c.grossProfit.toFixed(2)),
      Number(c.marginPct.toFixed(1)),
      Number(c.profitSharePct.toFixed(1)),
    ]),
  ];
}

/** AOA for the Excel "Sales Channels" sheet. */
export function buildChannelRows(data: ProfitabilityData): (string | number)[][] {
  return [
    ['Sales Channel', 'Orders Count', 'Total Revenue (GHS)', 'Gross Profit (GHS)', 'Margin %'],
    ...data.channels.map((ch) => [
      ch.label,
      ch.orderCount,
      Number(ch.totalRevenue.toFixed(2)),
      Number(ch.grossProfit.toFixed(2)),
      Number(ch.marginPct.toFixed(1)),
    ]),
  ];
}

/** The full CSV document for the product-profitability export. */
export function buildProfitabilityCsv(data: ProfitabilityData): string {
  const rows: (string | number)[][] = [
    [
      'Product Name',
      'Category',
      'SKU',
      'Units Sold',
      'Avg Cost (GHS)',
      'Avg Price (GHS)',
      'Total Revenue (GHS)',
      'Total COGS (GHS)',
      'Gross Profit (GHS)',
      'Margin %',
      'Status',
    ],
    ...data.products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.categoryName.replace(/"/g, '""')}"`,
      `"${(p.sku || '').replace(/"/g, '""')}"`,
      p.unitsSold,
      p.averageCostPrice.toFixed(2),
      p.averageSellingPrice.toFixed(2),
      p.totalRevenue.toFixed(2),
      p.totalCogs.toFixed(2),
      p.grossProfit.toFixed(2),
      `${p.marginPct.toFixed(1)}%`,
      p.healthStatus,
    ]),
  ];

  return rows.map((e) => e.join(',')).join('\n');
}
