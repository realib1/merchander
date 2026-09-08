'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  MapPin,
  Package,
  Calendar,
  Tag,
  ArrowRight,
  Truck,
  MessageCircle,
  Loader2,
  CheckCircle2,
  Bike,
  FileText,
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { formatGhanaLocalDisplay } from '@/utils/phone';
import { markOrderDeliveredAction } from '@/app/actions/fulfilment';
import { OrderDispatchModal } from './OrderDispatchModal';
import { WaybillSlipModal } from './WaybillSlipModal';
import { WaybillOrder } from '@/utils/waybill';
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
  fulfillment_mode?: 'delivery' | 'pickup' | null;
  rider_name?: string | null;
  rider_phone?: string | null;
  courier_name?: string | null;
  tracking_number?: string | null;
  dispatch_notes?: string | null;
  dispatched_at?: string | null;
  delivered_at?: string | null;
  store?: { name: string } | null;
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
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isWaybillModalOpen, setIsWaybillModalOpen] = useState(false);
  const [activeWaybill, setActiveWaybill] = useState<WaybillOrder | null>(null);

  if (!order) return null;

  const buildCurrentWaybillOrder = (): WaybillOrder => ({
    orderId: order.id,
    shortId: order.short_id || order.id.slice(0, 8).toUpperCase(),
    storeName: order.store?.name || 'Our Store',
    customerName: order.customer?.name || 'Valued Customer',
    customerPhone: order.customer?.phone || '',
    fulfillmentMode: (order.fulfillment_mode as 'delivery' | 'pickup') || 'delivery',
    deliveryAddress: order.delivery_address || '',
    items: (order.items || []).map((it) => ({
      name: it.variant?.product?.name || 'Item',
      variantName: it.variant?.name,
      price: it.unit_price || 0,
      quantity: it.quantity,
    })),
    deliveryFee: order.delivery_fee || 0,
    totalAmount: order.total_amount || 0,
    paymentStatus: order.status,
    riderName: order.rider_name || undefined,
    riderPhone: order.rider_phone || undefined,
    courierName: order.courier_name || undefined,
    trackingNumber: order.tracking_number || undefined,
    dispatchNotes: order.dispatch_notes || undefined,
  });

  const handleMarkDelivered = () => {
    startTransition(async () => {
      try {
        const res = await markOrderDeliveredAction({ orderId: order.id });
        if (!res.success) {
          toast.error(res.error || 'Failed to mark order as delivered');
        } else {
          toast.success('Order marked as delivered! Customer notified.');
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

    const msg = `*Order Receipt #${order.short_id || order.id.substring(0, 8).toUpperCase()}*\nHello ${
      order.customer.name || 'valued customer'
    },\n\nHere is your order summary:\n${itemsText}\n\n*Total Paid:* ${formatCurrency(
      order.total_amount || 0
    )}\n*Delivery:* ${order.delivery_address || 'Standard Delivery'}\n\nThank you for shopping with us!`;

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
      case 'delivered':
        return 'bg-emerald-500/10 text-emerald-500';
      default:
        return 'bg-surface-elevated text-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40"
            />

            {/* Sheet Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface border-l border-separator shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-separator">
                <div>
                  <h2 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
                    Order Details
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary font-semibold">
                      #{order.short_id || order.id.substring(0, 8).toUpperCase()}
                    </span>
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-surface-elevated transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
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

                {/* Fulfilment & Dispatch Details */}
                {(order.rider_name || order.courier_name || order.status === 'dispatched' || order.status === 'delivered') && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                      <Bike size={14} /> Fulfilment & Dispatch
                    </h3>
                    <div className="bg-surface-elevated p-4 rounded-xl border border-separator space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted">Method:</span>
                        <span className="font-semibold text-foreground capitalize">
                          {order.fulfillment_mode === 'pickup' ? 'Store Pickup' : 'Courier / Rider Delivery'}
                        </span>
                      </div>
                      {order.courier_name && (
                        <div className="flex justify-between">
                          <span className="text-muted">Courier:</span>
                          <span className="font-semibold text-foreground">{order.courier_name}</span>
                        </div>
                      )}
                      {order.rider_name && (
                        <div className="flex justify-between">
                          <span className="text-muted">Rider:</span>
                          <span className="font-semibold text-foreground">{order.rider_name}</span>
                        </div>
                      )}
                      {order.rider_phone && (
                        <div className="flex justify-between">
                          <span className="text-muted">Rider Phone:</span>
                          <span className="font-mono text-foreground">{order.rider_phone}</span>
                        </div>
                      )}
                      {order.tracking_number && (
                        <div className="flex justify-between">
                          <span className="text-muted">Tracking Ref:</span>
                          <span className="font-mono text-foreground">{order.tracking_number}</span>
                        </div>
                      )}
                      {order.dispatch_notes && (
                        <div className="pt-1 border-t border-separator text-muted">
                          <span className="font-medium text-foreground">Note: </span>
                          {order.dispatch_notes}
                        </div>
                      )}
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
                        <li key={item.id} className="p-3.5 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-foreground">
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
                <div className="flex flex-wrap gap-2">
                  {/* Dispatch / Assign Rider button */}
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => setIsDispatchModalOpen(true)}
                      className="flex-1 px-3 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-primary-600 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Truck size={13} />
                      <span>{order.status === 'dispatched' ? 'Reassign Rider' : 'Dispatch / Rider'}</span>
                    </button>
                  )}

                  {/* View Waybill Slip button */}
                  {(order.status === 'dispatched' || order.status === 'delivered') && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveWaybill(buildCurrentWaybillOrder());
                        setIsWaybillModalOpen(true);
                      }}
                      className="flex-1 px-3 py-2 bg-surface border border-separator text-foreground rounded-xl text-xs font-bold hover:bg-surface-elevated transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileText size={13} />
                      <span>Waybill Slip</span>
                    </button>
                  )}

                  {/* Mark Delivered button */}
                  {order.status === 'dispatched' && (
                    <button
                      type="button"
                      onClick={handleMarkDelivered}
                      disabled={isPending}
                      className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                    >
                      {isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      <span>Mark Delivered</span>
                    </button>
                  )}

                  {/* WhatsApp Customer Receipt */}
                  {order.customer?.phone && (
                    <button
                      type="button"
                      onClick={handleWhatsAppReceipt}
                      className="px-3 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold hover:bg-[#20bd5a] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <MessageCircle size={13} />
                      <span>Receipt</span>
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

      {/* Modals */}
      <OrderDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        order={{
          id: order.id,
          short_id: order.short_id,
          customer: order.customer,
          delivery_address: order.delivery_address,
          delivery_fee: order.delivery_fee,
          total_amount: order.total_amount,
          status: order.status,
          store: order.store,
          items: (order.items || []).map((it) => ({
            name: it.variant?.product?.name,
            variantName: it.variant?.name,
            price: it.unit_price,
            quantity: it.quantity,
          })),
        }}
        onSuccess={(wb) => {
          setActiveWaybill(wb);
          setIsWaybillModalOpen(true);
        }}
      />

      <WaybillSlipModal
        isOpen={isWaybillModalOpen}
        onClose={() => setIsWaybillModalOpen(false)}
        order={activeWaybill}
      />
    </>
  );
}
