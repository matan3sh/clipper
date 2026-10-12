import {
  BookOpen,
  House,
  Shirt,
  Smartphone,
  Sparkles,
  Tag,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';

import { CATEGORIES, type Category } from '@/types/voucher';

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  books: BookOpen,
  fashion: Shirt,
  home: House,
  beauty: Sparkles,
  food: UtensilsCrossed,
  tech: Smartphone,
  other: Tag,
};

export function categoryLabel(category: Category): string {
  return CATEGORIES.find((c) => c.id === category)?.label ?? 'Other';
}
