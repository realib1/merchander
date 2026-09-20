import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  Boxes,
  Container,
  Ship,
  Wallet,
  Receipt,
  LineChart,
  Lightbulb,
  PieChart,
  CheckSquare,
  UserCog,
  Settings,
  FolderTree,
  Store,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeType?: 'default' | 'accent' | 'warning';
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: 'COMMAND',
    items: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Orders', href: '/dashboard/orders', icon: ClipboardList },
      { name: 'Customers', href: '/dashboard/customers', icon: Users },
      { name: 'Approvals & Inquiries', href: '/dashboard/conversations', icon: CheckSquare, badgeType: 'accent' },
      { name: 'Online Store', href: '/dashboard/online-store', icon: Store },
    ],
  },
  {
    title: 'COMMERCE & INVENTORY',
    items: [
      { name: 'Products', href: '/dashboard/products', icon: Package },
      { name: 'Categories', href: '/dashboard/categories', icon: FolderTree },
      { name: 'Inventory', href: '/dashboard/inventory', icon: Boxes },
      { name: 'Purchasing', href: '/dashboard/purchasing', icon: Container },
      { name: 'Suppliers', href: '/dashboard/suppliers', icon: Users },
      { name: 'Shipments', href: '/dashboard/shipments', icon: Ship },
    ],
  },
  {
    title: 'FINANCES',
    items: [
      { name: 'Payments', href: '/dashboard/payments', icon: Wallet },
      { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt },
      { name: 'Profitability', href: '/dashboard/profitability', icon: LineChart },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { name: 'Insights', href: '/dashboard/insights', icon: Lightbulb },
      { name: 'Analytics', href: '/dashboard/analytics', icon: PieChart },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Staff', href: '/dashboard/staff', icon: UserCog },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

/**
 * Map of navigation route prefixes to their controlling business module.
 * Items not listed are core navigation items and always visible.
 */
export const NAV_ITEM_MODULE_MAP: Record<string, string> = {
  '/dashboard/online-store': 'storefront',
  '/dashboard/shipments': 'shipments',
  '/dashboard/suppliers': 'suppliers',
  '/dashboard/purchasing': 'batches',
  '/dashboard/profitability': 'profitability',
  '/dashboard/conversations': 'intelligence',
  '/dashboard/invoices': 'invoices',
  '/dashboard/quotes': 'quotes',
  '/dashboard/compliance': 'compliance',
  '/dashboard/payroll': 'payroll',
  '/dashboard/funding-plans': 'funding_plans',
  '/dashboard/calculators': 'calculators',
  '/dashboard/cashflow': 'cashflow',
};

/**
 * Dynamically filters navigation groups to hide dormant module links.
 */
export function getFilteredNavGroups(
  groups: NavGroup[],
  enabledModules?: string[] | null
): NavGroup[] {
  if (!enabledModules || enabledModules.length === 0) {
    return groups;
  }
  const activeSet = new Set(enabledModules);

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const requiredModule = NAV_ITEM_MODULE_MAP[item.href];
        if (!requiredModule) return true;
        return activeSet.has(requiredModule);
      }),
    }))
    .filter((group) => group.items.length > 0);
}
