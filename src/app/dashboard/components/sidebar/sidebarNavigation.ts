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
  Sparkles,
  PieChart,
  MessageSquare,
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
      { name: 'Conversations', href: '/dashboard/conversations', icon: MessageSquare, badgeType: 'accent' },
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
      { name: 'Insights', href: '/dashboard/insights', icon: Sparkles, badge: 'AI', badgeType: 'accent' },
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
