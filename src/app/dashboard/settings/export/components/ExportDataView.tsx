'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DownloadCloud, Mail, Database, Loader2, FileSpreadsheet, Users, ShoppingBag } from 'lucide-react';
import { fetchExportDataset } from '@/app/actions/settings-data';
import { toast } from 'sonner';

function triggerCsvDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function triggerJsonDownload(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ExportDataView() {
  const [isPending, startTransition] = useTransition();
  const [exportingType, setExportingType] = useState<string | null>(null);

  const handleExport = (type: 'products' | 'orders' | 'customers' | 'backup') => {
    setExportingType(type);
    startTransition(async () => {
      try {
        const dateStr = new Date().toISOString().split('T')[0];

        if (type === 'products') {
          const res = await fetchExportDataset('products');
          if (res.error || !res.data) throw new Error(res.error || 'Failed to fetch products');

          const rows = [
            ['Product ID', 'Product Name', 'Category', 'Price (GHS)', 'Stock Level'],
            ...res.data.map((p: Record<string, unknown>) => {
              const cat = (p.categories as { name?: string })?.name || 'General';
              const variants =
                (p.product_variants as Array<{ price?: number; inventory?: Array<{ stock_level?: number }> }>) || [];
              const price = variants[0]?.price ?? 0;
              const stock = variants[0]?.inventory?.[0]?.stock_level ?? 0;
              return [p.id, p.name, cat, price, stock];
            }),
          ];
          const csvContent = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
          triggerCsvDownload(`merchander_products_${dateStr}.csv`, csvContent);
          toast.success(`Exported ${res.data.length} products to CSV`);
        } else if (type === 'orders') {
          const res = await fetchExportDataset('orders');
          if (res.error || !res.data) throw new Error(res.error || 'Failed to fetch orders');

          const rows = [
            ['Order ID', 'Customer Name', 'Phone', 'Total (GHS)', 'Status', 'Payment Method', 'Channel', 'Date'],
            ...res.data.map((o: Record<string, unknown>) => {
              const cust = o.customers as { name?: string; phone?: string } | null;
              return [
                o.id,
                cust?.name || 'Walk-in',
                cust?.phone || '',
                o.total_amount,
                o.status,
                o.payment_method,
                o.channel,
                o.created_at,
              ];
            }),
          ];
          const csvContent = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
          triggerCsvDownload(`merchander_orders_${dateStr}.csv`, csvContent);
          toast.success(`Exported ${res.data.length} orders to CSV`);
        } else if (type === 'customers') {
          const res = await fetchExportDataset('customers');
          if (res.error || !res.data) throw new Error(res.error || 'Failed to fetch customers');

          const rows = [
            ['Customer ID', 'Name', 'Phone', 'Email', 'Created At'],
            ...res.data.map((c: Record<string, unknown>) => [c.id, c.name, c.phone, c.email || '', c.created_at]),
          ];
          const csvContent = rows
            .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
          triggerCsvDownload(`merchander_customers_${dateStr}.csv`, csvContent);
          toast.success(`Exported ${res.data.length} customers to CSV`);
        } else if (type === 'backup') {
          const [productsRes, ordersRes, customersRes] = await Promise.all([
            fetchExportDataset('products'),
            fetchExportDataset('orders'),
            fetchExportDataset('customers'),
          ]);

          const backupData = {
            exportDate: new Date().toISOString(),
            platform: 'Merchander E-commerce',
            products: productsRes.data,
            orders: ordersRes.data,
            customers: customersRes.data,
          };
          triggerJsonDownload(`merchander_account_backup_${dateStr}.json`, backupData);
          toast.success('Full account JSON backup downloaded successfully');
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Export failed');
      } finally {
        setExportingType(null);
      }
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <DownloadCloud className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Manual Data Exports</CardTitle>
              <CardDescription>
                Instantly generate and download CSV reports or a full JSON account archive.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="w-full justify-start text-left p-4 h-auto cursor-pointer"
              disabled={isPending}
              onClick={() => handleExport('products')}
            >
              <FileSpreadsheet className="w-5 h-5 mr-3 text-emerald-500 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-foreground">Export All Products</p>
                <p className="text-[10px] text-muted">CSV with pricing, variants & stock</p>
              </div>
              {isPending && exportingType === 'products' && <Loader2 size={16} className="animate-spin ml-auto" />}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-left p-4 h-auto cursor-pointer"
              disabled={isPending}
              onClick={() => handleExport('orders')}
            >
              <ShoppingBag className="w-5 h-5 mr-3 text-blue-500 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-foreground">Export All Orders</p>
                <p className="text-[10px] text-muted">CSV with totals, status & channels</p>
              </div>
              {isPending && exportingType === 'orders' && <Loader2 size={16} className="animate-spin ml-auto" />}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-left p-4 h-auto cursor-pointer"
              disabled={isPending}
              onClick={() => handleExport('customers')}
            >
              <Users className="w-5 h-5 mr-3 text-orange-500 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-foreground">Export Customer List</p>
                <p className="text-[10px] text-muted">CSV with contacts & phone numbers</p>
              </div>
              {isPending && exportingType === 'customers' && <Loader2 size={16} className="animate-spin ml-auto" />}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-left p-4 h-auto cursor-pointer"
              disabled={isPending}
              onClick={() => handleExport('backup')}
            >
              <Database className="w-5 h-5 mr-3 text-purple-500 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-foreground">Full Account Backup</p>
                <p className="text-[10px] text-muted">Complete JSON snapshot archive</p>
              </div>
              {isPending && exportingType === 'backup' && <Loader2 size={16} className="animate-spin ml-auto" />}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Automated Weekly Backup Digest</CardTitle>
              <CardDescription>
                Receive an encrypted zip archive of your business database every Sunday.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            Automated email backups are compiled every Sunday at 00:00 GMT and delivered to your registered store owner
            email.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
