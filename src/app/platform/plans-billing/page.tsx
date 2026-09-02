import React from 'react';
import { getPlatformPlansAction } from '@/app/actions/platform';
import { PlansBillingClient } from './components/PlansBillingClient';

export const dynamic = 'force-dynamic';

export default async function PlansBillingPage() {
  const { plans, error } = await getPlatformPlansAction();

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
          Failed to load plans: {error}
        </div>
      )}

      {!error && plans.length === 0 ? (
        <div className="p-8 rounded-2xl bg-surface border border-separator text-center space-y-2">
          <div className="text-sm font-bold text-foreground">No commercial plans configured</div>
          <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
            The <span className="font-mono">platform_plans</span> table is empty. Tier pricing,
            entitlements and the merchant plan picker all read from it, so add your plans here
            before onboarding paid merchants.
          </p>
        </div>
      ) : (
        <PlansBillingClient initialPlans={plans} />
      )}
    </div>
  );
}
