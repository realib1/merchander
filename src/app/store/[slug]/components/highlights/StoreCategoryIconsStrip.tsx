'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Grid2X2 } from 'lucide-react';
import { StorefrontCategory } from '@/types/storefront';
import { slugify } from '@/utils/format';
import { DEFAULT_CATEGORY_TEMPLATES } from './category-templates';

interface StoreCategoryIconsStripProps {
  slug: string;
  categories: StorefrontCategory[];
  primaryColor?: string;
}

export function StoreCategoryIconsStrip({
  slug,
  categories,
  primaryColor,
}: StoreCategoryIconsStripProps) {
  const items = useMemo(() => {
    if (categories.length === 0) {
      return DEFAULT_CATEGORY_TEMPLATES.map((tmpl) => ({
        id: slugify(tmpl.name),
        name: tmpl.name,
        icon: tmpl.icon,
        href: `/store/${slug}/categories/${slugify(tmpl.name)}`,
      }));
    }

    const topCategories = categories.slice(0, 6);
    return topCategories.map((cat) => {
      const lower = cat.name.toLowerCase();
      const matchedTmpl = DEFAULT_CATEGORY_TEMPLATES.find((t) =>
        t.slugMatch.some((kw) => lower.includes(kw))
      );
      return {
        id: cat.id,
        name: cat.name,
        icon: matchedTmpl ? matchedTmpl.icon : Grid2X2,
        href: `/store/${slug}/categories/${slugify(cat.name)}`,
      };
    });
  }, [categories, slug]);

  return (
    <div className="w-full select-none">
      <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border border-separator/80 bg-surface text-foreground shadow-2xs hover:border-brand-primary/60 hover:bg-surface-elevated/70 transition-all shrink-0 group text-xs sm:text-sm font-semibold"
            >
              <div
                className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center text-muted group-hover:text-brand-primary transition-colors shrink-0"
                style={primaryColor ? { color: undefined } : undefined}
              >
                <Icon size={14} />
              </div>
              <span className="whitespace-nowrap">{item.name}</span>
            </Link>
          );
        })}

        <Link
          href={`/store/${slug}/categories`}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border border-dashed border-separator/90 bg-surface/50 text-muted hover:text-foreground hover:border-brand-primary/60 transition-all shrink-0 text-xs sm:text-sm font-semibold whitespace-nowrap"
        >
          <Grid2X2 size={14} />
          <span>All Categories</span>
        </Link>
      </div>
    </div>
  );
}
