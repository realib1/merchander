'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { Search, Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Payment } from '@/types/payments';
import { exportToCSV, exportToExcel } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { RecordPaymentModal } from './RecordPaymentModal';
import { ReconcileMoMoModal } from './ReconcileMoMoModal';

interface OrderOption {
  id: string;
  total_amount: number;
  customer_name: string;
  customer_phone: string;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
}

interface PaymentsToolbarProps {
  payments: Payment[];
  orders: OrderOption[];
  customers: CustomerOption[];
}

export function PaymentsToolbar({ payments, orders, customers }: PaymentsToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get('q') || '';
  const currentPeriod = searchParams.get('period') || 'this_month';
  const currentProvider = searchParams.get('provider') || 'all';
  const currentStatus = searchParams.get('status') || 'all';

  const [search, setSearch] = useState(currentSearch);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close export dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeQ = searchParams.get('q') || '';
      if (activeQ !== search && (search !== '' || activeQ !== '')) {
        const params = new URLSearchParams(searchParams.toString());
        if (search) {
          params.set('q', search);
        } else {
          params.delete('q');
        }
        startTransition(() => {
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [search, searchParams, pathname, router]);

  // Export handlers
  const prepareExportData = () => {
    return payments.map((p) => ({
      'Transaction Ref': p.transaction_ref || 'N/A',
      'Payment Date': p.payment_date ? p.payment_date.split('T')[0] : '',
      'Payment Method': p.provider,
      'Gross Amount (GHS)': Number(p.amount) || 0,
      'Gateway Fee (GHS)': Number(p.fee) || 0,
      'Net Inflow (GHS)': Number(p.net_amount) || 0,
      Status: p.status,
      Customer: p.customer?.name || p.order?.customer?.name || p.sender_name || 'Direct',
      'Contact Phone': p.customer?.phone || p.order?.customer?.phone || p.sender_phone || '',
      'Linked Order ID': p.order_id ? `#ORD-${p.order_id.slice(0, 8)}` : 'Direct',
      Notes: p.notes || '',
    }));
  };

  const handleExportCSV = () => {
    const data = prepareExportData();
    if (data.length === 0) {
      toast.info('No transactions to export in the current filter view.');
      return;
    }
    exportToCSV(data, `merchander-payments-${currentPeriod}`);
    setIsExportOpen(false);
    toast.success('Payments exported to CSV');
  };

  const handleExportExcel = () => {
    const data = prepareExportData();
    if (data.length === 0) {
      toast.info('No transactions to export in the current filter view.');
      return;
    }
    exportToExcel(data, `merchander-payments-${currentPeriod}`, 'Payments');
    setIsExportOpen(false);
    toast.success('Payments exported to Excel (.xlsx)');
  };

  return (
    <div className="p-4 border-b border-separator flex flex-col gap-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            type="text"
            placeholder="Search by ref, phone, sender, customer, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-separator bg-surface placeholder:text-muted focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Reconcile MoMo Modal Trigger */}
          <ReconcileMoMoModal orders={orders} />

          {/* Record Payment Trigger */}
          <RecordPaymentModal orders={orders} customers={customers} />

          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <Button
              variant="outline"
              onClick={() => setIsExportOpen(!isExportOpen)}
              rightIcon={<ChevronDown size={14} />}
              className="h-10 px-3.5 text-sm font-semibold rounded-xl"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export</span>
            </Button>

            {isExportOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-surface-elevated border border-separator rounded-xl shadow-lg z-50 py-1 animate-fadeIn">
                <button
                  onClick={handleExportExcel}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-left flex items-center gap-2 hover:bg-surface text-foreground transition-colors cursor-pointer"
                >
                  <FileSpreadsheet size={15} className="text-emerald-500" />
                  Export to Excel (.xlsx)
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-left flex items-center gap-2 hover:bg-surface text-foreground transition-colors cursor-pointer"
                >
                  <FileText size={15} className="text-brand-primary" />
                  Export to CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Row: Method, Status, Period */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 transition-opacity ${isPending ? 'opacity-60' : 'opacity-100'}`}
      >
        {/* Method Selector */}
        <select
          value={currentProvider}
          onChange={(e) => updateParam('provider', e.target.value)}
          className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-separator bg-surface text-foreground focus:ring-2 focus:ring-brand-primary/50 outline-none cursor-pointer"
        >
          <option value="all">All Methods</option>
          <option value="mtn_momo">MTN Mobile Money</option>
          <option value="telecel_cash">Telecel Cash</option>
          <option value="at_money">AT Money</option>
          <option value="cash_on_delivery">Cash on Delivery (COD)</option>
          <option value="cash">In-Store Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="card">Card / POS</option>
        </select>

        {/* Status Selector */}
        <select
          value={currentStatus}
          onChange={(e) => updateParam('status', e.target.value)}
          className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-separator bg-surface text-foreground focus:ring-2 focus:ring-brand-primary/50 outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed / Verified</option>
          <option value="pending">Pending Verification</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        {/* Time Period Selector */}
        <select
          value={currentPeriod}
          onChange={(e) => updateParam('period', e.target.value)}
          className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-separator bg-surface text-foreground focus:ring-2 focus:ring-brand-primary/50 outline-none cursor-pointer"
        >
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_quarter">This Quarter</option>
          <option value="this_year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>
    </div>
  );
}
