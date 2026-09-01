'use client';

import React, { useState, useEffect } from 'react';
import { StorefrontConfig, StorefrontProduct } from '@/types/storefront';
import { MessageCircle, ArrowDown, ShoppingBag, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface StoreHeroSectionProps {
  config: StorefrontConfig;
  featuredProducts?: StorefrontProduct[];
  onSelectProduct?: (product: StorefrontProduct) => void;
}

export function StoreHeroSection({ config, featuredProducts = [], onSelectProduct }: StoreHeroSectionProps) {
  const primaryColor = config.primary_color || '#3b82f6';
  const currency = config.currency || 'GHS';

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const totalSlides = featuredProducts.length;

  const isBannerMode = Boolean(config.banner_url && config.hero_mode !== 'featured_product');
  const isSpotlightMode = Boolean(
    !isBannerMode && totalSlides > 0 && (config.hero_mode === 'featured_product' || totalSlides > 0)
  );

  const currentProduct = featuredProducts[currentSlideIndex] || featuredProducts[0];

  // Auto-advance slide carousel every 5s if multiple products exist
  useEffect(() => {
    if (!isSpotlightMode || totalSlides <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, [isSpotlightMode, totalSlides]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev + 1) % totalSlides);
  };

  const whatsappLink = config.whatsapp_phone
    ? `https://wa.me/${config.whatsapp_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        `Hello ${config.store_name}, I am browsing your online store!`
      )}`
    : null;

  const scrollToCatalog = () => {
    const el = document.getElementById('store-catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div>
        {isBannerMode && config.banner_url ? (
          /* Mode 1: Promotional Flyer Banner */
          <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-separator/80 shadow-md bg-surface flex flex-col justify-end min-h-65 sm:min-h-85 md:min-h-95 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={config.banner_url}
              alt={config.banner_headline || config.store_name}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent" />

            <div className="relative z-10 p-5 sm:p-8 text-white space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase border border-white/30">
                <Tag size={12} className="text-white" />
                <span>Featured Promotion</span>
              </div>

              <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                {config.banner_headline || config.tagline || `Special Offers at ${config.store_name}`}
              </h1>

              {config.banner_tagline && (
                <p className="text-xs sm:text-sm text-white/90 line-clamp-2 max-w-xl">{config.banner_tagline}</p>
              )}

              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={scrollToCatalog}
                  className="px-6 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-md hover:bg-white/90 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span>{config.banner_cta_text || 'Shop Collection'}</span>
                  <ArrowDown size={13} />
                </button>

                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle size={14} />
                    <span>Inquire on WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : isSpotlightMode && currentProduct ? (
          /* Mode 2: Multi-Item Sliding Featured Product Spotlight (like shop.sherohq.com) */
          <div
            onClick={() => onSelectProduct?.(currentProduct)}
            className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-separator/80 shadow-md bg-surface p-6 sm:p-8 md:p-10 flex flex-col-reverse md:flex-row items-center justify-between gap-6 md:gap-10 cursor-pointer hover:border-separator transition group"
          >
            {/* Left: Product Details Flex */}
            <div className="w-full md:w-1/2 flex flex-col justify-center space-y-4 z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
                  <Tag size={13} />
                  <span>Featured Spotlight</span>
                </span>
                <span className="text-xs font-bold text-muted uppercase tracking-wider">
                  {currentProduct.category_name}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight tracking-tight">
                {currentProduct.name}
              </h2>

              {currentProduct.description && (
                <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-3 max-w-xl">
                  {currentProduct.description}
                </p>
              )}

              <div className="pt-1 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-brand-primary">
                  {formatCurrency(currentProduct.min_price, currency)}
                </span>
                {currentProduct.availability_status === 'PRE_ORDER' && (
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold">
                    Pre-Order
                  </span>
                )}
              </div>

              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-90 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  style={{ backgroundColor: primaryColor }}
                >
                  <ShoppingBag size={14} />
                  <span>View Product Details</span>
                </button>

                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-4 py-2.5 rounded-xl bg-success/15 hover:bg-success/20 text-success border border-success/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle size={14} />
                    <span>Inquire on WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* Right: Product Image (Full Width & Height) */}
            <div className="w-full md:w-1/2 h-64 sm:h-80 md:h-96 relative sm:rounded-3xl overflow-hidden shrink-0 flex items-center justify-center">
              {currentProduct.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={currentProduct.id}
                  src={currentProduct.image_url}
                  alt={currentProduct.name}
                  className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500 animate-fadeIn"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted">
                  <ShoppingBag size={56} className="opacity-20" />
                </div>
              )}
            </div>

            {/* Prev / Next Slider Arrows (when multiple products exist) */}
            {totalSlides > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface/85 backdrop-blur-md border border-separator shadow-md text-foreground flex items-center justify-center cursor-pointer hover:bg-surface transition opacity-0 group-hover:opacity-100 z-20"
                  aria-label="Previous product slide"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface/85 backdrop-blur-md border border-separator shadow-md text-foreground flex items-center justify-center cursor-pointer hover:bg-surface transition opacity-0 group-hover:opacity-100 z-20"
                  aria-label="Next product slide"
                >
                  <ChevronRight size={18} />
                </button>

                {/* Slider Dot Indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                  {featuredProducts.map((p, idx) => (
                    <button
                      key={p.id || idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentSlideIndex(idx);
                      }}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === currentSlideIndex
                          ? 'w-6 bg-brand-primary'
                          : 'w-2 bg-separator/90 hover:bg-foreground/40'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          /* Mode 3: Focused Store Branded Headline Banner */
          <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-separator/80 shadow-md bg-surface p-6 sm:p-10 flex flex-col justify-between min-h-55">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[11px] font-bold">
                <ShoppingBag size={12} />
                <span>Official Online Store</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                {config.tagline || `Welcome to ${config.store_name}`}
              </h1>
              {config.bio && (
                <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-3 max-w-xl">{config.bio}</p>
              )}
            </div>

            <div className="pt-5 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={scrollToCatalog}
                className="px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-90 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                style={{ backgroundColor: primaryColor }}
              >
                <span>Explore Catalog</span>
                <ArrowDown size={13} />
              </button>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-success/15 hover:bg-success/20 text-success border border-success/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle size={14} />
                  <span>WhatsApp Order</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
