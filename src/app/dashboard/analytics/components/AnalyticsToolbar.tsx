'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AnalyticsData, AnalyticsFilterPeriod } from '@/types/analytics';
import { exportAnalyticsToExcel, exportAnalyticsToCsv, exportAnalyticsToPdf } from '@/utils/analyticsExport';
import { Download, ChevronDown, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AnalyticsToolbarProps {
  currentPeriod: AnalyticsFilterPeriod;
  analyticsData: AnalyticsData;
  businessName?: string;
  currency?: string;
}

const PERIOD_OPTIONS: Array<{ key: AnalyticsFilterPeriod; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: 'ytd', label: 'YTD' },
  { key: '1y', label: '1Y' },
];

export function AnalyticsToolbar({
  currentPeriod,
  analyticsData,
  businessName = 'Merchander Vendor',
  currency = 'GHS',
}: AnalyticsToolbarProps) {
  const router = useRouter();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePeriodChange = (period: AnalyticsFilterPeriod) => {
    router.push(`/dashboard/analytics?period=${period}`);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Period Selector Tabs */}
      <div className="inline-flex bg-surface border border-separator rounded-xl p-1 gap-0.5 shadow-2xs overflow-x-auto">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => handlePeriodChange(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition whitespace-nowrap ${
              currentPeriod === opt.key
                ? 'bg-brand-primary text-white shadow-xs'
                : 'text-muted hover:text-foreground hover:bg-surface-elevated'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Export Dropdown */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsExportOpen(!isExportOpen)}
          className="px-3.5 py-1.5 rounded-xl bg-surface border border-separator text-xs font-semibold text-foreground hover:bg-surface-elevated cursor-pointer transition flex items-center gap-2 shadow-xs"
        >
          <Download size={13} className="text-muted" />
          <span>Export</span>
          <ChevronDown size={12} className={`text-muted transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
        </button>

        {isExportOpen && (
          <div className="absolute right-0 mt-1.5 w-48 bg-surface border border-separator rounded-xl shadow-xl z-50 py-1 text-xs animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                exportAnalyticsToExcel(analyticsData, businessName, currency);
                setIsExportOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-foreground hover:bg-surface-elevated flex items-center gap-2 cursor-pointer transition font-medium"
            >
              <FileSpreadsheet size={14} className="text-success" /> Export Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={() => {
                exportAnalyticsToCsv(analyticsData, currency);
                setIsExportOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-foreground hover:bg-surface-elevated flex items-center gap-2 cursor-pointer transition font-medium border-t border-separator/40"
            >
              <FileText size={14} className="text-info" /> Export CSV (.csv)
            </button>
            <button
              type="button"
              onClick={() => {
                exportAnalyticsToPdf(analyticsData, businessName, currency);
                setIsExportOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-foreground hover:bg-surface-elevated flex items-center gap-2 cursor-pointer transition font-medium border-t border-separator/40"
            >
              <Printer size={14} className="text-brand-primary" /> Print / Save PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
