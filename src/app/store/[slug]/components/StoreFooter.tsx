'use client';

import React from 'react';
import Link from 'next/link';
import { StorefrontConfig } from '@/types/storefront';
import { MessageCircle, Package, ExternalLink } from 'lucide-react';
import { getBusinessInitials } from '@/utils/format';

interface StoreFooterProps {
  config: StorefrontConfig;
}

export function StoreFooter({ config }: StoreFooterProps) {
  const primaryColor = config.primary_color || '#3b82f6';
  const whatsappPhone = config.whatsapp_phone?.replace(/[^0-9]/g, '');
  const whatsappLink = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
        `Hello ${config.store_name}, I have an inquiry about your store.`
      )}`
    : null;

  return (
    <footer className="w-full border-t border-separator/80 bg-surface text-muted text-xs mt-12 pb-18 md:pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* 1. Store Identity & Bio */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              {config.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.logo_url}
                  alt={config.store_name}
                  className="h-6 w-auto max-w-20 object-contain rounded-md"
                />
              ) : (
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] text-white select-none shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  {getBusinessInitials(config.store_name)}
                </div>
              )}
              <span className="font-bold text-base text-foreground tracking-tight">{config.store_name}</span>
            </div>
            <p className="text-xs text-muted leading-relaxed max-w-sm">
              {config.bio || config.tagline || 'Online store powered by Merchander.'}
            </p>
            {config.delivery_policy && (
              <p className="text-[11px] text-muted-foreground pt-1 border-t border-separator/40">
                {config.delivery_policy}
              </p>
            )}
          </div>

          {/* 2. Customer Care & Navigation */}
          <div className="space-y-3 sm:text-right sm:flex sm:flex-col sm:items-end">
            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">Customer Help</h4>
            <ul className="space-y-2 flex flex-col sm:items-end">
              <li>
                <Link
                  href={`/store/${config.slug}/orders`}
                  className="hover:text-foreground transition cursor-pointer flex items-center gap-2 text-xs py-0.5"
                >
                  <Package size={14} style={{ color: primaryColor }} />
                  <span>Track Your Order</span>
                </Link>
              </li>
              {whatsappLink && (
                <li>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition cursor-pointer flex items-center gap-2 text-xs py-0.5"
                  >
                    <MessageCircle size={14} className="text-success" />
                    <span>Contact on WhatsApp</span>
                  </a>
                </li>
              )}
              {config.instagram_handle && (
                <li>
                  <a
                    href={`https://instagram.com/${config.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition cursor-pointer flex items-center gap-2 text-xs py-0.5"
                  >
                    <ExternalLink size={14} />
                    <span>Follow on Instagram</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Accepted Payment Methods */}
        {config.accepted_payment_methods && config.accepted_payment_methods.length > 0 && (
          <div className="pt-6 border-t border-separator/50 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <span className="text-[11px] font-medium text-muted">Accepted Payment Methods:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {config.accepted_payment_methods.map((method) => (
                <span
                  key={method.id}
                  className="px-2 py-0.5 rounded-md bg-surface-elevated border border-separator text-[10px] font-semibold text-foreground flex items-center gap-1"
                >
                  {method.dotColor && (
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: method.dotColor }} />
                  )}
                  <span>{method.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Line */}
        <div className="pt-6 border-t border-separator/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <p>
            © {new Date().getFullYear()} {config.store_name}. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <a
              href="https://merchander.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary font-bold hover:underline cursor-pointer"
            >
              Merchander
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
