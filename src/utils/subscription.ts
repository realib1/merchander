import { BillingInvoice, SubscriptionTier, SubscriptionPaymentMethod } from '@/types/settings';
import { formatDate } from './format';

export interface SubscriptionTierDetails {
  id: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  annualPricePerMonth: number;
  description: string;
  isPopular?: boolean;
  limits: {
    products: number; // -1 for unlimited
    staff: number; // -1 for unlimited
    bot: number; // -1 for unlimited
  };
  features: string[];
}

export const SUBSCRIPTION_TIER_CONFIG: Record<SubscriptionTier, SubscriptionTierDetails> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 0,
    annualPrice: 0,
    annualPricePerMonth: 0,
    description: 'Essential tools for solo sellers launching an online store.',
    limits: {
      products: 100,
      staff: 1,
      bot: 50,
    },
    features: [
      'Up to 100 Products in Catalog',
      '1 Staff Account',
      'Direct WhatsApp Order Links',
      'Mobile Money Cash Recording',
      'Basic Storefront Subdomain',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Growth Pro',
    monthlyPrice: 250,
    annualPrice: 2400,
    annualPricePerMonth: 200,
    description: 'Complete operating system for growing social commerce boutiques.',
    isPopular: true,
    limits: {
      products: 500,
      staff: 7,
      bot: 1000,
    },
    features: [
      'Up to 500 Products & Variants',
      '7 Staff Accounts & Permissions',
      'WhatsApp Cloud Bot & Auto-Reply',
      'Hubtel & Paystack MoMo Auto-Reconciliation',
      'Supplier Orders & Waybill Dispatch Slips',
      '1,000 AI Bot Message Quota / mo',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Scale',
    monthlyPrice: 750,
    annualPrice: 7200,
    annualPricePerMonth: 600,
    description: 'High-volume distributors, wholesale merchants, & multiple branches.',
    limits: {
      products: -1,
      staff: 20,
      bot: -1,
    },
    features: [
      'Unlimited Products & Warehouses',
      '20+ Staff Accounts with Role Isolation',
      'Multi-Branch Inventory Synchronization',
      'Custom Domain Binding (.com / .shop)',
      'Dedicated Priority SLA & WhatsApp Manager',
    ],
  },
};

/**
 * Resolves any raw tier identifier (including legacy slugs) to the canonical tier config.
 */
export function getTierConfig(tier?: string | null): SubscriptionTierDetails {
  if (!tier) return SUBSCRIPTION_TIER_CONFIG.starter;
  const normalized = tier.toLowerCase();
  if (normalized === 'growth' || normalized === 'pro') return SUBSCRIPTION_TIER_CONFIG.pro;
  if (normalized === 'business' || normalized === 'enterprise') return SUBSCRIPTION_TIER_CONFIG.enterprise;
  return SUBSCRIPTION_TIER_CONFIG.starter;
}

/**
 * Maps subscription tier slug to merchant-facing display name.
 */
export function formatTierName(tier?: string | null): string {
  if (!tier) return 'Starter';
  const normalized = tier.toLowerCase();
  switch (normalized) {
    case 'starter':
      return 'Starter';
    case 'growth':
    case 'pro':
      return 'Growth Pro';
    case 'business':
      return 'Business';
    case 'enterprise':
      return 'Enterprise Scale';
    case 'free':
      return 'Free Plan';
    default:
      return tier.charAt(0).toUpperCase() + tier.slice(1);
  }
}

/**
 * Calculates trial countdown metrics from renewal date.
 */
export function getTrialCountdown(
  renewalDate?: string | null,
  totalTrialDays: number = 14,
  baseTime: number = Date.now()
): {
  isTrial: boolean;
  daysRemaining: number;
  daysElapsed: number;
  percentElapsed: number;
  formattedTimeline: string;
} {
  if (!renewalDate) {
    return {
      isTrial: false,
      daysRemaining: 0,
      daysElapsed: totalTrialDays,
      percentElapsed: 100,
      formattedTimeline: 'Active Subscription',
    };
  }

  const target = new Date(renewalDate).getTime();
  if (isNaN(target)) {
    return {
      isTrial: false,
      daysRemaining: 0,
      daysElapsed: totalTrialDays,
      percentElapsed: 100,
      formattedTimeline: 'Active Subscription',
    };
  }

  const diffMs = target - baseTime;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(1, Math.min(totalTrialDays, totalTrialDays - daysRemaining + 1));
  const percentElapsed = Math.min(100, Math.max(0, Math.round(((totalTrialDays - daysRemaining) / totalTrialDays) * 100)));

  const formattedTimeline =
    daysRemaining > 0
      ? `Day ${daysElapsed} of ${totalTrialDays} • ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`
      : 'Trial period concluded';

  return {
    isTrial: daysRemaining > 0 && daysRemaining <= totalTrialDays,
    daysRemaining,
    daysElapsed,
    percentElapsed,
    formattedTimeline,
  };
}

/**
 * Formats a renewal date into natural, non-technical language.
 *
 * @param renewalDate - ISO string or date descriptor
 * @param cycle - 'monthly' | 'annual'
 * @param isTrial - whether account is currently in trial
 * @param baseTime - reference timestamp for test reproducibility
 */
export function formatRenewalDate(
  renewalDate?: string | null,
  cycle: 'monthly' | 'annual' = 'monthly',
  isTrial: boolean = false,
  baseTime: number = Date.now()
): string {
  if (!renewalDate) {
    return 'Continuous Free Access • No renewal charges';
  }

  const lower = renewalDate.toLowerCase();
  if (lower.includes('continuous') || lower.includes('free access')) {
    return 'Continuous Free Access • No renewal charges';
  }

  const parsed = new Date(renewalDate);
  if (isNaN(parsed.getTime())) {
    return renewalDate;
  }

  const formattedDate = formatDate(parsed, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const cycleText = cycle === 'annual' ? 'annually' : 'monthly';

  if (isTrial) {
    const { daysRemaining } = getTrialCountdown(renewalDate, 14, baseTime);
    if (daysRemaining > 0) {
      const dayWord = daysRemaining === 1 ? 'day' : 'days';
      return `Trial ends on ${formattedDate} (${daysRemaining} ${dayWord} left) • Billed ${cycleText} thereafter`;
    }
    return `Trial ended on ${formattedDate} • Billed ${cycleText}`;
  }

  return `Renews on ${formattedDate} • Billed ${cycleText}`;
}

/**
 * Generates an official 14-Day Free Trial invoice record.
 */
export function generateTrialInvoice(
  tenantId: string,
  createdAt?: string | null,
  tier: string = 'growth'
): BillingInvoice {
  const cleanId = (tenantId || 'workspace').replace(/[^a-zA-Z0-9]/g, '');
  const prefix = cleanId.slice(0, 6).toUpperCase() || 'TRIAL';
  const tierName = formatTierName(tier);

  return {
    id: `inv-trial-${cleanId.slice(0, 10)}`,
    invoiceNumber: `INV-TR-${prefix}`,
    date: createdAt || new Date().toISOString(),
    amount: 0,
    currency: 'GHS',
    status: 'paid',
    planName: `14-Day Free Trial (${tierName})`,
    receiptUrl: '#',
  };
}

/**
 * Identifies mocked, demo, or unverified test cards that should not be shown to users.
 */
export function isFakeCard(method?: SubscriptionPaymentMethod | null): boolean {
  if (!method) return false;
  const id = method.identifier || '';
  const last4 = method.last4 || '';
  const holder = (method.holderName || '').toLowerCase();
  return (
    last4 === '4242' ||
    last4 === '4081' ||
    last4 === '4567' ||
    id.includes('4242') ||
    id.includes('4081') ||
    id.includes('4084') ||
    id.includes('4567') ||
    holder.includes('demo') ||
    holder.includes('test') ||
    (method.type === 'card' && !method.provider && !method.authorizationCode)
  );
}

