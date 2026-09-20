'use client';

import React, { useTransition } from 'react';
import { Layers } from 'lucide-react';
import { uploadStorefrontBanner } from '@/app/actions/storefront';
import { toast } from 'sonner';
import { SpotlightItemEditor } from './spotlights/SpotlightItemEditor';

interface StorefrontSpotlightsCardProps {
  primaryColor: string;
  spotlightOneHeadline: string;
  spotlightOneTagline: string;
  spotlightOneImageUrl: string;
  spotlightOneCtaText: string;
  spotlightOneLinkUrl: string;
  spotlightOneImageFit?: 'fit' | 'cover';
  spotlightTwoHeadline: string;
  spotlightTwoTagline: string;
  spotlightTwoImageUrl: string;
  spotlightTwoCtaText: string;
  spotlightTwoLinkUrl: string;
  spotlightTwoImageFit?: 'fit' | 'cover';
  onSpotlightOneHeadlineChange: (val: string) => void;
  onSpotlightOneTaglineChange: (val: string) => void;
  onSpotlightOneImageUrlChange: (val: string) => void;
  onSpotlightOneCtaTextChange: (val: string) => void;
  onSpotlightOneLinkUrlChange: (val: string) => void;
  onSpotlightOneImageFitChange: (fit: 'fit' | 'cover') => void;
  onSpotlightTwoHeadlineChange: (val: string) => void;
  onSpotlightTwoTaglineChange: (val: string) => void;
  onSpotlightTwoImageUrlChange: (val: string) => void;
  onSpotlightTwoCtaTextChange: (val: string) => void;
  onSpotlightTwoLinkUrlChange: (val: string) => void;
  onSpotlightTwoImageFitChange: (fit: 'fit' | 'cover') => void;
}

export function StorefrontSpotlightsCard({
  primaryColor,
  spotlightOneHeadline,
  spotlightOneTagline,
  spotlightOneImageUrl,
  spotlightOneCtaText,
  spotlightOneLinkUrl,
  spotlightOneImageFit = 'fit',
  spotlightTwoHeadline,
  spotlightTwoTagline,
  spotlightTwoImageUrl,
  spotlightTwoCtaText,
  spotlightTwoLinkUrl,
  spotlightTwoImageFit = 'fit',
  onSpotlightOneHeadlineChange,
  onSpotlightOneTaglineChange,
  onSpotlightOneImageUrlChange,
  onSpotlightOneCtaTextChange,
  onSpotlightOneLinkUrlChange,
  onSpotlightOneImageFitChange,
  onSpotlightTwoHeadlineChange,
  onSpotlightTwoTaglineChange,
  onSpotlightTwoImageUrlChange,
  onSpotlightTwoCtaTextChange,
  onSpotlightTwoLinkUrlChange,
  onSpotlightTwoImageFitChange,
}: StorefrontSpotlightsCardProps) {
  const [isUploadingOne, startUploadOne] = useTransition();
  const [isUploadingTwo, startUploadTwo] = useTransition();

  const handleUpload = (
    file: File,
    startTransitionFn: React.TransitionStartFunction,
    onUrlChange: (url: string) => void
  ) => {
    if (file.size > 10 * 1024 * 1024) return toast.error('Image must be smaller than 10MB');
    startTransitionFn(async () => {
      const formData = new FormData();
      formData.append('bannerFile', file);
      const res = await uploadStorefrontBanner(formData);
      if (res.error) toast.error(res.error);
      else if (res.url) {
        onUrlChange(res.url);
        toast.success('Promotional image uploaded');
      }
    });
  };

  return (
    <div className="bg-surface border border-separator rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
      <div className="pb-3 border-b border-separator/60">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Layers size={16} style={{ color: primaryColor }} /> Homepage Promotional Spotlights
        </h3>
        <p className="text-xs text-muted mt-0.5">
          Customize the two side promotional cards that appear alongside your Featured Products.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpotlightItemEditor
          title="Spotlight 1 (Featured Promotion)"
          themeBadge="Dark Theme Card"
          badgeLabel="Featured Spotlight"
          variant="dark"
          headline={spotlightOneHeadline}
          tagline={spotlightOneTagline}
          imageUrl={spotlightOneImageUrl}
          ctaText={spotlightOneCtaText}
          linkUrl={spotlightOneLinkUrl}
          imageFit={spotlightOneImageFit}
          primaryColor={primaryColor}
          isUploading={isUploadingOne}
          defaultHeadline="Stay Hydrated."
          defaultTagline="Durable. Stylish. Everyday essentials."
          defaultLink="/categories/fashion-clothing"
          onHeadlineChange={onSpotlightOneHeadlineChange}
          onTaglineChange={onSpotlightOneTaglineChange}
          onImageUrlChange={onSpotlightOneImageUrlChange}
          onCtaTextChange={onSpotlightOneCtaTextChange}
          onLinkUrlChange={onSpotlightOneLinkUrlChange}
          onImageFitChange={onSpotlightOneImageFitChange}
          onUploadFile={(f) => handleUpload(f, startUploadOne, onSpotlightOneImageUrlChange)}
        />

        <SpotlightItemEditor
          title="Spotlight 2 (Trending Category)"
          themeBadge="Warm Light Card"
          badgeLabel="Trending Collection"
          variant="light"
          headline={spotlightTwoHeadline}
          tagline={spotlightTwoTagline}
          imageUrl={spotlightTwoImageUrl}
          ctaText={spotlightTwoCtaText}
          linkUrl={spotlightTwoLinkUrl}
          imageFit={spotlightTwoImageFit}
          primaryColor={primaryColor}
          isUploading={isUploadingTwo}
          defaultHeadline="Weekend Refresh"
          defaultTagline="Modern living pieces designed for comfort and ease."
          defaultLink="/categories/home-living"
          onHeadlineChange={onSpotlightTwoHeadlineChange}
          onTaglineChange={onSpotlightTwoTaglineChange}
          onImageUrlChange={onSpotlightTwoImageUrlChange}
          onCtaTextChange={onSpotlightTwoCtaTextChange}
          onLinkUrlChange={onSpotlightTwoLinkUrlChange}
          onImageFitChange={onSpotlightTwoImageFitChange}
          onUploadFile={(f) => handleUpload(f, startUploadTwo, onSpotlightTwoImageUrlChange)}
        />
      </div>
    </div>
  );
}
