'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExpenseFormModal } from './ExpenseFormModal';
import { EXPENSE_CATEGORIES } from '../constants';
import { exportToCSV, exportToExcel } from '@/lib/exportUtils';
import { toast } from 'sonner';
import type { Expense } from '@/types/expenses';

interface ExpensesToolbarProps {
  expenses?: Expense[];
}

export function ExpensesToolbar({ expenses = [] }: ExpensesToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('q') || '';
  const currentCategory = searchParams.get('category') || 'all';
  const currentPeriod = searchParams.get('period') || 'all';

  const [search, setSearch] = useState(currentSearch);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) params.set('q', search);
      else params.delete('q');

      if (searchParams.get('q') !== search && (search !== '' || searchParams.has('q'))) {
        router.push(`?${params.toString()}`);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [search, router, searchParams]);

  const prepareExportData = () => {
    return expenses.map((exp) => ({
      'Expense ID': `#${exp.short_id || exp.id.slice(0, 8)}`,
      Date: exp.expense_date,
      Category: exp.category,
      'Payment Method': exp.payment_method || 'Cash',
      Description: exp.description || 'N/A',
      Currency: exp.currency || 'GHS',
      'Amount (GHS)': Number(exp.amount),
      'Receipt / Ref': exp.receipt_url || 'N/A',
    }));
  };

  const handleExportCSV = () => {
    if (!expenses.length) {
      toast.error('No expense records to export.');
      return;
    }
    const data = prepareExportData();
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCSV(data, `merchander_expenses_${dateStr}`);
    toast.success('Expenses exported to CSV successfully!');
    setIsExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    if (!expenses.length) {
      toast.error('No expense records to export.');
      return;
    }
    const data = prepareExportData();
    const dateStr = new Date().toISOString().split('T')[0];
    exportToExcel(data, `merchander_expenses_${dateStr}`, 'Expenses');
    toast.success('Expenses exported to Excel (.xlsx) successfully!');
    setIsExportMenuOpen(false);
  };

  return (
    <>
      <div className="p-4 border-b border-separator flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-surface-elevated/20">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type="text"
              placeholder="Search expenses by description..."
              aria-label="Search expenses"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-separator rounded-xl text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <select
              value={currentPeriod}
              onChange={(e) => updateParam('period', e.target.value)}
              aria-label="Filter by period"
              className="bg-surface border border-separator rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/40 shadow-xs shrink-0 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_year">This Year</option>
            </select>

            <select
              value={currentCategory}
              onChange={(e) => updateParam('category', e.target.value)}
              aria-label="Filter by category"
              className="bg-surface border border-separator rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/40 shadow-xs shrink-0 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <Button
              variant="outline"
              size="md"
              className="rounded-xl flex items-center gap-1.5 shadow-xs text-xs font-semibold cursor-pointer"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            >
              <Download size={15} />
              <span>Export</span>
              <ChevronDown size={13} className="text-muted" />
            </Button>

            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-surface border border-separator rounded-xl shadow-lg z-50 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={handleExportExcel}
                  className="w-full px-4 py-2.5 text-xs font-medium text-left flex items-center gap-2.5 hover:bg-surface-elevated transition-colors text-foreground cursor-pointer"
                >
                  <FileSpreadsheet size={15} className="text-emerald-500" />
                  <span>Export to Excel (.xlsx)</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2.5 text-xs font-medium text-left flex items-center gap-2.5 hover:bg-surface-elevated transition-colors text-foreground cursor-pointer"
                >
                  <FileText size={15} className="text-blue-500" />
                  <span>Export to CSV</span>
                </button>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            className="whitespace-nowrap rounded-xl shadow-xs cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} className="mr-1.5" />
            Add Expense
          </Button>
        </div>
      </div>

      <ExpenseFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} categories={EXPENSE_CATEGORIES} />
    </>
  );
}
