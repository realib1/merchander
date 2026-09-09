import { describe, it, expect } from 'vitest';
import {
  isModuleEntitled,
  getEffectiveModules,
  filterPermissionsByModules,
  validateStoreSlug,
  MODULE_DEFINITIONS,
  ARCHETYPE_DEFINITIONS,
  PermissionGroup,
} from './business-modules';

describe('business-modules utilities', () => {
  describe('isModuleEntitled', () => {
    it('returns false when tier rank is below required tier', () => {
      // shipments requires growth tier (rank 3), starter has rank 2
      expect(isModuleEntitled('starter', 'shipments')).toBe(false);
      expect(isModuleEntitled('free', 'storefront')).toBe(false);
      expect(isModuleEntitled('none', 'profitability')).toBe(false);
    });

    it('returns true when tier rank matches or exceeds required tier', () => {
      expect(isModuleEntitled('starter', 'storefront')).toBe(true);
      expect(isModuleEntitled('growth', 'shipments')).toBe(true);
      expect(isModuleEntitled('business', 'batches')).toBe(true);
      expect(isModuleEntitled('enterprise', 'suppliers')).toBe(true);
    });
  });

  describe('getEffectiveModules', () => {
    it('filters out modules exceeding the subscription tier ceiling', () => {
      const enabled = ['shipments', 'batches', 'storefront', 'profitability'] as const;
      const effectiveForStarter = getEffectiveModules('starter', [...enabled]);
      expect(effectiveForStarter).toEqual(['storefront', 'profitability']);

      const effectiveForGrowth = getEffectiveModules('growth', [...enabled]);
      expect(effectiveForGrowth).toEqual(['shipments', 'batches', 'storefront', 'profitability']);
    });

    it('returns empty array when no modules are entitled', () => {
      const result = getEffectiveModules('free', ['shipments', 'batches']);
      expect(result).toEqual([]);
    });
  });

  describe('filterPermissionsByModules', () => {
    const mockPermissionGroups: PermissionGroup[] = [
      {
        category: 'Orders & Fulfilment',
        permissions: [
          { id: 'orders.view', label: 'View Orders', description: 'View orders' },
          { id: 'orders.manage', label: 'Manage Orders', description: 'Manage orders' },
        ],
      },
      {
        category: 'Inventory & Logistics',
        permissions: [
          { id: 'inventory.view', label: 'View Inventory', description: 'View stock' },
          { id: 'shipments.view', label: 'View Shipments', description: 'Track cargo' },
          { id: 'shipments.manage', label: 'Manage Shipments', description: 'Manage cargo' },
        ],
      },
      {
        category: 'Suppliers',
        permissions: [
          { id: 'suppliers.view', label: 'View Suppliers', description: 'View vendor balances' },
        ],
      },
    ];

    it('preserves core permissions and removes permissions of disabled modules', () => {
      // Shipments disabled, suppliers disabled
      const filtered = filterPermissionsByModules(['storefront', 'profitability'], mockPermissionGroups);

      // Orders (core) should be preserved
      expect(filtered[0].category).toBe('Orders & Fulfilment');
      expect(filtered[0].permissions.map((p) => p.id)).toEqual(['orders.view', 'orders.manage']);

      // Inventory (core) preserved, but shipments.view/manage removed
      expect(filtered[1].category).toBe('Inventory & Logistics');
      expect(filtered[1].permissions.map((p) => p.id)).toEqual(['inventory.view']);

      // Suppliers category completely removed because all permissions in it were pruned
      expect(filtered.find((g) => g.category === 'Suppliers')).toBeUndefined();
    });

    it('retains all module permissions when modules are enabled', () => {
      const filtered = filterPermissionsByModules(['shipments', 'suppliers'], mockPermissionGroups);
      const inventoryGroup = filtered.find((g) => g.category === 'Inventory & Logistics');
      expect(inventoryGroup?.permissions.map((p) => p.id)).toEqual([
        'inventory.view',
        'shipments.view',
        'shipments.manage',
      ]);
    });
  });

  describe('validateStoreSlug', () => {
    it('accepts valid alphanumeric slugs with hyphens', () => {
      expect(validateStoreSlug('glamour-haven')).toEqual({ valid: true });
      expect(validateStoreSlug('accra-shoes-2026')).toEqual({ valid: true });
      expect(validateStoreSlug('shop123')).toEqual({ valid: true });
    });

    it('rejects empty or whitespace-only slugs', () => {
      expect(validateStoreSlug('').valid).toBe(false);
      expect(validateStoreSlug('   ').valid).toBe(false);
    });

    it('rejects slugs that are too short or too long', () => {
      expect(validateStoreSlug('ab').valid).toBe(false);
      expect(validateStoreSlug('a'.repeat(41)).valid).toBe(false);
    });

    it('rejects invalid characters, underscores, and improper hyphens', () => {
      expect(validateStoreSlug('store_name').valid).toBe(false);
      expect(validateStoreSlug('store!name').valid).toBe(false);
      expect(validateStoreSlug('-store').valid).toBe(false);
      expect(validateStoreSlug('store-').valid).toBe(false);
      expect(validateStoreSlug('store--name').valid).toBe(false);
    });

    it('rejects reserved platform slugs', () => {
      expect(validateStoreSlug('admin').valid).toBe(false);
      expect(validateStoreSlug('dashboard').valid).toBe(false);
      expect(validateStoreSlug('signup').valid).toBe(false);
      expect(validateStoreSlug('platform').valid).toBe(false);
      expect(validateStoreSlug('api').valid).toBe(false);
    });
  });

  describe('archetype and module definitions consistency', () => {
    it('all archetypes have valid default modules', () => {
      for (const [key, archetype] of Object.entries(ARCHETYPE_DEFINITIONS)) {
        expect(archetype.id).toBe(key);
        expect(archetype.name).toBeTruthy();
        expect(archetype.defaultRoles.length).toBeGreaterThan(0);
        for (const mod of archetype.defaultModules) {
          expect(MODULE_DEFINITIONS[mod]).toBeDefined();
        }
      }
    });
  });
});
