import { describe, it, expect } from 'vitest';
import {
  CURATED_STOREFRONT_CATEGORIES,
  CURATED_COLLECTIONS,
  resolveCategoryImage,
  resolveCategoryIcon,
  resolveCategoryMeta,
} from './storefront-categories';
import { StorefrontProduct } from '@/types/storefront';

describe('Storefront Categories Utilities', () => {
  it('contains the 20 default retail category presets', () => {
    expect(CURATED_STOREFRONT_CATEGORIES).toHaveLength(20);

    const fashion = CURATED_STOREFRONT_CATEGORIES.find((c) => c.id === 'fashion-clothing');
    expect(fashion).toBeDefined();
    expect(fashion?.name).toBe('Fashion & Clothing');
    expect(fashion?.tags).toContain('Shirts');

    const shoes = CURATED_STOREFRONT_CATEGORIES.find((c) => c.id === 'shoes-footwear');
    expect(shoes).toBeDefined();
    expect(shoes?.name).toBe('Shoes & Footwear');
    expect(shoes?.tags).toContain('Sneakers');

    const bags = CURATED_STOREFRONT_CATEGORIES.find((c) => c.id === 'bags-accessories');
    expect(bags).toBeDefined();
    expect(bags?.tags).toContain('Handbags');

    const auto = CURATED_STOREFRONT_CATEGORIES.find((c) => c.id === 'automotive');
    expect(auto).toBeDefined();
    expect(auto?.tags).toContain('Car Accessories');

    const tools = CURATED_STOREFRONT_CATEGORIES.find((c) => c.id === 'tools-hardware');
    expect(tools).toBeDefined();
    expect(tools?.tags).toContain('Power Tools');

    const agriculture = CURATED_STOREFRONT_CATEGORIES.find((c) => c.id === 'agriculture-garden');
    expect(agriculture).toBeDefined();
    expect(agriculture?.tags).toContain('Seeds');

    const other = CURATED_STOREFRONT_CATEGORIES.find((c) => c.id === 'other');
    expect(other).toBeDefined();
    expect(other?.tags).toContain('General Goods');
  });

  it('contains curated collections matching Screen 3 of design mockup', () => {
    expect(CURATED_COLLECTIONS).toHaveLength(2);
    expect(CURATED_COLLECTIONS[0].title).toBe('New Arrivals');
    expect(CURATED_COLLECTIONS[1].title).toBe('Best Sellers');
  });

  it('resolves category images prioritizing real product images if available', () => {
    const mockProducts: StorefrontProduct[] = [
      {
        id: 'p1',
        name: 'Shero Classic Tee',
        description: 'Black t-shirt',
        category_id: 'cat-fashion',
        category_name: 'Fashion & Clothing',
        image_url: 'https://example.com/custom-tee.jpg',
        image_urls: ['https://example.com/custom-tee.jpg'],
        is_featured: true,
        min_price: 180,
        max_price: 180,
        total_stock: 20,
        availability_status: 'AVAILABLE',
        preorder_shipping_mode: 'included',
        specifications: [],
        variants: [],
      },
    ];

    const imageWithProduct = resolveCategoryImage('Fashion & Clothing', mockProducts);
    expect(imageWithProduct).toBe('https://example.com/custom-tee.jpg');

    const imageWithoutProduct = resolveCategoryImage('Fashion & Clothing', []);
    expect(imageWithoutProduct).toBe('/images/categories/category-apparel.jpg');
  });

  it('resolves category meta and icons with alias matching for backward compatibility', () => {
    // Direct name match
    const fashionMeta = resolveCategoryMeta('Fashion & Clothing');
    expect(fashionMeta.name).toBe('Fashion & Clothing');
    expect(fashionMeta.tags).toContain('Shirts');

    // Alias match for legacy Apparel
    const apparelMeta = resolveCategoryMeta('Apparel');
    expect(apparelMeta.name).toBe('Apparel');
    expect(apparelMeta.tags).toContain('Shirts');

    const customMeta = resolveCategoryMeta('Handcrafted Jewelry');
    expect(customMeta.name).toBe('Handcrafted Jewelry');
    expect(customMeta.slug).toBe('handcrafted-jewelry');
    expect(customMeta.tags).toContain('All');

    const icon = resolveCategoryIcon('Fashion & Clothing');
    expect(icon).toBeDefined();

    const aliasIcon = resolveCategoryIcon('Apparel');
    expect(aliasIcon).toBeDefined();
  });
});
