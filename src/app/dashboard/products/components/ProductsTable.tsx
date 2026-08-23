'use client';

import { useState, useEffect } from 'react';
import { MoreHorizontal, Edit, PackageSearch, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import type { Product } from '@/types/product';

interface InventoryLevel {
  quantity: number;
}

interface VariantWithInventory {
  inventory_levels?: InventoryLevel[] | null;
}

export function CatalogTable({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sync state when URL search parameters trigger a server re-fetch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProducts(initialProducts);
  }, [initialProducts]);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(products.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleItem = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const calculateTotalStock = (variants: VariantWithInventory[]) => {
    if (!variants || variants.length === 0) return 0;
    let total = 0;
    variants.forEach(variant => {
      if (variant.inventory_levels) {
        variant.inventory_levels.forEach((inv: InventoryLevel) => {
          total += (inv.quantity || 0);
        });
      }
    });
    return total;
  };

  return (
    <div className="bg-surface border border-separator rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-surface-elevated border-b border-separator text-text-secondary text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={products.length > 0 && selectedIds.size === products.length}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="rounded border-separator text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4 translate-y-0.5" 
                />
              </th>
              <th className="px-6 py-4 font-semibold">Product Name</th>
              <th className="px-6 py-4 font-semibold text-center">Status</th>
              <th className="px-6 py-4 font-semibold text-center">Variants</th>
              <th className="px-6 py-4 font-semibold text-right">Total Stock</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-text-muted italic">
                  No products found matching these criteria.
                </td>
              </tr>
            ) : (
              products.map(product => {
                const totalStock = calculateTotalStock((product.variants || []) as unknown as VariantWithInventory[]);
                const isOutOfStock = totalStock <= 0;
                
                return (
                  <tr key={product.id} className="hover:bg-surface-elevated/50 transition-colors group">
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(product.id)}
                        onChange={(e) => toggleItem(product.id, e.target.checked)}
                        className="rounded border-separator text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4 translate-y-0.5" 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-separator flex items-center justify-center shrink-0">
                          {/* Image placeholder */}
                          <PackageSearch size={18} className="text-text-muted" />
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">{product.name}</div>
                          <div className="font-mono text-xs text-text-muted mt-0.5">#{product.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {product.is_active ? (
                        <span className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center bg-surface-elevated text-text-secondary px-3 py-1 rounded-full text-xs font-semibold border border-separator">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center bg-surface-elevated text-text-primary px-3 py-1 rounded-full text-xs font-semibold border border-separator">
                        {product.variants?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${isOutOfStock ? 'text-error' : 'text-text-primary'}`}>
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative action-menu-container">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === product.id ? null : product.id);
                        }}
                        className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {activeMenuId === product.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-6 top-12 w-40 bg-surface border border-separator rounded-xl shadow-lg z-10 overflow-hidden text-left"
                          >
                            <div className="p-1">
                              <button onClick={() => { toast.info('Edit product coming soon!'); setActiveMenuId(null); }} className="w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg flex items-center gap-2 transition-colors">
                                <Edit size={14} />
                                Edit
                              </button>
                              <button onClick={() => { toast.info('Manage inventory coming soon!'); setActiveMenuId(null); }} className="w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg flex items-center gap-2 transition-colors">
                                <PackageSearch size={14} />
                                Inventory
                              </button>
                              <div className="h-px bg-separator my-1 mx-2" />
                              <button onClick={() => { toast.error('Delete product coming soon!'); setActiveMenuId(null); }} className="w-full px-3 py-2 text-sm text-error hover:bg-error/10 rounded-lg flex items-center gap-2 transition-colors">
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination placeholder */}
      <div className="p-4 border-t border-separator bg-surface-elevated/30 flex items-center justify-between text-sm text-text-secondary shrink-0">
        <div>Showing {products.length} products</div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors disabled:opacity-50">Previous</button>
          <button className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}
