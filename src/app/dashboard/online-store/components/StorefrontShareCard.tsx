'use client';

import React, { useState } from 'react';
import { StorefrontConfig } from '@/types/storefront';
import { Copy, Check, ExternalLink, Globe, QrCode, Smartphone } from 'lucide-react';

interface StorefrontShareCardProps {
  config: StorefrontConfig | null;
}

export function StorefrontShareCard({ config }: StorefrontShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const slug = config?.slug || 'my-store';
  const fullUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/store/${slug}` : `https://merchander.app/store/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fullUrl)}`;

  return (
    <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Store link details */}
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
            <Globe size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Public Link-in-Bio URL</span>
              <span
                className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  config?.is_active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}
              >
                {config?.is_active ? '● Live' : '○ Offline'}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground font-mono mt-0.5 break-all">{fullUrl}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-surface-elevated border border-separator text-xs font-semibold text-foreground hover:bg-surface-elevated/80 cursor-pointer transition flex items-center gap-1.5 shadow-xs"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-muted" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="px-3 py-2 rounded-xl bg-surface-elevated border border-separator text-xs font-semibold text-muted hover:text-foreground cursor-pointer transition flex items-center gap-1.5"
            title="Show QR Code"
          >
            <QrCode size={14} />
            <span>QR Code</span>
          </button>

          <a
            href={`/store/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 cursor-pointer transition flex items-center gap-1.5 shadow-xs"
          >
            <span>Open Storefront</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* QR Code Modal / Drawer */}
      {showQr && (
        <div className="mt-4 pt-4 border-t border-separator/60 flex flex-col sm:flex-row items-center gap-6 animate-fadeIn">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl}
            alt="Storefront QR Code"
            className="w-32 h-32 rounded-xl border border-separator bg-white p-2 shrink-0"
          />
          <div className="text-center sm:text-left">
            <h4 className="text-xs font-bold text-foreground flex items-center justify-center sm:justify-start gap-1.5">
              <Smartphone size={14} className="text-brand-primary" /> Scan to View Storefront
            </h4>
            <p className="text-xs text-muted mt-1 max-w-md">
              Print this QR code to place on your physical shop counter, receipts, product packaging, or market flyers.
            </p>
            <a
              href={qrImageUrl}
              download={`${slug}-qr-code.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs font-semibold text-brand-primary hover:underline cursor-pointer"
            >
              Download High-Res QR Image →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
