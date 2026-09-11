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
  shipments: {
    id: 'shipments',
    name: 'Inbound Freight & Cargo Shipments',
    description: 'Track air/sea cargo packages from China/Dubai, waybills, landing fees, and port clearing dates.',
    requiredTier: 'growth',
    icon: 'ship',
    impactTags: ['Sidebar: Shipments', 'Landed Cost Allocation', 'Freight Transit Radar'],
  },
  batches: {
    id: 'batches',
    name: 'Pre-Order Batch Cycles',
    description: 'Group incoming customer orders into timed batch windows and auto-allocate stock on arrival.',
    requiredTier: 'growth',
    icon: 'clock',
    impactTags: ['Sidebar: Batches', 'Order Batch Filtering', 'Batch Broadcasts'],
  },
  suppliers: {
    id: 'suppliers',
    name: 'Supplier Accounts & Foreign Debt',
    description: 'Track overseas factory liabilities in foreign currencies (USD, RMB) and ledger payments across shipments.',
    requiredTier: 'growth',
    icon: 'factory',
    impactTags: ['Sidebar: Suppliers', 'Foreign Currency Ledger', 'Vendor Payables'],
  },
  storefront: {
    id: 'storefront',
    name: 'Online Customer Storefront',
    description: 'Customer-facing digital catalog at [store].merchander.store with instant mobile checkout and MoMo payments.',
    requiredTier: 'starter',
    icon: 'globe',
    impactTags: ['Sidebar: Online Store', 'Custom Subdomain', 'Cart Links'],
  },
  profitability: {
    id: 'profitability',
    name: 'Unit Profitability & Margins',
    description: 'Direct landed cost calculation per unit, deducting packing, delivery fees, and charges for net take-home profit.',
    requiredTier: 'starter',
    icon: 'trending-up',
    impactTags: ['Sidebar: Profitability', 'Real Net Margins', 'Profit Reports'],
  },
  intelligence: {
    id: 'intelligence',
    name: 'Social AI Intelligence',
    description: 'One-tap WhatsApp customer order receipts, automatic delivery updates, and conversational cart recovery prompts.',
    requiredTier: 'starter',
    icon: 'bot',
    impactTags: ['WhatsApp Receipts', 'Assistant Drawer', 'Cart Recovery'],
  },
};

export const ARCHETYPE_DEFINITIONS: Record<BusinessArchetype, BusinessArchetypeDefinition> = {
  import_resale: {
    id: 'import_resale',
    name: 'Import & Social Resale',
    tagline: 'Sea/air cargo tracking, pre-orders, and foreign vendor debt.',
    description: 'For sellers ordering cargo from China, Turkey, or Dubai with pre-order batch cycles and staggered port arrivals.',
    icon: 'ship',
    badge: 'Most Popular',
    badgeType: 'primary',
    defaultModules: ['shipments', 'batches', 'suppliers', 'storefront', 'profitability', 'intelligence'],
    highlights: [
      'Sea/Air Freight Inbound Shipments',
      'Customer Pre-Order Batches',
      'Supplier Foreign Currency Balances',
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
    description: 'For fashion brands, shoe stores, and apparel boutiques needing multi-attribute inventory and courier delivery tracking.',
    icon: 'shopping-bag',
    badge: 'Fast Setup',
    badgeType: 'emerald',
    defaultModules: ['storefront', 'profitability', 'intelligence'],
    highlights: [
      'Multi-Attribute Variants (Size, Color)',
      'Instant Online Storefront',
      'Local Courier & Dispatch Tracking',
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
    description: 'For bulk distributors supplying regional retail shops, supermarkets, and market stalls with master carton inventory.',
    icon: 'boxes',
    badge: 'High Volume',
    badgeType: 'indigo',
    defaultModules: ['shipments', 'suppliers', 'profitability', 'intelligence'],
    highlights: [
      'Tiered Wholesale Price Lists',
      'Purchase Orders & Formal Invoices',
      'Waybill Delivery Documents',
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
        permissions: ['orders.view', 'orders.manage', 'reports.view', 'expenses.view'],
      },
    ],
  },
  general_pos: {
    id: 'general_pos',
    name: 'General Merchant / Fast POS',
    tagline: 'Rapid Cash and MoMo recording, flat catalog, and daily cashup.',
    description: 'For neighbourhood marts, cosmetics stalls, and fast daily retailers needing lightning-fast mobile sales and WhatsApp receipts.',
    icon: 'zap',
    badge: 'Streamlined',
    badgeType: 'amber',
    defaultModules: ['storefront', 'profitability', 'intelligence'],
    highlights: [
      '1-Tap Cash & MoMo Checkout',
      'Clean Flat Product Catalog',
      'WhatsApp Cart Takeover Link',
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
    defaultModules: ['storefront', 'profitability', 'intelligence'],
    highlights: [
      'Custom Module Selection',
      'Personalized Workflow',
      'Flexible Add-Ons Anytime',
    ],
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
export function getEffectiveModules(
  tier: PlatformTier,
  enabledModules: BusinessModuleKey[]
): BusinessModuleKey[] {
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
