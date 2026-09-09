import { PlatformTier } from './platform';

export type BusinessArchetype =
  | 'import_resale'
  | 'boutique_fashion'
  | 'wholesale_distributor'
  | 'general_pos'
  | 'custom';

export type BusinessModuleKey =
  | 'shipments'
  | 'batches'
  | 'suppliers'
  | 'storefront'
  | 'profitability'
  | 'intelligence';

export interface BusinessModuleConfig {
  id: BusinessModuleKey;
  name: string;
  description: string;
  requiredTier: PlatformTier;
  icon: string;
  impactTags: string[];
}

export interface ArchetypeDefaultRole {
  name: string;
  description: string;
  permissions: string[];
}

export interface BusinessArchetypeDefinition {
  id: BusinessArchetype;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  badge?: string;
  badgeType?: 'primary' | 'emerald' | 'indigo' | 'amber';
  defaultModules: BusinessModuleKey[];
  highlights: string[];
  defaultRoles: ArchetypeDefaultRole[];
}
