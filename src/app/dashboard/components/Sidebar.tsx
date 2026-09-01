'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { LifeBuoy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMobileNav } from './MobileNavContext';
import { toast } from 'sonner';
import { navGroups } from './sidebar/sidebarNavigation';
import { SidebarUserProfile } from './sidebar/SidebarUserProfile';

export interface SidebarProps {
  userEmail: string;
  userName?: string;
  userRole?: string;
  avatarUrl?: string | null;
  businessName: string;
  businessLogoUrl?: string | null;
}

export function Sidebar({
  userEmail,
  userName = 'Admin User',
  userRole = 'Owner',
  avatarUrl,
  businessName,
  businessLogoUrl,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { isOpen, setIsOpen, isDesktopCollapsed } = useMobileNav();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      toast.loading('Signing out...');
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-separator/60 bg-surface/50 backdrop-blur-xl transition-all duration-300 ease-in-out xl:static xl:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDesktopCollapsed ? 'xl:w-20' : 'xl:w-64'} w-64`}
      >
        {/* Brand Header */}
        <div className="flex h-18 shrink-0 items-center justify-between px-4 border-b border-separator/60">
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
                <span className="font-display font-bold text-sm tracking-tight text-foreground truncate leading-tight">
                  {businessName || 'Merchander'}
                </span>
                <span className="text-[10px] text-brand-primary/80 font-semibold uppercase tracking-widest mt-0.5">
                  MerchanderOS
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Grouped Navigation List */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 hide-scrollbar">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isDesktopCollapsed ? (
                <div className="text-[10px] font-bold text-muted/80 mb-1 px-3 tracking-widest uppercase">
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
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-primary/10 text-brand-primary font-bold shadow-2xs'
                        : 'text-muted hover:bg-surface-elevated/70 hover:text-foreground'
                    }`}
                    title={isDesktopCollapsed ? item.name : undefined}
                  >
                    <Icon
                      size={17}
                      className={`shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-brand-primary' : 'text-muted group-hover:text-foreground'
                      }`}
                    />
                    {!isDesktopCollapsed && <span className="truncate flex-1">{item.name}</span>}

                    {!isDesktopCollapsed && item.badge && (
                      <span
                        className={`ml-auto px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          item.badgeType === 'accent'
                            ? 'bg-brand-primary text-white shadow-2xs'
                            : 'bg-surface-elevated text-muted'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-brand-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Help & Support Page Link */}
        <div className="px-3 pb-2">
          <Link
            href="/dashboard/help"
            onClick={() => setIsOpen(false)}
            className={`w-full group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
              pathname === '/dashboard/help'
                ? 'bg-brand-primary text-white shadow-xs'
                : 'text-muted hover:bg-surface-elevated/70 hover:text-foreground'
            }`}
            title={isDesktopCollapsed ? 'Help & Support' : undefined}
          >
            <LifeBuoy
              size={17}
              className={`shrink-0 transition-colors ${
                pathname === '/dashboard/help' ? 'text-white' : 'text-muted group-hover:text-brand-primary'
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
