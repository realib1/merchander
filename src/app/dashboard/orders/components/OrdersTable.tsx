'use client';

import { useState, useEffect } from 'react';
import { updateOrderStatus, processMoMoPayment, OrderStatus } from '@/app/actions/orders';
import { formatGhanaLocalDisplay } from '@/utils/phone';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';
import { MoreHorizontal, FileText, CheckCircle, Truck, ArrowRight, Loader2, XCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OrderDetailsSheet } from './OrderDetailsSheet';

interface Order {
  id: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  customer?: { name: string; phone: string } | null;
  items?: { id: string; quantity: number; variant?: { name: string } | null }[] | null;
}

export function OrdersTable({ 
  initialOrders, 
  currentPage = 1, 
  totalPages = 1, 
  totalCount = 0 
}: { 
  initialOrders: Order[],
  currentPage?: number,
  totalPages?: number,
  totalCount?: number
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(new Set(orders.map(o => o.id)));
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
    setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
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
    setIsUpdating(true);
    setActiveMenuId(null);
    try {
      await updateOrderStatus(orderId, 'cancelled');
      setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      toast.success('Order cancelled successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to cancel order');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconciliationOrder || !smsText) return;
    
    setIsUpdating(true);
    try {
      await processMoMoPayment(
        reconciliationOrder.id, 
        smsText, 
        reconciliationOrder.total_amount, 
        'mtn_momo'
      );
      toast.success('Payment successfully verified!');
      // Optimistic update
      setOrders((prev) => prev.map(o => o.id === reconciliationOrder.id ? { ...o, status: 'paid' } : o));
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
    alert(`Exporting ${selectedOrderIds.size} orders to CSV...`);
    setSelectedOrderIds(new Set());
  };

  const handleBulkCancel = async () => {
    if (selectedOrderIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to cancel ${selectedOrderIds.size} orders?`)) return;
    
    setIsUpdating(true);
    try {
      // For a real app, this should be a Promise.all or a dedicated bulk RPC
      const arrayIds = Array.from(selectedOrderIds);
      for (const id of arrayIds) {
        await updateOrderStatus(id, 'cancelled');
      }
      setOrders((prev) => prev.map(o => selectedOrderIds.has(o.id) ? { ...o, status: 'cancelled' } : o));
      toast.success(`Successfully cancelled ${selectedOrderIds.size} orders`);
      setSelectedOrderIds(new Set());
    } catch (e) {
      console.error(e);
      toast.error('Failed to cancel some orders');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch(status) {
      case 'draft': return <span className="bg-surface-elevated text-text-secondary border border-separator px-3 py-1 rounded-full text-xs font-medium">Draft</span>;
      case 'pending_payment': return <span className="bg-warning/10 text-warning px-3 py-1 rounded-full text-xs font-medium">Awaiting Pay</span>;
      case 'paid': return <span className="bg-success/10 text-success px-3 py-1 rounded-full text-xs font-medium">Paid</span>;
      case 'dispatched': return <span className="bg-brand-secondary/10 text-brand-secondary px-3 py-1 rounded-full text-xs font-medium">Dispatched</span>;
      default: return <span className="bg-surface-elevated text-text-secondary border border-separator px-3 py-1 rounded-full text-xs font-medium capitalize">{status.replace('_', ' ')}</span>;
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-surface border border-separator rounded-2xl overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-elevated border-b border-separator text-text-secondary text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={orders.length > 0 && selectedOrderIds.size === orders.length}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="rounded border-separator text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4 translate-y-0.5" 
                  />
                </th>
                <th className="px-6 py-4 font-semibold">Order</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Items</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-text-muted italic">
                    No orders found matching these criteria.
                  </td>
                </tr>
              ) : (
                orders.map(order => (
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
                      <div className="font-mono font-medium text-text-primary">
                        #{order.id.substring(0, 6).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{order.customer?.name || 'Unknown'}</div>
                      <div className="text-xs text-text-muted">{formatGhanaLocalDisplay(order.customer?.phone || '')}</div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary text-xs">
                      {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-text-secondary text-xs">
                      {order.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 font-bold text-text-primary text-right">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-right relative action-menu-container">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === order.id ? null : order.id);
                        }}
                        className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
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
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg flex items-center gap-2 transition-colors"
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
                                    {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
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
        
        <div className="mt-auto p-4 border-t border-separator bg-surface-elevated/30 flex items-center justify-between text-sm text-text-secondary">
          <div>
            Showing <span className="font-medium text-text-primary">{totalCount === 0 ? 0 : (currentPage - 1) * 10 + 1}</span> to <span className="font-medium text-text-primary">{Math.min(currentPage * 10, totalCount)}</span> of <span className="font-medium text-text-primary">{totalCount}</span> orders
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
      
      <OrderDetailsSheet 
        isOpen={selectedOrder !== null} 
        onClose={() => setSelectedOrder(null)} 
        order={selectedOrder} 
      />

      {/* Bulk Actions Floating Bar */}
      <AnimatePresence>
        {selectedOrderIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-surface border border-separator rounded-full shadow-2xl px-6 py-3 flex items-center gap-6"
          >
            <div className="flex items-center gap-2 border-r border-separator pr-6">
              <span className="bg-brand-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {selectedOrderIds.size}
              </span>
              <span className="text-sm font-medium text-text-primary">selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleBulkExport}
                className="px-4 py-2 text-sm font-medium text-text-primary bg-surface-elevated hover:bg-surface-elevated/80 border border-separator rounded-full transition-colors flex items-center gap-2"
              >
                <FileText size={14} />
                Export
              </button>
              <button 
                onClick={handleBulkCancel}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-full transition-colors flex items-center gap-2"
              >
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Cancel Selected
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
                <h3 className="text-lg font-bold text-text-primary">Verify Mobile Money Payment</h3>
                <p className="text-sm text-text-secondary mt-1">
                  Order #{reconciliationOrder.id.substring(0, 6).toUpperCase()} • {formatCurrency(reconciliationOrder.total_amount)}
                </p>
              </div>
              
              <form onSubmit={handleReconcile} className="p-5 space-y-4">
                <div>
                  <label htmlFor="smsText" className="block text-sm font-medium text-text-primary mb-1.5">
                    Paste Payment SMS
                  </label>
                  <textarea
                    id="smsText"
                    rows={4}
                    value={smsText}
                    onChange={(e) => setSmsText(e.target.value)}
                    placeholder="e.g. Payment received for GHS 450.00 from Kwame Mensah. Ref: 18273918239"
                    className="w-full rounded-xl border-separator bg-surface-elevated text-sm px-4 py-3 text-text-primary focus:border-brand-primary focus:ring-brand-primary placeholder:text-text-muted resize-none"
                    required
                  />
                  <p className="text-xs text-text-muted mt-2">
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
                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
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
    </>
  );
}
