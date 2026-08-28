'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { CreateExpenseInput, UpdateExpenseInput } from '@/types/expenses';

const expenseSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().min(1).default('GHS'),
  category: z.string().min(1, 'Category is required'),
  payment_method: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date required'),
  store_id: z.string().uuid().nullable().optional(),
  receipt_url: z.string().url().nullable().optional(),
});

export async function createExpense(data: CreateExpenseInput) {
  // Validate input securely
  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Invalid input data');
  }

  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Not authenticated');
  }

  const { data: tenantUsers, error: tenantError } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', userData.user.id)
    .single();

  if (tenantError || !tenantUsers) {
    throw new Error('No tenant found for user');
  }

  const { error } = await supabase.from('expenses').insert({
    ...parsed.data,
    tenant_id: tenantUsers.tenant_id,
  });

  if (error) {
    console.error('Error creating expense:', error);
    throw new Error('Failed to create expense: ' + error.message);
  }

  revalidatePath('/dashboard/expenses');
  return { success: true };
}

export async function updateExpense(id: string, data: UpdateExpenseInput) {
  if (!id) throw new Error('Invalid ID');
  const parsed = expenseSchema.partial().safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Invalid input data');
  }

  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Not authenticated');
  }

  const { data: tenantUsers, error: tenantError } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', userData.user.id)
    .single();

  if (tenantError || !tenantUsers) {
    throw new Error('No tenant found for user');
  }

  const { error } = await supabase
    .from('expenses')
    .update(parsed.data)
    .eq('id', id)
    .eq('tenant_id', tenantUsers.tenant_id);

  if (error) {
    console.error('Error updating expense:', error);
    throw new Error('Failed to update expense: ' + error.message);
  }

  revalidatePath('/dashboard/expenses');
  return { success: true };
}

export async function deleteExpense(id: string) {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid ID');
  }

  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error('Not authenticated');
  }

  const { data: tenantUsers, error: tenantError } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', userData.user.id)
    .single();

  if (tenantError || !tenantUsers) {
    throw new Error('No tenant found for user');
  }

  const { error } = await supabase.from('expenses').delete().eq('id', id).eq('tenant_id', tenantUsers.tenant_id);

  if (error) {
    console.error('Error deleting expense:', error);
    throw new Error('Failed to delete expense: ' + error.message);
  }

  revalidatePath('/dashboard/expenses');
  return { success: true };
}
