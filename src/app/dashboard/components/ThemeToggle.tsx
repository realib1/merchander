'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8" />; // Placeholder to match button size
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-8 h-8 rounded-full bg-surface-elevated border border-separator flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-brand-primary/50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer"
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? (
        <Sun size={18} />
      ) : (
        <Moon size={18} />
      )}
    </button>
  );
}
