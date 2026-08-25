import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { MobileNavProvider } from './components/MobileNavContext';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect the dashboard - redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Fetch tenant name for sidebar display and tenant_id for settings
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id, tenants(name)')
    .eq('user_id', user.id)
    .single();

  const tenantData = tenantUser?.tenants as unknown as { name: string } | null;
  const businessName = tenantData?.name || 'My Business';

  let brandPrimaryColor = null;
  let brandSecondaryColor = null;

  if (tenantUser?.tenant_id) {
    const { data: settings } = await supabase
      .from('tenant_settings')
      .select('brand_primary_color, brand_secondary_color')
      .eq('tenant_id', tenantUser.tenant_id)
      .single();

    if (settings) {
      brandPrimaryColor = settings.brand_primary_color;
      brandSecondaryColor = settings.brand_secondary_color;
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

  return (
    <MobileNavProvider>
      {renderThemeStyles()}
      <div id="tenant-theme-wrapper" className="flex h-screen bg-background  overflow-hidden">
        <Sidebar userEmail={user.email || ''} businessName={businessName} />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-background relative z-10 transition-all overflow-hidden">
          <Topbar />

          <div className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-24 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </MobileNavProvider>
  );
}
