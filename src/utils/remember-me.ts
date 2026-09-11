export const REMEMBER_ME_STORAGE_KEY = 'merchander_remembered_identifier';

/**
 * Safely retrieves the stored login identifier (email or phone) from localStorage.
 * Returns null if running in SSR, if storage is empty, or if access throws.
 */
export function getRememberedIdentifier(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(REMEMBER_ME_STORAGE_KEY);
    return value ? value.trim() : null;
  } catch (err) {
    console.warn('Failed to read remembered identifier from localStorage:', err);
    return null;
  }
}

/**
 * Safely saves the login identifier to localStorage.
 * Trims input and avoids writing empty strings.
 */
export function saveRememberedIdentifier(identifier: string): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = identifier.trim();
    if (trimmed) {
      window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, trimmed);
    } else {
      window.localStorage.removeItem(REMEMBER_ME_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Failed to save remembered identifier to localStorage:', err);
  }
}

/**
 * Safely removes the remembered login identifier from localStorage.
 */
export function clearRememberedIdentifier(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(REMEMBER_ME_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear remembered identifier from localStorage:', err);
  }
}
