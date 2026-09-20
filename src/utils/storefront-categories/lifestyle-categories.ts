import { HeartPulse, Baby, Dumbbell, Car, Wrench } from 'lucide-react';
import { StorefrontCategoryMeta } from './types';

export const LIFESTYLE_CATEGORIES: StorefrontCategoryMeta[] = [
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    slug: 'health-wellness',
    subtitle: 'Fitness, wellness products, and personal health care.',
    icon: HeartPulse,
    image: '/images/categories/category-lifestyle.jpg',
    tags: ['All', 'Fitness & Wellness', 'Personal Health', 'Supplements'],
    keywords: [
      'fitness', 'wellness', 'health', 'personal health', 'supplements',
      'vitamins', 'care', 'first aid', 'sanitizer', 'wellness products',
    ],
    aliases: ['health', 'wellness'],
  },
  {
    id: 'baby-kids',
    name: 'Baby & Kids',
    slug: 'baby-kids',
    subtitle: "Baby products, children's clothing, toys, and care.",
    icon: Baby,
    image: '/images/categories/category-headwear.jpg',
    tags: ['All', 'Baby Products', "Children's Clothing", 'Toys', 'Feeding', 'School Items'],
    keywords: [
      'baby', 'kids', 'baby products', "children's clothing", 'children',
      'toy', 'toys', 'feeding', 'school items', 'diaper', 'stroller', 'toddler', 'infant', 'backpack',
    ],
    aliases: ['baby', 'kids', 'children'],
  },
  {
    id: 'sports-fitness',
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    subtitle: 'Sportswear, equipment, gym accessories, and gear.',
    icon: Dumbbell,
    image: '/images/categories/category-apparel.jpg',
    tags: ['All', 'Sportswear', 'Equipment', 'Gym Accessories', 'Outdoor Gear'],
    keywords: [
      'sportswear', 'equipment', 'gym accessories', 'outdoor gear', 'sports',
      'fitness', 'gym', 'workout', 'dumbbell', 'yoga', 'weights', 'running', 'training', 'activewear',
    ],
    aliases: ['sports', 'fitness'],
  },
  {
    id: 'automotive',
    name: 'Automotive',
    slug: 'automotive',
    subtitle: 'Car accessories, parts, maintenance, and motorbike gear.',
    icon: Car,
    image: '/images/categories/category-accessories.jpg',
    tags: ['All', 'Car Accessories', 'Parts', 'Maintenance Products', 'Motorbike Products'],
    keywords: [
      'car', 'cars', 'automotive', 'car accessories', 'parts', 'maintenance',
      'motorbike', 'motorcycle', 'vehicle', 'tire', 'oil', 'wiper', 'dashcam',
    ],
    aliases: ['auto', 'automotive', 'cars'],
  },
  {
    id: 'tools-hardware',
    name: 'Tools & Hardware',
    slug: 'tools-hardware',
    subtitle: 'Power tools, hand tools, electrical, plumbing, and building supplies.',
    icon: Wrench,
    image: '/images/categories/category-accessories.jpg',
    tags: ['All', 'Power Tools', 'Hand Tools', 'Electrical Hardware', 'Plumbing', 'Building Supplies'],
    keywords: [
      'power tools', 'hand tools', 'electrical hardware', 'plumbing',
      'building supplies', 'tools', 'hardware', 'drill', 'hammer', 'wrench', 'screwdriver', 'fixtures',
    ],
    aliases: ['tools', 'hardware'],
  },
];
