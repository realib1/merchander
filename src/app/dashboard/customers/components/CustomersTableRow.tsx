'use client';

import { CustomerStats } from '@/app/actions/customers';
import { formatGhanaLocalDisplay } from '@/utils/phone';
import { formatCurrency, formatDate } from '@/utils/format';
import { MoreHorizontal, FileText, Phone, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/Checkbox';

interface CustomersTableRowProps {
  customer: CustomerStats;
  isSelected: boolean;
  isMenuOpen: boolean;
  onToggleSelect: (checked: boolean) => void;
  onToggleMenu: (e: React.MouseEvent) => void;
  onCloseMenu: () => void;
  onRequestDelete: () => void;
}

export function CustomersTableRow({
  customer,
  isSelected,
  isMenuOpen,
  onToggleSelect,
  onToggleMenu,
  onCloseMenu,
  onRequestDelete,
}: CustomersTableRowProps) {
  const isCustomerActive =
    customer.lastOrderDate &&
    new Date().getTime() - new Date(customer.lastOrderDate).getTime() <= 90 * 24 * 60 * 60 * 1000;

  return (
    <tr className="hover:bg-surface-elevated/50 transition-colors group">
      <td className="px-6 py-4 text-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onToggleSelect(checked)}
          aria-label={`Select ${customer.name || 'customer'}`}
        />
      </td>
      <td className="px-6 py-4">
        <Link
          href={`/dashboard/customers/${customer.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm shrink-0">
            {customer.name ? customer.name.substring(0, 2).toUpperCase() : 'UN'}
          </div>
          <div>
            <div className="font-semibold text-brand-primary group-hover:text-brand-secondary transition-colors">
              {customer.name || 'Unknown'}
            </div>
            <div className="text-xs text-muted mt-0.5 flex items-center gap-1">
              {customer.email ? `${customer.email} · ` : ''}
              {formatGhanaLocalDisplay(customer.phone)}
            </div>
          </div>
        </Link>
      </td>
      <td className="px-6 py-4 font-bold text-center">{customer.totalOrders}</td>
      <td className="px-6 py-4 font-bold text-right">{formatCurrency(customer.totalSpent)}</td>
      <td className="px-6 py-4 text-right text-sm">{formatCurrency(customer.aov || 0)}</td>
      <td className="px-6 py-4 text-right text-sm">
        {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'Never'}
      </td>
      <td className="px-6 py-4 text-center">
        {isCustomerActive ? (
          <span className="inline-flex items-center justify-center bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-semibold">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center justify-center bg-surface-elevated px-3 py-1 rounded-full text-xs font-semibold">
            Inactive
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-right relative action-menu-container">
        <button
          onClick={onToggleMenu}
          className="p-2 text-muted hover:text-brand-primary hover:bg-surface-elevated rounded-lg transition-colors"
        >
          <MoreHorizontal size={18} />
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-6 top-12 w-40 bg-surface border border-separator rounded-xl shadow-lg z-10 overflow-hidden text-left"
            >
              <div className="p-1">
                <Link
                  href={`/dashboard/customers/${customer.id}`}
                  className="w-full px-3 py-2 text-sm hover:text-brand-primary hover:bg-surface-elevated rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FileText size={14} />
                  View Profile
                </Link>
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    toast.info('Contact features coming soon!');
                    onCloseMenu();
                  }}
                  className="w-full px-3 py-2 text-sm hover:text-brand-primary hover:bg-surface-elevated rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Phone size={14} />
                  Contact
                </button>
                <div className="h-px bg-separator my-1" />
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    onRequestDelete();
                    onCloseMenu();
                  }}
                  className="w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg flex items-center gap-2 transition-colors"
                >
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
}
