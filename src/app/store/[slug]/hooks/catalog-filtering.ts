import { StorefrontProduct } from '@/types/storefront';
import { SortOption } from '../components/StoreCatalogGrid';

interface FilterSortOptions {
  selectedCategoryId: string;
  searchQuery: string;
  inStockOnly: boolean;
  sortBy: SortOption;
}

export function filterAndSortCatalogProducts(
  products: StorefrontProduct[],
  { selectedCategoryId, searchQuery, inStockOnly, sortBy }: FilterSortOptions
): StorefrontProduct[] {
  let result = products.filter((p) => {
    const matchesCategory =
      selectedCategoryId === 'all'
        ? true
        : selectedCategoryId === 'preorders'
          ? p.availability_status === 'PRE_ORDER' || Boolean(p.active_batch)
          : p.category_id === selectedCategoryId;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStock = !inStockOnly || p.total_stock > 0 || p.availability_status === 'PRE_ORDER';
    return matchesCategory && matchesSearch && matchesStock;
  });

  switch (sortBy) {
    case 'price_asc':
      result = [...result].sort((a, b) => a.min_price - b.min_price);
      break;
    case 'price_desc':
      result = [...result].sort((a, b) => b.min_price - a.min_price);
      break;
    case 'name':
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'featured':
    default:
      result = [...result].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
      break;
  }
  return result;
}
