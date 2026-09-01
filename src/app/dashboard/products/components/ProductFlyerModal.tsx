'use client';

import { useState, useEffect } from 'react';
import { Share2, Download, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createProductFlyerShare, FlyerShare } from '@/app/actions/flyers';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/utils/format';
import { exportFlyerToPng } from '@/utils/flyer-canvas';
import { FlyerCardPreview } from './FlyerCardPreview';

interface ProductFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    image_url?: string | null;
    availability_status?: string | null;
    category_name?: string | null;
    description?: string | null;
    total_stock?: number;
    stock_unit?: string | null;
    preorder_shipping_mode?: string | null;
  };
}

export function ProductFlyerModal({ isOpen, onClose, product }: ProductFlyerModalProps) {
  const [flyerShare, setFlyerShare] = useState<FlyerShare | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (isOpen && product.id && !flyerShare) {
      const initFlyer = async () => {
        try {
          const share = await createProductFlyerShare(product.id, 'whatsapp');
          setFlyerShare(share);
        } catch (err) {
          console.error('Error creating flyer share:', err);
        }
      };
      initFlyer();
    }
  }, [isOpen, product.id, flyerShare]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://merchander.app';
  const shortDisplayUrl = flyerShare
    ? `${origin.replace(/^https?:\/\//, '')}/s/${flyerShare.short_code}`
    : `merchander.app/s/${product.id.substring(0, 6)}`;

  const fullShareUrl = flyerShare
    ? `${origin}/s/${flyerShare.short_code}`
    : `${origin}/dashboard/products/${product.id}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
    fullShareUrl
  )}&bgcolor=ffffff&color=111827&margin=2`;

  const isPreorder = product.availability_status === 'pre_order' || product.availability_status === 'PRE_ORDER';
  const isOutOfStock =
    product.availability_status === 'OUT_OF_STOCK' ||
    (product.total_stock !== undefined && product.total_stock <= 0 && !isPreorder);

  let dynamicStockText = 'In Stock';
  if (isPreorder) {
    dynamicStockText = 'Available for Pre-Order';
  } else if (isOutOfStock) {
    dynamicStockText = 'Out of Stock';
  } else if (product.total_stock !== undefined && product.total_stock > 0) {
    dynamicStockText = `In Stock (${product.total_stock} ${product.stock_unit || 'pcs'})`;
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullShareUrl);
      setHasCopied(true);
      toast.success('Flyer link copied to clipboard!');
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleWhatsAppShare = () => {
    const text = `*${product.name}*\nPrice: ${formatCurrency(product.price)}\n${
      isPreorder ? '*Pre-Order Item*' : `*${dynamicStockText}*`
    }\n${product.description ? `${product.description.slice(0, 100)}\n` : ''}\nView & order here:\n${fullShareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDownloadFullFlyer = async () => {
    setIsDownloading(true);
    try {
      await exportFlyerToPng({
        name: product.name,
        price: product.price,
        imageUrl: product.image_url,
        qrImageUrl,
        shortDisplayUrl,
        dynamicStockText,
        isPreorder,
        isOutOfStock,
        description: product.description,
      });
      toast.success('Full product flyer image downloaded!');
    } catch (err) {
      console.error('Failed to generate flyer image:', err);
      toast.error('Could not generate full flyer image');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            <Package size={16} />
          </div>
          <span className="font-display font-bold text-foreground">Dynamic Product Flyer</span>
        </div>
      }
      description="Social flyer card pulling live product details"
      size="sm"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
          <button
            type="button"
            onClick={handleDownloadFullFlyer}
            disabled={isDownloading}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold rounded-xl bg-surface-elevated text-foreground hover:bg-surface border border-separator inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            <span>{isDownloading ? 'Generating...' : 'Download Full Flyer'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl bg-[#25D366] text-white hover:bg-[#20bd5a] inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Share2 size={14} />
              Share on WhatsApp
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-surface text-muted hover:text-foreground border border-separator transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col items-center py-1">
        <FlyerCardPreview
          product={product}
          isPreorder={isPreorder}
          isOutOfStock={isOutOfStock}
          dynamicStockText={dynamicStockText}
          qrImageUrl={qrImageUrl}
          shortDisplayUrl={shortDisplayUrl}
          hasCopied={hasCopied}
          onCopyLink={handleCopyLink}
        />
      </div>
    </Modal>
  );
}
