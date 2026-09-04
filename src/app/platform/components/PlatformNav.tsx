'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Tags,
  TrendingUp,
  Globe,
  LifeBuoy,
  Megaphone,
  ShieldCheck,
  Activity,
  History,
  LogOut,
  X,
  Shield,
  Settings,
} from 'lucide-react';
import { useMobileNav } from '@/app/dashboard/components/MobileNavContext';
import { PlatformRole } from '@/types/platform';
import { PLATFORM_RBAC_RULES } from '@/lib/auth/platform-staff';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface PlatformNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  exact?: boolean;
  badge?: string;
}

interface PlatformNavSection {
  group: string;
  items: PlatformNavItem[];
}

interface PlatformNavProps {
  userEmail?: string;
  userRole?: PlatformRole | string;
  openTicketsCount?: number;
  activeIncidentsCount?: number;
}

export function PlatformNav({
  userEmail,
  userRole = 'platform_admin',
  openTicketsCount = 0,
  activeIncidentsCount = 0,
}: PlatformNavProps) {
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
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to sign out.');
      setIsLoggingOut(false);
    }
  };

  const isRoleAllowed = (href: string) => {
    if (userRole === 'platform_owner') return true;
    const allowed = PLATFORM_RBAC_RULES[href];
    if (!allowed) return true;
    return allowed.includes(userRole as PlatformRole);
  };

  const navSections: PlatformNavSection[] = [
    {
      group: 'OPERATIONS',
      items: [
        {
          href: '/platform',
          label: 'Overview',
          icon: LayoutDashboard,
          exact: true,
        },
        {
          href: '/platform/merchants',
          label: 'Merchants',
          icon: Building2,
        },
        {
          href: '/platform/plans-billing',
          label: 'Plans & Billing',
          icon: Tags,
        },
        {
          href: '/platform/revenue',
          label: 'Platform Revenue',
          icon: TrendingUp,
        },
      ].filter((item) => isRoleAllowed(item.href)),
    },
    {
      group: 'INFRASTRUCTURE',
      items: [


        {
          href: '/platform/domains',
          label: 'Domains',
          icon: Globe,
        },

        {
          href: '/platform/system-health',
          label: 'System Health',
          icon: Activity,
          badge: activeIncidentsCount > 0 ? String(activeIncidentsCount) : undefined,
        },
      ].filter((item) => isRoleAllowed(item.href)),
    },
    {
      group: 'GOVERNANCE',
      items: [
        {
          href: '/platform/support',
          label: 'Help & Support',
          icon: LifeBuoy,
          badge: openTicketsCount > 0 ? String(openTicketsCount) : undefined,
        },
        {
          href: '/platform/communications',
          label: 'Communications',
          icon: Megaphone,
        },
        {
          href: '/platform/security',
          label: 'Security & Staff',
          icon: ShieldCheck,
        },
        {
          href: '/platform/audit-logs',
          label: 'Audit Logs',
          icon: History,
        },
        {
          href: '/platform/settings',
          label: 'Platform Settings',
          icon: Settings,
        },

      ].filter((item) => isRoleAllowed(item.href)),
    },
  ].filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs xl:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-surface border-r border-separator/80 transition-all duration-300 ease-in-out xl:static ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full xl:translate-x-0'
        } ${isDesktopCollapsed ? 'xl:w-20' : 'xl:w-64'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-18 px-4 border-b border-separator/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center text-brand-primary-foreground font-bold font-mono text-sm shrink-0">
              M
            </div>
            {!isDesktopCollapsed && (
              <div className="min-w-0">
                <div className="font-bold text-sm tracking-tight text-foreground font-display truncate">
                  Merchander
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="xl:hidden p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav Links List */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-5">
          {navSections.map((sec) => (
            <div key={sec.group} className="space-y-1">
              {!isDesktopCollapsed && (
                <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-muted/70 mb-1.5">
                  {sec.group}
                </div>
              )}

              {sec.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-brand-primary text-brand-primary-foreground font-semibold shadow-xs'
                        : 'text-secondary hover:text-foreground hover:bg-surface-elevated'
                    }`}
                    title={isDesktopCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon size={16} className={isActive ? 'text-brand-primary-foreground' : 'text-muted'} />
                      {!isDesktopCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isDesktopCollapsed && item.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-destructive/10 text-destructive border border-destructive/20'
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

        {/* Bottom Profile & Sign Out */}
        <div className="p-3 border-t border-separator/60 bg-surface space-y-2">
          {!isDesktopCollapsed && userEmail && (
            <div className="px-3 py-2 rounded-xl bg-surface-elevated border border-separator/50 flex items-center justify-between text-xs">
              <div className="truncate pr-2">
                <div className="text-[11px] font-semibold text-foreground truncate">{userEmail}</div>
                <div className="text-[10px] font-mono text-muted uppercase font-semibold tracking-wider">
                  {userRole.replace('_', ' ')}
                </div>
              </div>
              <Shield size={14} className="text-brand-primary shrink-0" />
            </div>
          )}

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors"
          >
            <LogOut size={14} />
            {!isDesktopCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
