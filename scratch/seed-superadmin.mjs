import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedSuperadmin() {
  const email = 'superadmin@merchander.com';
  const password = 'superadmin123';

  console.log(`Checking superadmin user: ${email}...`);

  // 1. Check if user already exists
  const { data: userList, error: listErr } = await adminSupabase.auth.admin.listUsers();
  if (listErr) {
    console.error('Error listing users:', listErr);
    process.exit(1);
  }

  const existing = userList.users.find((u) => u.email === email);

  if (existing) {
    console.log(`User ${email} already exists (ID: ${existing.id}). Updating app_metadata...`);
    const { data: updated, error: updateErr } = await adminSupabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      app_metadata: {
        ...existing.app_metadata,
        is_superadmin: true,
        provider: 'email',
        providers: ['email'],
      },
      user_metadata: {
        ...existing.user_metadata,
        name: 'Superadmin',
        role: 'superadmin',
      },
    });

    if (updateErr) {
      console.error('Error updating superadmin:', updateErr);
      process.exit(1);
    }

    console.log('Successfully updated superadmin user:', updated.user.email);
    console.log('is_superadmin flag:', updated.user.app_metadata.is_superadmin);
  } else {
    console.log(`Creating new superadmin user ${email}...`);
    const { data: created, error: createErr } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        is_superadmin: true,
        provider: 'email',
        providers: ['email'],
      },
      user_metadata: {
        name: 'Superadmin',
        role: 'superadmin',
      },
    });

    if (createErr) {
      console.error('Error creating superadmin:', createErr);
      process.exit(1);
    }

    console.log('Successfully created superadmin user:', created.user.email);
    console.log('ID:', created.user.id);
    console.log('is_superadmin flag:', created.user.app_metadata.is_superadmin);
  }

  // 2. Ensure superadmin has tenant membership in Afia's Boutique for testing /dashboard
  const superadminId = existing?.id || 'f9e8d7c6-0000-0000-0000-000000000000';
  const defaultTenantId = '11000000-0000-0000-0000-000000000000';

  const { data: tenantRecord } = await adminSupabase
    .from('tenants')
    .select('id')
    .eq('id', defaultTenantId)
    .maybeSingle();

  if (tenantRecord) {
    console.log(`Linking superadmin ${superadminId} to tenant ${defaultTenantId}...`);
    const { error: linkErr } = await adminSupabase
      .from('tenant_users')
      .upsert(
        {
          tenant_id: defaultTenantId,
          user_id: superadminId,
          role: 'owner',
        },
        { onConflict: 'tenant_id,user_id' }
      );

    if (linkErr) {
      console.error('Error linking tenant user:', linkErr);
    } else {
      console.log('Successfully linked superadmin to default tenant!');
    }
  }

  console.log('\n--- Credentials ---');
  console.log('Email: superadmin@merchander.com');
  console.log('Password: superadmin123');
  console.log('Role: God Mode / Superadmin');
  console.log('Route: /superadmin');
}

seedSuperadmin();
