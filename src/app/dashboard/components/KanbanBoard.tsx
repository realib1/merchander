'use client';

import { useState, useEffect } from 'react';
import { updateOrderStatus, processMoMoPayment, getKanbanOrders, OrderStatus } from '@/app/actions/orders';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from '@/components/ui/Modal';
import { formatGhanaLocalDisplay } from '@/utils/phone';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';

interface Order {
  id: string;
  short_id?: string;
  total_amount: number;
  status: OrderStatus;
  customer?: { name: string; phone: string } | null;
  items?: { id: string; quantity: number; variant?: { name: string } | null }[] | null;
}

const COLUMNS: { id: OrderStatus; title: string; bg: string; text: string }[] = [
  { id: 'draft', title: 'New (AI Draft)', bg: 'bg-surface-elevated border-separator', text: '' },
  { id: 'pending_payment', title: 'Awaiting Payment', bg: 'bg-warning/10 border-warning/20', text: 'text-warning' },
  { id: 'paid', title: 'Paid (To Pack)', bg: 'bg-success/10 border-success/20', text: 'text-success' },
  {
    id: 'dispatched',
    title: 'Dispatched (In Transit)',
    bg: 'bg-brand-secondary/10 border-brand-secondary/20',
    text: 'text-brand-secondary',
  },
  {
    id: 'delivered',
    title: 'Delivered (Completed)',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    text: 'text-emerald-500',
  },
];

export function KanbanBoard({ initialOrders, searchQuery }: { initialOrders: Order[]; searchQuery?: string }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  // Sync state when URL search parameters trigger a server re-fetch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrders(initialOrders);
  }, [initialOrders]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reconciliationOrder, setReconciliationOrder] = useState<Order | null>(null);
  const [smsText, setSmsText] = useState('');

  const handleLoadMore = async (status: OrderStatus, currentCount: number) => {
    setIsUpdating(true);
    try {
      const moreOrders = (await getKanbanOrders(status, currentCount, 10, searchQuery)) as Order[];
      if (moreOrders && moreOrders.length > 0) {
        setOrders((prev) => {
          const newOrders = [...prev];
          for (const order of moreOrders) {
            if (!newOrders.find((o) => o.id === order.id)) {
              newOrders.push(order);
            }
          }
          return newOrders;
        });
      } else {
        toast.info('No more orders in this status');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load more orders');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMove = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(true);
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
    setIsUpdating(true);
    try {
      await updateOrderStatus(orderId, 'cancelled');
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
      toast.success('Order cancelled successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to cancel order');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReconcile = async (e: React.SubmitEvent<HTMLFormElement>) => {
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

  return (
    <>
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 min-h-125">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.id);

          return (
            <div
              key={col.id}
              className={`shrink-0 w-80 rounded-2xl border border-separator flex flex-col bg-surface shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] overflow-hidden h-full`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const orderId = e.dataTransfer.getData('orderId');
                if (orderId) {
                  if (col.id === 'paid') {
                    const orderToReconcile = orders.find((o) => o.id === orderId);
                    if (orderToReconcile && orderToReconcile.status !== 'paid') {
                      setReconciliationOrder(orderToReconcile);
                    }
                  } else {
                    handleMove(orderId, col.id as OrderStatus);
                  }
                }
              }}
            >
              <div className={`p-4 border-b ${col.bg}`}>
                <div className="flex justify-between items-center">
                  <h3 className={`font-semibold ${col.text}`}>{col.title}</h3>
                  <span className="bg-surface/80  text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                    {colOrders.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-surface-elevated/30">
                <AnimatePresence>
                  {colOrders.map((order) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={order.id}
                    >
                      <div
                        draggable={true}
                        onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
                          e.dataTransfer.setData('orderId', order.id);
                        }}
                        className="bg-surface p-4 rounded-xl border border-separator shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-200 group relative cursor-grab"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-mono text-muted">
                            #{order.short_id ? order.short_id : order.id.substring(0, 6).toUpperCase()}
                          </span>
                          <span className="text-sm font-bold">{formatCurrency(order.total_amount)}</span>
                        </div>

                        <div className="font-medium  text-sm">{order.customer?.name || 'Unknown Customer'}</div>
                        <div className="text-xs  mt-0.5">{formatGhanaLocalDisplay(order.customer?.phone || '')}</div>

                        <div className="mt-3 space-y-1">
                          {order.items?.map((item) => (
                            <div key={item.id} className="text-xs  flex justify-between">
                              <span className="truncate pr-2">
                                {item.quantity}x {item.variant?.name || 'Item'}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 pt-3 border-t border-separator flex flex-wrap justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {col.id === 'draft' && (
                            <button
                              onClick={() => handleMove(order.id, 'pending_payment')}
                              disabled={isUpdating}
                              className="flex-1 text-xs bg-warning/10 text-warning px-3 py-1.5 rounded-lg font-medium hover:bg-warning/20 transition-colors text-center"
                            >
                              Request Pay
                            </button>
                          )}
                          {col.id === 'pending_payment' && (
                            <button
                              onClick={() => setReconciliationOrder(order)}
                              disabled={isUpdating}
                              className="flex-1 text-xs bg-success/10 text-success px-3 py-1.5 rounded-lg font-medium hover:bg-success/20 transition-colors text-center"
                            >
                              Mark Paid
                            </button>
                          )}
                          {col.id === 'paid' && (
                            <button
                              onClick={() => handleMove(order.id, 'dispatched')}
                              disabled={isUpdating}
                              className="flex-1 text-xs bg-brand-secondary/10 text-brand-secondary px-3 py-1.5 rounded-lg font-medium hover:bg-brand-secondary/20 transition-colors text-center"
                            >
                              Dispatch
                            </button>
                          )}
                          {col.id === 'dispatched' && (
                            <button
                              onClick={() => handleMove(order.id, 'delivered')}
                              disabled={isUpdating}
                              className="flex-1 text-xs bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-500/20 transition-colors text-center"
                            >
                              Mark Delivered
                            </button>
                          )}
                          {['draft', 'pending_payment', 'paid'].includes(col.id) && (
                            <button
                              onClick={() => handleCancel(order.id)}
                              disabled={isUpdating}
                              className="flex-1 text-xs bg-destructive/10 text-destructive px-3 py-1.5 rounded-lg font-medium hover:bg-destructive/20 transition-colors text-center"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {colOrders.length === 0 && (
                  <div className="h-full flex items-center justify-center text-sm text-muted italic text-center p-4">
                    No orders in this state
                  </div>
                )}

                {colOrders.length > 0 && colOrders.length % 10 === 0 && (
                  <button
                    onClick={() => handleLoadMore(col.id as OrderStatus, colOrders.length)}
                    disabled={isUpdating}
                    className="w-full py-2 mt-2 text-xs font-medium border border-separator rounded-xl text-muted hover:text-foreground hover:bg-surface transition-colors"
                  >
                    Load More
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* MoMo Reconciliation Modal */}
      <Modal
        isOpen={Boolean(reconciliationOrder)}
        onClose={() => {
          setReconciliationOrder(null);
          setSmsText('');
        }}
        size="sm"
        title="Verify Mobile Money Payment"
        description={
          reconciliationOrder
            ? `Order #${reconciliationOrder.short_id || reconciliationOrder.id.substring(0, 6).toUpperCase()} • ${formatCurrency(reconciliationOrder.total_amount)}`
            : undefined
        }
      >
        <form onSubmit={handleReconcile} className="space-y-4">
          <div>
            <label htmlFor="smsText" className="block text-sm font-medium mb-1.5">
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
              className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating || !smsText}
              className="px-5 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm shadow-brand-primary/20 cursor-pointer"
            >
              {isUpdating ? 'Verifying...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
