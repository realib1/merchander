'use client';

import React from 'react';

interface HeroPriceBadgeProps {
  pricePill: string | null;
  compareAtPricePill?: string | null;
  contrastTheme: 'auto' | 'light' | 'dark';
}

function parsePriceNumber(str: string): number | null {
  const match = str.replace(/,/g, '').match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : null;
}

export function HeroPriceBadge({
  pricePill,
  compareAtPricePill,
  contrastTheme,
}: HeroPriceBadgeProps) {
  if (!pricePill && !compareAtPricePill) return null;

  const currentPrice = pricePill?.trim();
  const originalPrice = compareAtPricePill?.trim();

  // If both reduced price and original price exist, render a high-impact promo price badge
  if (currentPrice && originalPrice) {
    const currNum = parsePriceNumber(currentPrice);
    const compNum = parsePriceNumber(originalPrice);
    const discountPct =
      currNum && compNum && compNum > currNum
        ? Math.round(((compNum - currNum) / compNum) * 100)
        : null;

    return (
      <div
        className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full shadow-md border backdrop-blur-md ${
          contrastTheme === 'light'
            ? 'bg-slate-950 text-white border-slate-700'
            : 'bg-zinc-950/90 text-white border-white/25'
        }`}
      >
        <span className="text-[10px] sm:text-xs font-black tracking-tight text-white">
          {currentPrice}
        </span>
        <span className="text-[9px] sm:text-[11px] font-semibold line-through text-zinc-400 opacity-80 tabular-nums">
          {originalPrice}
        </span>
        {discountPct && (
          <span className="text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-emerald-500 text-white shadow-xs tracking-wider">
            -{discountPct}%
          </span>
        )}
      </div>
    );
  }

  // Single price display
  const singlePrice = currentPrice || originalPrice;
  return (
    <span
      className={`inline-flex items-center px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-black tracking-tight shadow-md border ${
        contrastTheme === 'light'
          ? 'bg-slate-950 text-white border-slate-700'
          : 'bg-zinc-950/90 text-white border-white/25'
      }`}
    >
      {singlePrice}
    </span>
  );
}
