'use client';

import { Package, Pencil, Trash2 } from 'lucide-react';
import { deleteCategory } from '@/app/actions/categories';
import { toast } from 'sonner';
import { CategoryFormModal } from './CategoryFormModal';

export interface CategoryData {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  productCount: number;
  totalInventory: number;
}

interface CategoriesTableProps {
  categories: CategoryData[];
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  editingCategory: CategoryData | null;
  setEditingCategory: (category: CategoryData | null) => void;
}

export function CategoriesTable({
  categories,
  isModalOpen,
  setIsModalOpen,
  editingCategory,
  setEditingCategory,
}: CategoriesTableProps) {
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const res = await deleteCategory(id);
      if (res.error) throw new Error(res.error);
      toast.success('Category deleted successfully');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  };

  return (
    <>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left whitespace-nowrap min-w-200">
          <thead>
            <tr className="text-xs font-semibold  bg-surface-elevated/30 border-b border-separator">
              <th className="px-6 py-4">Category Name</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-right">Products</th>
              <th className="px-6 py-4 text-right">Total Inventory</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {categories.length > 0 ? (
              categories.map((cat) => {
                const initials = cat.name.substring(0, 2).toUpperCase();

                return (
                  <tr key={cat.id} className="hover:bg-surface-elevated/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {initials}
                        </div>
                        <div className="font-semibold  text-sm">{cat.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm  truncate max-w-50">
                      {cat.description || <span className="text-muted italic">No description</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-semibold">{cat.productCount}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm">{cat.totalInventory} units</div>
                    </td>
                    <td className="px-6 py-4">
                      {cat.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-caption font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-caption font-semibold bg-surface-elevated  border border-separator">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setIsModalOpen(true);
                          }}
                          className="p-2  hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-2  hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center text-muted">
                      <Package size={24} />
                    </div>
                    <p className="text-body font-medium">No categories found</p>
                    <p className="text-sm text-muted">Try adjusting your filters or create a new category.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
      />
    </>
  );
}
