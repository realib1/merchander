'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Plug, ToggleLeft } from 'lucide-react';

const navItems = [
  { name: 'General', href: '/platform/settings', icon: Settings },
  { name: 'Integrations', href: '/platform/settings/integrations', icon: Plug },
  { name: 'Controls', href: '/platform/settings/controls', icon: ToggleLeft },
];

export function PlatformSettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="bg-surface border border-separator/80 rounded-2xl p-4 shadow-xs space-y-1.5" aria-label="Platform settings navigation">
      <h2 className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted/70 select-none pb-2">
        Platform Settings
      </h2>
      <ul className="space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <li key={item.name}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                    : 'text-foreground/80 hover:bg-surface-elevated hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    size={15}
                    className={`shrink-0 transition-colors ${
                      isActive ? 'text-brand-primary' : 'text-muted group-hover:text-foreground'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.name}</span>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
