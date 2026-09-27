
import React from 'react';
import Link from 'next/link';
import { StorefrontConfig, StorefrontCategory } from '@/types/storefront';
import {
  MessageCircle,
  Package,
  ShoppingBag,
  Grid3X3,
  Layers,
  MapPin,
  ArrowUpRight,
  Heart,
} from 'lucide-react';
import { getBusinessInitials } from '@/utils/format';

/* ---------- inline TikTok icon (not in lucide-react) ---------- */
function TikTokIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.28 0 .56.04.82.1V9a6.33 6.33 0 0 0-.82-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.77a8.16 8.16 0 0 0 3.76.93V6.27a4.85 4.85 0 0 1-.01.42z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

interface StoreFooterProps {
  config: StorefrontConfig;
  categories?: StorefrontCategory[];
}

export function StoreFooter({ config, categories }: StoreFooterProps) {
  const primaryColor = config.primary_color || '#3b82f6';
  const slug = config.slug;
  const year = new Date().getFullYear();

  /* ---- social / contact helpers ---- */
  const whatsappPhone = config.whatsapp_phone?.replace(/[^0-9]/g, '');
  const whatsappLink = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
        `Hello ${config.store_name}, I have an inquiry about your store.`
      )}`
    : null;

  const socialLinks = [
    // config.instagram_handle && {
    //   label: 'Instagram',
    //   href: `https://instagram.com/${config.instagram_handle}`,
    //   icon: <Instagram size={15} />,
    // },
    config.tiktok_handle && {
      label: 'TikTok',
      href: `https://tiktok.com/@${config.tiktok_handle}`,
      icon: <TikTokIcon size={15} />,
    },
    whatsappLink && {
      label: 'WhatsApp',
      href: whatsappLink,
      icon: <MessageCircle size={15} className="text-success" />,
    },
  ].filter(Boolean) as { label: string; href: string; icon: React.ReactNode }[];

  /* ---- quick navigation links (always present) ---- */
  const quickLinks = [
    { label: 'Shop All', href: `/store/${slug}` },
    { label: 'Categories', href: `/store/${slug}/categories` },
    ...(config.show_collections
      ? [{ label: 'Collections', href: `/store/${slug}/categories#collections` }]
      : []),
    { label: 'Track Order', href: `/store/${slug}/orders` },
  ];

  /* ---- top categories (show up to 5) ---- */
  const topCategories = (categories || []).slice(0, 5);

  return (
    <footer
      className="w-full border-t border-separator/60 bg-surface text-muted mt-12 pb-20 md:pb-10"
      style={{ '--footer-accent': primaryColor } as React.CSSProperties}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 space-y-8">
        {/* ═══════ Main Grid ═══════ */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* ── Column 1: Store Identity ── */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1 space-y-3.5">
            <div className="flex items-center gap-2.5">
              {config.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.logo_url}
                  alt={config.store_name}
                  className="h-7 w-auto max-w-24 object-contain rounded-md"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] text-white select-none shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {getBusinessInitials(config.store_name)}
                </div>
              )}
              <span className="font-bold text-base text-foreground tracking-tight leading-tight">
                {config.store_name}
              </span>
            </div>

            <p className="text-xs text-muted leading-relaxed max-w-xs">
              {config.bio || config.tagline || 'Quality products, seamless shopping.'}
            </p>

            {config.delivery_policy && (
              <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground pt-1">
                <MapPin size={12} className="mt-0.5 shrink-0" style={{ color: primaryColor }} />
                <span className="leading-relaxed">{config.delivery_policy}</span>
              </div>
            )}

            {/* Social Icons Row */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow on ${s.label}`}
                    className="w-8 h-8 rounded-lg bg-surface-elevated border border-separator/60 flex items-center justify-center text-muted hover:text-foreground hover:border-[var(--footer-accent)] hover:shadow-sm transition-all duration-200"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* ── Column 2: Quick Links ── */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-[11px] uppercase tracking-widest">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors duration-150"
                  >
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Categories ── */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-[11px] uppercase tracking-widest">
              {topCategories.length > 0 ? 'Categories' : 'Customer Care'}
            </h4>
            <ul className="space-y-2">
              {topCategories.length > 0 ? (
                <>
                  {topCategories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/store/${slug}/categories/${cat.slug || cat.id}`}
                        className="text-xs text-muted hover:text-foreground transition-colors duration-150"
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                  {(categories || []).length > 5 && (
                    <li>
                      <Link
                        href={`/store/${slug}/categories`}
                        className="text-xs font-medium hover:text-foreground transition-colors duration-150 flex items-center gap-1"
                        style={{ color: primaryColor }}
                      >
                        View all <ArrowUpRight size={11} />
                      </Link>
                    </li>
                  )}
                </>
              ) : (
                /* Fallback: customer care links when no categories exist */
                <>
                  <li>
                    <Link
                      href={`/store/${slug}/orders`}
                      className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors duration-150"
                    >
                      <Package size={14} style={{ color: primaryColor }} />
                      Track Your Order
                    </Link>
                  </li>
                  {whatsappLink && (
                    <li>
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors duration-150"
                      >
                        <MessageCircle size={14} className="text-success" />
                        Message Us
                      </a>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>

          {/* ── Column 4: Help & Contact ── */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-[11px] uppercase tracking-widest">
              Help
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/store/${slug}/orders`}
                  className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors duration-150"
                >
                  <Package size={14} style={{ color: primaryColor }} />
                  Track Order
                </Link>
              </li>
              {whatsappLink && (
                <li>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors duration-150"
                  >
                    <MessageCircle size={14} className="text-success" />
                    WhatsApp Us
                  </a>
                </li>
              )}
              {config.instagram_handle && (
                <li>
                  {/* <a
                    href={`https://instagram.com/${config.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors duration-150"
                  >
                    <Instagram size={14} />
                    Instagram
                  </a> */}
                </li>
              )}
              {config.payment_instructions && (
                <li className="pt-1">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {config.payment_instructions}
                  </p>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* ═══════ Accepted Payment Methods Strip ═══════ */}
        {config.accepted_payment_methods && config.accepted_payment_methods.length > 0 && (
          <div className="pt-6 border-t border-separator/50 flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-medium text-muted shrink-0">We accept:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {config.accepted_payment_methods.map((method) => (
                <span
                  key={method.id}
                  className="px-2.5 py-1 rounded-md bg-surface-elevated border border-separator/70 text-[10px] font-semibold text-foreground flex items-center gap-1.5 select-none"
                >
                  {method.dotColor && (
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: method.dotColor }}
                    />
                  )}
                  {method.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ Bottom Bar ═══════ */}
        <div className="pt-6 border-t border-separator/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted">
          <p className="flex items-center gap-1">
            &copy; {year} {config.store_name}
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">All rights reserved</span>
          </p>

          <div className="flex items-center gap-1.5">
          
            <span>Powered by</span>
            <a
              href="https://merchander.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold hover:underline cursor-pointer transition-colors duration-150"
              style={{ color: primaryColor }}
            >
              Merchander
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
