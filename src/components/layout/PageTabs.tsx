'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface Tab {
  name: string;
  href: string;
}

interface PageTabsProps {
  tabs: Tab[];
}

export function PageTabs({ tabs }: PageTabsProps) {
  const pathname = usePathname();

  return (
    <div className="w-full border-b border-separator/50 mb-6 overflow-x-auto no-scrollbar">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const isExact = pathname === tab.href;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  isExact
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-muted hover:text-foreground hover:border-separator'
                }
              `}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
