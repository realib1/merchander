/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  /** Current theme setting (light, dark, or system) */
  theme: ThemeMode;
  /** Actual computed theme active on the document (light or dark) */
  resolvedTheme: ResolvedTheme;
  /** Function to update theme preference */
  setTheme: (theme: ThemeMode) => void;
  /** Toggle between light and dark modes */
  toggleTheme: () => void;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
}

const STORAGE_KEY_DEFAULT = 'merchander-theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * ThemeProvider component managing zero-flash theme persistence and system preference sync.
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = STORAGE_KEY_DEFAULT,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    try {
      const stored = localStorage.getItem(storageKey) as ThemeMode | null;
      return stored || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    if (theme === 'system') return getSystemTheme();
    return theme;
  });

  // Synchronize class on documentElement and local storage
  useEffect(() => {
    const root = document.documentElement;
    const computed = theme === 'system' ? getSystemTheme() : theme;

    setResolvedTheme(computed);

    if (computed === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, [theme, storageKey]);

  // Listen to OS system color scheme changes when theme is set to 'system'
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent): void => {
      const newResolved = e.matches ? 'dark' : 'light';
      setResolvedTheme(newResolved);
      if (newResolved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode): void => {
    setThemeState(newTheme);
  };

  const toggleTheme = (): void => {
    setThemeState((current) => {
      const active = current === 'system' ? getSystemTheme() : current;
      return active === 'dark' ? 'light' : 'dark';
    });
  };

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme]
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

/**
 * Custom hook to access theme context.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
