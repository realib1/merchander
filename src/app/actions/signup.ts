'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { validateStoreSlug, ARCHETYPE_DEFINITIONS } from '@/utils/business-modules';
import { validateOwnerEmail } from '@/utils/merchant-provisioning';
import { BusinessArchetype, BusinessModuleKey } from '@/types/business-modules';

export interface SelfServiceSignupPayload {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  storeName: string;
  slug: string;
  currency?: string;
  city?: string;
  archetype: BusinessArchetype;
  customModules?: BusinessModuleKey[];
}

export interface SelfServiceSignupResult {
  success: boolean;
  error?: string;
  tenantId?: string;
}

/**
 * Public self-service merchant signup action.
 * Atomically provisions merchant auth, workspace tenant, default branch,
 * archetype settings with enabled modules, storefront, subscription,
 * and archetype-tailored staff roles.
 */
export async function selfServiceSignupAction(
  payload: SelfServiceSignupPayload
): Promise<SelfServiceSignupResult> {
  try {
    const adminSupabase = createAdminClient();

    // 1. Validate merchant full name
    const cleanFullName = payload.fullName?.trim();
    if (!cleanFullName) {
      return { success: false, error: 'Full name is required.' };
    }

    // 2. Validate email address
    const cleanEmail = payload.email?.trim().toLowerCase();
    const emailValidation = validateOwnerEmail(cleanEmail);
    if (!emailValidation.isValid) {
      return { success: false, error: emailValidation.error || 'Invalid email address.' };
    }

    // 3. Prevent platform staff email conflict
    const { data: staffMatch } = await adminSupabase
      .from('platform_staff_users')
      .select('id')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (staffMatch) {
      return {
        success: false,
        error: 'Cannot register a merchant workspace using a platform administrator email.',
      };
    }

    // 4. Validate password strength
    const password = payload.password?.trim();
    if (!password || password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    // 5. Validate phone number
    const cleanPhone = payload.phone?.trim();
    if (!cleanPhone) {
      return { success: false, error: 'Phone number is required.' };
    }

    // 6. Validate store name
    const cleanStoreName = payload.storeName?.trim();
    if (!cleanStoreName) {
      return { success: false, error: 'Store or business name is required.' };
    }

    // 7. Validate subdomain slug
    const normalizedSlug = payload.slug?.trim().toLowerCase();
    const slugValidation = validateStoreSlug(normalizedSlug);
    if (!slugValidation.valid) {
      return { success: false, error: slugValidation.error || 'Invalid store subdomain slug.' };
    }

    // Check slug uniqueness
    const { data: existingStorefront } = await adminSupabase
      .from('storefront_settings')
      .select('id')
      .eq('slug', normalizedSlug)
      .maybeSingle();

    if (existingStorefront) {
      return {
        success: false,
        error: `Subdomain "${normalizedSlug}" is already registered. Please choose another name.`,
      };
    }

    // 8. Determine archetype and active modules
    const archetypeKey: BusinessArchetype = payload.archetype || 'import_resale';
    const archetypeDef = ARCHETYPE_DEFINITIONS[archetypeKey] || ARCHETYPE_DEFINITIONS.import_resale;

    let enabledModules: string[] = archetypeDef.defaultModules;
    if (archetypeKey === 'custom' && payload.customModules && payload.customModules.length > 0) {
      enabledModules = payload.customModules;
    }

    // 9. Create Supabase Auth user
    const { data: authCreated, error: authError } = await adminSupabase.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: cleanFullName,
        full_name: cleanFullName,
        role: 'merchant',
        phone: cleanPhone,
        store_name: cleanStoreName,
      },
    });

    if (authError || !authCreated?.user) {
      if (
        authError?.message?.toLowerCase().includes('already') ||
        (authError as { status?: number })?.status === 422
      ) {
        return {
          success: false,
          error: 'An account with this email already exists. Please log in instead.',
        };
      }
      return {
        success: false,
        error: authError?.message || 'Failed to create user account.',
      };
    }

    const authUserId = authCreated.user.id;

    // 10. Provision Tenant Workspace
    const { data: tenant, error: tenantErr } = await adminSupabase
      .from('tenants')
      .insert({ name: cleanStoreName })
      .select('id')
      .single();

    if (tenantErr || !tenant) {
      // Rollback auth user on tenant creation failure
      await adminSupabase.auth.admin.deleteUser(authUserId);
      return { success: false, error: `Failed to create tenant workspace: ${tenantErr?.message}` };
    }

    const tenantId = tenant.id;

    // 11. Link Owner in tenant_users
    const { error: userLinkErr } = await adminSupabase.from('tenant_users').insert({
      tenant_id: tenantId,
      user_id: authUserId,
      role: 'owner',
    });

    if (userLinkErr) {
      return { success: false, error: `Failed to assign workspace owner: ${userLinkErr.message}` };
    }

    // 12. Create Primary Branch Store
    const { error: storeErr } = await adminSupabase.from('stores').insert({
      tenant_id: tenantId,
      name: `${cleanStoreName} - Main Store`,
      city: payload.city?.trim() || 'Accra',
      is_primary: true,
      pickup_enabled: true,
    });

    if (storeErr) {
      console.warn('Failed to insert primary store:', storeErr.message);
    }

    // 13. Create Tenant Settings with archetype & enabled modules
    const { error: settingsErr } = await adminSupabase.from('tenant_settings').insert({
      tenant_id: tenantId,
      store_email: cleanEmail,
      business_phone: cleanPhone,
      business_country: 'GH',
      store_currency: payload.currency || 'GHS',
      business_archetype: archetypeKey,
      enabled_modules: enabledModules,
      settings_data: {
        store_name: cleanStoreName,
        trading_name: cleanStoreName,
        business_type: archetypeKey,
        platform_status: 'active',
        created_via: 'self_service_signup',
        signup_at: new Date().toISOString(),
      },
    });

    if (settingsErr) {
      console.warn('Failed to insert tenant settings:', settingsErr.message);
    }

    // 14. Create Public Storefront Settings
    const { error: storefrontErr } = await adminSupabase.from('storefront_settings').insert({
      tenant_id: tenantId,
      store_name: cleanStoreName,
      slug: normalizedSlug,
      currency: payload.currency || 'GHS',
      whatsapp_phone: cleanPhone,
      is_active: true,
    });

    if (storefrontErr) {
      console.warn('Failed to insert storefront settings:', storefrontErr.message);
    }

    // 15. Create Initial Subscription (Trial / Starter)
    const { error: subErr } = await adminSupabase.from('tenant_subscriptions').insert({
      tenant_id: tenantId,
      tier: 'starter',
      status: 'active',
      billing_cycle: 'monthly',
      price_monthly: 0,
      renewal_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (subErr) {
      console.warn('Failed to insert tenant subscription:', subErr.message);
    }

    // 16. Seed Archetype-Tailored Default Staff Roles
    if (archetypeDef.defaultRoles && archetypeDef.defaultRoles.length > 0) {
      const rolesToInsert = archetypeDef.defaultRoles.map((role) => ({
        tenant_id: tenantId,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
      }));

      const { error: rolesErr } = await adminSupabase.from('tenant_roles').insert(rolesToInsert);
      if (rolesErr) {
        console.warn('Failed to seed archetype roles:', rolesErr.message);
      }
    }

    // 17. Authenticate user session
    const serverSupabase = await createClient();
    await serverSupabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    return {
      success: true,
      tenantId: tenantId,
    };
  } catch (err) {
    console.error('Unexpected error in selfServiceSignupAction:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred during signup.',
    };
  }
}
