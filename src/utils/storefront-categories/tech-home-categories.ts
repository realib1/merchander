import { Smartphone, Laptop, Home, UtensilsCrossed, Apple } from 'lucide-react';
import { StorefrontCategoryMeta } from './types';

export const TECH_HOME_CATEGORIES: StorefrontCategoryMeta[] = [
  {
    id: 'phones-gadgets',
    name: 'Phones & Gadgets',
    slug: 'phones-gadgets',
    subtitle: 'Smart devices, high-fidelity audio, and modern essentials.',
    icon: Smartphone,
    image: '/images/categories/category-lifestyle.jpg',
    tags: ['All', 'Smartphones', 'Tablets', 'Smartwatches', 'Power Banks', 'Chargers', 'Accessories'],
    keywords: [
      'smartphone', 'smartphones', 'phone', 'phones', 'tablet', 'tablets',
      'smartwatch', 'smartwatches', 'power bank', 'power banks', 'charger', 'chargers',
      'gadgets', 'airpods', 'earbuds', 'case',
    ],
    aliases: ['phones', 'gadgets'],
  },
  {
    id: 'computers-electronics',
    name: 'Computers & Electronics',
    slug: 'computers-electronics',
    subtitle: 'High-performance laptops, screens, and tech gear.',
    icon: Laptop,
    image: '/images/categories/category-accessories.jpg',
    tags: ['All', 'Laptops', 'Monitors', 'Keyboards', 'Cameras', 'Speakers', 'TVs', 'Electronics'],
    keywords: [
      'laptop', 'laptops', 'monitor', 'monitors', 'keyboard', 'keyboards',
      'camera', 'cameras', 'speaker', 'speakers', 'tv', 'tvs', 'television',
      'electronics', 'computer', 'pc', 'mouse', 'audio',
    ],
    aliases: ['computers', 'electronics'],
  },
  {
    id: 'home-living',
    name: 'Home & Living',
    slug: 'home-living',
    subtitle: 'Make every corner warm, functional, and inviting.',
    icon: Home,
    image: '/images/categories/category-lifestyle.jpg',
    tags: ['All', 'Furniture', 'Decor', 'Lighting', 'Bedding', 'Rugs', 'Curtains', 'Storage'],
    keywords: [
      'furniture', 'decor', 'lighting', 'bedding', 'rug', 'rugs', 'curtain',
      'curtains', 'storage', 'home', 'living', 'pillow', 'blanket', 'lamp', 'cushion',
    ],
    aliases: ['home', 'living'],
  },
  {
    id: 'kitchen-dining',
    name: 'Kitchen & Dining',
    slug: 'kitchen-dining',
    subtitle: 'Cookware, utensils, appliances, and tableware.',
    icon: UtensilsCrossed,
    image: '/images/categories/category-lifestyle.jpg',
    tags: ['All', 'Cookware', 'Utensils', 'Appliances', 'Tableware', 'Food Storage'],
    keywords: [
      'cookware', 'utensil', 'utensils', 'appliance', 'appliances', 'tableware',
      'food storage', 'kitchen', 'dining', 'pot', 'pan', 'knife', 'plate', 'mug', 'blender', 'bottle',
    ],
    aliases: ['kitchen', 'dining'],
  },
  {
    id: 'food-groceries',
    name: 'Food & Groceries',
    slug: 'food-groceries',
    subtitle: 'Packaged food, drinks, snacks, and household essentials.',
    icon: Apple,
    image: '/images/categories/collection-best-sellers.jpg',
    tags: ['All', 'Packaged Food', 'Drinks', 'Snacks', 'Ingredients', 'Household Groceries'],
    keywords: [
      'packaged food', 'drink', 'drinks', 'snack', 'snacks', 'ingredient',
      'ingredients', 'groceries', 'food', 'beverage', 'tea', 'coffee', 'rice', 'oil', 'spices', 'pantry',
    ],
    aliases: ['food', 'groceries'],
  },
];
