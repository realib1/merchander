import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  REMEMBER_ME_STORAGE_KEY,
  getRememberedIdentifier,
  saveRememberedIdentifier,
  clearRememberedIdentifier,
} from './remember-me';

describe('remember-me utilities', () => {
  let store: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    length: 0,
    key: vi.fn(() => null),
  };

  const originalWindow = globalThis.window;

  beforeEach(() => {
    store = {};
    vi.clearAllMocks();
    globalThis.window = {
      localStorage: mockLocalStorage,
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  describe('getRememberedIdentifier', () => {
    it('returns null when running in SSR (window undefined)', () => {
      delete (globalThis as { window?: unknown }).window;
      expect(getRememberedIdentifier()).toBeNull();
    });

    it('returns null when nothing is stored', () => {
      expect(getRememberedIdentifier()).toBeNull();
    });

    it('returns trimmed identifier when stored', () => {
      store[REMEMBER_ME_STORAGE_KEY] = '  merchant@example.com  ';
      expect(getRememberedIdentifier()).toBe('merchant@example.com');
    });

    it('handles localStorage errors gracefully without throwing', () => {
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage disabled');
      });
      expect(getRememberedIdentifier()).toBeNull();
    });
  });

  describe('saveRememberedIdentifier', () => {
    it('does nothing in SSR (window undefined)', () => {
      delete (globalThis as { window?: unknown }).window;
      expect(() => saveRememberedIdentifier('test@example.com')).not.toThrow();
    });

    it('saves trimmed non-empty identifier', () => {
      saveRememberedIdentifier('  024 123 4567  ');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(REMEMBER_ME_STORAGE_KEY, '024 123 4567');
      expect(store[REMEMBER_ME_STORAGE_KEY]).toBe('024 123 4567');
    });

    it('removes item if empty or whitespace string is passed', () => {
      store[REMEMBER_ME_STORAGE_KEY] = 'existing@store.com';
      saveRememberedIdentifier('   ');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(REMEMBER_ME_STORAGE_KEY);
      expect(store[REMEMBER_ME_STORAGE_KEY]).toBeUndefined();
    });

    it('handles localStorage write exceptions gracefully', () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceeded');
      });
      expect(() => saveRememberedIdentifier('merchant@store.com')).not.toThrow();
    });
  });

  describe('clearRememberedIdentifier', () => {
    it('does nothing in SSR (window undefined)', () => {
      delete (globalThis as { window?: unknown }).window;
      expect(() => clearRememberedIdentifier()).not.toThrow();
    });

    it('removes stored identifier', () => {
      store[REMEMBER_ME_STORAGE_KEY] = 'merchant@store.com';
      clearRememberedIdentifier();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(REMEMBER_ME_STORAGE_KEY);
      expect(store[REMEMBER_ME_STORAGE_KEY]).toBeUndefined();
    });

    it('handles localStorage remove exceptions gracefully', () => {
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('SecurityError');
      });
      expect(() => clearRememberedIdentifier()).not.toThrow();
    });
  });
});
