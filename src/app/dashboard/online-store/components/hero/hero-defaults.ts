import { StorefrontHeroSlide } from '@/types/storefront';

export const BADGE_SUGGESTIONS = [
  'NEW ARRIVALS',
  'LIMITED DROP',
  'SPECIAL OFFER',
  'FLASH SALE',
  'PROMO DROP',
  'WEEKEND DROP',
  'BEST SELLER',
  'HOLIDAY SPECIAL',
];

export interface HeroProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  comparePrice?: number | null;
  stock: number;
  imageUrl: string | null;
}

export function createDefaultSlide(id = 'slide_1'): StorefrontHeroSlide {
  return {
    id,
    is_active: true,
    image_url: null,
    headline: 'Everyday Essentials.',
    tagline: 'Quality, style and comfort in one place.',
    badge_text: 'NEW ARRIVALS',
    price_pill: '',
    compare_at_price_pill: '',
    cta_text: 'Shop Now',
    link_type: 'catalog',
    link_id: '',
    contrast_theme: 'auto',
    image_fit: 'cover',
  };
}

export function extractProductHeroUpdates(
  product: HeroProduct,
  currency: string
): Partial<StorefrontHeroSlide> {
  const curr = currency || 'GHS';
  const formattedPrice = product.price > 0 ? `From ${curr} ${product.price}` : '';
  const formattedComparePrice =
    product.comparePrice && product.comparePrice > product.price
      ? `${curr} ${product.comparePrice}`
      : '';

  let cleanTagline = `Quality and style - shop the ${product.name} now.`;
  if (product.description && product.description.trim().length > 0) {
    const trimmed = product.description.trim();
    const matchSentence = trimmed.match(/^[^.!?]+[.!?]/);
    cleanTagline =
      matchSentence && matchSentence[0].length <= 120
        ? matchSentence[0]
        : trimmed.slice(0, 110) + (trimmed.length > 110 ? '...' : '');
  }

  let badge = 'FEATURED DROP';
  if (product.comparePrice && product.comparePrice > product.price) {
    const savingsPct = Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100);
    badge = `PROMO - ${savingsPct}% OFF`;
  } else if (product.stock > 0 && product.stock <= 5) {
    badge = 'LIMITED STOCK';
  } else if (product.price > 0 && product.price < 50) {
    badge = 'SPECIAL VALUE';
  }

  return {
    link_type: 'product',
    link_id: product.id,
    headline: product.name,
    tagline: cleanTagline,
    price_pill: formattedPrice,
    compare_at_price_pill: formattedComparePrice,
    badge_text: badge,
    cta_text: 'Shop Now',
    image_fit: 'fit',
    ...(product.imageUrl ? { image_url: product.imageUrl } : {}),
  };
}

