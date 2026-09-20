'use client';

import React, { useState } from 'react';
import { Layers, Shapes, Info, ArrowUpRight, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { StorefrontCustomCollection } from '@/types/storefront';
import { CollectionEditorModal } from './collections/CollectionEditorModal';
import { toast } from 'sonner';

export const DEFAULT_COLLECTIONS: StorefrontCustomCollection[] = [
  {
    id: 'new-arrivals',
    title: 'New Arrivals',
    cta: 'New Arrivals',
    description: 'Fresh drops and this season’s latest pieces.',
    image: '/images/categories/collection-new-arrivals.jpg',
    link_type: 'filter',
    filter_param: 'new',
    is_active: true,
  },
  {
    id: 'best-sellers',
    title: 'Best Sellers',
    cta: 'Best Sellers',
    description: 'Our most loved and highest rated items.',
    image: '/images/categories/collection-best-sellers.jpg',
    link_type: 'filter',
    filter_param: 'featured',
    is_active: true,
  },
];

interface StorefrontCollectionsCardProps {
  primaryColor: string;
  showCollections: boolean;
  onShowCollectionsChange: (enabled: boolean) => void;
  collections?: StorefrontCustomCollection[];
  onCollectionsChange?: (collections: StorefrontCustomCollection[]) => void;
  categories?: Array<{ id: string; name: string }>;
  productCount?: number;
}

export function StorefrontCollectionsCard({
  primaryColor,
  showCollections,
  onShowCollectionsChange,
  collections,
  onCollectionsChange,
  categories = [],
  productCount = 0,
}: StorefrontCollectionsCardProps) {
  const isCatalogReady = productCount >= 4;
  const currentCollections = collections && collections.length > 0 ? collections : DEFAULT_COLLECTIONS;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<StorefrontCustomCollection | null>(null);

  const handleOpenAdd = () => {
    if (currentCollections.length >= 6) {
      toast.error('You can have a maximum of 6 curated collections.');
      return;
    }
    setEditingCollection(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (col: StorefrontCustomCollection) => {
    setEditingCollection(col);
    setIsModalOpen(true);
  };

  const handleSaveCollection = (saved: StorefrontCustomCollection) => {
    if (!onCollectionsChange) return;

    const existingIndex = currentCollections.findIndex((c) => c.id === saved.id);
    let next: StorefrontCustomCollection[];
    if (existingIndex >= 0) {
      next = currentCollections.map((c, idx) => (idx === existingIndex ? saved : c));
      toast.success(`Updated collection "${saved.title}"`);
    } else {
      next = [...currentCollections, saved];
      toast.success(`Added collection "${saved.title}"`);
    }

    onCollectionsChange(next);
  };

  const handleDeleteCollection = (id: string, title: string) => {
    if (!onCollectionsChange) return;
    if (currentCollections.length <= 1) {
      toast.error('You must keep at least one collection, or turn off Collections altogether.');
      return;
    }

    const next = currentCollections.filter((c) => c.id !== id);
    onCollectionsChange(next);
    toast.success(`Removed collection "${title}"`);
  };

  const handleToggleActive = (id: string) => {
    if (!onCollectionsChange) return;
    const next = currentCollections.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c));
    onCollectionsChange(next);
  };

  const getLinkTargetLabel = (col: StorefrontCustomCollection) => {
    if (col.link_type === 'category') {
      const match = categories.find((c) => c.id === col.category_id);
      return match ? `Category: ${match.name}` : 'Category link';
    }
    if (col.link_type === 'filter') {
      return col.filter_param === 'new'
        ? 'Filter: New arrivals'
        : col.filter_param === 'featured'
        ? 'Filter: Best sellers'
        : 'Filter: Deals';
    }
    return 'Full catalog';
  };

  return (
    <div className="bg-surface border border-separator rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Card Header with Title and Toggle Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-separator/70">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers size={16} style={{ color: primaryColor }} />
            <span>Storefront Collections &amp; Drops</span>
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Create, edit, and organize seasonal drops and curated collections for your storefront.
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted">
            {showCollections ? 'Enabled' : 'Disabled'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={showCollections}
            aria-label="Toggle collections on storefront"
            onClick={() => onShowCollectionsChange(!showCollections)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${
              showCollections ? 'bg-brand-primary' : 'bg-surface-elevated border-separator'
            }`}
            style={showCollections ? { backgroundColor: primaryColor } : undefined}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                showCollections ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Content depending on toggle state */}
      {showCollections ? (
        <div className="space-y-4 animate-fadeIn">
          {/* Header Action Bar */}
          <div className="p-3.5 bg-surface-elevated/50 border border-separator/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Shapes size={13} style={{ color: primaryColor }} />
                <span>Curated Drops ({currentCollections.length}/6)</span>
              </span>
              <p className="text-xs text-muted">
                Each collection appears as a drop banner on your categories page and is accessible from the store navigation.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-white shadow-xs transition hover:opacity-90 cursor-pointer shrink-0 self-start sm:self-auto"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={14} />
              <span>Add Collection</span>
            </button>
          </div>

          {/* Collections Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentCollections.map((col) => {
              const isColActive = col.is_active !== false;
              return (
                <div
                  key={col.id}
                  className={`p-3.5 rounded-2xl border transition flex flex-col justify-between space-y-3 bg-surface ${
                    isColActive ? 'border-separator/80 shadow-xs' : 'border-dashed border-separator opacity-60'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-elevated shrink-0 relative border border-separator/60">
                      {col.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={col.image} alt={col.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted">
                          <Shapes size={20} />
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isColActive ? 'bg-emerald-500' : 'bg-zinc-500'
                          }`}
                        />
                        <h4 className="text-xs font-bold text-foreground truncate">{col.title}</h4>
                      </div>
                      <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                        {col.description || 'No description provided.'}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-muted pt-0.5">
                        <span className="truncate">{getLinkTargetLabel(col)}</span>
                        <ArrowUpRight size={10} className="shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Item Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-separator/50 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(col.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-foreground cursor-pointer transition font-medium"
                    >
                      {isColActive ? <Eye size={12} className="text-emerald-500" /> : <EyeOff size={12} />}
                      <span>{isColActive ? 'Visible' : 'Hidden'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(col)}
                        className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition cursor-pointer"
                        title="Edit collection"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCollection(col.id, col.title)}
                        className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-surface-elevated transition cursor-pointer"
                        title="Delete collection"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Catalog Guard Note */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-elevated/30 border border-separator/60 text-xs text-muted">
            <Info size={15} className="text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Smart Catalog Guard:</strong> Collections will render on the public storefront once you have at least <strong>4 products</strong> published ({productCount} currently available &mdash; {isCatalogReady ? 'ready' : 'needs more products'}). This prevents sparse empty states.
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-surface-elevated/30 border border-dashed border-separator text-center space-y-1.5">
          <p className="text-xs font-medium text-foreground">Collections are turned off</p>
          <p className="text-[11px] text-muted max-w-md mx-auto">
            Your store displays a streamlined catalog without collections links or drop banners. Best for restaurants, services, single-product stores, or compact catalogs.
          </p>
        </div>
      )}

      {/* Editor Modal */}
      <CollectionEditorModal
        isOpen={isModalOpen}
        collection={editingCollection}
        categories={categories}
        primaryColor={primaryColor}
        onSave={handleSaveCollection}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
