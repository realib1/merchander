'use client';

import { useState } from 'react';
import { Store, ChevronDown, Check, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { setActiveBranch } from '@/app/actions/branch';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface BranchSwitcherProps {
  stores: { id: string; name: string }[];
  initialActiveStoreId?: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function BranchSwitcher({ stores, initialActiveStoreId, isOpen, onToggle, onClose }: BranchSwitcherProps) {
  const router = useRouter();
  const [activeStoreId, setActiveStoreId] = useState<string | null>(initialActiveStoreId || stores?.[0]?.id || null);

  if (!stores || stores.length <= 1) return null;

  const isAll = activeStoreId === 'all';
  const activeStore = stores.find((s) => s.id === activeStoreId);
  const displayName = isAll ? 'All Branches' : activeStore?.name || stores?.[0]?.name || 'Select Branch';

  const handleBranchSwitch = async (storeId: string) => {
    setActiveStoreId(storeId);
    onClose();
    const targetStore = stores.find((s) => s.id === storeId);
    const targetName = storeId === 'all' ? 'All Branches' : targetStore?.name || 'Selected Branch';

    const res = await setActiveBranch(storeId);
    if (res.success) {
      toast.success(`Switched branch to ${targetName}`);
      router.refresh();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        aria-label="Switch store branch"
        className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors border border-separator hover:border-separator/50 cursor-pointer"
      >
        <Store size={16} className="text-muted" />
        <span className="text-sm font-medium hidden lg:block max-w-30 truncate">{displayName}</span>
        <ChevronDown size={14} className="text-muted" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-surface border border-separator rounded-xl shadow-lg z-50 p-1"
          >
            <div className="px-3 py-2 border-b border-separator/50 flex items-center justify-between">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Switch Branch</p>
              <span className="text-[10px] text-muted">{stores.length} locations</span>
            </div>
            <div className="py-1 space-y-0.5">
              {stores.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleBranchSwitch('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-colors cursor-pointer ${
                    isAll
                      ? 'bg-brand-primary/10 text-brand-primary font-bold'
                      : 'hover:bg-surface-elevated text-foreground font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Layers size={14} className="shrink-0 text-muted" />
                    <span className="truncate">All Branches (Global)</span>
                  </div>
                  {isAll && <Check size={14} className="text-brand-primary shrink-0 ml-2" />}
                </button>
              )}

              {stores.map((store) => {
                const isSelected = activeStoreId === store.id || (!activeStoreId && store.id === stores[0]?.id);
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => handleBranchSwitch(store.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-brand-primary/10 text-brand-primary font-bold'
                        : 'hover:bg-surface-elevated text-foreground font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Store size={14} className="shrink-0 text-muted" />
                      <span className="truncate">{store.name}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-brand-primary shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
