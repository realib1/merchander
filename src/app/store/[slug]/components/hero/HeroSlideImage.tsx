'use client';

import React from 'react';

interface HeroSlideImageProps {
  bannerSrc: string;
  isFitMode: boolean;
  contrastTheme: 'auto' | 'light' | 'dark';
  isActive?: boolean;
}

export function HeroSlideImage({
  bannerSrc,
  isFitMode,
  contrastTheme,
  isActive = true,
}: HeroSlideImageProps) {
  if (isFitMode) {
    return (
      <div className="w-full md:w-[42%] flex items-center justify-center relative p-2 pt-4 sm:p-4 md:p-8 order-1 md:order-2 shrink-0">
        <div
          className={`w-36 sm:w-56 md:w-72 h-36 sm:h-56 md:h-72 rounded-full bg-brand-primary/15 dark:bg-brand-primary/25 blur-3xl absolute pointer-events-none transform transition-all duration-1000 ease-out ${
            isActive ? 'opacity-100 scale-100' : 'opacity-30 scale-90'
          }`}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bannerSrc}
          alt="Product showcase"
          decoding="async"
          className={`relative z-10 max-h-[110px] sm:max-h-[140px] md:max-h-[250px] lg:max-h-[280px] w-auto object-contain drop-shadow-2xl pointer-events-none transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isActive ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-3 opacity-0'
          }`}
        />
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bannerSrc}
        alt="Hero banner"
        decoding="async"
        className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transform transition-transform duration-1000 ease-out ${
          isActive ? 'scale-100 group-hover:scale-105' : 'scale-105'
        }`}
      />
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          isActive ? 'opacity-100' : 'opacity-0'
        } ${
          contrastTheme === 'light'
            ? 'bg-gradient-to-r from-white/95 via-white/80 sm:via-white/60 to-transparent'
            : 'bg-gradient-to-r from-black/90 via-black/60 sm:via-black/40 to-transparent'
        }`}
      />
    </>
  );
}
