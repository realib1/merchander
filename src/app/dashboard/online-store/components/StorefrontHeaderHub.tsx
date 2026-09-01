'use client';

import React, { useState } from 'react';
import { Globe, Copy, Check, ExternalLink, QrCode, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface StorefrontHeaderHubProps {
  slug: string;
  publicUrl: string;
  isActive: boolean;
  primaryColor?: string;
}

export function StorefrontHeaderHub({ slug, publicUrl, isActive, primaryColor = '#3b82f6' }: StorefrontHeaderHubProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(publicUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Storefront link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-surface border border-separator rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
            style={{
              backgroundColor: `${primaryColor}18`,
              color: primaryColor,
            }}
          >
            <Globe size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Public Storefront</span>
              <span
                className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                }`}
              >
                {isActive ? '● Active' : '○ Offline / Draft'}
              </span>
            </div>
            <p className="text-sm font-bold text-foreground font-mono mt-0.5 break-all">{publicUrl}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl bg-surface-elevated border border-separator text-xs font-semibold text-foreground hover:bg-surface-elevated/80 cursor-pointer transition flex items-center gap-1.5 shadow-xs"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-muted" />}
            <span>{copied ? 'Copied Link' : 'Copy URL'}</span>
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
            href={`/store/${slug || 'my-store'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90 cursor-pointer transition flex items-center gap-1.5 shadow-xs"
            style={{ backgroundColor: primaryColor }}
          >
            <span>Preview Store</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* QR Code Drawer / Popover */}
      {showQr && (
        <div className="mt-4 pt-4 border-t border-separator/60 flex flex-col sm:flex-row items-center gap-6 animate-fadeIn">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl}
            alt="Storefront QR Code"
            className="w-32 h-32 rounded-xl border border-separator bg-white p-2 shrink-0 shadow-xs"
          />
          <div className="text-center sm:text-left">
            <h4 className="text-xs font-bold text-foreground flex items-center justify-center sm:justify-start gap-1.5">
              <Smartphone size={14} style={{ color: primaryColor }} /> Scan to Open Customer Storefront
            </h4>
            <p className="text-xs text-muted mt-1 max-w-md">
              Download and place this QR code on your physical shop counter, receipts, product packaging, or flyers.
            </p>
            <a
              href={qrImageUrl}
              download={`${slug}-qr-code.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs font-bold hover:underline cursor-pointer"
              style={{ color: primaryColor }}
            >
              Download QR Code
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
