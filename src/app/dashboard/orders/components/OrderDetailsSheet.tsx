'use client';

import { useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, MapPin, Package, Calendar, Tag, ArrowRight, Truck, MessageCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { formatGhanaLocalDisplay } from '@/utils/phone';
import { updateOrderStatus } from '@/app/actions/orders';
import { toast } from 'sonner';
import Link from 'next/link';

interface Order {
  id: string;
  short_id?: string;
  status: string;
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
  total_amount?: number;
  delivery_fee?: number;
  delivery_address?: string;
  customer_id?: string | null;
}

export function OrderDetailsSheet({
  isOpen,
  onClose,
  order,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}) {
  const [isPending, startTransition] = useTransition();

  if (!order) return null;

  const handleMarkDispatched = () => {
    startTransition(async () => {
      try {
        const res = await updateOrderStatus(order.id, 'dispatched');
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success('Order marked as dispatched');
          onClose();
        }
      } catch {
        toast.error('Failed to update status');
      }
    });
  };

  const handleWhatsAppReceipt = () => {
    if (!order.customer?.phone) {
      toast.error('Customer phone number not available');
      return;
    }
    const cleanPhone = order.customer.phone.replace(/[^0-9]/g, '');
    const itemsText = (order.items || [])
      .map((it) => `• ${it.quantity}x ${it.variant?.product?.name || 'Product'} (${it.variant?.name || 'Standard'})`)
      .join('\n');

    const msg = `🧾 *Order Receipt #${order.short_id || order.id.substring(0, 8).toUpperCase()}*\nHello ${
      order.customer.name || 'valued customer'
    },\n\nHere is your order summary:\n${itemsText}\n\n💰 *Total Paid:* ${formatCurrency(
      order.total_amount || 0
    )}\n📍 *Delivery:* ${order.delivery_address || 'Standard Delivery'}\n\nThank you for shopping with us!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success/10 text-success';
      case 'pending_payment':
        return 'bg-warning/10 text-warning';
      case 'dispatched':
        return 'bg-info/10 text-info';
      default:
        return 'bg-surface-elevated text-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Slide-over panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface shadow-2xl border-l border-separator flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-separator">
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">Order Details</h2>
                <p className="text-xs font-mono text-muted mt-1 uppercase">
                  #{order.short_id ? order.short_id : order.id.split('-')[0]}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-elevated rounded-lg transition-colors text-muted hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Status & Date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Calendar size={16} />
                  {new Date(order.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>

              {/* Customer Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                  <User size={14} /> Customer Information
                </h3>
                <div className="bg-surface-elevated p-4 rounded-xl border border-separator space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">
                      {order.customer?.name || 'Walk-in Customer'}
                    </span>
                    {order.customer_id && (
                      <Link
                        href={`/dashboard/customers/${order.customer_id}`}
                        className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1"
                      >
                        View Profile <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                  {order.customer?.phone && (
                    <div className="text-xs text-muted font-mono">{formatGhanaLocalDisplay(order.customer.phone)}</div>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              {order.delivery_address && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={14} /> Delivery Address
                  </h3>
                  <div className="bg-surface-elevated p-4 rounded-xl border border-separator text-xs text-foreground leading-relaxed">
                    {order.delivery_address}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Package size={14} /> Order Items
                </h3>
                <div className="bg-surface-elevated rounded-xl border border-separator overflow-hidden">
                  <ul className="divide-y divide-separator">
                    {order.items?.map((item) => (
                      <li key={item.id} className="p-4 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {item.variant?.product?.name || 'Product'}{' '}
                            {item.variant?.name ? `- ${item.variant.name}` : ''}
                          </div>
                          <div className="text-xs text-muted mt-0.5">Qty: {item.quantity}</div>
                        </div>
                        {item.unit_price && (
                          <div className="text-sm font-semibold text-foreground">
                            {formatCurrency(item.unit_price * item.quantity)}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  {(!order.items || order.items.length === 0) && (
                    <div className="p-4 text-sm text-muted text-center">No items found</div>
                  )}
                </div>
              </div>

              {/* Financial Summary */}
              <div>
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Tag size={14} /> Summary
                </h3>
                <div className="bg-surface-elevated p-4 rounded-xl border border-separator space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency((order.total_amount || 0) - (order.delivery_fee || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Delivery</span>
                    <span className="font-medium text-foreground">{formatCurrency(order.delivery_fee || 0)}</span>
                  </div>
                  <div className="pt-2 border-t border-separator mt-2 flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-black text-brand-primary font-display text-base">
                      {formatCurrency(order.total_amount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-separator bg-surface-elevated/50 flex flex-col gap-2">
              <div className="flex gap-2">
                {order.status === 'paid' && (
                  <button
                    type="button"
                    onClick={handleMarkDispatched}
                    disabled={isPending}
                    className="flex-1 px-3 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-primary-600 transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    {isPending ? <Loader2 size={13} className="animate-spin" /> : <Truck size={13} />}
                    <span>Mark Dispatched</span>
                  </button>
                )}

                {order.customer?.phone && (
                  <button
                    type="button"
                    onClick={handleWhatsAppReceipt}
                    className="flex-1 px-3 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold hover:bg-[#20bd5a] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <MessageCircle size={13} />
                    <span>WhatsApp Receipt</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2 bg-surface border border-separator rounded-xl text-xs font-semibold text-foreground hover:bg-surface-elevated transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
