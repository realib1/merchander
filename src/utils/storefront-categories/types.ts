import { LucideIcon } from 'lucide-react';

export interface StorefrontCategoryMeta {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  icon: LucideIcon;
  image: string;
  tags: string[];
  keywords: string[];
  aliases?: string[];
}
