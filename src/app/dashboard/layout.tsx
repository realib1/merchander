import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { MobileNavProvider } from './components/MobileNavContext';
import { getUnreadNotifications } from '@/app/actions/notifications';
import { sanitizeCssColor } from '@/utils';
import { isActivePlatformStaff } from '@/lib/auth/platform-staff';
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect the dashboard - redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  // If user is platform staff, redirect to platform management console
  if (await isActivePlatformStaff(supabase, user.id)) {
    redirect('/platform');
  }

  // Fetch tenant name for sidebar display and tenant_id for settings
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id, role, tenants(name), tenant_roles(permissions)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!tenantUser) {
    redirect('/login?error=no-tenant');
  }

  const userRole = tenantUser?.role || 'member';
  const tenantRoles = tenantUser?.tenant_roles as unknown as { permissions: string[] } | null;
  const permissions = tenantRoles?.permissions || [];
  const canSwitchBranch = userRole === 'owner' || userRole === 'admin' || permissions.includes('stores.switch');

  let stores: { id: string; name: string }[] = [];
  let initialActiveStoreId: string | null = null;

  if (tenantUser?.tenant_id) {
    const { data: storesData } = await supabase
      .from('stores')
      .select('id, name')
      .eq('tenant_id', tenantUser.tenant_id)
      .order('name');

    if (storesData && storesData.length > 0) {
      stores = storesData;

      // Determine active store from cookie
      const cookieStore = await cookies();
      const storeCookie = cookieStore.get('merchander_active_store')?.value;

      if (storeCookie === 'all') {
        initialActiveStoreId = 'all';
      } else if (storeCookie && stores.some((s) => s.id === storeCookie)) {
        initialActiveStoreId = storeCookie;
      } else {
        initialActiveStoreId = stores[0]?.id || null;
      }
    }
  }

  // Fetch unread notifications
  const { data: notificationsData } = await getUnreadNotifications();
  const notifications = notificationsData || [];

  const tenantData = tenantUser?.tenants as unknown as { name: string } | null;
  const businessName = tenantData?.name || 'My Business';

  let brandPrimaryColor = null;
  let brandSecondaryColor = null;
  let businessLogoUrl: string | null = null;
  let enabledModules: string[] | null = null;

  if (tenantUser?.tenant_id) {
    const [settingsRes, sfRes] = await Promise.all([
      supabase
        .from('tenant_settings')
        .select('brand_primary_color, brand_secondary_color, settings_data, enabled_modules')
        .eq('tenant_id', tenantUser.tenant_id)
        .single(),
      supabase.from('storefront_settings').select('logo_url').eq('tenant_id', tenantUser.tenant_id).single(),
    ]);

    if (settingsRes.data) {
      brandPrimaryColor = sanitizeCssColor(settingsRes.data.brand_primary_color || '');
      brandSecondaryColor = sanitizeCssColor(settingsRes.data.brand_secondary_color || '');
      enabledModules = (settingsRes.data.enabled_modules as string[]) || null;
      const custom = settingsRes.data.settings_data as Record<string, unknown> | null;
      if (custom?.logo_url) {
        businessLogoUrl = custom.logo_url as string;
      }
    }
    if (sfRes.data?.logo_url) {
      businessLogoUrl = sfRes.data.logo_url;
    }
  }

  const renderThemeStyles = () => {
    if (!brandPrimaryColor && !brandSecondaryColor) return null;

    let css = '';

    if (brandPrimaryColor) {
      css += `
        --brand-primary: ${brandPrimaryColor};
        --brand-primary-50: color-mix(in srgb, ${brandPrimaryColor} 5%, white);
        --brand-primary-100: color-mix(in srgb, ${brandPrimaryColor} 10%, white);
        --brand-primary-200: color-mix(in srgb, ${brandPrimaryColor} 30%, white);
        --brand-primary-300: color-mix(in srgb, ${brandPrimaryColor} 50%, white);
        --brand-primary-400: color-mix(in srgb, ${brandPrimaryColor} 70%, white);
        --brand-primary-500: ${brandPrimaryColor};
        --brand-primary-600: color-mix(in srgb, ${brandPrimaryColor} 85%, black);
        --brand-primary-700: color-mix(in srgb, ${brandPrimaryColor} 70%, black);
        --brand-primary-800: color-mix(in srgb, ${brandPrimaryColor} 50%, black);
        --brand-primary-900: color-mix(in srgb, ${brandPrimaryColor} 30%, black);
      `;
    }

    if (brandSecondaryColor) {
      css += `
        --brand-secondary: ${brandSecondaryColor};
      `;
    }

    return (
      <style
        dangerouslySetInnerHTML={{
          __html: `
      #tenant-theme-wrapper { ${css} }
      .dark #tenant-theme-wrapper { ${css} }
    `,
        }}
      />
    );
  };

  const meta = user.user_metadata || {};
  const metaFullName =
    meta.full_name ||
    meta.name ||
    (meta.first_name || meta.last_name ? `${meta.first_name || ''} ${meta.last_name || ''}`.trim() : null);

  const displayName =
    metaFullName ||
    (user.email
      ? user.email
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Admin User');

  let avatarUrl = meta.avatar_url || null;
  if (avatarUrl && avatarUrl.startsWith('data:')) {
    avatarUrl = null;
  }

  return (
    <MobileNavProvider>
      {renderThemeStyles()}
      <div id="tenant-theme-wrapper" className="flex h-screen bg-background  overflow-hidden">
        <Sidebar
          userEmail={user.email || ''}
          userName={displayName}
          userRole={userRole}
          avatarUrl={avatarUrl}
          businessName={businessName}
          businessLogoUrl={businessLogoUrl}
          enabledModules={enabledModules}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-background relative z-10 transition-all overflow-hidden">
          <Topbar
            user={{
              email: user.email || '',
              fullName: displayName,
              avatarUrl: avatarUrl,
              role: userRole,
            }}
            stores={stores}
            canSwitchBranch={canSwitchBranch}
            initialActiveStoreId={initialActiveStoreId}
            initialNotifications={notifications}
          />

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col custom-scrollbar">
            <div className="flex-1 w-full min-w-0">{children}</div>
            {/* Dedicated Guaranteed Bottom Breathing Room Spacer */}
            <div className="h-10 sm:h-10 shrink-0 w-full" aria-hidden="true" />
          </div>
        </main>
      </div>
    </MobileNavProvider>
  );
}
