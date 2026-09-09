import React from 'react';
import { Store, ShoppingBag, Package, Sparkles } from 'lucide-react';
import { PlatformTier } from '@/types/platform';

export type Archetype = 'general' | 'grocery' | 'importer' | 'boutique';

export interface ArchetypeConfig {
  id: Archetype;
  label: string;
  icon: React.ElementType;
  description: string;
  defaultCity: string;
  modules: Record<string, boolean>;
}

export const ARCHETYPES: ArchetypeConfig[] = [
  {
    id: 'general',
    label: 'General Retail',
    icon: Store,
    description: 'Standard retail, branch inventory, and online storefront.',
    defaultCity: 'Accra',
    modules: { inventory: true, orders: true, pos: true, storefront: true },
  },
  {
    id: 'grocery',
    label: 'Grocery & Mart',
    icon: ShoppingBag,
    description: 'Supermarkets & fresh food with barcode POS and fast counter sales.',
    defaultCity: 'Accra',
    modules: { inventory: true, orders: true, pos: true, storefront: true, barcode: true },
  },
  {
    id: 'importer',
    label: 'Importer / Pre-Orders',
    icon: Package,
    description: 'Direct overseas shipments, batch pre-orders and deposit claims.',
    defaultCity: 'Accra',
    modules: { inventory: true, orders: true, preorders: true, storefront: true, tracking: true },
  },
  {
    id: 'boutique',
    label: 'Social Boutique',
    icon: Sparkles,
    description: 'Fashion and beauty with Link-in-Bio mobile store and MoMo checkouts.',
    defaultCity: 'Kumasi',
    modules: { inventory: true, orders: true, storefront: true, instagram_sync: true, momo_auto: true },
  },
];

export interface CreatedCredentials {
  storeName: string;
  slug: string;
  subdomainUrl: string;
  portalUrl: string;
  ownerEmail: string;
  temporaryPassword: string;
  tier: PlatformTier;
}
