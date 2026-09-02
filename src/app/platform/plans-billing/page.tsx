import React from 'react';
import { getPlatformPlansAction } from '@/app/actions/platform';
import { PlansBillingClient } from './components/PlansBillingClient';

export const dynamic = 'force-dynamic';

export default async function PlansBillingPage() {
  const { plans, error } = await getPlatformPlansAction();

  const fallbackPlans = [
    {
      id: 'plan-free',
      name: 'Free Explorer',
      slug: 'free',
      price_ghs: 0,
      price_usd: 0,
      billing_cycle: 'monthly' as const,
      is_active: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: 'Essential tools to launch social commerce in Ghana',
      entitlements: {
        max_products: 20,
        max_monthly_orders: 50,
        max_staff_seats: 1,
        custom_domain_allowed: false,
        ai_queries_monthly: 50,
        priority_support: false,
      },
    },
    {
      id: 'plan-starter',
      name: 'Starter Tier',
      slug: 'starter',
      price_ghs: 150,
      price_usd: 12,
      billing_cycle: 'monthly' as const,
      is_active: true,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: 'Organize procurement, pre-orders and customer sales',
      entitlements: {
        max_products: 100,
        max_monthly_orders: 300,
        max_staff_seats: 3,
        custom_domain_allowed: false,
        ai_queries_monthly: 250,
        priority_support: false,
      },
    },
    {
      id: 'plan-growth',
      name: 'Growth Tier',
      slug: 'growth',
      price_ghs: 350,
      price_usd: 29,
      billing_cycle: 'monthly' as const,
      is_active: true,
      sort_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: 'Scale multi-channel WhatsApp, Instagram, and shipment tracking',
      entitlements: {
        max_products: 500,
        max_monthly_orders: 1500,
        max_staff_seats: 7,
        custom_domain_allowed: true,
        ai_queries_monthly: 1000,
        priority_support: true,
      },
    },
    {
      id: 'plan-business',
      name: 'Business Pro',
      slug: 'business',
      price_ghs: 750,
      price_usd: 59,
      billing_cycle: 'monthly' as const,
      is_active: true,
      sort_order: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: 'High-volume importers, inventory intelligence, custom domain',
      entitlements: {
        max_products: 2500,
        max_monthly_orders: 10000,
        max_staff_seats: 20,
        custom_domain_allowed: true,
        ai_queries_monthly: 5000,
        priority_support: true,
      },
    },
    {
      id: 'plan-enterprise',
      name: 'Enterprise Custom',
      slug: 'enterprise',
      price_ghs: 1800,
      price_usd: 149,
      billing_cycle: 'monthly' as const,
      is_active: true,
      sort_order: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: 'Unlimited throughput, dedicated account manager, bespoke SLAs',
      entitlements: {
        max_products: 100000,
        max_monthly_orders: 500000,
        max_staff_seats: 100,
        custom_domain_allowed: true,
        ai_queries_monthly: 50000,
        priority_support: true,
      },
    },
  ];

  const activePlans = plans && plans.length > 0 ? plans : fallbackPlans;

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
          Notice: {error} (Displaying standard plan templates)
        </div>
      )}
      <PlansBillingClient initialPlans={activePlans} />
    </div>
  );
}
