'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createCategoryAction } from '@/app/actions/create-category';
import { toast } from 'sonner';

export interface Category {
  id: string;
  name: string;
}

interface ProductOrganizationCardProps {
  categories: Category[];
  categoryId: string;
  vendor: string;
  stockUnit: string;
  onCategoryIdChange: (val: string) => void;
  onVendorChange: (val: string) => void;
  onStockUnitChange: (val: string) => void;
  onCategoriesUpdate: (categories: Category[]) => void;
}

export function ProductOrganizationCard({
  categories,
  categoryId,
  vendor,
  stockUnit,
  onCategoryIdChange,
  onVendorChange,
  onStockUnitChange,
  onCategoriesUpdate,
}: ProductOrganizationCardProps) {
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSavingCategory(true);
    const fd = new FormData();
    fd.append('name', newCategoryName);
    const result = await createCategoryAction(fd);
    if (result.error) {
      toast.error(result.error);
    } else if (result.category) {
      const updated = [...categories, result.category].sort((a, b) => a.name.localeCompare(b.name));
      onCategoriesUpdate(updated);
      onCategoryIdChange(result.category.id);
      setNewCategoryName('');
      setIsCreatingCategory(false);
    }
    setIsSavingCategory(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="product-category" className="text-body-sm font-semibold">
              Category
            </label>
            <button
              type="button"
              onClick={() => setIsCreatingCategory(!isCreatingCategory)}
              className="text-xs font-medium text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1 cursor-pointer"
            >
              {isCreatingCategory ? <X size={12} /> : <Plus size={12} />}
              {isCreatingCategory ? 'Cancel' : 'Add Category'}
            </button>
          </div>

          {isCreatingCategory ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveCategory();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleSaveCategory}
                disabled={isSavingCategory || !newCategoryName.trim()}
                className="text-xs px-3"
              >
                {isSavingCategory ? '...' : 'Save'}
              </Button>
            </div>
          ) : (
            <select
              id="product-category"
              value={categoryId}
              onChange={(e) => onCategoryIdChange(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
            >
              <option value="">Select Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="product-vendor" className="text-body-sm font-semibold">
            Vendor
          </label>
          <input
            id="product-vendor"
            type="text"
            value={vendor}
            onChange={(e) => onVendorChange(e.target.value)}
            placeholder="e.g. Merchander"
            className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="product-stock-unit" className="text-body-sm font-semibold">
            Stock Unit
          </label>
          <div className="relative">
            <select
              id="product-stock-unit"
              value={stockUnit}
              onChange={(e) => onStockUnitChange(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all appearance-none cursor-pointer"
            >
              <option value="pcs">Pieces (pcs)</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="g">Grams (g)</option>
              <option value="lbs">Pounds (lbs)</option>
              <option value="oz">Ounces (oz)</option>
              <option value="l">Liters (l)</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="box">Boxes</option>
              <option value="carton">Cartons</option>
              <option value="pack">Packs</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
