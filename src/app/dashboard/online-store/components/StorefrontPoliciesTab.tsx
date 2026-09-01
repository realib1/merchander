'use client';

import React from 'react';
import { MessageCircle, Truck, Save, Loader2 } from 'lucide-react';

function InstagramIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

interface StorefrontPoliciesTabProps {
  whatsappPhone: string;
  instagramHandle: string;
  tiktokHandle: string;
  deliveryPolicy: string;
  primaryColor: string;
  isPending: boolean;
  onWhatsappPhoneChange: (val: string) => void;
  onInstagramHandleChange: (val: string) => void;
  onTiktokHandleChange: (val: string) => void;
  onDeliveryPolicyChange: (val: string) => void;
}

export function StorefrontPoliciesTab({
  whatsappPhone,
  instagramHandle,
  tiktokHandle,
  deliveryPolicy,
  primaryColor,
  isPending,
  onWhatsappPhoneChange,
  onInstagramHandleChange,
  onTiktokHandleChange,
  onDeliveryPolicyChange,
}: StorefrontPoliciesTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-surface border border-separator rounded-2xl p-6 shadow-xs space-y-4">
        <div className="pb-3 border-b border-separator/60">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <MessageCircle size={16} className="text-success" /> Social Commerce &amp; WhatsApp Ordering
          </h3>
          <p className="text-xs text-muted mt-0.5">Configure your direct WhatsApp order routing and social channels.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted mb-1 flex items-center gap-1.5">
              <MessageCircle size={13} className="text-success" /> WhatsApp Ordering Phone Number *
            </label>
            <input
              type="tel"
              value={whatsappPhone}
              onChange={(e) => onWhatsappPhoneChange(e.target.value)}
              placeholder="e.g. 024 123 4567 or +233 24 123 4567"
              className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
            />
            <p className="text-[10px] text-muted mt-1">
              Storefront order slips and customer inquiries are dispatched directly to this WhatsApp number.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted mb-1 flex items-center gap-1.5">
                <InstagramIcon size={13} className="text-pink-500" /> Instagram Handle
              </label>
              <div className="flex items-center bg-surface-elevated border border-separator rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-brand-primary">
                <span className="text-xs text-muted px-2.5 bg-surface border-r border-separator select-none font-mono">
                  @
                </span>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => onInstagramHandleChange(e.target.value.replace(/^@/, ''))}
                  placeholder="uniquefashion_gh"
                  className="w-full bg-transparent px-3 py-2 text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted mb-1 flex items-center gap-1.5">
                <TikTokIcon size={13} className="text-foreground" /> TikTok Handle
              </label>
              <div className="flex items-center bg-surface-elevated border border-separator rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-brand-primary">
                <span className="text-xs text-muted px-2.5 bg-surface border-r border-separator select-none font-mono">
                  @
                </span>
                <input
                  type="text"
                  value={tiktokHandle}
                  onChange={(e) => onTiktokHandleChange(e.target.value.replace(/^@/, ''))}
                  placeholder="uniquefashion"
                  className="w-full bg-transparent px-3 py-2 text-xs outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1 flex items-center gap-1.5">
              <Truck size={13} style={{ color: primaryColor }} /> Delivery Policy &amp; Dispatch Notice
            </label>
            <input
              type="text"
              value={deliveryPolicy}
              onChange={(e) => onDeliveryPolicyChange(e.target.value)}
              placeholder="e.g. Same-day delivery in Greater Accra (GH₵ 25). Nationwide dispatch via VIP/FedEx."
              className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl text-white text-xs font-bold hover:opacity-90 active:scale-95 disabled:opacity-50 transition cursor-pointer flex items-center gap-2 shadow-sm"
          style={{ backgroundColor: primaryColor }}
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{isPending ? 'Saving...' : 'Save Policies & Contact'}</span>
        </button>
      </div>
    </div>
  );
}
