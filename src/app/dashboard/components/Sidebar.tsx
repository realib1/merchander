'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { LifeBuoy, Settings, UserCog } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMobileNav } from './MobileNavContext';
import { toast } from 'sonner';
import { navGroups, getFilteredNavGroups } from './sidebar/sidebarNavigation';
import { SidebarUserProfile } from './sidebar/SidebarUserProfile';

export interface SidebarProps {
  userEmail: string;
  userName?: string;
  userRole?: string;
  avatarUrl?: string | null;
  businessName: string;
  businessLogoUrl?: string | null;
  enabledModules?: string[] | null;
}

export function Sidebar({
  userEmail,
  userName = 'Admin User',
  userRole = 'Owner',
  avatarUrl,
  businessName,
  businessLogoUrl,
  enabledModules,
}: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const { isOpen, setIsOpen, isDesktopCollapsed } = useMobileNav();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const toastId = toast.loading('Signing out...');
    try {
      await supabase.auth.signOut();
      toast.dismiss(toastId);
      toast.dismiss();
      window.location.replace('/login');
    } catch (err) {
      console.error('Logout error:', err);
      toast.dismiss(toastId);
      toast.error('Failed to sign out. Please try again.');
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs xl:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-separator bg-surface transition-all duration-300 ease-in-out xl:static xl:relative xl:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDesktopCollapsed ? 'xl:w-20' : 'xl:w-64'} w-64`}
      >

        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-separator/60">
          <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 min-w-0 group">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
              {businessLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={businessLogoUrl}
                  alt={`${businessName || 'Business'} Logo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src="/icon.png"
                  alt="Merchander Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                  priority
                />
              )}
            </div>
            {!isDesktopCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-display font-bold text-base tracking-tight text-foreground truncate leading-tight">
                  {businessName || 'Merchander'}
                </span>
                <span className="text-[11px] text-brand-primary font-semibold uppercase tracking-wider mt-0.5">
                  Merchander
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Grouped Navigation List */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 hide-scrollbar">
          {getFilteredNavGroups(navGroups, enabledModules).map((group) => (
            <div key={group.title} className="space-y-1">
              {!isDesktopCollapsed ? (
                <div className="text-[11px] font-bold text-muted mb-1 px-3 tracking-wider uppercase">
                  {group.title}
                </div>
              ) : (
                <div className="w-full h-px bg-separator/50 my-2" />
              )}

              {group.items.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-primary-50 text-brand-primary-700 dark:bg-brand-primary/10 dark:text-brand-primary font-semibold'
                        : 'text-muted hover:bg-surface-elevated/70 hover:text-foreground'
                    }`}
                    title={isDesktopCollapsed ? item.name : undefined}
                  >
                    <Icon
                      size={17}
                      className={`shrink-0 transition-transform group-hover:scale-105 ${
                        isActive
                          ? 'text-brand-primary-700 dark:text-brand-primary'
                          : 'text-muted group-hover:text-foreground'
                      }`}
                    />
                    {!isDesktopCollapsed && <span className="truncate flex-1">{item.name}</span>}

                    {!isDesktopCollapsed && item.badge && (
                      <span
                        className={`ml-auto px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          item.badgeType === 'accent'
                            ? 'bg-brand-primary text-white'
                            : 'bg-surface-elevated text-muted'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Secondary Account / Management Links (§07) */}
        <div className="px-3 pb-2 space-y-1">
          <Link
            href="/dashboard/staff"
            onClick={() => setIsOpen(false)}
            className={`w-full group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              pathname.startsWith('/dashboard/staff')
                ? 'bg-brand-primary-50 text-brand-primary-700 dark:bg-brand-primary/10 dark:text-brand-primary font-semibold'
                : 'text-muted hover:bg-surface-elevated/70 hover:text-foreground'
            }`}
            title={isDesktopCollapsed ? 'Staff' : undefined}
          >
            <UserCog
              size={17}
              className={`shrink-0 transition-colors ${
                pathname.startsWith('/dashboard/staff')
                  ? 'text-brand-primary-700 dark:text-brand-primary'
                  : 'text-muted group-hover:text-foreground'
              }`}
            />
            {!isDesktopCollapsed && <span className="truncate">Staff</span>}
          </Link>

          <Link
            href="/dashboard/settings"
            onClick={() => setIsOpen(false)}
            className={`w-full group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              pathname.startsWith('/dashboard/settings')
                ? 'bg-brand-primary-50 text-brand-primary-700 dark:bg-brand-primary/10 dark:text-brand-primary font-semibold'
                : 'text-muted hover:bg-surface-elevated/70 hover:text-foreground'
            }`}
            title={isDesktopCollapsed ? 'Settings' : undefined}
          >
            <Settings
              size={17}
              className={`shrink-0 transition-colors ${
                pathname.startsWith('/dashboard/settings')
                  ? 'text-brand-primary-700 dark:text-brand-primary'
                  : 'text-muted group-hover:text-foreground'
              }`}
            />
            {!isDesktopCollapsed && <span className="truncate">Settings</span>}
          </Link>

          <Link
            href="/dashboard/help"
            onClick={() => setIsOpen(false)}
            className={`w-full group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              pathname === '/dashboard/help'
                ? 'bg-brand-primary-50 text-brand-primary-700 dark:bg-brand-primary/10 dark:text-brand-primary font-semibold'
                : 'text-muted hover:bg-surface-elevated/70 hover:text-foreground'
            }`}
            title={isDesktopCollapsed ? 'Help & Support' : undefined}
          >
            <LifeBuoy
              size={17}
              className={`shrink-0 transition-colors ${
                pathname === '/dashboard/help'
                  ? 'text-brand-primary-700 dark:text-brand-primary'
                  : 'text-muted group-hover:text-foreground'
              }`}
            />
            {!isDesktopCollapsed && (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="truncate">Help & Support</span>
              </div>
            )}
          </Link>
        </div>

        {/* Current User Profile Card & Sign Out */}
        <SidebarUserProfile
          isDesktopCollapsed={isDesktopCollapsed}
          userEmail={userEmail}
          userName={userName}
          userRole={userRole}
          avatarUrl={avatarUrl}
          isLoggingOut={isLoggingOut}
          onLogout={handleLogout}
          onNavigate={() => setIsOpen(false)}
        />
      </aside>
    </>
  );
}
