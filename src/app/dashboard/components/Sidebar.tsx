'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  Boxes,
  Truck,
  Container,
  Ship,
  Wallet,
  Receipt,
  LineChart,
  Sparkles,
  PieChart,
  MessageSquare,
  UserCog,
  Settings,
  LogOut,
  FolderTree
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useMobileNav } from './MobileNavContext';

export function Sidebar({ userEmail, businessName }: { userEmail: string; businessName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { isOpen, setIsOpen, isDesktopCollapsed } = useMobileNav();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navGroups = [
    {
      title: 'COMMAND',
      items: [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Orders', href: '/dashboard/orders', icon: ClipboardList },
        { name: 'Customers', href: '/dashboard/customers', icon: Users },
      ]
    },
    {
      title: 'COMMERCE',
      items: [
        { name: 'Products', href: '/dashboard/products', icon: Package },
        { name: 'Categories', href: '/dashboard/categories', icon: FolderTree },
        { name: 'Inventory', href: '/dashboard/inventory', icon: Boxes },
        { name: 'Procurement', href: '/dashboard/procurement', icon: Truck },
        { name: 'Suppliers', href: '/dashboard/suppliers', icon: Container },
        { name: 'Shipments', href: '/dashboard/shipments', icon: Ship },
      ]
    },
    {
      title: 'MONEY',
      items: [
        { name: 'Payments', href: '/dashboard/payments', icon: Wallet },
        { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt },
        { name: 'Profitability', href: '/dashboard/profitability', icon: LineChart },
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { name: 'Insights', href: '/dashboard/insights', icon: Sparkles },
        { name: 'Analytics', href: '/dashboard/analytics', icon: PieChart },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { name: 'Conversations', href: '/dashboard/conversations', icon: MessageSquare },
        { name: 'Staff', href: '/dashboard/staff', icon: UserCog },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ]
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false); }}
        />
      )}
      
      <aside 
        aria-label="Main navigation"
        className={`
        fixed md:static inset-y-0 left-0 z-50
        ${isDesktopCollapsed ? 'w-64 md:w-20' : 'w-64'} bg-surface/50 backdrop-blur-xl border-r border-separator/50 flex-col flex h-full shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className={`p-6 pb-4 border-b border-separator/50 ${isDesktopCollapsed ? 'md:px-4' : ''}`}>
        <Link href="/dashboard" className={`flex items-center gap-2 group ${isDesktopCollapsed ? 'md:justify-center' : ''}`}>
          <div className="w-8 h-8 shrink-0">
            {/* Logo */}
            <Image src="/merchander.png" alt="Logo" width={100} height={100} />
          </div>
          <div className={`transition-opacity duration-200 overflow-hidden ${isDesktopCollapsed ? 'md:hidden md:w-0' : 'whitespace-nowrap'}`}>
            <div className="text-xl font-bold text-primary font-display tracking-tight">
              {businessName}
            </div>
            <div className="text-caption text-brand-primary font-bold tracking-widest uppercase -mt-1">
              Merchander OS
            </div>
          </div>
        </Link>
      </div>

      <nav className={`flex-1 py-6 space-y-6 overflow-y-auto ${isDesktopCollapsed ? 'px-2 md:px-3' : 'px-4'}`}>
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <div className={`text-caption font-bold text-muted mb-2 px-3 tracking-widest uppercase ${isDesktopCollapsed ? 'md:hidden' : ''}`}>
              {group.title}
            </div>
            {isDesktopCollapsed && <div className="hidden md:block w-full h-px bg-separator/50 my-2"></div>}
            {group.items.map((item) => {
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isDesktopCollapsed ? item.name : undefined}
                  className={`
                    flex items-center gap-3 rounded-xl font-medium transition-all group
                    ${isDesktopCollapsed ? 'md:justify-center md:px-0 px-3 py-3' : 'px-3 py-2'}
                    ${isActive
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'text-secondary hover:bg-surface-elevated hover:text-brand-primary'}
                  `}
                >
                  <Icon size={18} className={`shrink-0 ${isActive ? 'text-brand-primary' : 'text-muted group-hover:text-brand-primary transition-colors'}`} />
                  <span className={`text-sm ${isDesktopCollapsed ? 'md:hidden' : ''}`}>{item.name}</span>
                  {isActive && !isDesktopCollapsed && (
                    <div className="ml-auto w-1 h-4 bg-brand-primary rounded-full shadow-[0_0_8px_rgba(255,106,0,0.5)] shrink-0"></div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile Section at bottom */}
      <div className={`p-4 m-4 mt-0 bg-surface-elevated/50 border border-separator/50 rounded-2xl backdrop-blur-sm ${isDesktopCollapsed ? 'md:mx-2 md:p-2' : ''}`}>
        <div className={`flex items-center gap-3 mb-3 ${isDesktopCollapsed ? 'md:justify-center' : ''}`}>
          <div className="w-10 h-10 shrink-0 rounded-full bg-linear-to-tr from-brand-secondary to-brand-primary p-0.5">
            <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{userEmail.charAt(0).toUpperCase()}</span>
            </div>
          </div>
          <div className={`flex-1 min-w-0 ${isDesktopCollapsed ? 'md:hidden' : ''}`}>
            <p className="text-sm font-semibold text-primary truncate">Admin User</p>
            <p className="text-xs text-muted truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title={isDesktopCollapsed ? "Sign Out" : undefined}
          className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-red-500/80 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer ${isDesktopCollapsed ? 'md:p-3' : ''}`}
        >
          <LogOut size={14} className="shrink-0" />
          <span className={`${isDesktopCollapsed ? 'md:hidden' : ''}`}>Sign Out</span>
        </button>
      </div>
      </aside>
    </>
  );
}
