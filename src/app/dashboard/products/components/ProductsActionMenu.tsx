'use client';

import { useState, useEffect } from 'react';
import { MoreHorizontal, Edit, PackageSearch, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { deleteProduct } from '@/app/actions/products';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function ProductsActionMenu({ productId }: { productId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProduct(productId);
      toast.success('Product deleted successfully');
      setIsOpen(false);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest(`.action-menu-${productId}`)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [productId]);

  return (
    <div className={`relative action-menu-${productId}`}>
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false); }}
        aria-label="Product actions"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
      >
        <MoreHorizontal size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-8 top-0 w-40 bg-surface border border-separator rounded-xl shadow-lg z-50 overflow-hidden text-left"
          >
            <div role="menu"  className="p-1">
              <Link
                href={`/dashboard/products/${productId}`}
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg flex items-center gap-2 transition-colors"
                role="menuitem"
              >
                <Eye size={14} />
                View details
              </Link>
              <Link
                href={`/dashboard/products/${productId}/edit`}
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg flex items-center gap-2 transition-colors"
                role="menuitem"
              >
                <Edit size={14} />
                Edit
              </Link>
              <Link 
                href={`/dashboard/inventory?product=${productId}`}
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
                className="w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg flex items-center gap-2 transition-colors"
                role="menuitem"
              >
                <PackageSearch size={14} />
                Inventory
              </Link>
              <div className="h-px bg-separator my-1 mx-2" role="separator" />
              <button 
                role="menuitem"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsDeleteDialogOpen(true); }} 
                className="w-full px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        description="Are you sure you want to delete this product? All associated variants and inventory levels will be permanently deleted. This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
