'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, User, MapPin, Package, Calendar, Tag } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { formatGhanaLocalDisplay } from '@/utils/phone';

interface Order {
  id: string;
  status: string;
  created_at: string;
  customer?: { name: string; phone: string } | null;
  items?: { id: string; quantity: number; variant?: { name: string } | null; unit_price?: number }[] | null;
  total?: number;
  delivery_address?: string;
}

export function OrderDetailsSheet({
  isOpen,
  onClose,
  order
}: {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}) {
  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success/10 text-success';
      case 'pending_payment': return 'bg-warning/10 text-warning';
      case 'dispatched': return 'bg-info/10 text-info';
      default: return 'bg-surface-elevated text-text-secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
                <h2 className="text-xl font-display font-bold text-text-primary">Order Details</h2>
                <p className="text-xs font-mono text-text-muted mt-1 uppercase">#{order.id.split('-')[0]}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-surface-elevated rounded-lg transition-colors text-text-secondary"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* Status & Date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Calendar size={16} />
                  {new Date(order.created_at).toLocaleDateString('en-GB', { 
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </div>
              </div>

              {/* Customer Details */}
              <div>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User size={14} /> Customer Information
                </h3>
                <div className="bg-surface-elevated p-4 rounded-xl border border-separator space-y-3">
                  <div>
                    <div className="text-xs text-text-muted">Name</div>
                    <div className="text-sm font-semibold text-text-primary">{order.customer?.name || 'Unknown'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Phone</div>
                    <div className="text-sm font-semibold text-text-primary">
                      {order.customer?.phone ? formatGhanaLocalDisplay(order.customer.phone) : 'N/A'}
                    </div>
                  </div>
                  {order.delivery_address && (
                    <div>
                      <div className="text-xs text-text-muted flex items-center gap-1"><MapPin size={12} /> Address</div>
                      <div className="text-sm text-text-primary mt-0.5">{order.delivery_address}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Package size={14} /> Order Items
                </h3>
                <div className="bg-surface-elevated rounded-xl border border-separator overflow-hidden">
                  <ul className="divide-y divide-separator">
                    {order.items?.map((item) => (
                      <li key={item.id} className="p-4 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-text-primary">{item.variant?.name || 'Product'}</div>
                          <div className="text-xs text-text-muted mt-0.5">Qty: {item.quantity}</div>
                        </div>
                        {item.unit_price && (
                          <div className="text-sm font-semibold text-text-primary">
                            {formatCurrency(item.unit_price * item.quantity)}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  {(!order.items || order.items.length === 0) && (
                    <div className="p-4 text-sm text-text-muted text-center">No items found</div>
                  )}
                </div>
              </div>

              {/* Financial Summary */}
              <div>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Tag size={14} /> Summary
                </h3>
                <div className="bg-surface-elevated p-4 rounded-xl border border-separator space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Subtotal</span>
                    <span className="text-text-primary font-medium">{formatCurrency((order.total || 0))}</span>
                  </div>
                  <div className="pt-2 border-t border-separator mt-2 flex justify-between">
                    <span className="font-semibold text-text-primary">Total</span>
                    <span className="font-bold text-text-primary font-display">{formatCurrency(order.total || 0)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-separator bg-surface-elevated/50 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-surface text-text-primary border border-separator rounded-xl text-sm font-semibold hover:bg-surface-elevated transition-colors"
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
