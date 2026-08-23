'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { CreateExpenseInput, UpdateExpenseInput } from '@/types/expenses';

const expenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(1),
  category: z.string().min(1),
  description: z.string().nullable(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  store_id: z.string().uuid().nullable().optional(),
  receipt_url: z.string().url().nullable().optional(),
});

export async function createExpense(data: CreateExpenseInput) {
  // Validate input securely
  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Invalid input data');
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
    .insert({
      ...parsed.data,
      tenant_id: tenantUsers.tenant_id,
    });

  if (error) {
    console.error('Error creating expense:', error);
    throw new Error('Failed to create expense');
  }

  revalidatePath('/dashboard/expenses');
  return { success: true };
}

export async function updateExpense(id: string, data: UpdateExpenseInput) {
  // Validate input securely (partial)
  const parsed = expenseSchema.partial().safeParse(data);
  if (!parsed.success) {
    throw new Error('Invalid input data');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('expenses')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    console.error('Error updating expense:', error);
    throw new Error('Failed to update expense');
  }

  revalidatePath('/dashboard/expenses');
  return { success: true };
}

export async function deleteExpense(id: string) {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid ID');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting expense:', error);
    throw new Error('Failed to delete expense');
  }

  revalidatePath('/dashboard/expenses');
  return { success: true };
}
