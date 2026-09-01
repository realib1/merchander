'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, Plus, Trash2, Star, Image as ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { ProductImageItem } from '@/types/product-form';

interface ProductImageUploaderProps {
  images: ProductImageItem[];
  onAddFiles: (files: File[]) => void;
  onRemoveImage: (index: number) => void;
  onSetPrimaryImage: (index: number) => void;
  maxImages?: number;
}

export function ProductImageUploader({
  images,
  onAddFiles,
  onRemoveImage,
  onSetPrimaryImage,
  maxImages = 5,
}: ProductImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const remainingSlots = Math.max(0, maxImages - images.length);
      onAddFiles(selectedFiles.slice(0, remainingSlots));
      e.target.value = '';
    }
  };

  const primaryImage = images.length > 0 ? images[0] : null;
  const secondaryImages = images.slice(1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Product Media & Gallery</CardTitle>
            <CardDescription>
              The primary image is shown on your store cover and catalog. Click &quot;Make Primary&quot; on any photo to
              switch it.
            </CardDescription>
          </div>
          <span className="text-xs font-semibold text-muted bg-surface-elevated px-2.5 py-1 rounded-lg border border-separator">
            {images.length} / {maxImages} Photos
          </span>
        </div>
      </CardHeader>

      <CardBody>
        {images.length === 0 ? (
          /* Empty State Full Dropzone */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-separator hover:border-brand-primary rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-surface-elevated/50 transition-all cursor-pointer relative overflow-hidden group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />
            <div className="w-16 h-16 bg-surface border border-separator rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-brand-primary transition-all duration-300 shadow-xs">
              <UploadCloud className="w-8 h-8 text-brand-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Click or drag product images to upload</p>
            <p className="text-xs text-muted mt-1.5 max-w-sm">
              Upload high-quality PNG, JPG, or WebP images (up to {maxImages} photos, max 5MB each).
            </p>
            <button
              type="button"
              className="mt-4 px-4 py-2 rounded-xl bg-surface-elevated border border-separator text-xs font-semibold text-foreground hover:border-brand-primary transition shadow-xs cursor-pointer"
            >
              Browse Files
            </button>
          </div>
        ) : (
          /* Bento Gallery Layout: Big Primary Showcase on Left + Thumbnails on Right */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* 1. Large Primary Showcase */}
            {primaryImage && (
              <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-muted uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-brand-primary">
                    <Star size={13} className="fill-brand-primary" /> Cover / Primary Photo
                  </span>
                  <span className="text-[11px] font-medium text-muted">Position #1</span>
                </div>

                <div className="relative aspect-square w-full rounded-2xl overflow-hidden border-2 border-brand-primary/50 bg-surface-elevated shadow-sm group">
                  <Image
                    src={primaryImage.type === 'existing' ? primaryImage.url : primaryImage.preview}
                    alt="Primary product cover"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-102"
                  />

                  {/* Primary Cover Badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-brand-primary text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 backdrop-blur-xs select-none">
                    <Star size={12} className="fill-white" />
                    Cover Photo
                  </div>

                  {/* Top-Right Remove Action */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onRemoveImage(0)}
                      aria-label="Remove primary image"
                      className="p-2 rounded-xl bg-destructive/90 hover:bg-destructive text-white shadow-md transition hover:scale-105 cursor-pointer backdrop-blur-xs"
                      title="Remove cover photo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Bottom Caption Banner */}
                  <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-3.5 pt-8 text-white">
                    <p className="text-[11px] font-medium leading-tight opacity-90">
                      Featured on storefront catalog, direct link shares &amp; social previews.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Secondary Thumbnails & Uploader */}
            <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-muted uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <ImageIcon size={13} className="text-muted" /> Gallery &amp; Angle Shots ({secondaryImages.length})
                </span>
                <span className="text-[11px] font-medium text-muted">
                  {images.length < maxImages ? `${maxImages - images.length} slots left` : 'Maximum reached'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {secondaryImages.map((item, idx) => {
                  const actualIndex = idx + 1;
                  return (
                    <div
                      key={item.id}
                      className="relative aspect-square rounded-xl overflow-hidden border border-separator bg-surface-elevated group hover:border-brand-primary/60 transition shadow-xs"
                    >
                      <Image
                        src={item.type === 'existing' ? item.url : item.preview}
                        alt={`Product shot #${actualIndex + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 150px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Position Tag */}
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold select-none">
                        #{actualIndex + 1}
                      </div>

                      {/* Hover Actions Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 backdrop-blur-xs">
                        <button
                          type="button"
                          onClick={() => onSetPrimaryImage(actualIndex)}
                          className="w-full py-1.5 px-2 rounded-lg bg-brand-primary text-white text-[11px] font-bold hover:bg-brand-primary/90 transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                          title="Promote to Cover Photo"
                        >
                          <Star size={11} className="fill-white" />
                          <span>Make Primary</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveImage(actualIndex)}
                          className="w-full py-1 px-2 rounded-lg bg-destructive/80 text-white text-[11px] font-semibold hover:bg-destructive transition flex items-center justify-center gap-1 cursor-pointer"
                          title="Delete photo"
                        >
                          <Trash2 size={11} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add More Photos Drop Tile */}
                {images.length < maxImages && (
                  <div
                    onClick={() => addMoreInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-separator hover:border-brand-primary flex flex-col items-center justify-center text-center p-3 hover:bg-surface-elevated/60 transition-all cursor-pointer relative group"
                  >
                    <input
                      ref={addMoreInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleInputChange}
                    />
                    <div className="w-9 h-9 rounded-xl bg-surface border border-separator flex items-center justify-center mb-1.5 group-hover:scale-110 group-hover:border-brand-primary transition-all shadow-xs">
                      <Plus className="w-4 h-4 text-muted group-hover:text-brand-primary transition-colors" />
                    </div>
                    <span className="text-xs font-semibold text-foreground group-hover:text-brand-primary transition-colors">
                      Add Photo
                    </span>
                    <span className="text-[10px] text-muted mt-0.5">Upload more</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
