export type PaymentProvider =
  | 'mtn_momo'
  | 'telecel_cash'
  | 'at_money'
  | 'cash_on_delivery'
  | 'cash'
  | 'bank_transfer'
  | 'card'
  | 'hubtel'
  | 'paystack';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentOrder {
  id: string;
  status: string;
  total_amount: number;
  customer?: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

export interface PaymentCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
}

export interface Payment {
  id: string;
  tenant_id: string;
  order_id: string | null;
  customer_id: string | null;
  provider: PaymentProvider;
  transaction_ref: string | null;
  amount: number;
  fee: number;
  net_amount: number;
  status: PaymentStatus;
  sender_phone: string | null;
  sender_name: string | null;
  notes: string | null;
  recorded_by: string | null;
  refund_reason: string | null;
  refunded_at: string | null;
  payment_date: string;
  created_at: string;
  order?: PaymentOrder | null;
  customer?: PaymentCustomer | null;
}

export interface PaymentMetrics {
  totalInflow: number;
  netInflow: number;
  totalFees: number;
  completedCount: number;
  momoVolume: number;
  momoPercentage: number;
  pendingReconciliationCount: number;
  pendingReconciliationAmount: number;
}

export interface CreatePaymentInput {
  order_id?: string | null;
  customer_id?: string | null;
  provider: PaymentProvider;
  transaction_ref?: string | null;
  amount: number;
  fee?: number;
  status?: PaymentStatus;
  sender_phone?: string | null;
  sender_name?: string | null;
  notes?: string | null;
  payment_date?: string;
}

export interface ReconcileMoMoInput {
  order_id: string;
  sms_text: string;
  amount_paid: number;
  provider?: PaymentProvider;
}

export interface RefundPaymentInput {
  payment_id: string;
  refund_reason: string;
  refund_amount?: number;
}
