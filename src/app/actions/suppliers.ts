'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getSuppliers() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { data: [], error: null };

  const { data: tenantUsers } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', userData.user.id)
    .single();

  if (!tenantUsers) return { data: [], error: null };

  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('tenant_id', tenantUsers.tenant_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching suppliers:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function createSupplier(formData: FormData) {
  const supabase = await createClient();

  // Get tenant ID
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { data: null, error: 'Not authenticated' };

  const { data: tenantUsers } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', userData.user.id)
    .single();

  if (!tenantUsers) return { data: null, error: 'No tenant found' };

  const name = formData.get('name') as string;
  const contact_name = formData.get('contact_name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const country = formData.get('country') as string;

  const { data, error } = await supabase
    .from('suppliers')
    .insert([
      {
        name,
        contact_name,
        email,
        phone,
        country,
        tenant_id: tenantUsers.tenant_id,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating supplier:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/dashboard/suppliers');
  return { data, error: null };
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: 'Not authenticated' };

  const { data: tenantUsers } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', userData.user.id)
    .single();

  if (!tenantUsers) return { error: 'No tenant found' };

  const { error } = await supabase.from('suppliers').delete().eq('id', id).eq('tenant_id', tenantUsers.tenant_id);

  if (error) {
    console.error('Error deleting supplier:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/suppliers');
  return { error: null };
}

export async function recordSupplierPayment(formData: FormData) {
  const supabase = await createClient();

  const supplier_id = formData.get('supplier_id') as string;
  const amountStr = formData.get('amount') as string;
  const payment_date = formData.get('payment_date') as string;
  const payment_method = formData.get('payment_method') as string;
  const reference_number = formData.get('reference_number') as string;
  const notes = formData.get('notes') as string;

  if (!supplier_id || !amountStr || !payment_date || !payment_method) {
    return { error: 'Missing required fields' };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Invalid amount' };
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: 'Not authenticated' };

  const { data: tenantUsers } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', userData.user.id)
    .single();

  if (!tenantUsers) return { error: 'No tenant found' };

  // 1. Get current supplier balance
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .select('outstanding_balance')
    .eq('id', supplier_id)
    .eq('tenant_id', tenantUsers.tenant_id)
    .single();

  if (supplierError || !supplier) {
    return { error: 'Supplier not found' };
  }

  const newBalance = Number(supplier.outstanding_balance) - amount;

  // 2. Insert payment record
  const { error: paymentError } = await supabase.from('supplier_payments').insert([
    {
      tenant_id: tenantUsers.tenant_id,
      supplier_id,
      amount,
      payment_date,
      payment_method,
      reference_number: reference_number || null,
      notes: notes || null,
    },
  ]);

  if (paymentError) {
    console.error('Error recording payment:', paymentError);
    return { error: paymentError.message };
  }

  // 3. Update supplier balance
  const { error: updateError } = await supabase
    .from('suppliers')
    .update({ outstanding_balance: newBalance })
    .eq('id', supplier_id)
    .eq('tenant_id', tenantUsers.tenant_id);

  if (updateError) {
    console.error('Error updating supplier balance:', updateError);
    return { error: 'Payment recorded, but failed to update supplier balance.' };
  }

  revalidatePath('/dashboard/suppliers');
  return { error: null };
}
