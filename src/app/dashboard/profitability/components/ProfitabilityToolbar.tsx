'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProfitPeriod, ProfitabilityData } from '@/types/profitability';
import { Button } from '@/components/ui/Button';
import {
  exportProfitabilityToExcel,
  exportProfitabilityToCSV,
  exportProfitabilityToPDF,
} from '@/utils/profitabilityExport';
import { Download, FileSpreadsheet, FileText, Printer, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface ProfitabilityToolbarProps {
  currentPeriod: ProfitPeriod;
  data: ProfitabilityData;
  businessName?: string;
}

const PERIOD_OPTIONS: Array<{ value: ProfitPeriod; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last 1 Year' },
];

export function ProfitabilityToolbar({
  currentPeriod,
  data,
  businessName = 'Merchander Store',
}: ProfitabilityToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  const handlePeriodChange = (newPeriod: ProfitPeriod) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', newPeriod);
    router.push(`/dashboard/profitability?${params.toString()}`);
  };

  const handleExportExcel = () => {
    try {
      exportProfitabilityToExcel(data, businessName);
      toast.success('Excel spreadsheet generated successfully');
      setShowExportMenu(false);
    } catch {
      toast.error('Failed to export Excel file');
    }
  };

  const handleExportCSV = () => {
    try {
      exportProfitabilityToCSV(data);
      toast.success('CSV file downloaded successfully');
      setShowExportMenu(false);
    } catch {
      toast.error('Failed to export CSV file');
    }
  };

  const handleExportPDF = () => {
    try {
      exportProfitabilityToPDF(data, businessName);
      setShowExportMenu(false);
    } catch {
      toast.error('Failed to generate PDF statement');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Period Selector Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-surface border border-separator rounded-xl overflow-x-auto shadow-2xs">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePeriodChange(opt.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              currentPeriod === opt.value
                ? 'bg-brand-primary text-white shadow-xs'
                : 'text-muted hover:text-foreground hover:bg-surface-elevated'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Export Options Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExportMenu(!showExportMenu)}
          leftIcon={<Download size={14} />}
          rightIcon={
            <ChevronDown
              size={12}
              className={showExportMenu ? 'rotate-180 transition-transform' : 'transition-transform'}
            />
          }
        >
          Export Statement
        </Button>

        {showExportMenu && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-separator rounded-xl shadow-xl z-20 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={handleExportExcel}
              className="w-full px-4 py-2.5 text-xs text-left font-medium text-foreground hover:bg-surface-elevated flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" />
              <span>Excel Spreadsheet (.xlsx)</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="w-full px-4 py-2.5 text-xs text-left font-medium text-foreground hover:bg-surface-elevated flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <FileText size={15} className="text-blue-500" />
              <span>CSV Data File (.csv)</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="w-full px-4 py-2.5 text-xs text-left font-medium text-foreground hover:bg-surface-elevated flex items-center gap-2.5 transition-colors cursor-pointer border-t border-separator/50"
            >
              <Printer size={15} className="text-brand-primary" />
              <span>Print / PDF </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
