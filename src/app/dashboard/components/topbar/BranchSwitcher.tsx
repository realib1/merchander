'use client';

import { useState } from 'react';
import { Store, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { setActiveBranch } from '@/app/actions/branch';

interface BranchSwitcherProps {
  stores: { id: string; name: string }[];
  initialActiveStoreId?: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function BranchSwitcher({ stores, initialActiveStoreId, isOpen, onToggle, onClose }: BranchSwitcherProps) {
  const [activeStoreId, setActiveStoreId] = useState<string | null>(initialActiveStoreId || stores?.[0]?.id || null);

  const activeStore = stores.find((s) => s.id === activeStoreId);

  const handleBranchSwitch = async (storeId: string) => {
    setActiveStoreId(storeId);
    onClose();
    await setActiveBranch(storeId);
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        aria-label="Switch store branch"
        className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors border border-separator hover:border-separator/50 cursor-pointer"
      >
        <Store size={16} className="text-muted" />
        <span className="text-sm font-medium hidden lg:block max-w-30 truncate">
          {activeStore?.name || 'Select Branch'}
        </span>
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
            <div className="px-3 py-2 border-b border-separator/50">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Switch Branch</p>
            </div>
            <div className="py-1">
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => handleBranchSwitch(store.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                    activeStoreId === store.id
                      ? 'bg-brand-primary/10 text-brand-primary font-medium'
                      : 'hover:bg-surface-elevated text-foreground'
                  }`}
                >
                  <span className="truncate">{store.name}</span>
                  {activeStoreId === store.id && <Check size={16} className="text-brand-primary shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
