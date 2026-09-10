'use client';
 
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Receipt, Download, FileText, CheckCircle2, Printer, Eye } from 'lucide-react';
import { BillingInvoice } from '@/types/settings';
import { formatCurrency, formatDate } from '@/utils/format';
import { toast } from 'sonner';

interface BillingInvoicesTableProps {
  invoices: BillingInvoice[];
}

export function BillingInvoicesTable({ invoices }: BillingInvoicesTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(null);

  const handleOpenReceipt = (inv: BillingInvoice) => {
    setSelectedInvoice(inv);
  };

  const handlePrintReceipt = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadInvoice = (inv: BillingInvoice) => {
    const isZero = inv.amount === 0;
    const amountFormatted = isZero ? 'GH₵ 0.00' : formatCurrency(inv.amount, 'GHS');
    const dateFormatted = formatDate(inv.date, { month: 'short', day: 'numeric', year: 'numeric' });

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${inv.invoiceNumber} - Merchander</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 40px; color: #0f172a; background: #fff; }
    .invoice-card { max-width: 650px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
    .brand { font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px; }
    .brand span { color: #059669; }
    .meta { font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.5; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; font-size: 13px; }
    .grid-card { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 12px; }
    .grid-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px; }
    .grid-val { font-weight: 700; color: #0f172a; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    th { background: #f8fafc; text-align: left; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; color: #475569; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #64748b; }
    .total-row.final { border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 10px; font-size: 16px; font-weight: 800; color: #0f172a; }
    .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #94a3b8; font-style: italic; }
    .print-bar { text-align: right; max-width: 650px; margin: 0 auto 16px; }
    .print-btn { background: #059669; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
    @media print { .print-bar { display: none; } body { padding: 0; } .invoice-card { border: none; box-shadow: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="print-bar">
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand">MERCHANDER <span>COMMERCE</span></div>
        <div class="meta">
          Accra, Ghana • VAT / TIN: GH-7749102-M<br />
          Email: billing@merchander.com
        </div>
      </div>
      <div style="text-align: right;">
        <span class="badge">● ${isZero ? 'ACTIVE TRIAL / FREE' : 'PAID / VERIFIED'}</span>
        <div class="meta" style="font-family: monospace; font-weight: 700; margin-top: 6px;">${inv.invoiceNumber}</div>
        <div class="meta">${dateFormatted}</div>
      </div>
    </div>
    <div class="grid">
      <div class="grid-card">
        <div class="grid-label">Billed To</div>
        <div class="grid-val">Merchant Workspace Account</div>
      </div>
      <div class="grid-card">
        <div class="grid-label">Payment Method</div>
        <div class="grid-val">${isZero ? '14-Day Free Trial Voucher / Free Tier' : 'Tokenized Auto-Debit (MoMo / Card)'}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${inv.planName}</strong><br /><span style="color: #64748b; font-size: 11px;">SaaS Cloud Commerce Operating System</span></td>
          <td style="text-align: right; font-family: monospace; font-weight: 700;">${amountFormatted}</td>
        </tr>
      </tbody>
    </table>
    <div style="margin-left: auto; max-width: 250px;">
      <div class="total-row">
        <span>Subtotal:</span>
        <span style="font-family: monospace;">${amountFormatted}</span>
      </div>
      <div class="total-row">
        <span>VAT / NHIL (0% Exempt):</span>
        <span style="font-family: monospace;">GH₵ 0.00</span>
      </div>
      <div class="total-row final">
        <span>Total Paid:</span>
        <span style="font-family: monospace; color: #059669;">${amountFormatted}</span>
      </div>
    </div>
    <div class="footer">
      Thank you for partnering with Merchander. This electronic document serves as proof of subscription payment.
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Merchander-Invoice-${inv.invoiceNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Invoice ${inv.invoiceNumber} downloaded`);
  };

  return (
    <Card className="shadow-xs border border-separator bg-surface">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary shrink-0">
            <Receipt className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display text-foreground">
              Billing History & Invoices
            </CardTitle>
            <CardDescription className="text-xs text-muted">
              Subscription activation records, monthly payments, and tax receipts.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-0">
        {invoices.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <FileText className="mx-auto h-8 w-8 text-muted/50" />
            <p className="text-xs font-semibold text-foreground">No invoices generated yet</p>
            <p className="text-[11px] text-muted max-w-sm mx-auto">
              Receipts and invoices will automatically appear here once your account is created or when your plan renews.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 768px) */}
            <div className="block md:hidden divide-y divide-separator">
              {invoices.map((inv) => {
                const isZeroAmount = inv.amount === 0;
                return (
                  <div key={inv.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs text-foreground tracking-wide">
                        {inv.invoiceNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          isZeroAmount
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        <CheckCircle2 size={10} />
                        <span>{isZeroAmount ? 'Active Trial' : 'Paid'}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="font-medium text-foreground">{inv.planName}</span>
                      <span className="font-mono font-bold text-foreground">
                        {isZeroAmount ? 'GH₵ 0.00 (Free)' : formatCurrency(inv.amount, 'GHS')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-separator/50 text-[11px] text-muted">
                      <span>{formatDate(inv.date, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleOpenReceipt(inv)}
                          className="flex items-center gap-1 text-brand-primary font-semibold hover:underline cursor-pointer"
                          title="View receipt modal"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(inv)}
                          className="flex items-center gap-1 text-muted hover:text-foreground font-semibold hover:underline cursor-pointer"
                          title="Download invoice file (.html / .pdf)"
                        >
                          <Download size={12} />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-y border-separator bg-surface-elevated/40 text-muted font-semibold">
                    <th className="py-3 px-4">Invoice / Record #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Plan / Description</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator">
                  {invoices.map((inv) => {
                    const isZeroAmount = inv.amount === 0;
                    return (
                      <tr key={inv.id} className="hover:bg-surface-elevated/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-foreground">{inv.invoiceNumber}</td>
                        <td className="py-3.5 px-4 text-muted font-medium">
                          {formatDate(inv.date, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-foreground">{inv.planName}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                          {isZeroAmount ? 'GH₵ 0.00' : formatCurrency(inv.amount, 'GHS')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isZeroAmount
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            <CheckCircle2 size={11} />
                            <span>{isZeroAmount ? 'Active Trial' : 'Paid'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenReceipt(inv)}
                              className="p-1.5 text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors cursor-pointer"
                              title="View Receipt"
                              aria-label="View Receipt"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleDownloadInvoice(inv)}
                              className="p-1.5 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
                              title="Download Invoice File (.html / .pdf)"
                              aria-label="Download Invoice File"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardBody>

      {/* Printable Receipt Preview Modal */}
      <Modal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        title="Official Subscription Receipt"
        description="Official payment receipt & tax statement for your Merchander workspace."
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedInvoice(null)}
            >
              Close
            </Button>
            <div className="flex items-center gap-2">
              {selectedInvoice && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadInvoice(selectedInvoice)}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download HTML</span>
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrintReceipt}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} />
                <span>Print / Save as PDF</span>
              </Button>
            </div>
          </div>
        }
      >
        {selectedInvoice && (
          <div className="p-4 sm:p-5 bg-surface-elevated/40 border border-separator rounded-xl space-y-4 text-foreground">
            {/* Receipt Header */}
            <div className="flex items-start justify-between border-b border-separator pb-4">
              <div>
                <h4 className="text-xs font-bold font-display uppercase tracking-wider text-brand-primary">
                  Merchander Cloud Commerce
                </h4>
                <p className="text-[11px] text-muted mt-0.5">
                  Accra, Ghana • VAT / TIN: GH-7749102-M
                </p>
                <p className="text-[11px] text-muted">billing@merchander.com</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedInvoice.amount === 0
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <CheckCircle2 size={11} />
                  <span>{selectedInvoice.amount === 0 ? 'Active Trial' : 'Paid'}</span>
                </span>
                <p className="text-[11px] font-mono text-muted mt-1">
                  {formatDate(selectedInvoice.date, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-surface border border-separator/60">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Receipt Number</span>
                <span className="font-mono font-bold text-foreground text-xs">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-separator/60">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">Payment Method</span>
                <span className="font-semibold text-foreground text-xs">
                  {selectedInvoice.amount === 0 ? 'Free Trial Voucher' : 'MoMo / Card Auto-Debit'}
                </span>
              </div>
            </div>

            {/* Line Item Breakdown */}
            <div className="border border-separator rounded-lg overflow-hidden bg-surface">
              <div className="bg-surface-elevated/60 px-3.5 py-2 border-b border-separator flex justify-between text-[11px] font-bold text-muted">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="px-3.5 py-3 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-foreground">{selectedInvoice.planName}</p>
                  <p className="text-[11px] text-muted">SaaS Commerce Operating System</p>
                </div>
                <span className="font-mono font-bold text-foreground">
                  {selectedInvoice.amount === 0 ? 'GH₵ 0.00' : formatCurrency(selectedInvoice.amount, 'GHS')}
                </span>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="space-y-1.5 pt-2 border-t border-separator text-xs">
              <div className="flex justify-between text-muted text-xs">
                <span>Subtotal</span>
                <span className="font-mono">{selectedInvoice.amount === 0 ? 'GH₵ 0.00' : formatCurrency(selectedInvoice.amount, 'GHS')}</span>
              </div>
              <div className="flex justify-between text-muted text-xs">
                <span>VAT / Levies (0% Exempt / Inclusive)</span>
                <span className="font-mono">GH₵ 0.00</span>
              </div>
              <div className="flex justify-between text-foreground font-bold text-sm pt-1.5 border-t border-separator/60">
                <span>Total Amount Paid</span>
                <span className="font-mono text-brand-primary">
                  {selectedInvoice.amount === 0 ? 'GH₵ 0.00' : formatCurrency(selectedInvoice.amount, 'GHS')}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-muted text-center italic">
              Thank you for partnering with Merchander. This electronic receipt serves as official proof of subscription payment.
            </p>
          </div>
        )}
      </Modal>
    </Card>
  );
}
