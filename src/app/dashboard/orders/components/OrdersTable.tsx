'use client';

import { useState, useEffect } from 'react';
import { updateOrderStatus, processMoMoPayment, OrderStatus } from '@/app/actions/orders';
import { formatGhanaLocalDisplay } from '@/utils/phone';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';
import { MoreHorizontal, FileText, CheckCircle, Truck, ArrowRight, Loader2, XCircle, Eye, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { OrderDetailsSheet } from './OrderDetailsSheet';

function SortIcon({ column, currentSortBy, currentSortOrder }: { column: string, currentSortBy: string, currentSortOrder: string }) {
  if (currentSortBy !== column) return <ArrowUpDown className="w-3 h-3 ml-1 inline text-muted opacity-0 group-hover:opacity-100 transition-opacity" />;
  return currentSortOrder === 'asc' ? (
    <ArrowUp className="w-3 h-3 ml-1 inline text-foreground" />
  ) : (
    <ArrowDown className="w-3 h-3 ml-1 inline text-foreground" />
  );
}

interface Order {
  id: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  customer?: { name: string; phone: string } | null;
  items?:
    | {
        id: string;
        quantity: number;
        variant?: { name: string; product?: { name: string } } | null;
        unit_price?: number;
      }[]
    | null;
  delivery_address?: string;
  delivery_fee?: number;
}

export function OrdersTable({
  initialOrders,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
}: {
  initialOrders: Order[];
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Sync state when URL search parameters trigger a server re-fetch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrders(initialOrders);
  }, [initialOrders]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reconciliationOrder, setReconciliationOrder] = useState<Order | null>(null);
  const [smsText, setSmsText] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [orderToCancel, setOrderToCancel] = useState<string | 'bulk' | null>(null);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(new Set(orders.map((o) => o.id)));
    } else {
      setSelectedOrderIds(new Set());
    }
  };

  const toggleOrder = (orderId: string, checked: boolean) => {
    const newSet = new Set(selectedOrderIds);
    if (checked) newSet.add(orderId);
    else newSet.delete(orderId);
    setSelectedOrderIds(newSet);
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

  const handleMove = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(true);
    setActiveMenuId(null);
    // Optimistic UI update
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));

    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update order status');
      setOrders(initialOrders);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async (orderId: string) => {
    setOrderToCancel(orderId);
    setActiveMenuId(null);
  };

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconciliationOrder || !smsText) return;

    setIsUpdating(true);
    try {
      await processMoMoPayment(reconciliationOrder.id, smsText, reconciliationOrder.total_amount, 'mtn_momo');
      toast.success('Payment successfully verified!');
      // Optimistic update
      setOrders((prev) => prev.map((o) => (o.id === reconciliationOrder.id ? { ...o, status: 'paid' } : o)));
      setReconciliationOrder(null);
      setSmsText('');
    } catch (e) {
      console.error(e);
      const err = e as Error;
      toast.error(err.message || 'Failed to verify payment SMS');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedOrderIds.size === 0) return;

    const selectedOrders = orders.filter((o) => selectedOrderIds.has(o.id));
    const csvHeader = 'Order ID,Customer Name,Customer Phone,Date,Total Amount,Status\n';
    const csvRows = selectedOrders
      .map((o) => {
        const date = new Date(o.created_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        return `${o.id},"${o.customer?.name || 'Unknown'}","${o.customer?.phone || ''}","${date}",${o.total_amount},${o.status}`;
      })
      .join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedOrderIds.size} orders to CSV`);
    setSelectedOrderIds(new Set());
  };

  const confirmCancel = async () => {
    if (!orderToCancel) return;

    setIsUpdating(true);
    const idsToCancel = orderToCancel === 'bulk' ? Array.from(selectedOrderIds) : [orderToCancel];

    try {
      for (const id of idsToCancel) {
        await updateOrderStatus(id, 'cancelled');
      }
      setOrders((prev) => prev.map((o) => (idsToCancel.includes(o.id) ? { ...o, status: 'cancelled' } : o)));
      toast.success(`Successfully cancelled ${idsToCancel.length} order${idsToCancel.length > 1 ? 's' : ''}`);

      if (orderToCancel === 'bulk') {
        setSelectedOrderIds(new Set());
      } else {
        const newSelected = new Set(selectedOrderIds);
        newSelected.delete(orderToCancel);
        setSelectedOrderIds(newSelected);
      }
      setOrderToCancel(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to cancel some orders');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="bg-surface-elevated  border border-separator px-3 py-1 rounded-full text-xs font-medium">
            Draft
          </span>
        );
      case 'pending_payment':
        return (
          <span className="bg-warning/10 text-warning px-3 py-1 rounded-full text-xs font-medium">Awaiting Pay</span>
        );
      case 'paid':
        return <span className="bg-success/10 text-success px-3 py-1 rounded-full text-xs font-medium">Paid</span>;
      case 'dispatched':
        return (
          <span className="bg-brand-secondary/10 text-brand-secondary px-3 py-1 rounded-full text-xs font-medium">
            Dispatched
          </span>
        );
      default:
        return (
          <span className="bg-surface-elevated  border border-separator px-3 py-1 rounded-full text-xs font-medium capitalize">
            {status.replace('_', ' ')}
          </span>
        );
    }
  };

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
      <div className="flex-1 flex flex-col bg-surface border border-separator rounded-2xl overflow-hidden min-h-125">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-elevated border-b border-separator  text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold w-12 text-center">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedOrderIds.size === orders.length}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="rounded border-separator text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4 translate-y-0.5"
                  />
                </th>
                <th className="px-6 py-4 font-semibold">
                  <Link href={createSortUrl('id')} className="flex items-center group cursor-pointer">
                    Order <SortIcon column="id" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                  </Link>
                </th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">
                  <Link href={createSortUrl('created_at')} className="flex items-center group cursor-pointer">
                    Date <SortIcon column="created_at" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                  </Link>
                </th>
                <th className="px-6 py-4 font-semibold">Items</th>
                <th className="px-6 py-4 font-semibold text-right">
                  <Link href={createSortUrl('total_amount')} className="flex items-center justify-end group cursor-pointer">
                    Total <SortIcon column="total_amount" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                  </Link>
                </th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted italic">
                    No orders found matching these criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-elevated/50 transition-colors group">
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.has(order.id)}
                        onChange={(e) => toggleOrder(order.id, e.target.checked)}
                        className="rounded border-separator text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4 translate-y-0.5"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono font-medium text-brand-primary group-hover:text-brand-secondary transition-colors">
                        #{order.id.substring(0, 6).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{order.customer?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted">{formatGhanaLocalDisplay(order.customer?.phone || '')}</div>
                    </td>
                    <td className="px-6 py-4  text-xs">
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4  text-xs">{order.items?.length || 0} items</td>
                    <td className="px-6 py-4 font-bold  text-right">
                      {formatCurrency(order.total_amount - (order.delivery_fee || 0))}
                    </td>
                    <td className="px-6 py-4 text-center">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 text-right relative action-menu-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === order.id ? null : order.id);
                        }}
                        className="p-2 text-muted hover:text-brand-primary hover:bg-surface-elevated rounded-lg transition-colors"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {activeMenuId === order.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-6 top-12 w-48 bg-surface border border-separator rounded-xl shadow-lg z-10 overflow-hidden text-left"
                          >
                            <div className="p-1">
                              <button
                                onPointerDown={(e) => {
                                  e.preventDefault();
                                  setSelectedOrder(order);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-sm  hover:text-brand-primary hover:bg-surface-elevated rounded-lg flex items-center gap-2 transition-colors"
                              >
                                <Eye size={14} />
                                View Details
                              </button>

                              {order.status === 'draft' && (
                                <button
                                  onClick={() => handleMove(order.id, 'pending_payment')}
                                  disabled={isUpdating}
                                  className="w-full px-3 py-2 text-sm text-warning hover:bg-warning/10 rounded-lg flex items-center gap-2 transition-colors mt-1"
                                >
                                  <ArrowRight size={14} />
                                  Request Pay
                                </button>
                              )}

                              {order.status === 'pending_payment' && (
                                <button
                                  onClick={() => {
                                    setReconciliationOrder(order);
                                    setActiveMenuId(null);
                                  }}
                                  disabled={isUpdating}
                                  className="w-full px-3 py-2 text-sm text-success hover:bg-success/10 rounded-lg flex items-center gap-2 transition-colors mt-1"
                                >
                                  <CheckCircle size={14} />
                                  Mark Paid
                                </button>
                              )}

                              {order.status === 'paid' && (
                                <button
                                  onClick={() => handleMove(order.id, 'dispatched')}
                                  disabled={isUpdating}
                                  className="w-full px-3 py-2 text-sm text-info hover:bg-info/10 rounded-lg flex items-center gap-2 transition-colors mt-1"
                                >
                                  <Truck size={14} />
                                  Dispatch Order
                                </button>
                              )}

                              {['draft', 'pending_payment', 'paid'].includes(order.status) && (
                                <>
                                  <div className="h-px bg-separator my-1" />
                                  <button
                                    onClick={() => handleCancel(order.id)}
                                    disabled={isUpdating}
                                    className="w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg flex items-center gap-2 transition-colors"
                                  >
                                    {isUpdating ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <XCircle size={14} />
                                    )}
                                    Cancel Order
                                  </button>
                                </>
                              )}
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

        <div className="mt-auto p-4 border-t border-separator bg-surface-elevated/30 flex items-center justify-between text-sm">
          <div>
            Showing <span className="font-medium">{totalCount === 0 ? 0 : (currentPage - 1) * 10 + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * 10, totalCount)}</span> of{' '}
            <span className="font-medium">{totalCount}</span> orders
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', (currentPage - 1).toString());
                router.push(`?${params.toString()}`);
              }}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', (currentPage + 1).toString());
                router.push(`?${params.toString()}`);
              }}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <OrderDetailsSheet isOpen={selectedOrder !== null} onClose={() => setSelectedOrder(null)} order={selectedOrder} />

      {/* Bulk Actions Floating Bar */}
      <AnimatePresence>
        {selectedOrderIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-4 bg-surface-elevated/90 backdrop-blur-xl border border-separator/80 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] rounded-full px-3 sm:px-4 py-2 w-max max-w-[calc(100vw-2rem)] overflow-x-auto hide-scrollbar"
          >
            <div className="flex items-center gap-2 pr-2 sm:pr-4 border-r border-separator shrink-0">
              <div className="flex items-center justify-center bg-brand-primary text-white text-xs font-bold w-6 h-6 rounded-full tabular-nums">
                {selectedOrderIds.size}
              </div>
              <span className="hidden sm:inline text-sm font-semibold">Selected</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={() => setSelectedOrderIds(new Set())}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold  hover:text-primary hover:bg-surface/50 rounded-full transition-colors"
                title="Deselect"
              >
                <XCircle size={14} />
                <span className="hidden sm:inline">Deselect</span>
              </button>
              <button
                onClick={handleBulkExport}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold  hover:text-primary hover:bg-surface/50 rounded-full transition-colors"
                title="Export"
              >
                <FileText size={14} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MoMo Reconciliation Modal - Reused from KanbanBoard */}
      <AnimatePresence>
        {reconciliationOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-separator shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-separator">
                <h3 className="text-lg font-bold">Verify Mobile Money Payment</h3>
                <p className="text-sm  mt-1">
                  Order #{reconciliationOrder.id.substring(0, 6).toUpperCase()} •{' '}
                  {formatCurrency(reconciliationOrder.total_amount)}
                </p>
              </div>

              <form onSubmit={handleReconcile} className="p-5 space-y-4">
                <div>
                  <label htmlFor="smsText" className="block text-sm font-medium  mb-1.5">
                    Paste Payment SMS
                  </label>
                  <textarea
                    id="smsText"
                    rows={4}
                    value={smsText}
                    onChange={(e) => setSmsText(e.target.value)}
                    placeholder="e.g. Payment received for GHS 450.00 from Kwame Mensah. Ref: 18273918239"
                    className="w-full rounded-xl border-separator bg-surface-elevated text-sm px-4 py-3 focus:ring-brand-primary placeholder:text-muted resize-none"
                    required
                  />
                  <p className="text-xs text-muted mt-2">
                    The system will securely extract the transaction reference and prevent duplicate entries.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReconciliationOrder(null);
                      setSmsText('');
                    }}
                    className="px-4 py-2 text-sm font-medium  hover:text-brand-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating || !smsText}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm shadow-brand-primary/20"
                  >
                    {isUpdating && <Loader2 size={16} className="animate-spin" />}
                    {isUpdating ? 'Verifying...' : 'Confirm Payment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {orderToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-separator shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-5 border-b border-separator">
                <h3 className="text-lg font-bold">Confirm Cancellation</h3>
                <p className="text-sm  mt-1">
                  {orderToCancel === 'bulk'
                    ? `Are you sure you want to cancel ${selectedOrderIds.size} orders?`
                    : `Are you sure you want to cancel this order?`}{' '}
                  This action cannot be undone.
                </p>
              </div>

              <div className="p-5 flex justify-end gap-3 bg-surface-elevated/30">
                <button
                  type="button"
                  onClick={() => setOrderToCancel(null)}
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-medium  hover:text-primary transition-colors disabled:opacity-50"
                >
                  Keep Order
                </button>
                <button
                  onClick={confirmCancel}
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm shadow-red-500/20"
                >
                  {isUpdating && <Loader2 size={16} className="animate-spin" />}
                  {isUpdating ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
