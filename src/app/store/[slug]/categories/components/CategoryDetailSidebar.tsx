'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, LucideIcon } from 'lucide-react';

export interface SidebarCategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: LucideIcon;
  count: number;
  href: string;
  isActive: boolean;
}

interface CategoryDetailSidebarProps {
  categories: SidebarCategoryItem[];
  primaryColor: string;
}

export function CategoryDetailSidebar({ categories, primaryColor }: CategoryDetailSidebarProps) {
  return (
    <aside className="hidden lg:block space-y-4 rounded-2xl border border-separator/70 bg-surface p-4 sticky top-24 shadow-2xs">
      <div className="flex items-center gap-2 px-2 pb-3 border-b border-separator/60">
        <Layers size={16} className="text-brand-primary" />
        <h2 className="text-xs font-black uppercase tracking-widest text-foreground">Categories</h2>
      </div>

      <div className="space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto no-scrollbar pr-1">
        {categories.map((item) => {
          const isSelected = item.isActive;
          const IconComponent = item.icon || Layers;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isSelected ? 'text-white shadow-2xs' : 'text-muted hover:text-foreground hover:bg-surface-elevated'
              }`}
              style={isSelected ? { backgroundColor: primaryColor } : undefined}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <IconComponent size={15} className={isSelected ? 'text-white' : 'text-muted'} />
                <span className="truncate">{item.name}</span>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/25 text-white font-bold' : 'bg-surface-elevated text-muted'
                }`}
              >
                {item.count}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
