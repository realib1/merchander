'use client';

import { useState } from 'react';
import { CategoriesToolbar } from './CategoriesToolbar';
import { CategoriesTable, CategoryData } from './CategoriesTable';

export function CategoriesPageClient({ categories }: { categories: CategoryData[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);

  return (
    <div className="bg-surface border border-separator rounded-xl flex-1 flex flex-col overflow-hidden shadow-sm min-h-150">
      <CategoriesToolbar
        statuses={['All', 'Active', 'Draft']}
        onAddCategory={() => {
          setEditingCategory(null);
          setIsModalOpen(true);
        }}
      />
      <CategoriesTable
        categories={categories}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        editingCategory={editingCategory}
        setEditingCategory={setEditingCategory}
      />
    </div>
  );
}
