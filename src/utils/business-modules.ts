import { PlatformTier } from '@/types/platform';
import {
  BusinessArchetype,
  BusinessModuleKey,
  BusinessModuleConfig,
  BusinessArchetypeDefinition,
} from '@/types/business-modules';

export const TIER_RANK: Record<PlatformTier, number> = {
  none: 0,
  free: 1,
  starter: 2,
  growth: 3,
  business: 4,
  enterprise: 5,
};

export const MODULE_DEFINITIONS: Record<BusinessModuleKey, BusinessModuleConfig> = {
  // --- Commerce Pillar ---
  storefront: {
    id: 'storefront',
    name: 'Online Customer Storefront',
    description:
      'Customer-facing digital catalog at [store].merchander.store with instant mobile checkout and MoMo payments.',
    requiredTier: 'starter',
    icon: 'globe',
    pillar: 'commerce',
    impactTags: ['Sidebar: Online Store', 'Custom Subdomain', 'Cart Links'],
  },
  shipments: {
    id: 'shipments',
    name: 'Inbound Freight & Cargo Shipments',
    description: 'Track air/sea cargo packages from China/Dubai, waybills, landing fees, and port clearing dates.',
    requiredTier: 'growth',
    icon: 'ship',
    pillar: 'commerce',
    impactTags: ['Sidebar: Shipments', 'Landed Cost Allocation', 'Freight Transit Radar'],
  },
  batches: {
    id: 'batches',
    name: 'Pre-Order Batch Cycles',
    description: 'Group incoming customer orders into timed batch windows and auto-allocate stock on arrival.',
    requiredTier: 'growth',
    icon: 'clock',
    pillar: 'commerce',
    impactTags: ['Sidebar: Batches', 'Order Batch Filtering', 'Batch Broadcasts'],
  },
  suppliers: {
    id: 'suppliers',
    name: 'Supplier Accounts & Foreign Debt',
    description:
      'Track overseas factory liabilities in foreign currencies (USD, RMB) and ledger payments across shipments.',
    requiredTier: 'growth',
    icon: 'factory',
    pillar: 'commerce',
    impactTags: ['Sidebar: Suppliers', 'Foreign Currency Ledger', 'Vendor Payables'],
  },

  // --- Money Pillar ---
  cashflow: {
    id: 'cashflow',
    name: 'Inflow / Outflow & Cashflow',
    description: 'Track fixed and variable operational expenses, daily cash balances, and financial runway.',
    requiredTier: 'starter',
    icon: 'arrow-left-right',
    pillar: 'money',
    impactTags: ['Inflow & Outflow Radar', 'Fixed & Variable Expenses', 'Operational Runway'],
  },
  invoices: {
    id: 'invoices',
    name: 'Invoices & Customer Accounts',
    description: 'Generate branded PDF invoices, track payment status, and offer direct MoMo payment links.',
    requiredTier: 'starter',
    icon: 'file-text',
    pillar: 'money',
    impactTags: ['Direct Invoicing', 'Payment Links', 'Customer Accounts'],
  },
  quotes: {
    id: 'quotes',
    name: 'Quotes & Proforma Invoices',
    description: 'Send formal B2B estimates and proformas that convert directly into orders upon customer approval.',
    requiredTier: 'growth',
    icon: 'file-check',
    pillar: 'money',
    impactTags: ['Formal B2B Quotes', 'Proforma Invoices', '1-Click Convert to Order'],
  },
  compliance: {
    id: 'compliance',
    name: 'Tax & Regulatory Compliance',
    description: 'Timely reminders for GRA VAT/income tax filings, business operating permits, and receipt vault.',
    requiredTier: 'starter',
    icon: 'shield-check',
    pillar: 'money',
    impactTags: ['GRA Tax Deadlines', 'Permit Renewal Tracker', 'Filing Receipt Vault'],
  },
  payroll: {
    id: 'payroll',
    name: 'Staff Payroll Recording',
    description: 'Track employee compensation and record 1-click salary deductions directly into your expense ledger.',
    requiredTier: 'growth',
    icon: 'users',
    pillar: 'money',
    impactTags: ['Staff Compensation Log', '1-Click Pay-All Deduction', 'Expense Integration'],
  },
  funding_plans: {
    id: 'funding_plans',
    name: 'Funding Plans & Grants',
    description:
      'Track venture capital, SME grants, bank facilities, and capital disbursement milestones against targets.',
    requiredTier: 'growth',
    icon: 'target',
    pillar: 'money',
    impactTags: ['Grant & Capital Tracking', 'Disbursement Budgets', 'Funding Milestone Radar'],
  },
  calculators: {
    id: 'calculators',
    name: 'Business Decision Calculators',
    description: 'Interactive breakeven analysis, target margin modeling, and payment processing fee comparisons.',
    requiredTier: 'starter',
    icon: 'calculator',
    pillar: 'money',
    impactTags: ['Breakeven Analysis', 'Target Margin Calculator', 'MoMo Fee Deductor'],
  },
  profitability: {
    id: 'profitability',
    name: 'Unit Profitability & Margins',
    description:
      'Direct landed cost calculation per unit, deducting packing, delivery fees, and charges for net take-home profit.',
    requiredTier: 'starter',
    icon: 'trending-up',
    pillar: 'money',
    impactTags: ['Sidebar: Profitability', 'Real Net Margins', 'Profit Reports'],
  },

  // --- Intelligence Pillar ---
  intelligence: {
    id: 'intelligence',
    name: 'Social AI Intelligence',
    description:
      'One-tap WhatsApp customer order receipts, automatic delivery updates, and conversational cart recovery prompts.',
    requiredTier: 'starter',
    icon: 'bot',
    pillar: 'intelligence',
    impactTags: ['WhatsApp Receipts', 'Assistant Drawer', 'Cart Recovery'],
  },
};

export const ARCHETYPE_DEFINITIONS: Record<BusinessArchetype, BusinessArchetypeDefinition> = {
  import_resale: {
    id: 'import_resale',
    name: 'Import & Social Resale',
    tagline: 'Sea/air cargo tracking, pre-orders, and foreign vendor debt.',
    description:
      'For sellers ordering cargo from China, Turkey, or Dubai with pre-order batch cycles and staggered port arrivals.',
    icon: 'ship',
    badge: 'Most Popular',
    badgeType: 'primary',
    defaultModules: [
      'shipments',
      'batches',
      'suppliers',
      'storefront',
      'profitability',
      'intelligence',
      'cashflow',
      'invoices',
      'compliance',
      'funding_plans',
    ],
    highlights: [
      'Sea/Air Freight Inbound Shipments',
      'Customer Pre-Order Batches',
      'Supplier Foreign Currency Balances',
      'Cashflow & Compliance Reminders',
    ],
    defaultRoles: [
      {
        name: 'Logistics Officer',
        description: 'Manages shipments, cargo arrival status, landed costs, and supplier balances.',
        permissions: ['shipments.view', 'shipments.manage', 'inventory.view', 'inventory.manage'],
      },
      {
        name: 'Pre-Order Sales Rep',
        description: 'Records customer pre-orders, verifies MoMo deposits, and issues WhatsApp receipts.',
        permissions: ['orders.view', 'orders.manage', 'customers.view', 'customers.manage'],
      },
    ],
  },
  boutique_fashion: {
    id: 'boutique_fashion',
    name: 'Boutique & Retail Fashion',
    tagline: 'Size/color variants, instant storefront, and dispatch riders.',
    description:
      'For fashion brands, shoe stores, and apparel boutiques needing multi-attribute inventory and courier delivery tracking.',
    icon: 'shopping-bag',
    badge: 'Fast Setup',
    badgeType: 'emerald',
    defaultModules: ['storefront', 'profitability', 'intelligence', 'cashflow', 'invoices', 'compliance'],
    highlights: [
      'Multi-Attribute Variants (Size, Color)',
      'Instant Online Storefront',
      'Local Courier & Dispatch Tracking',
      'Customer Invoicing & Tax Reminders',
    ],
    defaultRoles: [
      {
        name: 'Shop Floor Attendant',
        description: 'Processes walk-in customers, operates POS, and checks variant stock levels.',
        permissions: ['pos.sell', 'inventory.view', 'orders.view', 'orders.manage'],
      },
      {
        name: 'Dispatch Coordinator',
        description: 'Prepares online orders and assigns local delivery riders.',
        permissions: ['orders.view', 'orders.manage', 'customers.view'],
      },
    ],
  },
  wholesale_distributor: {
    id: 'wholesale_distributor',
    name: 'Wholesale & Distribution',
    tagline: 'Bulk cartons, tiered B2B pricing, waybills, and formal invoices.',
    description:
      'For bulk distributors supplying regional retail shops, supermarkets, and market stalls with master carton inventory.',
    icon: 'boxes',
    badge: 'High Volume',
    badgeType: 'indigo',
    defaultModules: [
      'shipments',
      'suppliers',
      'profitability',
      'intelligence',
      'cashflow',
      'invoices',
      'quotes',
      'compliance',
      'payroll',
      'funding_plans',
    ],
    highlights: [
      'Tiered Wholesale Price Lists',
      'Quotes, Invoices & Proformas',
      'Waybills & Pallet Freight',
      'Staff Payroll & Regulatory Compliance',
    ],
    defaultRoles: [
      {
        name: 'Warehouse Manager',
        description: 'Manages pallet inventory, receives supplier shipments, and generates waybills.',
        permissions: ['inventory.view', 'inventory.manage', 'shipments.view', 'shipments.manage'],
      },
      {
        name: 'B2B Accounts Clerk',
        description: 'Tracks credit customer invoices, receivables, and payment receipts.',
        permissions: [
          'orders.view',
          'orders.manage',
          'reports.view',
          'expenses.view',
          'invoices.view',
          'invoices.manage',
        ],
      },
    ],
  },
  general_pos: {
    id: 'general_pos',
    name: 'General Merchant / Fast POS',
    tagline: 'Rapid Cash and MoMo recording, flat catalog, and daily cashup.',
    description:
      'For neighbourhood marts, cosmetics stalls, and fast daily retailers needing lightning-fast mobile sales and WhatsApp receipts.',
    icon: 'zap',
    badge: 'Streamlined',
    badgeType: 'amber',
    defaultModules: ['storefront', 'profitability', 'intelligence', 'cashflow', 'calculators'],
    highlights: [
      '1-Tap Cash & MoMo Checkout',
      'Clean Flat Product Catalog',
      'Cashflow Inflow/Outflow Tracker',
      'Breakeven & Pricing Calculators',
    ],
    defaultRoles: [
      {
        name: 'Cashier',
        description: 'Records point of sale transactions and daily cash register balancing.',
        permissions: ['pos.sell', 'orders.view'],
      },
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom Setup',
    tagline: 'Hand-pick modules tailored specifically to your business.',
    description: 'Select your own set of tools (electronics, beauty formulations, made-in-Ghana production, and more).',
    icon: 'sliders',
    defaultModules: ['storefront', 'profitability', 'intelligence', 'cashflow'],
    highlights: ['Custom Module Selection', 'Personalized Workflow', 'Flexible Add-Ons Anytime'],
    defaultRoles: [
      {
        name: 'Store Associate',
        description: 'Assists with customer orders and inventory checking.',
        permissions: ['orders.view', 'inventory.view', 'pos.sell'],
      },
    ],
  },
};

/**
 * Checks if a tenant subscription tier entitles usage of a specific module.
 */
export function isModuleEntitled(tier: PlatformTier, moduleKey: BusinessModuleKey): boolean {
  const config = MODULE_DEFINITIONS[moduleKey];
  if (!config) return false;
  const userRank = TIER_RANK[tier] ?? 0;
  const requiredRank = TIER_RANK[config.requiredTier] ?? 0;
  return userRank >= requiredRank;
}

/**
 * Returns the effective list of active modules for a tenant, filtering out
 * any modules that exceed their current subscription tier ceiling.
 */
export function getEffectiveModules(tier: PlatformTier, enabledModules: BusinessModuleKey[]): BusinessModuleKey[] {
  return enabledModules.filter((mod) => isModuleEntitled(tier, mod));
}

/**
 * Maps permission IDs to their controlling business module.
 * Permissions not listed here are core permissions and always available.
 */
export const PERMISSION_MODULE_MAP: Record<string, BusinessModuleKey> = {
  'shipments.view': 'shipments',
  'shipments.manage': 'shipments',
  'batches.view': 'batches',
  'batches.manage': 'batches',
  'suppliers.view': 'suppliers',
  'suppliers.manage': 'suppliers',
  'storefront.manage': 'storefront',
  'reports.view': 'profitability',
  'expenses.view': 'profitability',
  'expenses.manage': 'profitability',
  'invoices.view': 'invoices',
  'invoices.manage': 'invoices',
  'quotes.view': 'quotes',
  'quotes.manage': 'quotes',
  'compliance.view': 'compliance',
  'compliance.manage': 'compliance',
  'payroll.view': 'payroll',
  'payroll.manage': 'payroll',
  'funding_plans.view': 'funding_plans',
  'funding_plans.manage': 'funding_plans',
  'calculators.view': 'calculators',
  'cashflow.view': 'cashflow',
};

export interface PermissionItem {
  id: string;
  label: string;
  description: string;
}

export interface PermissionGroup {
  category: string;
  permissions: PermissionItem[];
}

/**
 * Filters out permission items that belong to dormant or disabled modules
 * so staff role creation forms do not present dead options.
 */
export function filterPermissionsByModules(
  enabledModules: BusinessModuleKey[],
  permissionGroups: PermissionGroup[]
): PermissionGroup[] {
  const activeSet = new Set(enabledModules);

  return permissionGroups
    .map((group) => {
      const filteredPermissions = group.permissions.filter((perm) => {
        const requiredModule = PERMISSION_MODULE_MAP[perm.id];
        // If permission has no module constraint, it is core and always allowed
        if (!requiredModule) return true;
        return activeSet.has(requiredModule);
      });

      return {
        ...group,
        permissions: filteredPermissions,
      };
    })
    .filter((group) => group.permissions.length > 0);
}

/**
 * Validates a store subdomain slug for URL safety and uniqueness standards.
 */
export function validateStoreSlug(slug: string): { valid: boolean; error?: string } {
  const normalized = slug.trim().toLowerCase();

  if (!normalized) {
    return { valid: false, error: 'Store subdomain slug is required.' };
  }

  if (normalized.length < 3) {
    return { valid: false, error: 'Store subdomain must be at least 3 characters.' };
  }

  if (normalized.length > 40) {
    return { valid: false, error: 'Store subdomain must not exceed 40 characters.' };
  }

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(normalized)) {
    return {
      valid: false,
      error: 'Slug may only contain lowercase letters, numbers, and single hyphens between words.',
    };
  }

  const reservedSlugs = new Set([
    'admin',
    'api',
    'app',
    'auth',
    'dashboard',
    'login',
    'platform',
    'signup',
    'store',
    'storefront',
    'support',
    'system',
    'www',
  ]);

  if (reservedSlugs.has(normalized)) {
    return { valid: false, error: `"${normalized}" is a reserved subdomain slug.` };
  }

  return { valid: true };
}
