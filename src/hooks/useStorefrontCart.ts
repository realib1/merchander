'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { StorefrontCartItem } from '@/types/storefront';

const CART_EVENT = 'merchander_cart_updated';

function getCartSnapshot(storageKey: string): string {
  if (typeof window === 'undefined') return '[]';
  try {
    return localStorage.getItem(storageKey) || '[]';
  } catch {
    return '[]';
  }
}

function subscribeToCart(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(CART_EVENT, callback);
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener(CART_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function useStorefrontCart(storeSlug: string) {
  const storageKey = `merchander_cart_${storeSlug}`;

  const rawJson = useSyncExternalStore(
    subscribeToCart,
    () => getCartSnapshot(storageKey),
    () => '[]'
  );

  const cart = useMemo<StorefrontCartItem[]>(() => {
    try {
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  }, [rawJson]);

  const updateCart = useCallback(
    (updater: (prev: StorefrontCartItem[]) => StorefrontCartItem[]) => {
      try {
        const currentRaw = getCartSnapshot(storageKey);
        let currentCart: StorefrontCartItem[] = [];
        try {
          const parsed = JSON.parse(currentRaw);
          if (Array.isArray(parsed)) currentCart = parsed;
        } catch {
          currentCart = [];
        }
        const next = updater(currentCart);
        localStorage.setItem(storageKey, JSON.stringify(next));
        window.dispatchEvent(new Event(CART_EVENT));
      } catch {
        // Ignore localStorage error
      }
    },
    [storageKey]
  );

  const clearCart = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      window.dispatchEvent(new Event(CART_EVENT));
    } catch {
      // Ignore localStorage error
    }
  }, [storageKey]);

  return { cart, updateCart, clearCart };
}
