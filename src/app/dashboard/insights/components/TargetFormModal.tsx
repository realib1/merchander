'use client';

import React, { useState, useTransition } from 'react';
import { CreateTargetInput, TargetMetric, TargetPeriod } from '@/types/targets';
import { createBusinessTarget } from '@/app/actions/targets';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { X, Target, Loader2, Check } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, addMonths } from 'date-fns';
import { toast } from 'sonner';

interface TargetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableProducts: Array<{ id: string; name: string }>;
  availableBatches: Array<{ id: string; name: string; code: string }>;
  currency?: string;
}

export function TargetFormModal({
  isOpen,
  onClose,
  onSuccess,
  availableProducts,
  availableBatches,
  currency = 'GHS',
}: TargetFormModalProps) {
  const [isPending, startTransition] = useTransition();

  const now = new Date();
  const [name, setName] = useState('Monthly Revenue Goal');
  const [metric, setMetric] = useState<TargetMetric>('revenue');
  const [targetValue, setTargetValue] = useState('20000');
  const [period, setPeriod] = useState<TargetPeriod>('monthly');
  const [startDate, setStartDate] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(now), 'yyyy-MM-dd'));
  const [productId, setProductId] = useState<string>('');
  const [batchId, setBatchId] = useState<string>('');

  if (!isOpen) return null;

  const handlePeriodChange = (newPeriod: TargetPeriod) => {
    setPeriod(newPeriod);
    const currentDate = new Date();

    if (newPeriod === 'monthly') {
      setStartDate(format(startOfMonth(currentDate), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(currentDate), 'yyyy-MM-dd'));
      if (name.includes('Revenue') || name.includes('Target')) {
        setName(`${format(currentDate, 'MMMM')} Revenue Target`);
      }
    } else if (newPeriod === 'weekly') {
      setStartDate(format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setName(`Weekly ${metric === 'revenue' ? 'Revenue' : 'Sales'} Goal`);
    } else if (newPeriod === 'quarterly') {
      setStartDate(format(startOfMonth(currentDate), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(addMonths(currentDate, 2)), 'yyyy-MM-dd'));
      setName(`Q${Math.floor(currentDate.getMonth() / 3) + 1} Target`);
    }
  };

  const handleMetricChange = (newMetric: TargetMetric) => {
    setMetric(newMetric);
    if (newMetric === 'revenue') {
      setName('Monthly Revenue Target');
      setTargetValue('50000');
    } else if (newMetric === 'orders') {
      setName('Monthly Orders Target');
      setTargetValue('200');
    } else if (newMetric === 'new_customers') {
      setName('New Customer Acquisition');
      setTargetValue('100');
    } else if (newMetric === 'customers') {
      setName('Total Customer Milestone');
      setTargetValue('500');
    } else if (newMetric === 'product_sales') {
      const p = availableProducts[0];
      setName(p ? `Sell ${p.name}` : 'Product Sales Target');
      setTargetValue('50');
      if (p) setProductId(p.id);
    } else if (newMetric === 'preorder_customers' || newMetric === 'preorder_revenue') {
      const b = availableBatches[0];
      setName(b ? `${b.name} Target` : 'Pre-order Batch Target');
      setTargetValue(newMetric === 'preorder_revenue' ? '15000' : '50');
      if (b) setBatchId(b.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetValue);
    if (isNaN(val) || val <= 0) {
      toast.error('Please enter a valid target value');
      return;
    }

    startTransition(async () => {
      const payload: CreateTargetInput = {
        name: name.trim(),
        metric,
        target_value: val,
        period,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        product_id: metric === 'product_sales' ? productId || null : null,
        batch_id: metric === 'preorder_customers' || metric === 'preorder_revenue' ? batchId || null : null,
      };

      const res = await createBusinessTarget(payload);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Business target created successfully');
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-surface border border-separator rounded-2xl shadow-xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-separator">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground font-display">Create Goal or Target</h3>
              <p className="text-[11px] text-muted">Define a measurable target for Merchander Intelligence tracking.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1 rounded-lg text-muted hover:text-foreground transition cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <FormField
            name="name"
            label="Target Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. September Revenue Goal"
            required
            disabled={isPending}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="metricSelect" className="text-xs font-semibold text-foreground">
                Metric Area
              </label>
              <select
                id="metricSelect"
                value={metric}
                onChange={(e) => handleMetricChange(e.target.value as TargetMetric)}
                disabled={isPending}
                className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 cursor-pointer"
              >
                <option value="revenue">Total Revenue ({currency})</option>
                <option value="orders">Completed Orders Count</option>
                <option value="new_customers">New Customers Acquired</option>
                <option value="customers">Total Customer Reach</option>
                <option value="product_sales">Product Units Sold</option>
                <option value="preorder_customers">Pre-order Batch Customers</option>
                <option value="preorder_revenue">Pre-order Batch Revenue ({currency})</option>
              </select>
            </div>

            <FormField
              name="targetValue"
              label={`Target Value ${metric === 'revenue' || metric === 'preorder_revenue' ? `(${currency})` : '(Units)'}`}
              type="number"
              min={1}
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="e.g. 50000"
              required
              disabled={isPending}
            />
          </div>

          {/* Conditional Product Selector */}
          {metric === 'product_sales' && (
            <div className="space-y-1.5">
              <label htmlFor="productSelect" className="text-xs font-semibold text-foreground">
                Select Product
              </label>
              <select
                id="productSelect"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={isPending}
                className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 cursor-pointer"
              >
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conditional Batch Selector */}
          {(metric === 'preorder_customers' || metric === 'preorder_revenue') && (
            <div className="space-y-1.5">
              <label htmlFor="batchSelect" className="text-xs font-semibold text-foreground">
                Select Pre-order Batch
              </label>
              <select
                id="batchSelect"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                disabled={isPending}
                className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 cursor-pointer"
              >
                {availableBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Period Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Target Period</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(['weekly', 'monthly', 'quarterly', 'yearly', 'custom'] as TargetPeriod[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePeriodChange(p)}
                  disabled={isPending}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition border cursor-pointer ${
                    period === p
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-separator bg-surface text-muted hover:text-foreground'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField
              name="startDate"
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              disabled={isPending}
            />
            <FormField
              name="endDate"
              label="End Date / Cutoff"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-separator">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isPending} className="min-w-28 gap-1.5">
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>{isPending ? 'Saving...' : 'Set Target'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
