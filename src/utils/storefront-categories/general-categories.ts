import { Briefcase, BookOpen, PawPrint, Sprout, Package } from 'lucide-react';
import { StorefrontCategoryMeta } from './types';

export const GENERAL_CATEGORIES: StorefrontCategoryMeta[] = [
  {
    id: 'office-stationery',
    name: 'Office & Stationery',
    slug: 'office-stationery',
    subtitle: 'Stationery, office equipment, school supplies, and printers.',
    icon: Briefcase,
    image: '/images/categories/category-accessories.jpg',
    tags: ['All', 'Stationery', 'Office Equipment', 'School Supplies', 'Printers & Accessories'],
    keywords: [
      'stationery', 'office equipment', 'school supplies', 'printer', 'printers',
      'office', 'notebook', 'pen', 'paper', 'journal', 'desk', 'ink',
    ],
    aliases: ['office', 'stationery'],
  },
  {
    id: 'books-media',
    name: 'Books & Media',
    slug: 'books-media',
    subtitle: 'Books, educational materials, games, music, and media.',
    icon: BookOpen,
    image: '/images/categories/collection-best-sellers.jpg',
    tags: ['All', 'Books', 'Educational Materials', 'Games', 'Music & Media'],
    keywords: [
      'book', 'books', 'educational materials', 'games', 'board games',
      'music', 'media', 'novel', 'textbook', 'reading', 'vinyl', 'cd',
    ],
    aliases: ['books', 'media'],
  },
  {
    id: 'pet-supplies',
    name: 'Pet Supplies',
    slug: 'pet-supplies',
    subtitle: 'Pet food, accessories, grooming, and loving care.',
    icon: PawPrint,
    image: '/images/categories/category-lifestyle.jpg',
    tags: ['All', 'Pet Food', 'Accessories', 'Grooming & Care'],
    keywords: [
      'pet food', 'pet', 'pets', 'dog', 'cat', 'puppy', 'kitten',
      'leash', 'collar', 'grooming', 'kibble', 'chew', 'litter',
    ],
    aliases: ['pets', 'pet-supplies'],
  },
  {
    id: 'agriculture-garden',
    name: 'Agriculture & Garden',
    slug: 'agriculture-garden',
    subtitle: 'Seeds, farming tools, gardening supplies, and irrigation.',
    icon: Sprout,
    image: '/images/categories/category-lifestyle.jpg',
    tags: ['All', 'Seeds', 'Farming Tools', 'Gardening Supplies', 'Irrigation'],
    keywords: [
      'seeds', 'farming tools', 'gardening supplies', 'irrigation',
      'farming', 'garden', 'plants', 'fertilizer', 'soil', 'planter', 'mower', 'hose',
    ],
    aliases: ['agriculture', 'garden', 'farming'],
  },
  {
    id: 'other',
    name: 'Other',
    slug: 'other',
    subtitle: "Specialty goods and unique finds that don't fit elsewhere.",
    icon: Package,
    image: '/images/categories/category-apparel.jpg',
    tags: ['All', 'General Goods', 'Miscellaneous', 'Specialty Items'],
    keywords: ['other', 'miscellaneous', 'general', 'specialty', 'custom', 'unique'],
    aliases: ['misc', 'general', 'other'],
  },
];
