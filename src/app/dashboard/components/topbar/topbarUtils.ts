export interface PageHeaderInfo {
  title: string;
  subtitle: string;
}

export function getPageHeader(segment: string): PageHeaderInfo {
  switch (segment) {
    case 'products':
      return { title: 'Products', subtitle: 'Manage your catalog, pricing and product availability.' };
    case 'categories':
      return { title: 'Categories', subtitle: 'Organize your product catalog by collections and departments.' };
    case 'orders':
      return { title: 'Orders', subtitle: 'Manage and fulfill customer orders.' };
    case 'customers':
      return { title: 'Customers', subtitle: 'Manage your customer base and relationships.' };
    case 'inventory':
      return { title: 'Inventory', subtitle: 'Track and manage stock levels across all variants.' };
    case 'purchasing':
    case 'procurement':
      return { title: 'Purchase Orders', subtitle: 'Manage purchase orders, supplier restocks, and deliveries.' };
    case 'suppliers':
      return { title: 'Suppliers', subtitle: 'Manage your supplier network, lead times, and performance.' };
    case 'shipments':
      return { title: 'Shipments & Logistics', subtitle: 'Track inbound freight consignments and customs clearance.' };
    case 'payments':
      return {
        title: 'Payments & Cashflow',
        subtitle: 'Monitor Mobile Money ledger, COD collections, and reconciliation.',
      };
    case 'expenses':
      return {
        title: 'Expenses & Outlays',
        subtitle: 'Track operational expenses, recurring bills, and cash outlays.',
      };
    case 'staff':
      return { title: 'Staff & Team', subtitle: 'Manage team access, granular roles, and invitations.' };
    case 'profitability':
      return { title: 'Profitability', subtitle: 'Real-time profit intelligence, COGS, and landed margins.' };
    case 'insights':
      return { title: 'Business Insights', subtitle: 'Automated intelligence, low stock alerts, and velocity trends.' };
    case 'analytics':
      return { title: 'Analytics', subtitle: 'GMV volume, customer retention, and sales velocity.' };
    case 'online-store':
      return { title: 'Online Store', subtitle: 'Manage your storefront, bio links, and catalog.' };
    case 'conversations':
      return { title: 'Conversations', subtitle: 'Omnichannel customer chat, WhatsApp bot, and quick replies.' };
    case 'settings':
    case 'permissions':
    case 'business-profile':
    case 'store':
    case 'channels':
    case 'security':
    case 'notifications':
    case 'audit-log':
    case 'export':
    case 'privacy':
    case 'hours':
    case 'business-hours':
    case 'fulfillment':
    case 'checkout':
    case 'automation':
      return { title: 'Settings', subtitle: 'Manage your account and application preferences.' };
    default:
      return { title: 'Overview', subtitle: 'Your business performance at a glance.' };
  }
}
