'use client';

import { Search, Bell, Menu, PanelLeftClose, PanelLeft } from 'lucide-react';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { useMobileNav } from './MobileNavContext';

export function Topbar() {
  const pathname = usePathname();
  const { setIsOpen, isDesktopCollapsed, setIsDesktopCollapsed } = useMobileNav();

  // Format pathname for breadcrumb (e.g. /dashboard/orders -> Orders)
  const segments = pathname.split('/').filter(Boolean);
  const currentSegment = segments[segments.length - 1] || 'dashboard';

  const getPageHeader = (segment: string) => {
    switch (segment) {
      case 'products':
        return { title: 'Products', subtitle: 'Manage your catalog, pricing and product availability.' };
      case 'orders':
        return { title: 'Orders', subtitle: 'Manage and fulfill customer orders.' };
      case 'customers':
        return { title: 'Customers', subtitle: 'Manage your customer base and relationships.' };
      case 'inventory':
        return { title: 'Inventory', subtitle: 'Track and manage stock levels across all variants.' };
      case 'procurement':
        return { title: 'Procurement', subtitle: 'Manage purchase orders and supplier deliveries.' };
      case 'suppliers':
        return { title: 'Suppliers', subtitle: 'Manage your supplier network and performance.' };
      case 'shipments':
        return { title: 'Shipments', subtitle: 'Track outbound shipping and delivery status.' };
      case 'payments':
        return { title: 'Payments', subtitle: 'Monitor transactions and revenue flows.' };
      case 'settings':
        return { title: 'Settings', subtitle: 'Manage your account and application preferences.' };
      default:
        return { title: 'Overview', subtitle: 'Your business performance at a glance.' };
    }
  };

  const header = getPageHeader(currentSegment);

  return (
    <header className="h-18 border-b border-separator/50 bg-background/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 -ml-2  hover:bg-surface-elevated rounded-lg transition-colors"
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Desktop panel toggle */}
        <button
          className="hidden md:flex p-2 -ml-2  hover:bg-surface-elevated rounded-lg transition-colors"
          onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
          aria-label="Toggle sidebar panel"
        >
          {isDesktopCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>

        {/* Page Title & Subtitle */}
        <div className="flex flex-col justify-center">
          <h1 className="text-xl font-bold  tracking-tight leading-none">{header.title}</h1>
          <p className="hidden sm:block text-xs  mt-1.5 leading-none">{header.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="hidden md:flex items-center relative">
          <Search size={16} className="absolute left-3 text-muted" />
          <input
            type="text"
            placeholder="Search products, orders, customers, suppliers..."
            className="w-80 lg:w-96 bg-surface/50 border border-separator/80 rounded-md pl-9 pr-4 py-1.5 text-sm  focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all placeholder:text-muted/50"
          />
        </div>

        {/* Notifications & Status */}
        <div className="flex items-center gap-3">
          <button className="relative p-2  hover:bg-surface-elevated hover:text-brand-primary rounded-full transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-primary rounded-full border border-background"></span>
          </button>
          <div className="h-4 w-px bg-separator/50 mx-1 hidden sm:block"></div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
