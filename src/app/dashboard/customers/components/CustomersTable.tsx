'use client';

import { useState, useEffect } from 'react';
import { CustomerStats } from '@/app/actions/customers';
import { formatGhanaLocalDisplay } from '@/utils/phone';
import { formatCurrency, formatDate } from '@/utils/format';
import { MoreHorizontal, FileText, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import Link from 'next/link';

export function CustomersTable({ initialCustomers }: { initialCustomers: CustomerStats[] }) {
  const [customers, setCustomers] = useState<CustomerStats[]>(initialCustomers);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sync state when URL search parameters trigger a server re-fetch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(customers.map(c => c.id)));
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

  return (
    <div className="bg-surface border border-separator rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-surface-elevated border-b border-separator text-text-secondary text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={customers.length > 0 && selectedIds.size === customers.length}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="rounded border-separator text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4 translate-y-0.5" 
                />
              </th>
              <th className="px-6 py-4 font-semibold">Customer</th>
              <th className="px-6 py-4 font-semibold text-center">Orders</th>
              <th className="px-6 py-4 font-semibold text-right">Total spent</th>
              <th className="px-6 py-4 font-semibold text-right">Avg. order</th>
              <th className="px-6 py-4 font-semibold text-right">Last order</th>
              <th className="px-6 py-4 font-semibold text-center">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-text-muted italic">
                  No customers found matching these criteria.
                </td>
              </tr>
            ) : (
              customers.map(customer => (
                <tr key={customer.id} className="hover:bg-surface-elevated/50 transition-colors group">
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(customer.id)}
                      onChange={(e) => toggleItem(customer.id, e.target.checked)}
                      className="rounded border-separator text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4 translate-y-0.5" 
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/customers/${customer.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {customer.name ? customer.name.substring(0, 2).toUpperCase() : 'UN'}
                      </div>
                      <div>
                        <div className="font-semibold text-brand-primary group-hover:text-brand-secondary transition-colors">{customer.name || 'Unknown'}</div>
                        <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                          {customer.email ? `${customer.email} · ` : ''}{formatGhanaLocalDisplay(customer.phone)}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-bold text-text-primary text-center">
                    {customer.totalOrders}
                  </td>
                  <td className="px-6 py-4 font-bold text-text-primary text-right">
                    {formatCurrency(customer.totalSpent)}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-right text-sm">
                    {formatCurrency(customer.aov || 0)}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-right text-sm">
                    {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {customer.lastOrderDate && (new Date().getTime() - new Date(customer.lastOrderDate).getTime()) <= 90 * 24 * 60 * 60 * 1000 ? (
                      <span className="inline-flex items-center justify-center bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center bg-surface-elevated text-text-secondary px-3 py-1 rounded-full text-xs font-semibold">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right relative action-menu-container">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === customer.id ? null : customer.id);
                      }}
                      className="p-2 text-text-muted hover:text-brand-primary hover:bg-surface-elevated rounded-lg transition-colors"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {activeMenuId === customer.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-6 top-12 w-40 bg-surface border border-separator rounded-xl shadow-lg z-10 overflow-hidden text-left"
                        >
                          <div className="p-1">
                            <Link href={`/dashboard/customers/${customer.id}`} className="w-full px-3 py-2 text-sm text-text-secondary hover:text-brand-primary hover:bg-surface-elevated rounded-lg flex items-center gap-2 transition-colors">
                              <FileText size={14} />
                              View Profile
                            </Link>
                            <button onClick={() => { toast.info('Contact features coming soon!'); setActiveMenuId(null); }} className="w-full px-3 py-2 text-sm text-text-secondary hover:text-brand-primary hover:bg-surface-elevated rounded-lg flex items-center gap-2 transition-colors">
                              <Phone size={14} />
                              Contact
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination placeholder */}
      <div className="p-4 border-t border-separator bg-surface-elevated/30 flex items-center justify-between text-sm text-text-secondary shrink-0">
        <div>Showing {customers.length} customers</div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors disabled:opacity-50">Previous</button>
          <button className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}
