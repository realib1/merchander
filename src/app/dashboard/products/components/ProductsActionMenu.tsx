'use client';

import { useState, useEffect } from 'react';
import { MoreHorizontal, Edit, PackageSearch, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export function ProductsActionMenu({ productId }: { productId: string }) {
  const [isOpen, setIsOpen] = useState(false);

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
              <button 
                role="menuitem"
                onClick={(e) => { e.preventDefault(); toast.info('Edit product coming soon!'); setIsOpen(false); }} 
                className="w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg flex items-center gap-2 transition-colors"
              >
                <Edit size={14} />
                Edit
              </button>
              <button 
                role="menuitem"
                onClick={(e) => { e.preventDefault(); toast.info('Manage inventory coming soon!'); setIsOpen(false); }} 
                className="w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg flex items-center gap-2 transition-colors"
              >
                <PackageSearch size={14} />
                Inventory
              </button>
              <div className="h-px bg-separator my-1 mx-2" role="separator" />
              <button 
                role="menuitem"
                onClick={(e) => { e.preventDefault(); toast.error('Delete product coming soon!'); setIsOpen(false); }} 
                className="w-full px-3 py-2 text-sm text-error hover:bg-error/10 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
