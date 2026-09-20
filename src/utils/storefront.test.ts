
import {
  generateStoreSlug,
  calculateCartTotals,
  formatWhatsAppOrderMessage,
  createWhatsAppOrderLink,
  resolveActiveHeroSlides,
  resolveSpotlightBanner,
} from './storefront';
import { StorefrontCartItem, StorefrontConfig } from '@/types/storefront';

describe('Storefront Utility Functions', () => {
  it('generates clean URL-safe slugs', () => {
    expect(generateStoreSlug('Glam Hair & Beauty Accra!')).toBe('glam-hair-beauty-accra');
    expect(generateStoreSlug('  Fresh  Kicks   GH ')).toBe('fresh-kicks-gh');
    expect(generateStoreSlug('100% Cotton Apparel')).toBe('100-cotton-apparel');
  });

  it('calculates cart totals accurately', () => {
    const items: StorefrontCartItem[] = [
      {
        variantId: 'v1',
        productId: 'p1',
        productName: 'Raw Virgin Wig',
        variantTitle: '24 inch / Natural Black',
        price: 850,
        quantity: 2,
        imageUrl: null,
      },
      {
        variantId: 'v2',
        productId: 'p2',
        productName: 'Edge Control Gel',
        variantTitle: 'Default',
        price: 50,
        quantity: 3,
        imageUrl: null,
      },
    ];

    const { subtotal, itemCount } = calculateCartTotals(items);
    expect(subtotal).toBe(850 * 2 + 50 * 3); // 1700 + 150 = 1850
    expect(itemCount).toBe(5);
  });

  it('formats structured WhatsApp order messages', () => {
    const config: StorefrontConfig = {
      tenant_id: 't-123',
      store_name: 'Glam Accra',
      slug: 'glam-accra',
      tagline: 'Best hair in Ghana',
      bio: null,
      logo_url: null,
      banner_url: null,
      whatsapp_phone: '+233241234567',
      instagram_handle: 'glam_accra',
      tiktok_handle: null,
      delivery_policy: null,
      is_active: true,
      currency: 'GHS',
    };

    const cart: StorefrontCartItem[] = [
      {
        variantId: 'v1',
        productId: 'p1',
        productName: 'Silk Bonnet',
        variantTitle: 'Pink',
        price: 60,
        quantity: 1,
        imageUrl: null,
      },
    ];

    const message = formatWhatsAppOrderMessage(config, cart, {
      name: 'Kofi Mensah',
      phone: '0241234567',
      address: 'East Legon, Accra',
    });

    expect(message).toContain('GLAM ACCRA');
    expect(message).toContain('Kofi Mensah');
    expect(message).toContain('East Legon, Accra');
    expect(message).toContain('Silk Bonnet (Pink) x1');
  });

  it('creates valid WhatsApp click-to-chat links', () => {
    const link = createWhatsAppOrderLink('+233 24 123 4567', 'Hello from store');
    expect(link).toBe('https://wa.me/233241234567?text=Hello%20from%20store');
  });

  describe('resolveActiveHeroSlides', () => {
    const baseConfig: StorefrontConfig = {
      tenant_id: 't-123',
      store_name: 'Glam Accra',
      slug: 'glam-accra',
      tagline: 'Premium Hair',
      bio: 'Best hair shop in East Legon',
      logo_url: null,
      banner_url: '/img/default.jpg',
      banner_headline: 'Top Deals',
      banner_tagline: 'Save up to 50%',
      banner_cta_text: 'Buy Now',
      banner_badge_text: 'HOT',
      banner_price_pill: 'GHS 150',
      banner_contrast_theme: 'dark',
      whatsapp_phone: null,
      instagram_handle: null,
      tiktok_handle: null,
      delivery_policy: null,
      is_active: true,
      currency: 'GHS',
    };

    it('falls back to default slide from legacy config when hero_slides is missing', () => {
      const slides = resolveActiveHeroSlides(baseConfig);
      expect(slides).toHaveLength(1);
      expect(slides[0].headline).toBe('Top Deals');
      expect(slides[0].image_url).toBe('/img/default.jpg');
      expect(slides[0].contrast_theme).toBe('dark');
      expect(slides[0].is_active).toBe(true);
    });

    it('filters out inactive slides', () => {
      const configWithSlides: StorefrontConfig = {
        ...baseConfig,
        hero_slides: [
          {
            id: 's1',
            is_active: true,
            headline: 'Slide 1',
            image_url: '/img/1.jpg',
          },
          {
            id: 's2',
            is_active: false,
            headline: 'Slide 2 Hidden',
            image_url: '/img/2.jpg',
          },
          {
            id: 's3',
            is_active: true,
            headline: 'Slide 3',
            image_url: '/img/3.jpg',
          },
        ],
      };

      const slides = resolveActiveHeroSlides(configWithSlides);
      expect(slides).toHaveLength(2);
      expect(slides[0].headline).toBe('Slide 1');
      expect(slides[1].headline).toBe('Slide 3');
    });

    it('bounds slides to a maximum of 3', () => {
      const configWith4Slides: StorefrontConfig = {
        ...baseConfig,
        hero_slides: [
          { id: '1', is_active: true, headline: 'S1' },
          { id: '2', is_active: true, headline: 'S2' },
          { id: '3', is_active: true, headline: 'S3' },
          { id: '4', is_active: true, headline: 'S4' },
        ],
      };

      const slides = resolveActiveHeroSlides(configWith4Slides);
      expect(slides).toHaveLength(3);
      expect(slides.map((s) => s.id)).toEqual(['1', '2', '3']);
    });

    it('falls back to legacy default when all configured slides are inactive', () => {
      const configWithAllInactive: StorefrontConfig = {
        ...baseConfig,
        hero_slides: [
          { id: '1', is_active: false, headline: 'Draft 1' },
          { id: '2', is_active: false, headline: 'Draft 2' },
        ],
      };

      const slides = resolveActiveHeroSlides(configWithAllInactive);
      expect(slides).toHaveLength(1);
      expect(slides[0].headline).toBe('Top Deals');
      expect(slides[0].is_active).toBe(true);
    });

    it('preserves image_fit as cover or fit and respects link_type fallback', () => {
      const configWithFit: StorefrontConfig = {
        ...baseConfig,
        banner_image_fit: 'cover',
        hero_slides: [
          { id: 's1', is_active: true, image_fit: 'cover', link_type: 'product' },
          { id: 's2', is_active: true, link_type: 'product' },
          { id: 's3', is_active: true, link_type: 'catalog' },
        ],
      };

      const slides = resolveActiveHeroSlides(configWithFit);
      expect(slides[0].image_fit).toBe('cover'); // explicit cover preserved even for product link
      expect(slides[1].image_fit).toBe('fit'); // product link defaults to fit
      expect(slides[2].image_fit).toBe('cover'); // non-product link falls back to banner_image_fit / cover
    });
  });

  describe('resolveSpotlightBanner', () => {
    it('defaults image_fit to fit when unspecified', () => {
      const banner = resolveSpotlightBanner({
        headline: 'Featured Shoes',
        tagline: 'Fresh arrivals',
        image_url: '/img/shoes.png',
      });
      expect(banner.image_fit).toBe('fit');
      expect(banner.headline).toBe('Featured Shoes');
      expect(banner.cta_text).toBe('Explore');
      expect(banner.link_url).toBe('/products');
    });

    it('preserves cover image_fit mode when explicitly configured', () => {
      const banner = resolveSpotlightBanner({
        headline: 'Weekend Sale',
        tagline: 'Up to 40% off',
        image_url: '/img/lifestyle-banner.jpg',
        image_fit: 'cover',
        cta_text: 'Shop Sale',
        link_url: '/catalog?sale=true',
      });
      expect(banner.image_fit).toBe('cover');
      expect(banner.cta_text).toBe('Shop Sale');
      expect(banner.link_url).toBe('/catalog?sale=true');
    });

    it('uses fallback values when banner is empty or null', () => {
      const banner = resolveSpotlightBanner(null, {
        headline: 'Default Highlight',
        image_fit: 'cover',
        cta_text: 'Discover',
      });
      expect(banner.headline).toBe('Default Highlight');
      expect(banner.image_fit).toBe('cover');
      expect(banner.cta_text).toBe('Discover');
    });
  });
});


