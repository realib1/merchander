import {
  Shirt,
  Footprints,
  ShoppingBag,
  Home,
  Heart,
  Smartphone,
  LucideIcon,
} from 'lucide-react';

export interface CategoryTemplate {
  name: string;
  icon: LucideIcon;
  slugMatch: string[];
}

export const DEFAULT_CATEGORY_TEMPLATES: CategoryTemplate[] = [
  {
    name: 'Fashion & Clothing',
    icon: Shirt,
    slugMatch: ['fashion', 'clothing', 'apparel', 'clothes', 'wear', 't-shirt', 'shirts'],
  },
  {
    name: 'Shoes & Footwear',
    icon: Footprints,
    slugMatch: ['shoes', 'footwear', 'sneakers', 'sandals', 'slides', 'boots'],
  },
  {
    name: 'Bags & Accessories',
    icon: ShoppingBag,
    slugMatch: ['bags', 'accessories', 'backpacks', 'totes', 'handbags', 'wallets'],
  },
  {
    name: 'Beauty & Personal Care',
    icon: Heart,
    slugMatch: ['beauty', 'cosmetics', 'skincare', 'fragrance', 'personal-care'],
  },
  {
    name: 'Phones & Gadgets',
    icon: Smartphone,
    slugMatch: ['phones', 'gadgets', 'smartphone', 'iphone', 'audio', 'airpods'],
  },
  {
    name: 'Home & Living',
    icon: Home,
    slugMatch: ['home', 'living', 'decor', 'kitchen', 'lifestyle', 'bedding'],
  },
];
