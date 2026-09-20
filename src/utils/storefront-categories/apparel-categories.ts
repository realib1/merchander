import { Shirt, Footprints, ShoppingBag, Watch, Heart } from 'lucide-react';
import { StorefrontCategoryMeta } from './types';

export const APPAREL_CATEGORIES: StorefrontCategoryMeta[] = [
  {
    id: 'fashion-clothing',
    name: 'Fashion & Clothing',
    slug: 'fashion-clothing',
    subtitle: 'Contemporary styles, everyday essentials, and traditional wear.',
    icon: Shirt,
    image: '/images/categories/category-apparel.jpg',
    tags: ['All', 'Shirts', 'Dresses', 'Trousers', 'Jeans', 'Hoodies', 'Traditional Wear', 'Underwear'],
    keywords: [
      'shirt', 't-shirt', 'tee', 'dress', 'trouser', 'trousers', 'jeans', 'hoodie',
      'hoodies', 'traditional wear', 'kente', 'underwear', 'clothing', 'fashion',
      'wear', 'apparel', 'top', 'jacket', 'sweatshirt',
    ],
    aliases: ['apparel', 'clothing', 'headwear'],
  },
  {
    id: 'shoes-footwear',
    name: 'Shoes & Footwear',
    slug: 'shoes-footwear',
    subtitle: 'Step forward in comfort, performance, and style.',
    icon: Footprints,
    image: '/images/categories/category-apparel.jpg',
    tags: ['All', 'Sneakers', 'Sandals', 'Heels', 'Boots', 'Slippers'],
    keywords: [
      'sneaker', 'sneakers', 'sandal', 'sandals', 'heel', 'heels', 'boot', 'boots',
      'slipper', 'slippers', 'shoes', 'footwear', 'kicks', 'loafers', 'slides',
    ],
    aliases: ['shoes', 'footwear'],
  },
  {
    id: 'bags-accessories',
    name: 'Bags & Accessories',
    slug: 'bags-accessories',
    subtitle: 'Carry what matters with crafted everyday essentials.',
    icon: ShoppingBag,
    image: '/images/categories/category-accessories.jpg',
    tags: ['All', 'Handbags', 'Backpacks', 'Wallets', 'Belts', 'Caps', 'Sunglasses'],
    keywords: [
      'handbag', 'handbags', 'backpack', 'backpacks', 'wallet', 'wallets', 'belt',
      'belts', 'cap', 'caps', 'sunglasses', 'shades', 'bag', 'bags', 'tote',
      'duffel', 'crossbody', 'accessories',
    ],
    aliases: ['bags', 'accessories'],
  },
  {
    id: 'jewelry-watches',
    name: 'Jewelry & Watches',
    slug: 'jewelry-watches',
    subtitle: 'Timeless accents, wristwear, and fine jewelry.',
    icon: Watch,
    image: '/images/categories/category-accessories.jpg',
    tags: ['All', 'Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Watches'],
    keywords: [
      'ring', 'rings', 'necklace', 'necklaces', 'bracelet', 'bracelets', 'earring',
      'earrings', 'watch', 'watches', 'jewelry', 'jewellery', 'gold', 'silver', 'chain', 'pendant',
    ],
    aliases: ['jewelry', 'watches'],
  },
  {
    id: 'beauty-personal-care',
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    subtitle: 'Nourish your skin, hair, and daily wellness.',
    icon: Heart,
    image: '/images/categories/category-lifestyle.jpg',
    tags: ['All', 'Skincare', 'Makeup', 'Perfumes', 'Hair Products', 'Grooming'],
    keywords: [
      'skincare', 'makeup', 'perfume', 'perfumes', 'fragrance', 'hair products',
      'hair', 'grooming', 'beauty', 'lotion', 'cream', 'serum', 'cosmetics', 'soap', 'glow', 'care',
    ],
    aliases: ['beauty', 'personal-care'],
  },
];
