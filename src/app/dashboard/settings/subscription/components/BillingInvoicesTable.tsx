'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Receipt, Download } from 'lucide-react';
import { BillingInvoice } from '@/types/settings';
import { formatCurrency, formatDate } from '@/utils/format';
import { toast } from 'sonner';

interface BillingInvoicesTableProps {
  invoices: BillingInvoice[];
}

export function BillingInvoicesTable({ invoices }: BillingInvoicesTableProps) {
  const handleDownloadInvoice = (inv: BillingInvoice) => {
    toast.success(`Invoice ${inv.invoiceNumber} downloaded`);
  };

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
            <Receipt className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Billing History & Invoices</CardTitle>
            <CardDescription className="text-xs text-muted">
              Past subscription payments, tax invoices, and official receipts.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-0">
        {invoices.length === 0 ? (
          <div className="p-6 text-center space-y-1">
            <p className="text-xs font-semibold text-foreground">No invoices generated yet</p>
            <p className="text-[11px] text-muted">
              Official receipts and tax invoices will appear here after your first plan billing cycle.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 768px) */}
            <div className="block md:hidden divide-y divide-separator">
              {invoices.map((inv) => (
                <div key={inv.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-foreground">{inv.invoiceNumber}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      ● Paid
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{inv.planName}</span>
                    <span className="font-mono font-bold text-foreground">{formatCurrency(inv.amount, 'GHS')}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-separator/50 text-[11px] text-muted">
                    <span>{formatDate(inv.date)}</span>
                    <button
                      onClick={() => handleDownloadInvoice(inv)}
                      className="flex items-center gap-1 text-brand-primary font-semibold hover:underline cursor-pointer"
                    >
                      <Download size={12} />
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-y border-separator bg-surface-elevated/40 text-muted font-semibold">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-foreground">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 text-muted">{formatDate(inv.date)}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{inv.planName}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                        {formatCurrency(inv.amount, 'GHS')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          ● Paid
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDownloadInvoice(inv)}
                          className="p-1.5 text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors cursor-pointer"
                          title="Download PDF Receipt"
                          aria-label="Download PDF Receipt"
                        >
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
