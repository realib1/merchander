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

async function main() {
  console.log('Seeding Platform Staff and Merchant accounts...');

  // 1. Platform Staff: admin@merchander.com
  const adminEmail = 'admin@merchander.com';
  const adminPassword = 'admin123';
  const adminId = 'f9e8d7c6-0000-0000-0000-000000000000';

  const { data: userList } = await adminSupabase.auth.admin.listUsers();
  const existingAdmin = userList?.users.find((u) => u.email === adminEmail);

  let realAdminId = adminId;
  if (existingAdmin) {
    realAdminId = existingAdmin.id;
    console.log(`Updating existing admin user ${adminEmail} (ID: ${realAdminId})...`);
    await adminSupabase.auth.admin.updateUserById(realAdminId, {
      password: adminPassword,
      email_confirm: true,
      app_metadata: { is_superadmin: true, provider: 'email', providers: ['email'] },
      user_metadata: { name: 'Platform Owner', role: 'platform_owner' },
    });
  } else {
    console.log(`Creating platform staff user ${adminEmail}...`);
    const { data: createdAdmin, error: createAdminErr } = await adminSupabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      app_metadata: { is_superadmin: true, provider: 'email', providers: ['email'] },
      user_metadata: { name: 'Platform Owner', role: 'platform_owner' },
    });
    if (createAdminErr) console.error('Error creating admin:', createAdminErr);
    if (createdAdmin) realAdminId = createdAdmin.user.id;
  }

  // Insert into platform_staff_users
  const { error: staffErr } = await adminSupabase.from('platform_staff_users').upsert(
    {
      user_id: realAdminId,
      email: adminEmail,
      role: 'platform_owner',
      is_active: true,
      mfa_enabled: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (staffErr) {
    console.error('Error upserting platform_staff_users:', staffErr);
  } else {
    console.log('Successfully upserted platform_staff_users record for admin@merchander.com');
  }

  // Ensure admin is NOT in tenant_users (strict separation)
  await adminSupabase.from('tenant_users').delete().eq('user_id', realAdminId);

  // 2. Merchant: uniquefashion@merchander.com (Unique Fashion)
  const merchantEmail = 'uniquefashion@merchander.com';
  const merchantPassword = 'merchant123';
  const merchantId = 'a2b3c4d5-0000-0000-0000-000000000000';
  const tenantId = '12000000-0000-0000-0000-000000000000';
  const storeId = '22000000-0000-0000-0000-000000000000';

  const existingMerchant = userList?.users.find((u) => u.email === merchantEmail);
  let realMerchantId = merchantId;

  if (existingMerchant) {
    realMerchantId = existingMerchant.id;
    console.log(`Updating existing merchant user ${merchantEmail} (ID: ${realMerchantId})...`);
    await adminSupabase.auth.admin.updateUserById(realMerchantId, {
      password: merchantPassword,
      email_confirm: true,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { name: 'Unique Fashion Owner', role: 'merchant' },
    });
  } else {
    console.log(`Creating merchant user ${merchantEmail}...`);
    const { data: createdMerchant, error: createMerchErr } = await adminSupabase.auth.admin.createUser({
      email: merchantEmail,
      password: merchantPassword,
      email_confirm: true,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { name: 'Unique Fashion Owner', role: 'merchant' },
    });
    if (createMerchErr) console.error('Error creating merchant:', createMerchErr);
    if (createdMerchant) realMerchantId = createdMerchant.user.id;
  }

  // Upsert Tenant: Unique Fashion
  const { error: tenantErr } = await adminSupabase.from('tenants').upsert(
    {
      id: tenantId,
      name: 'Unique Fashion',
    },
    { onConflict: 'id' }
  );
  if (tenantErr) {
    console.error('Error upserting tenant:', tenantErr);
  } else {
    console.log('Successfully upserted tenant: Unique Fashion');
  }

  // Upsert Store
  const { error: storeErr } = await adminSupabase.from('stores').upsert(
    {
      id: storeId,
      tenant_id: tenantId,
      name: 'Main Branch - Accra',
      location: 'Accra Mall, Tetteh Quarshie',
      is_primary: true,
    },
    { onConflict: 'id' }
  );
  if (storeErr) {
    console.error('Error upserting store:', storeErr);
  } else {
    console.log('Successfully upserted store: Main Branch - Accra');
  }

  // Upsert Tenant User Link
  const { error: linkErr } = await adminSupabase.from('tenant_users').upsert(
    {
      tenant_id: tenantId,
      user_id: realMerchantId,
      role: 'owner',
    },
    { onConflict: 'tenant_id,user_id' }
  );
  if (linkErr) {
    console.error('Error linking tenant user:', linkErr);
  } else {
    console.log('Successfully linked merchant user to Unique Fashion tenant');
  }

  // Upsert Tenant Settings
  const { error: settingsErr } = await adminSupabase.from('tenant_settings').upsert(
    {
      tenant_id: tenantId,
      store_email: merchantEmail,
      business_phone: '+233244000111',
      business_country: 'Ghana',
      store_currency: 'GHS',
      settings_data: {
        store_name: 'Unique Fashion',
        slug: 'unique-fashion',
        tagline: 'Curated streetwear and luxury Ghanaian fashion',
        instagram: '@uniquefashiongh',
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'tenant_id' }
  );
  if (settingsErr) {
    console.error('Error upserting tenant_settings:', settingsErr);
  } else {
    console.log('Successfully upserted tenant_settings for Unique Fashion');
  }

  // Upsert Tenant Subscription
  const { error: subErr } = await adminSupabase.from('tenant_subscriptions').upsert(
    {
      tenant_id: tenantId,
      tier: 'starter',
      billing_cycle: 'monthly',
      status: 'active',
      price_monthly: 0.0,
      renewal_date: null,
      payment_method: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'tenant_id' }
  );
  if (subErr) {
    console.error('Error upserting tenant_subscriptions:', subErr);
  } else {
    console.log('Successfully upserted tenant_subscriptions for Unique Fashion');
  }

  console.log('\n=============================================');
  console.log('--- ALL ACCOUNTS SEEDED & ISOLATED SUCCESSFULLY ---');
  console.log('1. Platform / Dev Management Account:');
  console.log('   Email: admin@merchander.com');
  console.log('   Password: admin123');
  console.log('   Role: platform_owner');
  console.log('   Destination: /platform');
  console.log('\n2. Merchant Store Account:');
  console.log('   Email: uniquefashion@merchander.com');
  console.log('   Password: merchant123');
  console.log('   Store: Unique Fashion');
  console.log('   Destination: /dashboard');
  console.log('=============================================\n');
}

main().catch(console.error);
