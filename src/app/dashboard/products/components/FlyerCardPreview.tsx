'use client';

import Image from 'next/image';
import { Check, Copy, CheckCircle2, AlertCircle, Clock, Package } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface FlyerCardPreviewProps {
  product: {
    name: string;
    price: number;
    image_url?: string | null;
    description?: string | null;
  };
  isPreorder: boolean;
  isOutOfStock: boolean;
  dynamicStockText: string;
  qrImageUrl: string;
  shortDisplayUrl: string;
  hasCopied: boolean;
  onCopyLink: () => void;
}

export function FlyerCardPreview({
  product,
  isPreorder,
  isOutOfStock,
  dynamicStockText,
  qrImageUrl,
  shortDisplayUrl,
  hasCopied,
  onCopyLink,
}: FlyerCardPreviewProps) {
  return (
    <div className="w-full max-w-75 rounded-2xl border border-separator bg-surface shadow-md overflow-hidden flex flex-col">
      {/* Top: Product Image (Object-Contain) */}
      <div className="w-full h-44 relative bg-surface-elevated flex items-center justify-center border-b border-separator/80 p-2 overflow-hidden">
        {product.image_url ? (
          <div className="relative w-full h-full">
            <Image src={product.image_url} alt={product.name} fill className="object-contain" sizes="300px" priority />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted">
            <Package size={36} className="stroke-[1.5]" />
            <span className="text-[11px] font-medium">{product.name}</span>
          </div>
        )}
      </div>

      {/* Bottom Card Content */}
      <div className="p-4 flex flex-col gap-2.5 text-center">
        {/* Title & Price */}
        <div>
          <h3 className="text-sm font-bold text-foreground font-display leading-tight truncate">{product.name}</h3>
          <p className="text-lg font-black text-brand-primary font-display mt-0.5">{formatCurrency(product.price)}</p>
        </div>

        {/* Dynamic Status */}
        <div className="flex flex-col items-center gap-0.5 text-[11px] text-foreground font-medium">
          {isPreorder ? (
            <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
              <Clock size={12} /> Available for Pre-Order
            </span>
          ) : isOutOfStock ? (
            <span className="inline-flex items-center gap-1 text-red-500">
              <AlertCircle size={12} /> Out of Stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={12} className="text-emerald-500" />
              {dynamicStockText}
            </span>
          )}

          {product.description && (
            <p className="text-[11px] text-muted line-clamp-1 max-w-60 mt-0.5">{product.description}</p>
          )}
        </div>

        {/* Small Compact QR Code (64px) */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <div className="p-1.5 bg-white rounded-lg border border-separator/80 shadow-2xs">
            <Image
              src={qrImageUrl}
              alt={`QR Code for ${product.name}`}
              width={64}
              height={64}
              className="rounded"
              unoptimized
            />
          </div>
          <p className="font-mono text-[11px] font-bold text-foreground tracking-tight select-all">{shortDisplayUrl}</p>
          <span className="text-[10px] text-muted">Scan / tap to view</span>
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={onCopyLink}
          className="w-full py-1.5 px-3 rounded-xl bg-surface-elevated border border-separator text-[11px] font-semibold text-foreground hover:bg-surface transition-colors flex items-center justify-center gap-1 mt-1 cursor-pointer"
        >
          {hasCopied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
          <span>{hasCopied ? 'Link Copied' : 'Copy Link'}</span>
        </button>
      </div>
    </div>
  );
}
