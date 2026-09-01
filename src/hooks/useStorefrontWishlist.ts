'use client';

import { useState, useCallback, useMemo, useSyncExternalStore } from 'react';
import { syncGuestWishlist } from '@/app/actions/storefront-wishlist';
import { toast } from 'sonner';

const WISHLIST_EVENT = 'merchander_wishlist_updated';

function getWishlistSnapshot(storageKey: string): string {
  if (typeof window === 'undefined') return '[]';
  try {
    return localStorage.getItem(storageKey) || '[]';
  } catch {
    return '[]';
  }
}

function subscribeToWishlist(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(WISHLIST_EVENT, callback);
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener(WISHLIST_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function useStorefrontWishlist(storeSlug: string) {
  const storageKey = `merchander_wishlist_${storeSlug}`;
  const [isSyncing, setIsSyncing] = useState(false);

  const rawJson = useSyncExternalStore(
    subscribeToWishlist,
    () => getWishlistSnapshot(storageKey),
    () => '[]'
  );

  const savedIds = useMemo<string[]>(() => {
    try {
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Ignore JSON parse errors
    }
    return [];
  }, [rawJson]);

  const persist = useCallback(
    (newIds: string[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newIds));
        window.dispatchEvent(new Event(WISHLIST_EVENT));
      } catch {
        // Ignore localStorage write error
      }
    },
    [storageKey]
  );

  const isSaved = useCallback((productId: string) => savedIds.includes(productId), [savedIds]);

  const toggleSave = useCallback(
    (productId: string) => {
      if (savedIds.includes(productId)) {
        persist(savedIds.filter((id: string) => id !== productId));
        toast.info('Removed from saved items');
      } else {
        persist([...savedIds, productId]);
        toast.success('Saved to wishlist');
      }
    },
    [savedIds, persist]
  );

  const saveProduct = useCallback(
    (productId: string) => {
      if (!savedIds.includes(productId)) {
        persist([...savedIds, productId]);
        toast.success('Saved to wishlist');
      }
    },
    [savedIds, persist]
  );

  const removeProduct = useCallback(
    (productId: string) => {
      persist(savedIds.filter((id: string) => id !== productId));
      toast.info('Removed from saved items');
    },
    [savedIds, persist]
  );

  const clearWishlist = useCallback(() => {
    persist([]);
  }, [persist]);

  const syncWithPhone = useCallback(
    async (phone: string) => {
      setIsSyncing(true);
      try {
        const res = await syncGuestWishlist({
          tenantSlug: storeSlug,
          phone,
          productIds: savedIds,
        });
        return res;
      } finally {
        setIsSyncing(false);
      }
    },
    [storeSlug, savedIds]
  );

  return {
    savedIds,
    isLoaded: true,
    isSyncing,
    count: savedIds.length,
    isSaved,
    toggleSave,
    saveProduct,
    removeProduct,
    clearWishlist,
    syncWithPhone,
  };
}
