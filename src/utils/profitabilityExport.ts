import * as XLSX from 'xlsx';
import { ProfitabilityData } from '@/types/profitability';
import { formatCurrency } from './format';

export function exportProfitabilityToExcel(data: ProfitabilityData, businessName: string = 'Business'): void {
  const wb = XLSX.utils.book_new();

  // 1. Executive Summary Sheet
  const summaryRows = [
    ['FINANCIAL PROFITABILITY STATEMENT'],
    ['Business Name:', businessName],
    ['Period:', data.period.toUpperCase()],
    ['Date Range:', `${data.dateRange.from} to ${data.dateRange.to}`],
    ['Generated At:', new Date().toLocaleString()],
    [],
    ['KEY FINANCIAL METRICS', 'AMOUNT (GHS)', '% OF REVENUE'],
    ['Gross Revenue', data.metrics.grossRevenue, '100.0%'],
    [
      'Cost of Goods Sold (COGS)',
      data.metrics.cogs,
      `${((data.metrics.cogs / (data.metrics.grossRevenue || 1)) * 100).toFixed(1)}%`,
    ],
    ['Gross Profit', data.metrics.grossProfit, `${data.metrics.grossMarginPct.toFixed(1)}%`],
    [
      'Operating Expenses (OPEX)',
      data.metrics.operatingExpenses,
      `${((data.metrics.operatingExpenses / (data.metrics.grossRevenue || 1)) * 100).toFixed(1)}%`,
    ],
    [
      'Inbound Freight & Customs',
      data.metrics.logisticsFreightCost,
      `${((data.metrics.logisticsFreightCost / (data.metrics.grossRevenue || 1)) * 100).toFixed(1)}%`,
    ],
    [
      'Gateway & Payment Fees',
      data.metrics.gatewayFees,
      `${((data.metrics.gatewayFees / (data.metrics.grossRevenue || 1)) * 100).toFixed(1)}%`,
    ],
    [
      'Total Operating Outlays',
      data.metrics.totalExpenses,
      `${((data.metrics.totalExpenses / (data.metrics.grossRevenue || 1)) * 100).toFixed(1)}%`,
    ],
    ['NET PROFIT', data.metrics.netProfit, `${data.metrics.netMarginPct.toFixed(1)}%`],
    [],
    ['Total Orders:', data.metrics.totalOrdersCount],
    ['Total Units Sold:', data.metrics.totalUnitsSold],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // 2. Product Unit Margins Sheet
  const productRows = [
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
  const wsProducts = XLSX.utils.aoa_to_sheet(productRows);
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Product Margins');

  // 3. Category Profitability Sheet
  const categoryRows = [
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
  const wsCategories = XLSX.utils.aoa_to_sheet(categoryRows);
  XLSX.utils.book_append_sheet(wb, wsCategories, 'Categories');

  // 4. Channels Sheet
  const channelRows = [
    ['Sales Channel', 'Orders Count', 'Total Revenue (GHS)', 'Gross Profit (GHS)', 'Margin %'],
    ...data.channels.map((ch) => [
      ch.label,
      ch.orderCount,
      Number(ch.totalRevenue.toFixed(2)),
      Number(ch.grossProfit.toFixed(2)),
      Number(ch.marginPct.toFixed(1)),
    ]),
  ];
  const wsChannels = XLSX.utils.aoa_to_sheet(channelRows);
  XLSX.utils.book_append_sheet(wb, wsChannels, 'Sales Channels');

  const fileName = `Profitability_Report_${data.period}_${data.dateRange.from}_to_${data.dateRange.to}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportProfitabilityToCSV(data: ProfitabilityData): void {
  const rows = [
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

  const csvContent = rows.map((e) => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Product_Profitability_${data.period}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportProfitabilityToPDF(data: ProfitabilityData, businessName: string = 'Business'): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export the PDF financial statement.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Profitability Statement - ${businessName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #0f172a; line-height: 1.5; font-size: 12px; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 20px; font-weight: 700; margin: 0; }
          .subtitle { color: #64748b; font-size: 11px; margin-top: 4px; }
          .section-title { font-size: 14px; font-weight: 700; margin: 24px 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          th { text-align: left; background: #f8fafc; padding: 8px; font-weight: 600; border-bottom: 1px solid #cbd5e1; font-size: 10px; text-transform: uppercase; color: #475569; }
          td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .highlight { background: #f8fafc; font-weight: 700; }
          .net-profit-row { background: #f0fdf4; color: #166534; font-weight: 700; font-size: 12px; }
          .negative { color: #dc2626; }
          @media print {
            body { padding: 0; }
            @page { margin: 15mm; size: A4; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${businessName}</h1>
            <div class="subtitle">Profitability & Financial Unit Economics Statement</div>
          </div>
          <div class="text-right">
            <div><strong>Period:</strong> ${data.period.toUpperCase()} (${data.dateRange.from} to ${data.dateRange.to})</div>
            <div class="subtitle">Generated: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div class="section-title">1. Executive Summary & Income Statement</div>
        <table>
          <thead>
            <tr><th>Metric</th><th class="text-right">Amount (GHS)</th><th class="text-right">% of Revenue</th></tr>
          </thead>
          <tbody>
            <tr class="highlight"><td>Gross Revenue</td><td class="text-right">${formatCurrency(data.metrics.grossRevenue, 'GHS')}</td><td class="text-right">100.0%</td></tr>
            <tr><td>Cost of Goods Sold (COGS)</td><td class="text-right">${formatCurrency(data.metrics.cogs, 'GHS')}</td><td class="text-right">${((data.metrics.cogs / (data.metrics.grossRevenue || 1)) * 100).toFixed(1)}%</td></tr>
            <tr class="font-bold"><td>Gross Profit</td><td class="text-right">${formatCurrency(data.metrics.grossProfit, 'GHS')}</td><td class="text-right">${data.metrics.grossMarginPct.toFixed(1)}%</td></tr>
            <tr><td>Operating Expenses (OPEX)</td><td class="text-right">${formatCurrency(data.metrics.operatingExpenses, 'GHS')}</td><td class="text-right">${((data.metrics.operatingExpenses / (data.metrics.grossRevenue || 1)) * 100).toFixed(1)}%</td></tr>
            <tr><td>Inbound Freight & Customs Duties</td><td class="text-right">${formatCurrency(data.metrics.logisticsFreightCost, 'GHS')}</td><td class="text-right">${((data.metrics.logisticsFreightCost / (data.metrics.grossRevenue || 1)) * 100).toFixed(1)}%</td></tr>
            <tr><td>Gateway & Payment Processing Fees</td><td class="text-right">${formatCurrency(data.metrics.gatewayFees, 'GHS')}</td><td class="text-right">${((data.metrics.gatewayFees / (data.metrics.grossRevenue || 1)) * 100).toFixed(1)}%</td></tr>
            <tr class="net-profit-row"><td>NET PROFIT</td><td class="text-right">${formatCurrency(data.metrics.netProfit, 'GHS')}</td><td class="text-right">${data.metrics.netMarginPct.toFixed(1)}%</td></tr>
          </tbody>
        </table>

        <div class="section-title">2. Top Product Margins</div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th class="text-right">Units Sold</th>
              <th class="text-right">Revenue</th>
              <th class="text-right">COGS</th>
              <th class="text-right">Gross Profit</th>
              <th class="text-right">Margin %</th>
            </tr>
          </thead>
          <tbody>
            ${data.products
              .slice(0, 15)
              .map(
                (p) => `
              <tr>
                <td class="font-bold">${p.name}</td>
                <td>${p.categoryName}</td>
                <td class="text-right">${p.unitsSold}</td>
                <td class="text-right">${formatCurrency(p.totalRevenue, 'GHS')}</td>
                <td class="text-right">${formatCurrency(p.totalCogs, 'GHS')}</td>
                <td class="text-right ${p.grossProfit < 0 ? 'negative' : ''}">${formatCurrency(p.grossProfit, 'GHS')}</td>
                <td class="text-right font-bold ${p.marginPct < 0 ? 'negative' : ''}">${p.marginPct.toFixed(1)}%</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
