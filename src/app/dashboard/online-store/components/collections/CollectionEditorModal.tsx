'use client';

import React, { useState, useRef, useTransition } from 'react';
import { X, Upload, Loader2, Image as ImageIcon, Sparkles, Filter, FolderTree, ShoppingBag } from 'lucide-react';
import { StorefrontCustomCollection } from '@/types/storefront';
import { uploadStorefrontBanner } from '@/app/actions/storefront';
import { compressImageForUpload } from '@/utils/image-compression';
import { toast } from 'sonner';

interface CollectionEditorModalProps {
  isOpen: boolean;
  collection: StorefrontCustomCollection | null;
  categories: Array<{ id: string; name: string }>;
  primaryColor: string;
  onSave: (collection: StorefrontCustomCollection) => void;
  onClose: () => void;
}

const PRESET_IMAGES = [
  { label: 'New Arrivals', url: '/images/categories/collection-new-arrivals.jpg' },
  { label: 'Best Sellers', url: '/images/categories/collection-best-sellers.jpg' },
  { label: 'Apparel', url: '/images/categories/apparel-dresses.jpg' },
  { label: 'Footwear', url: '/images/categories/apparel-shoes.jpg' },
];

export function CollectionEditorModal({
  isOpen,
  collection,
  categories,
  primaryColor,
  onSave,
  onClose,
}: CollectionEditorModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, startUpload] = useTransition();

  const [title, setTitle] = useState(collection?.title || '');
  const [description, setDescription] = useState(collection?.description || '');
  const [cta, setCta] = useState(collection?.cta || 'Shop Collection');
  const [image, setImage] = useState(collection?.image || '');
  const [linkType, setLinkType] = useState<'filter' | 'category' | 'catalog'>(collection?.link_type || 'filter');
  const [filterParam, setFilterParam] = useState(collection?.filter_param || 'new');
  const [categoryId, setCategoryId] = useState(collection?.category_id || (categories[0]?.id || ''));
  const [isActive, setIsActive] = useState(collection ? collection.is_active : true);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startUpload(async () => {
      try {
        const compressed = await compressImageForUpload(file);
        const formData = new FormData();
        formData.append('file', compressed);

        const res = await uploadStorefrontBanner(formData);
        if (res.error) {
          toast.error(res.error);
        } else if (res.url) {
          setImage(res.url);
          toast.success('Collection image uploaded successfully');
        }
      } catch (err) {
        console.error('Image upload failed:', err);
        toast.error('Failed to upload image. Please try again.');
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a collection title.');
      return;
    }

    const saved: StorefrontCustomCollection = {
      id: collection?.id || `col_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      cta: cta.trim() || 'Shop Collection',
      image: image || null,
      link_type: linkType,
      filter_param: linkType === 'filter' ? filterParam : undefined,
      category_id: linkType === 'category' ? categoryId : null,
      is_active: isActive,
    };

    onSave(saved);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Edit Collection"
    >
      <div
        className="w-full max-w-lg bg-surface border border-separator rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-separator/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: primaryColor }} />
            <h3 className="text-sm font-bold text-foreground">
              {collection ? 'Edit Collection' : 'Create New Collection'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs custom-scrollbar">
          {/* Collection Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Collection Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer '26 Drop, Office Staples, Weekend Edit"
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-separator text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          {/* Tagline / Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Short Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Fresh seasonal drops and lightweight essentials."
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-separator text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand-primary resize-none"
            />
          </div>

          {/* CTA Label */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Button CTA Text</label>
            <input
              type="text"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="e.g. Shop Collection, Explore Drop"
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-separator text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <label className="font-semibold text-foreground flex items-center justify-between">
              <span>Cover Photo</span>
              {image && (
                <button
                  type="button"
                  onClick={() => setImage('')}
                  className="text-[10px] text-destructive hover:underline cursor-pointer"
                >
                  Remove Image
                </button>
              )}
            </label>

            <div className="flex items-center gap-3">
              {/* Preview Thumbnail */}
              <div className="w-20 h-16 rounded-xl border border-separator/80 overflow-hidden bg-surface-elevated shrink-0 relative flex items-center justify-center">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={20} className="text-muted" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Upload Action */}
              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-separator bg-surface-elevated hover:bg-surface text-foreground font-semibold cursor-pointer transition text-[11px]"
                >
                  <Upload size={13} />
                  <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                </button>
                <p className="text-[10px] text-muted">Recommended: 800x600px JPEG/PNG/WebP</p>
              </div>
            </div>

            {/* Presets */}
            {!image && (
              <div className="pt-1">
                <span className="text-[10px] text-muted block mb-1">Or choose a preset:</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setImage(preset.url)}
                      className="px-2 py-1 rounded-md text-[10px] border border-separator/80 bg-surface-elevated hover:bg-surface text-foreground cursor-pointer transition font-medium"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Link Target */}
          <div className="space-y-2 pt-2 border-t border-separator/60">
            <label className="font-semibold text-foreground">Where should this collection link to?</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLinkType('filter')}
                className={`p-2.5 rounded-xl border text-center cursor-pointer transition flex flex-col items-center gap-1 ${
                  linkType === 'filter'
                    ? 'border-brand-primary bg-brand-primary/10 text-foreground font-bold'
                    : 'border-separator bg-surface-elevated/40 text-muted hover:text-foreground'
                }`}
              >
                <Filter size={15} style={linkType === 'filter' ? { color: primaryColor } : undefined} />
                <span className="text-[11px]">Smart Filter</span>
              </button>

              <button
                type="button"
                onClick={() => setLinkType('category')}
                className={`p-2.5 rounded-xl border text-center cursor-pointer transition flex flex-col items-center gap-1 ${
                  linkType === 'category'
                    ? 'border-brand-primary bg-brand-primary/10 text-foreground font-bold'
                    : 'border-separator bg-surface-elevated/40 text-muted hover:text-foreground'
                }`}
              >
                <FolderTree size={15} style={linkType === 'category' ? { color: primaryColor } : undefined} />
                <span className="text-[11px]">Store Category</span>
              </button>

              <button
                type="button"
                onClick={() => setLinkType('catalog')}
                className={`p-2.5 rounded-xl border text-center cursor-pointer transition flex flex-col items-center gap-1 ${
                  linkType === 'catalog'
                    ? 'border-brand-primary bg-brand-primary/10 text-foreground font-bold'
                    : 'border-separator bg-surface-elevated/40 text-muted hover:text-foreground'
                }`}
              >
                <ShoppingBag size={15} style={linkType === 'catalog' ? { color: primaryColor } : undefined} />
                <span className="text-[11px]">Full Catalog</span>
              </button>
            </div>

            {/* Target Details */}
            {linkType === 'filter' && (
              <div className="space-y-1 animate-fadeIn pt-1">
                <label className="text-[11px] text-muted">Select Smart Filter</label>
                <select
                  value={filterParam}
                  onChange={(e) => setFilterParam(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-separator text-xs text-foreground focus:outline-hidden"
                >
                  <option value="new">New Arrivals (Recent catalog additions)</option>
                  <option value="featured">Best Sellers &amp; Featured Products</option>
                  <option value="sale">Special Deals &amp; Discounts</option>
                </select>
              </div>
            )}

            {linkType === 'category' && (
              <div className="space-y-1 animate-fadeIn pt-1">
                <label className="text-[11px] text-muted">Select Category</label>
                {categories.length > 0 ? (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-separator text-xs text-foreground focus:outline-hidden"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-amber-500">
                    No categories found. Please create categories in Dashboard &gt; Categories first.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between pt-2 border-t border-separator/60">
            <div>
              <span className="font-semibold text-foreground block">Collection Visible</span>
              <span className="text-[10px] text-muted">Display this card on your categories hub</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                isActive ? 'bg-brand-primary' : 'bg-surface-elevated border-separator'
              }`}
              style={isActive ? { backgroundColor: primaryColor } : undefined}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-separator/70">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-semibold text-muted hover:text-foreground hover:bg-surface-elevated transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold text-white shadow-xs transition hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              {collection ? 'Save Changes' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
