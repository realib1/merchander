'use client';

import React from 'react';
import { Truck, ShieldCheck, Headphones } from 'lucide-react';

interface StoreTrustBarProps {
  primaryColor?: string;
}

export function StoreTrustBar({ primaryColor = '#f97316' }: StoreTrustBarProps) {
  const items = [
    {
      icon: Truck,
      title: 'Fast Delivery',
      mobileTitle: 'Delivery',
      description: 'Prompt delivery across Ghana',
      mobileDesc: 'Nationwide',
    },
    {
      icon: ShieldCheck,
      title: 'Flexible Payment',
      mobileTitle: 'Payment',
      description: 'MoMo, Card & Cash on Delivery',
      mobileDesc: '100% Secure',
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      mobileTitle: 'Support',
      description: 'Instant WhatsApp assistance',
      mobileDesc: 'Always Here',
    },
  ];

  return (
    <div className="rounded-2xl border border-separator/80 bg-surface/70 backdrop-blur-xs p-3 sm:p-5 shadow-2xs select-none">
      <div className="grid grid-cols-3 gap-2 sm:gap-6 divide-x divide-separator/60">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className={`flex items-center gap-2 sm:gap-3.5 ${
                idx === 0 ? 'pr-2 sm:pr-4' : idx === 1 ? 'px-2 sm:px-4' : 'pl-2 sm:pl-4'
              }`}
            >
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-surface-elevated border border-separator/70 flex items-center justify-center shrink-0 shadow-2xs"
              >
                <Icon size={16} style={{ color: primaryColor }} className="sm:hidden" />
                <Icon size={19} style={{ color: primaryColor }} className="hidden sm:block" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] sm:text-xs md:text-sm font-bold text-foreground truncate">
                  <span className="sm:hidden">{item.mobileTitle}</span>
                  <span className="hidden sm:inline">{item.title}</span>
                </h4>
                <p className="text-[9.5px] sm:text-[11px] text-muted truncate font-medium">
                  <span className="sm:hidden">{item.mobileDesc}</span>
                  <span className="hidden sm:inline">{item.description}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
