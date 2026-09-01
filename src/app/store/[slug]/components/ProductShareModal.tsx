'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Copy, Check, MessageCircle, Share2, QrCode } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { useFocusTrap } from '@/hooks';

interface ProductShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productPrice: number;
  currency: string;
  shareUrl: string;
  primaryColor?: string;
}

export function ProductShareModal({
  isOpen,
  onClose,
  productName,
  productPrice,
  currency,
  shareUrl,
  primaryColor = '#3b82f6',
}: ProductShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const containerRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Check out ${productName} (${formatCurrency(productPrice, currency)}) on Merchander: ${shareUrl}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Share product modal"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm bg-surface border border-separator rounded-2xl p-5 shadow-2xl space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <Share2 size={16} />
              </div>
              <h3 className="text-sm font-bold text-foreground">Share Product</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface-elevated transition cursor-pointer"
              aria-label="Close share modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="text-xs text-muted">
            Share <strong className="text-foreground">{productName}</strong> directly via link, WhatsApp, or printable
            QR code.
          </div>

          {/* Copy Link Input */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-elevated border border-separator">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent text-xs text-foreground focus:outline-none select-all truncate px-1"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs transition hover:opacity-90 flex items-center gap-1.5 cursor-pointer shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Social Channels */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20ba59] transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <MessageCircle size={16} />
              <span>WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => setShowQR(!showQR)}
              className="py-2.5 px-3 rounded-xl bg-surface-elevated border border-separator text-foreground text-xs font-semibold hover:border-separator/80 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <QrCode size={16} className="text-brand-primary" />
              <span>{showQR ? 'Hide QR' : 'View QR'}</span>
            </button>
          </div>

          {/* QR Code Display */}
          {showQR && (
            <div className="p-4 rounded-xl bg-surface-elevated border border-separator flex flex-col items-center justify-center space-y-2 text-center">
              <div className="p-2 bg-white rounded-xl shadow-xs">
                <Image
                  src={qrImageUrl}
                  alt={`QR Code for ${productName}`}
                  width={160}
                  height={160}
                  className="rounded-lg"
                  unoptimized
                />
              </div>
              <p className="text-[11px] text-muted">Scan with any smartphone camera to open directly</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
