'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Payment, PaymentMetrics, CreatePaymentInput, ReconcileMoMoInput, RefundPaymentInput } from '@/types/payments';
import { extractMomoReference } from '@/utils/momo';
import { updateOrderStatus } from './orders';
import { fetchPaymentsWithMetrics, GetPaymentsOptions } from './payments-query';

export type { GetPaymentsOptions };

const CreatePaymentSchema = z.object({
  order_id: z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid().optional().nullable(),
  provider: z.enum([
    'mtn_momo',
    'telecel_cash',
    'at_money',
    'cash_on_delivery',
    'cash',
    'bank_transfer',
    'card',
    'hubtel',
    'paystack',
  ]),
  transaction_ref: z.string().optional().nullable(),
  amount: z.number().positive({ message: 'Amount must be greater than 0' }),
  fee: z.number().min(0).default(0),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).default('completed'),
  sender_phone: z.string().optional().nullable(),
  sender_name: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  payment_date: z.string().optional(),
});

export async function getPayments(options: GetPaymentsOptions = {}): Promise<{
  payments: Payment[];
  metrics: PaymentMetrics;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) {
    throw new Error('Tenant not found');
  }

  return fetchPaymentsWithMetrics(supabase, tenantUser.tenant_id, options);
}

export async function recordPayment(input: CreatePaymentInput): Promise<Payment> {
  const validated = CreatePaymentSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) throw new Error('Tenant not found');
  const tenantId = tenantUser.tenant_id;

  const fee = validated.fee || 0;
  const netAmount = validated.amount - fee;

  const insertPayload = {
    tenant_id: tenantId,
    order_id: validated.order_id || null,
    customer_id: validated.customer_id || null,
    provider: validated.provider,
    transaction_ref: validated.transaction_ref?.trim() || null,
    amount: validated.amount,
    fee: fee,
    net_amount: netAmount,
    status: validated.status,
    sender_phone: validated.sender_phone?.trim() || null,
    sender_name: validated.sender_name?.trim() || null,
    notes: validated.notes?.trim() || null,
    recorded_by: user.id,
    payment_date: validated.payment_date || new Date().toISOString(),
  };

  let data;
  const { data: inserted, error } = await supabase.from('payments').insert(insertPayload).select().single();

  if (error) {
    if (error.code === '42703') {
      const basicPayload = {
        tenant_id: tenantId,
        order_id: validated.order_id || null,
        provider: validated.provider,
        transaction_ref: validated.transaction_ref?.trim() || null,
        amount: validated.amount,
        status: validated.status,
      };
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('payments')
        .insert(basicPayload)
        .select()
        .single();
      if (fallbackError) {
        if (fallbackError.code === '23505') {
          throw new Error('A payment with this transaction reference already exists in your account.');
        }
        throw new Error(`Failed to record payment: ${fallbackError.message}`);
      }
      data = fallbackData;
    } else if (error.code === '23505') {
      throw new Error('A payment with this transaction reference already exists in your account.');
    } else {
      throw new Error(`Failed to record payment: ${error.message}`);
    }
  } else {
    data = inserted;
  }

  if (validated.order_id && validated.status === 'completed') {
    try {
      await updateOrderStatus(validated.order_id, 'paid');
    } catch {
      // Ignore order transition error if already updated
    }
  }

  revalidatePath('/dashboard/payments');
  revalidatePath('/dashboard/orders');
  revalidatePath('/dashboard');
  return data as Payment;
}

export async function reconcileMoMoPaymentAction(input: ReconcileMoMoInput): Promise<{
  success: boolean;
  transactionRef: string;
  payment: Payment;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) throw new Error('Tenant not found');
  const tenantId = tenantUser.tenant_id;

  const transactionRef = extractMomoReference(input.sms_text);
  if (!transactionRef) {
    throw new Error('Could not extract a valid transaction reference from the provided SMS text.');
  }

  const provider = input.provider || 'mtn_momo';
  const insertPayload = {
    tenant_id: tenantId,
    order_id: input.order_id || null,
    provider: provider,
    transaction_ref: transactionRef,
    amount: input.amount_paid,
    fee: 0,
    net_amount: input.amount_paid,
    status: 'completed' as const,
    notes: `Reconciled via SMS: ${input.sms_text.substring(0, 80)}...`,
    recorded_by: user.id,
    payment_date: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('payments').insert(insertPayload).select().single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Transaction reference "${transactionRef}" has already been recorded.`);
    }
    throw new Error(`Failed to reconcile payment: ${error.message}`);
  }

  if (input.order_id) {
    await updateOrderStatus(input.order_id, 'paid');
  }

  revalidatePath('/dashboard/payments');
  revalidatePath('/dashboard/orders');
  return { success: true, transactionRef, payment: data as Payment };
}

export async function refundPaymentAction(input: RefundPaymentInput): Promise<Payment> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) throw new Error('Tenant not found');

  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'refunded',
      refund_reason: input.refund_reason,
      refunded_at: new Date().toISOString(),
    })
    .eq('id', input.payment_id)
    .eq('tenant_id', tenantUser.tenant_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to refund payment: ${error.message}`);
  }

  revalidatePath('/dashboard/payments');
  return data as Payment;
}

export async function deletePaymentAction(paymentId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) throw new Error('Tenant not found');

  const { error } = await supabase.from('payments').delete().eq('id', paymentId).eq('tenant_id', tenantUser.tenant_id);

  if (error) {
    throw new Error(`Failed to delete payment: ${error.message}`);
  }

  revalidatePath('/dashboard/payments');
  return true;
}

export async function getUnpaidOrdersForPayment(): Promise<
  Array<{
    id: string;
    total_amount: number;
    customer_id: string;
    customer_name: string;
    customer_phone: string;
  }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: tenantUser } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

  if (!tenantUser) return [];

  const { data } = await supabase
    .from('orders')
    .select(
      `
      id,
      total_amount,
      customer_id,
      customer:customers (
        name,
        phone
      )
    `
    )
    .eq('tenant_id', tenantUser.tenant_id)
    .in('status', ['draft', 'pending_payment'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (!data) return [];

  return (data || []).map((order) => {
    const cust = Array.isArray(order.customer) ? order.customer[0] : order.customer;
    return {
      id: String(order.id),
      total_amount: Number(order.total_amount) || 0,
      customer_id: String(order.customer_id),
      customer_name: cust?.name || 'Walk-in Customer',
      customer_phone: cust?.phone || '',
    };
  });
}
