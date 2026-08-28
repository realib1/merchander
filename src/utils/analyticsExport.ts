import * as XLSX from 'xlsx';
import { AnalyticsData } from '@/types/analytics';
import { formatCurrency } from './format';

export function exportAnalyticsToExcel(data: AnalyticsData, businessName: string = 'Business'): void {
  const wb = XLSX.utils.book_new();

  // 1. Executive Summary Sheet
  const summaryRows = [
    ['COMMERCE & GMV ANALYTICS REPORT'],
    ['Business Name:', businessName],
    ['Period:', data.periodLabel],
    ['Generated At:', new Date().toLocaleString()],
    [],
    ['KEY PERFORMANCE METRICS', 'VALUE'],
    ['Gross Merchandise Value (GMV)', formatCurrency(data.metrics.gmv, 'GHS')],
    ['Total Completed Orders', data.metrics.ordersCount],
    ['Average Order Value (AOV)', formatCurrency(data.metrics.aov, 'GHS')],
    ['Fulfillment / Delivery Rate', `${data.metrics.fulfillmentRatePct.toFixed(1)}%`],
    ['Customer Repeat Purchase Rate', `${data.metrics.repeatCustomerRatePct.toFixed(1)}%`],
    ['Total Unique Buyers', data.customerCohorts.totalUniqueBuyers],
    ['New Buyers Revenue', formatCurrency(data.customerCohorts.newBuyersRevenue, 'GHS')],
    ['Returning Buyers Revenue', formatCurrency(data.customerCohorts.returningBuyersRevenue, 'GHS')],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // 2. Sales Timeline Sheet
  const timelineRows = [
    ['Date / Time', 'GMV Revenue (GHS)', 'Orders Count', 'Average Order Value (GHS)'],
    ...data.timeline.map((t) => [t.label, Number(t.gmv.toFixed(2)), t.ordersCount, Number(t.aov.toFixed(2))]),
  ];
  const wsTimeline = XLSX.utils.aoa_to_sheet(timelineRows);
  XLSX.utils.book_append_sheet(wb, wsTimeline, 'Sales Timeline');

  // 3. Top Products Sheet
  const productRows = [
    ['Product Name', 'Category', 'SKU', 'Units Sold', 'Total Revenue (GHS)', 'Avg Price (GHS)'],
    ...data.topProducts.map((p) => [
      p.name,
      p.categoryName,
      p.sku || '-',
      p.unitsSold,
      Number(p.revenue.toFixed(2)),
      Number(p.avgPrice.toFixed(2)),
    ]),
  ];
  const wsProducts = XLSX.utils.aoa_to_sheet(productRows);
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Top Products');

  // 4. Sales Channels Sheet
  const channelRows = [
    ['Sales Channel', 'GMV Revenue (GHS)', 'Orders Count', 'Channel Share %'],
    ...data.channels.map((c) => [c.label, Number(c.gmv.toFixed(2)), c.ordersCount, Number(c.sharePct.toFixed(1))]),
  ];
  const wsChannels = XLSX.utils.aoa_to_sheet(channelRows);
  XLSX.utils.book_append_sheet(wb, wsChannels, 'Sales Channels');

  // 5. Payment Methods Sheet
  const paymentRows = [
    ['Payment Method', 'Volume (GHS)', 'Transaction Count', 'Volume Share %'],
    ...data.paymentMethods.map((p) => [p.label, Number(p.volume.toFixed(2)), p.count, Number(p.sharePct.toFixed(1))]),
  ];
  const wsPayments = XLSX.utils.aoa_to_sheet(paymentRows);
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Payment Methods');

  // 6. VIP Spenders Sheet
  const vipRows = [
    ['Customer Name', 'Phone Number', 'Completed Orders', 'Total Spent (GHS)', 'Last Order Date'],
    ...data.customerCohorts.topVipCustomers.map((c) => [
      c.name,
      c.phone,
      c.ordersCount,
      Number(c.totalSpent.toFixed(2)),
      c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-GB') : '-',
    ]),
  ];
  const wsVip = XLSX.utils.aoa_to_sheet(vipRows);
  XLSX.utils.book_append_sheet(wb, wsVip, 'Top VIP Customers');

  const fileName = `Merchander_Analytics_${data.period}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportAnalyticsToCsv(data: AnalyticsData): void {
  const rows = [
    ['Date', 'GMV Revenue (GHS)', 'Orders Count', 'Average Order Value (GHS)'],
    ...data.timeline.map((t) => [t.label, t.gmv.toFixed(2), t.ordersCount, t.aov.toFixed(2)]),
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Merchander_Analytics_${data.period}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAnalyticsToPdf(data: AnalyticsData, businessName: string = 'Business'): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Analytics Report - ${businessName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #1e293b; }
          h1 { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
          .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
          .card-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
          .card-val { font-size: 20px; font-weight: bold; margin-top: 6px; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th { text-align: left; background: #f1f5f9; padding: 8px 12px; border-bottom: 1px solid #cbd5e1; font-weight: 600; }
          td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
          .section-title { font-size: 14px; font-weight: bold; margin-top: 24px; margin-bottom: 8px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>${businessName} — Business Analytics</h1>
            <p style="color: #64748b; font-size: 12px; margin: 2px 0 0 0;">Period: ${data.periodLabel}</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            <p style="margin: 0;">Generated: ${new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        <div class="metrics">
          <div class="card">
            <div class="card-title">Gross Sales (GMV)</div>
            <div class="card-val">${formatCurrency(data.metrics.gmv, 'GHS')}</div>
          </div>
          <div class="card">
            <div class="card-title">Completed Orders</div>
            <div class="card-val">${data.metrics.ordersCount.toLocaleString()}</div>
          </div>
          <div class="card">
            <div class="card-title">Average Order Value</div>
            <div class="card-val">${formatCurrency(data.metrics.aov, 'GHS')}</div>
          </div>
          <div class="card">
            <div class="card-title">Customer Repeat Rate</div>
            <div class="card-val">${data.metrics.repeatCustomerRatePct.toFixed(1)}%</div>
          </div>
        </div>

        <div class="section-title">Top 10 Best Selling Products</div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Units Sold</th>
              <th>Revenue (GHS)</th>
            </tr>
          </thead>
          <tbody>
            ${data.topProducts
              .map(
                (p) => `
              <tr>
                <td><strong>${p.name}</strong></td>
                <td>${p.categoryName}</td>
                <td>${p.unitsSold}</td>
                <td>${formatCurrency(p.revenue, 'GHS')}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="section-title" style="margin-top: 32px;">Top VIP Customers</div>
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Total Spend (GHS)</th>
            </tr>
          </thead>
          <tbody>
            ${data.customerCohorts.topVipCustomers
              .slice(0, 5)
              .map(
                (c) => `
              <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.phone}</td>
                <td>${c.ordersCount}</td>
                <td>${formatCurrency(c.totalSpent, 'GHS')}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 300);
}
