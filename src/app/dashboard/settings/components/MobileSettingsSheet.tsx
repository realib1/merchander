'use client';

import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { X, Check, LifeBuoy } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface SettingsItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface SettingsGroup {
  title: string;
  items: SettingsItem[];
}

interface MobileSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
  groups: SettingsGroup[];
}

export function MobileSettingsSheet({ isOpen, onClose, pathname, groups }: MobileSettingsSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 md:hidden"
          />

          {/* Bottom Sheet Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="fixed bottom-0 inset-x-0 bg-surface border-t border-separator rounded-t-3xl shadow-2xl z-50 max-h-[82vh] flex flex-col md:hidden overflow-hidden"
          >
            {/* Sheet Handle & Header */}
            <div className="p-4 border-b border-separator/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-primary" />
                <h3 className="text-sm font-bold text-foreground font-display">Settings Menu</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Grouped Options List */}
            <div className="overflow-y-auto p-4 space-y-5 custom-scrollbar">
              {groups.map((group) => (
                <div key={group.title} className="space-y-1.5">
                  <h4 className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted/70">{group.title}</h4>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={onClose}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                            isActive
                              ? 'bg-brand-primary/10 text-brand-primary'
                              : 'text-foreground/80 hover:bg-surface-elevated hover:text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={16} className={isActive ? 'text-brand-primary' : 'text-muted'} />
                            <span>{item.name}</span>
                          </div>
                          {isActive && <Check size={14} className="text-brand-primary" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Support Link */}
            <div className="p-4 border-t border-separator/80 bg-surface-elevated/40">
              <Link
                href="/dashboard/help"
                onClick={onClose}
                className="w-full py-2.5 px-3 rounded-xl bg-surface border border-separator text-xs font-semibold text-foreground hover:bg-surface-elevated transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <LifeBuoy size={15} className="text-brand-primary" />
                <span>Need Assistance? Open Help & Support</span>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
