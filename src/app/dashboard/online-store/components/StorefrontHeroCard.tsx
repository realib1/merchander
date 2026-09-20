'use client';

import React, { useTransition, useState } from 'react';
import { StorefrontHeroSlide } from '@/types/storefront';
import { uploadStorefrontBanner } from '@/app/actions/storefront';
import { toast } from 'sonner';
import { compressImageForUpload } from '@/utils/image-compression';
import {
  BADGE_SUGGESTIONS,
  HeroProduct,
  createDefaultSlide,
  extractProductHeroUpdates,
} from './hero/hero-defaults';
import { HeroCardHeader } from './hero/HeroCardHeader';
import { HeroSlidePreview } from './hero/HeroSlidePreview';
import { HeroContentForm } from './hero/HeroContentForm';
import { HeroImageUploader } from './hero/HeroImageUploader';
import { HeroLinkSelector } from './hero/HeroLinkSelector';

export { BADGE_SUGGESTIONS };
export type { HeroProduct };

interface StorefrontHeroCardProps {
  heroSlides: StorefrontHeroSlide[];
  primaryColor: string;
  currency?: string;
  products?: HeroProduct[];
  onHeroSlidesChange: (slides: StorefrontHeroSlide[]) => void;
}

export function StorefrontHeroCard({
  heroSlides,
  primaryColor,
  currency = 'GHS',
  products = [],
  onHeroSlidesChange,
}: StorefrontHeroCardProps) {
  const slides = heroSlides && heroSlides.length > 0 ? heroSlides : [createDefaultSlide()];
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [isUploading, startUpload] = useTransition();

  const currentSlide = slides[selectedSlideIndex] || slides[0];

  const updateCurrentSlide = (updates: Partial<StorefrontHeroSlide>) => {
    const updated = slides.map((s, idx) => (idx === selectedSlideIndex ? { ...s, ...updates } : s));
    onHeroSlidesChange(updated);
  };

  const handleProductSelect = (productId: string) => {
    if (!productId) return updateCurrentSlide({ link_id: '' });
    const product = products.find((p) => p.id === productId);
    if (!product) return updateCurrentSlide({ link_id: productId });

    updateCurrentSlide(extractProductHeroUpdates(product, currency));
    toast.success(`Auto-filled slide with details from "${product.name}"`);
  };

  const handleAddSlide = () => {
    if (slides.length >= 3) return toast.error('You can add a maximum of 3 hero banner slides.');
    const newSlide = createDefaultSlide(`slide_${Date.now()}`);
    newSlide.headline = 'Fresh Season Drop';
    newSlide.tagline = 'Discover trending pieces made for everyday movement.';
    newSlide.badge_text = 'LIMITED DROP';
    newSlide.cta_text = 'Shop Collection';

    const nextSlides = [...slides, newSlide];
    onHeroSlidesChange(nextSlides);
    setSelectedSlideIndex(nextSlides.length - 1);
    toast.success(`Added Slide ${nextSlides.length}`);
  };

  const handleDeleteSlide = (indexToDelete: number) => {
    if (slides.length <= 1) return toast.error('You must have at least one hero slide.');
    const nextSlides = slides.filter((_, idx) => idx !== indexToDelete);
    onHeroSlidesChange(nextSlides);
    setSelectedSlideIndex(Math.min(selectedSlideIndex, nextSlides.length - 1));
    toast.success('Slide removed');
  };

  const handleFileUpload = (file: File) => {
    if (file.size > 15 * 1024 * 1024) return toast.error('Image must be smaller than 15MB');
    startUpload(async () => {
      try {
        const uploadFile = await compressImageForUpload(file);
        const formData = new FormData();
        formData.append('bannerFile', uploadFile);
        formData.append('slideIndex', String(selectedSlideIndex));
        formData.append('autoSync', 'true');

        const res = await uploadStorefrontBanner(formData);
        if (res.error) toast.error(res.error);
        else if (res.url) {
          updateCurrentSlide({ image_url: res.url });
          toast.success('Banner image uploaded and saved');
        }
      } catch (err) {
        console.error('Banner upload error:', err);
        toast.error('Failed to upload image');
      }
    });
  };

  return (
    <div className="bg-surface border border-separator rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
      <HeroCardHeader
        slides={slides}
        selectedSlideIndex={selectedSlideIndex}
        previewViewport={previewViewport}
        primaryColor={primaryColor}
        onSelectSlide={setSelectedSlideIndex}
        onSelectViewport={setPreviewViewport}
        onAddSlide={handleAddSlide}
      />

      <HeroSlidePreview
        slide={currentSlide}
        slideIndex={selectedSlideIndex}
        previewViewport={previewViewport}
        primaryColor={primaryColor}
      />

      <div className="p-4 sm:p-5 rounded-xl border border-separator/80 bg-surface-elevated/40 space-y-5">
        <HeroContentForm
          currentSlide={currentSlide}
          selectedSlideIndex={selectedSlideIndex}
          totalSlides={slides.length}
          primaryColor={primaryColor}
          onUpdateSlide={updateCurrentSlide}
          onDeleteSlide={handleDeleteSlide}
        />

        <HeroImageUploader
          currentSlide={currentSlide}
          products={products}
          isUploading={isUploading}
          onUploadFile={handleFileUpload}
          onUpdateSlide={updateCurrentSlide}
        />

        <HeroLinkSelector
          currentSlide={currentSlide}
          products={products}
          currency={currency}
          onUpdateSlide={updateCurrentSlide}
          onProductSelect={handleProductSelect}
        />
      </div>
    </div>
  );
}
