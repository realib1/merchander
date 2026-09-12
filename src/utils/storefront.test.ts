
import {
  generateStoreSlug,
  calculateCartTotals,
  formatWhatsAppOrderMessage,
  createWhatsAppOrderLink,
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
});
