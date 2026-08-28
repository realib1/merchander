import { SupabaseClient } from '@supabase/supabase-js';
import { Payment, PaymentProvider, PaymentStatus, PaymentMetrics } from '@/types/payments';

export interface GetPaymentsOptions {
  period?: 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'all';
  provider?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export type RawPaymentItem = {
  id: string;
  tenant_id: string;
  order_id: string | null;
  customer_id?: string | null;
  provider: string;
  transaction_ref: string | null;
  amount: number;
  fee?: number;
  net_amount?: number;
  status: string;
  sender_phone?: string | null;
  sender_name?: string | null;
  notes?: string | null;
  recorded_by?: string | null;
  refund_reason?: string | null;
  refunded_at?: string | null;
  payment_date?: string;
  created_at: string;
  order?: {
    id: string;
    status: string;
    total_amount: number;
    customer?:
      | { id: string; name: string; phone: string; email?: string | null }
      | Array<{ id: string; name: string; phone: string; email?: string | null }>
      | null;
  } | null;
};

export async function fetchPaymentsWithMetrics(
  supabase: SupabaseClient,
  tenantId: string,
  options: GetPaymentsOptions = {}
): Promise<{ payments: Payment[]; metrics: PaymentMetrics }> {
  let query = supabase
    .from('payments')
    .select(
      `
      *,
      order:orders (
        id,
        status,
        total_amount,
        customer:customers (
          id,
          name,
          phone,
          email
        )
      )
    `
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (options.startDate) {
    query = query.gte('created_at', options.startDate);
  }
  if (options.endDate) {
    query = query.lte('created_at', options.endDate);
  }
  if (options.provider && options.provider !== 'all') {
    query = query.eq('provider', options.provider);
  }
  if (options.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  const { data: rawData, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch payments: ${error.message}`);
  }

  const rawList = (rawData as unknown as RawPaymentItem[]) || [];

  const customerIds = Array.from(new Set(rawList.map((p) => p.customer_id).filter(Boolean))) as string[];
  const customerMap = new Map<string, { id: string; name: string; phone: string; email?: string | null }>();

  if (customerIds.length > 0) {
    const { data: custData } = await supabase.from('customers').select('id, name, phone, email').in('id', customerIds);

    if (custData) {
      custData.forEach((c) => {
        customerMap.set(c.id, c);
      });
    }
  }

  let payments: Payment[] = rawList.map((p) => {
    const orderCustomer = Array.isArray(p.order?.customer) ? p.order.customer[0] : p.order?.customer;
    const directCustomer = p.customer_id ? customerMap.get(p.customer_id) : null;
    const resolvedCustomer = directCustomer || orderCustomer || null;
    const grossAmount = Number(p.amount) || 0;
    const feeAmount = Number(p.fee) || 0;
    const netAmount = Number(p.net_amount) || grossAmount - feeAmount;

    return {
      id: p.id,
      tenant_id: p.tenant_id,
      order_id: p.order_id,
      customer_id: p.customer_id || null,
      provider: p.provider as PaymentProvider,
      transaction_ref: p.transaction_ref,
      amount: grossAmount,
      fee: feeAmount,
      net_amount: netAmount,
      status: p.status as PaymentStatus,
      sender_phone: p.sender_phone || null,
      sender_name: p.sender_name || null,
      notes: p.notes || null,
      recorded_by: p.recorded_by || null,
      refund_reason: p.refund_reason || null,
      refunded_at: p.refunded_at || null,
      payment_date: p.payment_date || p.created_at,
      created_at: p.created_at,
      customer: resolvedCustomer,
      order: p.order
        ? {
            id: p.order.id,
            status: p.order.status,
            total_amount: Number(p.order.total_amount) || 0,
            customer: orderCustomer,
          }
        : null,
    };
  });

  if (options.search && options.search.trim() !== '') {
    const term = options.search.toLowerCase().trim();
    payments = payments.filter((p) => {
      const ref = p.transaction_ref?.toLowerCase() || '';
      const sName = p.sender_name?.toLowerCase() || '';
      const sPhone = p.sender_phone?.toLowerCase() || '';
      const notes = p.notes?.toLowerCase() || '';
      const custName = p.customer?.name?.toLowerCase() || p.order?.customer?.name?.toLowerCase() || '';
      const custPhone = p.customer?.phone?.toLowerCase() || p.order?.customer?.phone?.toLowerCase() || '';
      return (
        ref.includes(term) ||
        sName.includes(term) ||
        sPhone.includes(term) ||
        notes.includes(term) ||
        custName.includes(term) ||
        custPhone.includes(term)
      );
    });
  }

  let totalInflow = 0;
  let totalFees = 0;
  let completedCount = 0;
  let momoVolume = 0;
  let pendingCount = 0;
  let pendingAmount = 0;

  payments.forEach((p) => {
    const amt = Number(p.amount) || 0;
    const fee = Number(p.fee) || 0;

    if (p.status === 'completed') {
      totalInflow += amt;
      totalFees += fee;
      completedCount += 1;

      if (['mtn_momo', 'telecel_cash', 'at_money'].includes(p.provider)) {
        momoVolume += amt;
      }
    } else if (p.status === 'pending') {
      pendingCount += 1;
      pendingAmount += amt;
    }
  });

  const netInflow = totalInflow - totalFees;
  const momoPercentage = totalInflow > 0 ? Math.round((momoVolume / totalInflow) * 100) : 0;

  const metrics: PaymentMetrics = {
    totalInflow,
    netInflow,
    totalFees,
    completedCount,
    momoVolume,
    momoPercentage,
    pendingReconciliationCount: pendingCount,
    pendingReconciliationAmount: pendingAmount,
  };

  return { payments, metrics };
}
