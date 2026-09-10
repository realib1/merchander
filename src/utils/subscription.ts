import { BillingInvoice } from '@/types/settings';
import { formatDate } from './format';

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
