import { PaymentProvider, PaymentStatus } from '@/types/payments';

export interface ProviderConfig {
  value: PaymentProvider;
  label: string;
  category: 'momo' | 'cash' | 'digital';
  badgeClass: string;
  bgClass: string;
  textClass: string;
  iconName: string;
}

export const PAYMENT_PROVIDERS: Record<PaymentProvider, ProviderConfig> = {
  mtn_momo: {
    value: 'mtn_momo',
    label: 'MTN Mobile Money',
    category: 'momo',
    badgeClass: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-600 dark:text-amber-400',
    iconName: 'Smartphone',
  },
  telecel_cash: {
    value: 'telecel_cash',
    label: 'Telecel Cash',
    category: 'momo',
    badgeClass: 'bg-red-500/10 text-red-600 border border-red-500/20 dark:text-red-400',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-600 dark:text-red-400',
    iconName: 'Smartphone',
  },
  at_money: {
    value: 'at_money',
    label: 'AT Money',
    category: 'momo',
    badgeClass: 'bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:text-blue-400',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-600 dark:text-blue-400',
    iconName: 'Smartphone',
  },
  cash_on_delivery: {
    value: 'cash_on_delivery',
    label: 'Cash on Delivery (COD)',
    category: 'cash',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    iconName: 'Truck',
  },
  cash: {
    value: 'cash',
    label: 'Cash In Hand',
    category: 'cash',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    iconName: 'Banknote',
  },
  bank_transfer: {
    value: 'bank_transfer',
    label: 'Bank Transfer (E-Zwich / ACH)',
    category: 'digital',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 dark:text-indigo-400',
    bgClass: 'bg-indigo-500/10',
    textClass: 'text-indigo-600 dark:text-indigo-400',
    iconName: 'Building2',
  },
  card: {
    value: 'card',
    label: 'Debit / Credit Card (POS)',
    category: 'digital',
    badgeClass: 'bg-purple-500/10 text-purple-600 border border-purple-500/20 dark:text-purple-400',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-600 dark:text-purple-400',
    iconName: 'CreditCard',
  },
  hubtel: {
    value: 'hubtel',
    label: 'Hubtel Gateway',
    category: 'digital',
    badgeClass: 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 dark:text-cyan-400',
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-600 dark:text-cyan-400',
    iconName: 'Zap',
  },
  paystack: {
    value: 'paystack',
    label: 'Paystack Gateway',
    category: 'digital',
    badgeClass: 'bg-teal-500/10 text-teal-600 border border-teal-500/20 dark:text-teal-400',
    bgClass: 'bg-teal-500/10',
    textClass: 'text-teal-600 dark:text-teal-400',
    iconName: 'Zap',
  },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; badgeClass: string; dotClass: string }> = {
  completed: {
    label: 'Completed / Verified',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
  },
  pending: {
    label: 'Pending Verification',
    badgeClass: 'bg-warning/10 text-warning border border-warning/20',
    dotClass: 'bg-warning',
  },
  failed: {
    label: 'Failed / Rejected',
    badgeClass: 'bg-destructive/10 text-destructive border border-destructive/20',
    dotClass: 'bg-destructive',
  },
  refunded: {
    label: 'Refunded',
    badgeClass: 'bg-muted/10 text-muted border border-muted/20',
    dotClass: 'bg-muted',
  },
};
