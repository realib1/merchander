'use client';

import React from 'react';
import { CustomerCohortMetrics } from '@/types/analytics';
import { formatCurrency } from '@/utils/format';
import { Users, UserPlus, UserCheck, Crown, Phone, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface AnalyticsCustomerCohortsProps {
  cohorts: CustomerCohortMetrics;
}

export function AnalyticsCustomerCohorts({ cohorts }: AnalyticsCustomerCohortsProps) {
  const totalSpend = cohorts.newBuyersRevenue + cohorts.returningBuyersRevenue;
  const newRevenuePct = totalSpend > 0 ? (cohorts.newBuyersRevenue / totalSpend) * 100 : 0;
  const returningRevenuePct = totalSpend > 0 ? (cohorts.returningBuyersRevenue / totalSpend) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* 1. Visual Cohort Breakdown Card */}
      <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
              <Users size={15} className="text-brand-primary" /> Customer Cohorts
            </h3>
            <span className="text-[11px] text-muted font-medium">Acquisition vs Retention</span>
          </div>

          {/* Top Cohort Scorecards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-surface-elevated/40 border border-separator/40 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                <UserPlus size={13} className="text-brand-primary" /> New Buyers
              </div>
              <div className="text-xl font-bold text-foreground mt-1 tabular-nums">
                {cohorts.newBuyersCount.toLocaleString()}
              </div>
              <div className="text-[11px] text-muted mt-0.5 font-semibold">
                {formatCurrency(cohorts.newBuyersRevenue, 'GHS')}
              </div>
            </div>

            <div className="bg-surface-elevated/40 border border-separator/40 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                <UserCheck size={13} className="text-brand-secondary" /> Returning Buyers
              </div>
              <div className="text-xl font-bold text-foreground mt-1 tabular-nums">
                {cohorts.returningBuyersCount.toLocaleString()}
              </div>
              <div className="text-[11px] text-muted mt-0.5 font-semibold">
                {formatCurrency(cohorts.returningBuyersRevenue, 'GHS')}
              </div>
            </div>
          </div>

          {/* Visual Revenue Share Distribution Bar */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-brand-primary">New: {newRevenuePct.toFixed(1)}%</span>
              <span className="text-brand-secondary">Returning: {returningRevenuePct.toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full bg-surface-elevated rounded-full overflow-hidden flex gap-0.5">
              <div
                className="bg-brand-primary h-full transition-all duration-300"
                style={{ width: `${Math.max(newRevenuePct, cohorts.newBuyersRevenue > 0 ? 5 : 0)}%` }}
                title={`New Buyers Revenue: ${formatCurrency(cohorts.newBuyersRevenue, 'GHS')}`}
              />
              <div
                className="bg-brand-secondary h-full transition-all duration-300"
                style={{ width: `${Math.max(returningRevenuePct, cohorts.returningBuyersRevenue > 0 ? 5 : 0)}%` }}
                title={`Returning Buyers Revenue: ${formatCurrency(cohorts.returningBuyersRevenue, 'GHS')}`}
              />
            </div>
          </div>

          {/* Retention Health Note */}
          <div className="p-3 bg-surface-elevated/60 border border-separator/50 rounded-xl text-xs">
            <div className="font-semibold text-foreground flex items-center justify-between">
              <span>Repeat Purchase Rate:</span>
              <span className="text-info font-bold">{cohorts.repeatRatePct.toFixed(1)}%</span>
            </div>
            <p className="text-[11px] text-muted mt-1">
              {cohorts.repeatRatePct >= 30
                ? 'High customer loyalty. Returning buyers represent a strong revenue anchor.'
                : 'Focus on WhatsApp broadcasts and post-purchase followups to drive retention.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Top VIP Customer Spenders Table (2 Cols) */}
      <div className="lg:col-span-2 bg-surface border border-separator rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                <Crown size={15} className="text-warning" /> Top VIP Spenders
              </h3>
              <p className="text-xs text-muted mt-0.5">Highest lifetime customer contribution</p>
            </div>
            <Link
              href="/dashboard/customers"
              className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              View all CRM <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto border border-separator/60 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-elevated/80 border-b border-separator text-muted font-semibold text-[11px] uppercase tracking-wider">
                  <th className="px-3.5 py-2.5">Customer</th>
                  <th className="px-3.5 py-2.5">Phone / Contact</th>
                  <th className="px-3.5 py-2.5 text-right">Orders</th>
                  <th className="px-3.5 py-2.5 text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator/40">
                {cohorts.topVipCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted">
                      No customer transactions recorded
                    </td>
                  </tr>
                ) : (
                  cohorts.topVipCustomers.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-surface-elevated/40 transition">
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted font-mono w-4">#{idx + 1}</span>
                          <span className="font-semibold text-foreground truncate max-w-35 sm:max-w-45">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-muted font-mono text-[11px] flex items-center gap-1">
                        <Phone size={11} className="text-muted" /> {c.phone}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-medium text-foreground tabular-nums">
                        {c.ordersCount}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-foreground tabular-nums">
                        {formatCurrency(c.totalSpent, 'GHS')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
