import { StorefrontCartItem, StorefrontConfig, StorefrontHeroSlide, StorefrontSpotlightBanner } from '@/types/storefront';
import { formatCurrency } from '@/utils/format';

/**
 * Generate a clean, URL-safe slug from a store name
 */
export function generateStoreSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Calculates cart subtotal and total item count
 */
export function calculateCartTotals(cart: StorefrontCartItem[]): { subtotal: number; itemCount: number } {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, itemCount };
}

/**
 * Formats a structured WhatsApp message for 1-click cart checkout
 */
export function formatWhatsAppOrderMessage(
  config: StorefrontConfig,
  cart: StorefrontCartItem[],
  customer: { name: string; phone: string; address?: string; notes?: string; fulfillmentMode?: 'delivery' | 'pickup' }
): string {
  const { subtotal } = calculateCartTotals(cart);
  const currency = config.currency || 'GHS';

  const lines: string[] = [
    `*NEW ORDER - ${config.store_name.toUpperCase()}*`,
    `--------------------------------`,
    `*Customer:* ${customer.name}`,
    `*Phone:* ${customer.phone}`,
  ];

  if (customer.fulfillmentMode) {
    lines.push(`*Fulfillment:* ${customer.fulfillmentMode === 'pickup' ? 'Store Pickup' : 'Doorstep Delivery'}`);
  }

  if (customer.address) {
    lines.push(`*Address / Branch:* ${customer.address}`);
  }

  if (customer.notes) {
    lines.push(`*Note:* ${customer.notes}`);
  }

  lines.push(`--------------------------------`);
  lines.push(`*ITEMS:*`);

  cart.forEach((item, index) => {
    const itemTotal = formatCurrency(item.price * item.quantity, currency);
    const variantDesc = item.variantTitle && item.variantTitle !== 'Default' ? ` (${item.variantTitle})` : '';
    lines.push(`${index + 1}. ${item.productName}${variantDesc} x${item.quantity} = ${itemTotal}`);
  });

  lines.push(`--------------------------------`);
  lines.push(`*TOTAL:* ${formatCurrency(subtotal, currency)}`);
  lines.push(`--------------------------------`);
  lines.push(`Order created via Merchander Storefront`);

  return lines.join('\n');
}

/**
 * Generates direct WhatsApp click-to-chat URL with pre-filled message
 */
export function createWhatsAppOrderLink(phone: string, message: string): string {
  // Normalize phone number (strip +, spaces, dashes)
  const cleanedPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanedPhone}?text=${encodedText}`;
}

/**
 * Resolves active hero slides with fallback to legacy config or default slide.
 * Strictly bounds slides to max 3 and filters inactive ones.
 */
export function resolveActiveHeroSlides(config: StorefrontConfig): StorefrontHeroSlide[] {
  const active = (config.hero_slides || [])
    .filter((s) => s.is_active)
    .slice(0, 3)
    .map((s) => ({
      ...s,
      compare_at_price_pill: s.compare_at_price_pill || null,
      image_fit: s.image_fit || (s.link_type === 'product' ? 'fit' : 'cover'),
    }));
  if (active.length > 0) return active;

  return [
    {
      id: 'slide_default',
      is_active: true,
      image_url: config.banner_url || null,
      headline: config.banner_headline || config.tagline || 'Everyday Essentials.',
      tagline: config.banner_tagline || config.bio || 'Quality, style and comfort in one place.',
      badge_text: config.banner_badge_text || 'NEW ARRIVALS',
      price_pill: config.banner_price_pill || '',
      compare_at_price_pill: config.banner_compare_at_price_pill || '',
      cta_text: config.banner_cta_text || 'Shop Now',
      link_type: config.banner_link_type || 'catalog',
      link_id: config.banner_link_id || null,
      contrast_theme: config.banner_contrast_theme || 'auto',
      image_fit: config.banner_image_fit || 'cover',
    },
  ];
}

/**
 * Normalizes spotlight banner configuration and ensures valid image display mode ('fit' | 'cover').
 */
export function resolveSpotlightBanner(
  spotlight?: StorefrontSpotlightBanner | null,
  fallback: Partial<StorefrontSpotlightBanner> = {}
): StorefrontSpotlightBanner {
  return {
    headline: spotlight?.headline ?? fallback.headline ?? null,
    tagline: spotlight?.tagline ?? fallback.tagline ?? null,
    image_url: spotlight?.image_url ?? fallback.image_url ?? null,
    cta_text: spotlight?.cta_text ?? fallback.cta_text ?? 'Explore',
    link_url: spotlight?.link_url ?? fallback.link_url ?? '/products',
    badge_text: spotlight?.badge_text ?? fallback.badge_text ?? null,
    image_fit: spotlight?.image_fit ?? fallback.image_fit ?? 'fit',
  };
}


