'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CreditCard, Zap, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';

export function SubscriptionView() {
  const [showPlans, setShowPlans] = useState(false);

  const handleManageBilling = () => {
    toast.info('Billing portal is synchronized with Paystack subscriptions.');
  };

  return (
    <div className="space-y-8">
      {/* Current Plan Card */}
      <Card className="border-brand-primary/20 bg-brand-primary/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-primary/10 rounded-bl-full -z-10" />
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-primary/20 text-brand-primary shadow-xs">
                <Zap className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-foreground font-bold">Merchander Pro Plan</CardTitle>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-primary text-white uppercase tracking-wider">
                    Active
                  </span>
                </div>
                <CardDescription className="text-xs text-muted">
                  Billed monthly &bull; Next renewal on 1st of next month
                </CardDescription>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-2xl font-extrabold text-foreground tabular-nums">
                {formatCurrency(250).replace('.00', '')}
                <span className="text-xs font-normal text-muted ml-1">/ month</span>
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <li className="flex items-center gap-2 text-xs font-medium text-foreground">
              <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" /> Unlimited Products &
              Catalog
            </li>
            <li className="flex items-center gap-2 text-xs font-medium text-foreground">
              <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" /> Multi-seat Staff &
              Custom Permissions
            </li>
            <li className="flex items-center gap-2 text-xs font-medium text-foreground">
              <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" /> WhatsApp Cloud API &
              Bot Automation
            </li>
            <li className="flex items-center gap-2 text-xs font-medium text-foreground">
              <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" /> Landed Cost Freight &
              Land Logistics
            </li>
          </ul>
        </CardBody>
        <CardFooter className="justify-end gap-2.5">
          <Button variant="outline" size="sm" onClick={() => setShowPlans(!showPlans)}>
            <Sparkles size={14} className="mr-1 text-brand-primary" />
            {showPlans ? 'Hide Plan Tiers' : 'Compare Plans'}
          </Button>
          <Button variant="primary" size="sm" onClick={handleManageBilling}>
            Manage Billing & Invoices
          </Button>
        </CardFooter>
      </Card>

      {/* Plan Tiers Comparison (Expandable) */}
      {showPlans && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
          <div className="p-5 rounded-2xl bg-surface border border-separator space-y-4">
            <h3 className="text-sm font-bold text-foreground">Starter</h3>
            <p className="text-xl font-extrabold text-foreground">Free</p>
            <p className="text-xs text-muted">For single merchants launching their online catalog.</p>
            <ul className="space-y-2 text-xs text-muted">
              <li>&bull; Up to 25 Products</li>
              <li>&bull; 1 Staff Account</li>
              <li>&bull; WhatsApp Order Links</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-surface border-2 border-brand-primary space-y-4 shadow-md relative">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-brand-primary">Pro (Current)</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary">
                Current
              </span>
            </div>
            <p className="text-xl font-extrabold text-foreground">GHS 250 / mo</p>
            <p className="text-xs text-muted">For growing direct-to-consumer and social brands.</p>
            <ul className="space-y-2 text-xs text-foreground font-medium">
              <li>&bull; Unlimited Products</li>
              <li>&bull; 5 Staff Accounts & RBAC</li>
              <li>&bull; WhatsApp Bot Auto-responder</li>
              <li>&bull; MoMo Auto-Reconciliation</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-separator space-y-4">
            <h3 className="text-sm font-bold text-foreground">Enterprise</h3>
            <p className="text-xl font-extrabold text-foreground">Custom</p>
            <p className="text-xs text-muted">For high-volume multi-branch distributors.</p>
            <ul className="space-y-2 text-xs text-muted">
              <li>&bull; Unlimited Everything</li>
              <li>&bull; Custom ERP Integrations</li>
              <li>&bull; Dedicated Account Manager</li>
            </ul>
          </div>
        </div>
      )}

      {/* Payment Method Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated border border-separator">
                <CreditCard className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Default Billing Method</CardTitle>
                <CardDescription>Primary payment method used for monthly subscription dues.</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-separator rounded-xl bg-surface-elevated">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-8 bg-yellow-400 rounded-lg flex items-center justify-center font-bold text-xs text-black border border-black/10">
                MTN
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">MTN Mobile Money Wallet</p>
                <p className="text-[11px] text-muted">&bull;&bull;&bull;&bull; 4567 (Auto-debit active)</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
              <ShieldCheck size={16} /> Verified
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
