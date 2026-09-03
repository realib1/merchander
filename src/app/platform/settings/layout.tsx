import { ReactNode } from 'react';
import { verifyPlatformStaff } from '@/app/actions/platform';
import { PLATFORM_RBAC_RULES } from '@/lib/auth/platform-staff';
import { PlatformSettingsSidebar } from './components/PlatformSettingsSidebar';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Global Settings | Platform Console',
};

export default async function PlatformSettingsLayout({ children }: { children: ReactNode }) {
  try {
    await verifyPlatformStaff(PLATFORM_RBAC_RULES['/platform/settings']);
  } catch {
    redirect('/platform');
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">Global Settings</h1>
        <p className="text-sm text-muted max-w-2xl">
          Configure platform-wide defaults, branding, third-party integrations, and master controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 lg:gap-8 items-start">
        {/* Left Sidebar */}
        <aside className="sticky top-6 hidden md:block">
          <PlatformSettingsSidebar />
        </aside>
        
        {/* Mobile Sidebar (shown only below md) */}
        <div className="md:hidden">
          <PlatformSettingsSidebar />
        </div>

        {/* Right Content */}
        <main className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
