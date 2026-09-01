'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { SubscriptionSettings, SubscriptionTier, BillingCycle } from '@/types/settings';
import { updateSubscriptionTier } from '@/app/actions/settings-subscription';
import {
  initiateSubscriptionUpgradePayment,
  verifyAndApplySubscriptionPayment,
  verifyBillingMethodStatus,
} from '@/app/actions/payments-online';
import { CurrentPlanCard } from './CurrentPlanCard';
import { PlanTiersGrid } from './PlanTiersGrid';
import { BillingMethodCard } from './BillingMethodCard';
import { BillingInvoicesTable } from './BillingInvoicesTable';
import { toast } from 'sonner';

interface SubscriptionViewProps {
  initialSettings: SubscriptionSettings;
  callbackStatus?: string;
  callbackRef?: string;
  callbackType?: string;
}

export function SubscriptionView({
  initialSettings,
  callbackStatus,
  callbackRef,
  callbackType,
}: SubscriptionViewProps) {
  const [localSettings, setLocalSettings] = useState<SubscriptionSettings | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [isPending, startTransition] = useTransition();

  const settings = localSettings || initialSettings;

  // Handle gateway return callback verification inside transition (outside RSC render)
  useEffect(() => {
    if (callbackStatus === 'verified' && callbackRef) {
      startTransition(async () => {
        toast.loading('Verifying gateway transaction...');
        try {
          if (callbackType === 'setup') {
            const res = await verifyBillingMethodStatus(callbackRef);
            toast.dismiss();
            if (res.success && res.method) {
              setLocalSettings((prev) => ({
                ...(prev || initialSettings),
                paymentMethod: res.method,
              }));
              toast.success('Billing payment method connected successfully!');
            } else {
              toast.info('Billing method verification completed.');
            }
          } else {
            const res = await verifyAndApplySubscriptionPayment(callbackRef);
            toast.dismiss();
            if (res.success && res.tier && res.billingCycle) {
              const prices = {
                starter: { monthly: 0, annual: 0 },
                pro: { monthly: 250, annual: 2400 },
                enterprise: { monthly: 750, annual: 7200 },
              }[res.tier];

              setLocalSettings((prev) => ({
                ...(prev || initialSettings),
                tier: res.tier!,
                billingCycle: res.billingCycle!,
                monthlyPrice: prices.monthly,
                annualPrice: prices.annual,
                status: 'active',
              }));
              toast.success(`Subscription upgraded to ${res.tier.toUpperCase()} (${res.billingCycle})!`);
            } else {
              toast.success('Subscription payment verified successfully!');
            }
          }
        } catch (err) {
          console.error('Error verifying callback:', err);
          toast.dismiss();
          toast.error('Failed to verify gateway return transaction');
        }

        // Clean query params from URL without page reload
        if (typeof window !== 'undefined') {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      });
    }
  }, [callbackStatus, callbackRef, callbackType, initialSettings]);

  const handleSelectPlan = (tier: SubscriptionTier, cycle: BillingCycle) => {
    startTransition(async () => {
      if (tier === 'starter') {
        const res = await updateSubscriptionTier('starter', 'monthly');
        if (res.error) {
          toast.error(res.error);
        } else {
          setLocalSettings({
            ...settings,
            tier: 'starter',
            billingCycle: 'monthly',
            monthlyPrice: 0,
            annualPrice: 0,
          });
          toast.success('Subscription updated to Starter (Free)!');
          setShowPlans(false);
        }
        return;
      }

      // Paid plan upgrade (Pro / Enterprise) -> Initiate Paystack live checkout
      toast.loading('Initializing secure Paystack checkout...');
      const checkoutRes = await initiateSubscriptionUpgradePayment(tier, cycle);

      if (checkoutRes.error) {
        toast.dismiss();
        toast.error(checkoutRes.error);
        return;
      }

      if (checkoutRes.authorizationUrl) {
        toast.dismiss();
        toast.success('Redirecting to Paystack payment portal...');
        window.location.href = checkoutRes.authorizationUrl;
        return;
      }

      // Fallback direct upgrade
      const res = await updateSubscriptionTier(tier, cycle);
      toast.dismiss();
      if (res.error) {
        toast.error(res.error);
      } else {
        const prices = {
          starter: { monthly: 0, annual: 0 },
          pro: { monthly: 250, annual: 2400 },
          enterprise: { monthly: 750, annual: 7200 },
        }[tier];

        setLocalSettings({
          ...settings,
          tier,
          billingCycle: cycle,
          monthlyPrice: prices.monthly,
          annualPrice: prices.annual,
        });
        toast.success(`Subscription upgraded to ${tier.toUpperCase()} (${cycle})!`);
        setShowPlans(false);
      }
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 sm:pb-8">
      {/* 1. Active Plan Card */}
      <CurrentPlanCard settings={settings} onOpenPlans={() => setShowPlans(!showPlans)} showPlans={showPlans} />

      {/* 2. Expandable Plan Tiers Grid */}
      {showPlans && (
        <PlanTiersGrid
          currentTier={settings.tier}
          currentCycle={settings.billingCycle}
          onSelectPlan={handleSelectPlan}
          isPending={isPending}
        />
      )}

      {/* 3. Default Billing Method */}
      <BillingMethodCard
        paymentMethod={settings.paymentMethod}
        onUpdateMethod={(newMethod) => setLocalSettings({ ...settings, paymentMethod: newMethod })}
      />

      {/* 4. Invoices & Receipts History */}
      <BillingInvoicesTable invoices={settings.invoices} />
    </div>
  );
}
