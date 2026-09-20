'use client';

import React from 'react';
import { Search, X, ArrowUpDown, LucideIcon } from 'lucide-react';

export type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'name';

interface CategoryDetailToolbarProps {
  categoryName: string;
  subtitle?: string;
  icon: LucideIcon;
  searchQuery: string;
  tags: string[];
  selectedTag: string;
  inStockOnly: boolean;
  sortBy: SortOption;
  primaryColor: string;
  onSearchChange: (q: string) => void;
  onSelectTag: (tag: string) => void;
  onToggleInStock: (val: boolean) => void;
  onSortChange: (sort: SortOption) => void;
}

export function CategoryDetailToolbar({
  categoryName,
  subtitle,
  icon: IconComponent,
  searchQuery,
  tags,
  selectedTag,
  inStockOnly,
  sortBy,
  primaryColor,
  onSearchChange,
  onSelectTag,
  onToggleInStock,
  onSortChange,
}: CategoryDetailToolbarProps) {
  return (
    <div className="space-y-4">
      {/* Category Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-separator/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <IconComponent size={18} />
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">{categoryName}</h1>
          </div>
          {subtitle && <p className="text-xs sm:text-sm text-muted mt-1">{subtitle}</p>}
        </div>

        {/* Capsule Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search in ${categoryName}...`}
            className="w-full pl-9 pr-8 py-2 rounded-full border border-separator/80 bg-surface text-xs text-foreground placeholder:text-muted/70 focus:outline-none focus:border-brand-primary transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Sub-Category Filter Chips & Sort Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {tags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onSelectTag(tag)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition border ${
                  isSelected
                    ? 'text-white shadow-xs'
                    : 'bg-surface border-separator text-muted hover:text-foreground hover:bg-surface-elevated'
                }`}
                style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
              >
                {tag}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer font-medium select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => onToggleInStock(e.target.checked)}
              className="rounded text-brand-primary"
            />
            <span>In Stock</span>
          </label>

          <div className="flex items-center gap-1.5 bg-surface border border-separator rounded-xl px-2.5 py-1 text-xs text-muted">
            <ArrowUpDown size={12} />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-foreground text-xs outline-none cursor-pointer pr-1"
            >
              <option value="featured">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
