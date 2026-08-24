import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createCategory, updateCategory } from '@/app/actions/categories';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null; // null/undefined means we are creating a new category
}

export function CategoryFormModal({ isOpen, onClose, category }: CategoryFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(category.name || '');
      setDescription(category.description || '');
      setIsActive(category.is_active ?? true);
    } else {
      setName('');
      setDescription('');
      setIsActive(true);
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('is_active', isActive.toString());

    try {
      if (category) {
        const res = await updateCategory(category.id, formData);
        if (res.error) throw new Error(res.error);
        toast.success('Category updated successfully');
      } else {
        const res = await createCategory(formData);
        if (res.error) throw new Error(res.error);
        toast.success('Category created successfully');
      }
      onClose();
    } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      toast.error(error.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Category' : 'Add Category'}
      description={category ? 'Update the details for this category.' : 'Create a new product category.'}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Category'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-body-sm font-semibold">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm  focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
            placeholder="e.g. Electronics, Clothing"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-body-sm font-semibold">
            Description <span className="text-muted font-normal">(Optional)</span>
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm  focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
            placeholder="Brief description of the category..."
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            id="is_active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-separator text-brand-primary focus:ring-brand-primary"
          />
          <label htmlFor="is_active" className="text-sm font-medium  cursor-pointer">
            Active
          </label>
        </div>
      </form>
    </Modal>
  );
}
