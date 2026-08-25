'use client';

import { useState, useEffect } from 'react';
import { CustomerStats } from '@/app/actions/customers';
import { formatGhanaLocalDisplay } from '@/utils/phone';
import { formatCurrency, formatDate } from '@/utils/format';
import { MoreHorizontal, FileText, Phone, X, Trash2, Loader2, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import Link from 'next/link';
import { bulkDeleteCustomers } from '@/app/actions/customers';
import { usePathname, useSearchParams } from 'next/navigation';

function SortIcon({
  column,
  currentSortBy,
  currentSortOrder,
}: {
  column: string;
  currentSortBy: string;
  currentSortOrder: string;
}) {
  if (currentSortBy !== column)
    return (
      <ArrowUpDown className="w-3 h-3 ml-1 inline text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
    );
  return currentSortOrder === 'asc' ? (
    <ArrowUp className="w-3 h-3 ml-1 inline text-foreground" />
  ) : (
    <ArrowDown className="w-3 h-3 ml-1 inline text-foreground" />
  );
}

export function CustomersTable({
  initialCustomers,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
}: {
  initialCustomers: CustomerStats[];
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
}) {
  const [customers, setCustomers] = useState<CustomerStats[]>(initialCustomers);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | 'bulk' | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sync state when URL search parameters trigger a server re-fetch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(customers.map((c) => c.id)));
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

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    setIsUpdating(true);
    const idsToDelete = customerToDelete === 'bulk' ? Array.from(selectedIds) : [customerToDelete];

    try {
      await bulkDeleteCustomers(idsToDelete);
      toast.success(`Deleted ${idsToDelete.length} customer${idsToDelete.length > 1 ? 's' : ''}`);
      setCustomers((prev) => prev.filter((c) => !idsToDelete.includes(c.id)));
      if (customerToDelete === 'bulk') {
        setSelectedIds(new Set());
      } else {
        const newSelected = new Set(selectedIds);
        newSelected.delete(customerToDelete);
        setSelectedIds(newSelected);
      }
      setCustomerToDelete(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete customers');
    } finally {
      setIsUpdating(false);
    }
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

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const createSortUrl = (column: string) => {
    const params = new URLSearchParams(searchParams);
    const currentSortBy = params.get('sortBy') || 'created_at';
    const currentSortOrder = params.get('sortOrder') || 'desc';

    if (currentSortBy === column) {
      params.set('sortOrder', currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortBy', column);
      params.set('sortOrder', 'asc');
    }

    return `${pathname}?${params.toString()}`;
  };

  const currentSortBy = searchParams.get('sortBy') || 'created_at';
  const currentSortOrder = searchParams.get('sortOrder') || 'desc';

  return (
    <>
      <div className="bg-surface border border-separator rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-elevated border-b border-separator  text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold w-12 text-center">
                  <input
                    type="checkbox"
                    checked={customers.length > 0 && selectedIds.size === customers.length}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="rounded border-separator text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4 translate-y-0.5"
                  />
                </th>
                <th className="px-6 py-4 font-semibold">
                  <Link href={createSortUrl('name')} className="flex items-center group cursor-pointer">
                    Customer{' '}
                    <SortIcon column="name" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                  </Link>
                </th>
                <th className="px-6 py-4 font-semibold text-center">
                  <Link
                    href={createSortUrl('total_orders')}
                    className="flex items-center justify-center group cursor-pointer"
                  >
                    Orders{' '}
                    <SortIcon column="total_orders" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                  </Link>
                </th>
                <th className="px-6 py-4 font-semibold text-right">
                  <Link
                    href={createSortUrl('total_spent')}
                    className="flex items-center justify-end group cursor-pointer"
                  >
                    Total spent{' '}
                    <SortIcon column="total_spent" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                  </Link>
                </th>
                <th className="px-6 py-4 font-semibold text-right">
                  <Link href={createSortUrl('aov')} className="flex items-center justify-end group cursor-pointer">
                    Avg. order{' '}
                    <SortIcon column="aov" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                  </Link>
                </th>
                <th className="px-6 py-4 font-semibold text-right">
                  <Link
                    href={createSortUrl('last_order_date')}
                    className="flex items-center justify-end group cursor-pointer"
                  >
                    Last order{' '}
                    <SortIcon
                      column="last_order_date"
                      currentSortBy={currentSortBy}
                      currentSortOrder={currentSortOrder}
                    />
                  </Link>
                </th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted italic">
                    No customers found matching these criteria.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
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
                    <td className="px-6 py-4 font-bold  text-center">{customer.totalOrders}</td>
                    <td className="px-6 py-4 font-bold  text-right">{formatCurrency(customer.totalSpent)}</td>
                    <td className="px-6 py-4  text-right text-sm">{formatCurrency(customer.aov || 0)}</td>
                    <td className="px-6 py-4  text-right text-sm">
                      {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {customer.lastOrderDate &&
                      new Date().getTime() - new Date(customer.lastOrderDate).getTime() <= 90 * 24 * 60 * 60 * 1000 ? (
                        <span className="inline-flex items-center justify-center bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center bg-surface-elevated  px-3 py-1 rounded-full text-xs font-semibold">
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
                        className="p-2 text-muted hover:text-brand-primary hover:bg-surface-elevated rounded-lg transition-colors"
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
                              <Link
                                href={`/dashboard/customers/${customer.id}`}
                                className="w-full px-3 py-2 text-sm  hover:text-brand-primary hover:bg-surface-elevated rounded-lg flex items-center gap-2 transition-colors"
                              >
                                <FileText size={14} />
                                View Profile
                              </Link>
                              <button
                                onPointerDown={(e) => {
                                  e.preventDefault();
                                  toast.info('Contact features coming soon!');
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-sm  hover:text-brand-primary hover:bg-surface-elevated rounded-lg flex items-center gap-2 transition-colors"
                              >
                                <Phone size={14} />
                                Contact
                              </button>
                              <div className="h-px bg-separator my-1" />
                              <button
                                onPointerDown={(e) => {
                                  e.preventDefault();
                                  setCustomerToDelete(customer.id);
                                  setActiveMenuId(null);
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {customers && customers.length > 0 && (
          <div className="p-4 border-t border-separator bg-surface-elevated/30 flex items-center justify-between text-sm shrink-0">
            <div>
              Showing {Math.min((currentPage - 1) * 10 + 1, totalCount)}-{Math.min(currentPage * 10, totalCount)} of{' '}
              {totalCount} customers
            </div>
            <div className="flex gap-2">
              {currentPage > 1 ? (
                <Link
                  href={createPageUrl(currentPage - 1)}
                  className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors"
                >
                  Previous
                </Link>
              ) : (
                <button
                  disabled
                  className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
              )}

              {currentPage < totalPages ? (
                <Link
                  href={createPageUrl(currentPage + 1)}
                  className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors"
                >
                  Next
                </Link>
              ) : (
                <button
                  disabled
                  className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-4 bg-surface-elevated/90 backdrop-blur-xl border border-separator/80 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] rounded-full px-3 sm:px-4 py-2 w-max max-w-[calc(100vw-2rem)] overflow-x-auto hide-scrollbar"
          >
            <div className="flex items-center gap-2 pr-2 sm:pr-4 border-r border-separator shrink-0">
              <div className="flex items-center justify-center bg-brand-primary text-white text-xs font-bold w-6 h-6 rounded-full tabular-nums">
                {selectedIds.size}
              </div>
              <span className="hidden sm:inline text-sm font-semibold">Selected</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold  hover:text-primary hover:bg-surface/50 rounded-full transition-colors"
                title="Deselect"
              >
                <X size={14} />
                <span className="hidden sm:inline">Deselect</span>
              </button>
              <button
                onClick={() => setCustomerToDelete('bulk')}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete"
              >
                {isUpdating && customerToDelete === 'bulk' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {customerToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-separator shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-5 border-b border-separator">
                <h3 className="text-lg font-bold">Confirm Deletion</h3>
                <p className="text-sm  mt-1">
                  {customerToDelete === 'bulk'
                    ? `Are you sure you want to permanently delete ${selectedIds.size} customers?`
                    : `Are you sure you want to permanently delete this customer?`}{' '}
                  This action cannot be undone.
                </p>
              </div>

              <div className="p-5 flex justify-end gap-3 bg-surface-elevated/30">
                <button
                  type="button"
                  onClick={() => setCustomerToDelete(null)}
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-medium  hover:text-primary transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm shadow-red-500/20"
                >
                  {isUpdating && <Loader2 size={16} className="animate-spin" />}
                  {isUpdating ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
