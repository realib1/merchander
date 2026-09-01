'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface StoreFloatingWhatsAppProps {
  whatsappPhone?: string | null;
  storeName: string;
}

export function StoreFloatingWhatsApp({ whatsappPhone, storeName }: StoreFloatingWhatsAppProps) {
  if (!whatsappPhone) return null;

  const cleanPhone = whatsappPhone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return null;

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello ${storeName}, I am browsing your online store and need some assistance.`
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 group flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer select-none"
      aria-label={`Chat with ${storeName} on WhatsApp`}
      title="Chat on WhatsApp"
    >
      <div className="relative">
        <MessageCircle size={22} className="fill-white text-[#25D366]" />
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
      </div>
      <span className="hidden md:inline-block text-xs font-bold max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap pl-0 group-hover:pr-2">
        Chat with us
      </span>
    </a>
  );
}
