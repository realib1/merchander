'use client';

import React from 'react';
import { Truck, ShieldCheck, Headphones } from 'lucide-react';

interface StoreTrustBadgesProps {
  primaryColor?: string;
}

export function StoreTrustBadges({ primaryColor = '#f97316' }: StoreTrustBadgesProps) {
  return (
    <div className="rounded-2xl border border-separator/70 bg-surface p-4 sm:p-5 space-y-3.5 shadow-2xs select-none">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-foreground shrink-0">
          <Truck size={16} style={{ color: primaryColor }} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground">Fast Delivery</h4>
          <p className="text-[11px] text-muted">Across Ghana</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-foreground shrink-0">
          <ShieldCheck size={16} style={{ color: primaryColor }} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground">Secure Payments</h4>
          <p className="text-[11px] text-muted">Multiple options</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-foreground shrink-0">
          <Headphones size={16} style={{ color: primaryColor }} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground">24/7 Support</h4>
          <p className="text-[11px] text-muted">We are here to help</p>
        </div>
      </div>
    </div>
  );
}
