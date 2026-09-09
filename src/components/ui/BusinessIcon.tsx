import React from 'react';
import {
  Ship,
  Clock,
  Factory,
  Globe,
  TrendingUp,
  Bot,
  ShoppingBag,
  Boxes,
  Zap,
  SlidersHorizontal,
  Package,
} from 'lucide-react';

export interface BusinessIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function BusinessIcon({ name, className = '', size = 20 }: BusinessIconProps) {
  switch (name) {
    case 'ship':
      return <Ship size={size} className={className} />;
    case 'clock':
      return <Clock size={size} className={className} />;
    case 'factory':
      return <Factory size={size} className={className} />;
    case 'globe':
      return <Globe size={size} className={className} />;
    case 'trending-up':
      return <TrendingUp size={size} className={className} />;
    case 'bot':
      return <Bot size={size} className={className} />;
    case 'shopping-bag':
      return <ShoppingBag size={size} className={className} />;
    case 'boxes':
      return <Boxes size={size} className={className} />;
    case 'zap':
      return <Zap size={size} className={className} />;
    case 'sliders':
      return <SlidersHorizontal size={size} className={className} />;
    default:
      return <Package size={size} className={className} />;
  }
}
