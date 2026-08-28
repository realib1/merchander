'use client';

import { MoreHorizontal, Truck, CircleCheck, CircleX, Eye } from 'lucide-react';
import { formatGhanaLocalDisplay } from '@/utils/phone';
import { formatCurrency } from '@/utils/format';
import type { OrderStatus } from '@/app/actions/orders';

export interface Order {
  id: string;
  short_id?: string;
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
  shipping_tbd?: boolean;
}

interface OrdersTableRowProps {
  order: Order;
  isSelected: boolean;
  isMenuOpen: boolean;
  onToggleSelect: (id: string, checked: boolean) => void;
  onToggleMenu: (id: string) => void;
  onOpenDetails: (order: Order) => void;
  onOpenReconcile: (order: Order) => void;
  onStatusChange: (id: string, newStatus: OrderStatus) => void;
  onOpenCancel: (id: string) => void;
}

export function OrdersTableRow({
  order,
  isSelected,
  isMenuOpen,
  onToggleSelect,
  onToggleMenu,
  onOpenDetails,
  onOpenReconcile,
  onStatusChange,
  onOpenCancel,
}: OrdersTableRowProps) {
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Paid
          </span>
        );
      case 'dispatched':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
            Dispatched
          </span>
        );
      case 'pending_payment':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
            Pending Payment
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Draft
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <tr className="hover:bg-surface-elevated/40 transition-colors group">
      <td className="p-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelect(order.id, e.target.checked)}
          className="rounded border-separator text-brand-primary focus:ring-brand-primary cursor-pointer"
        />
      </td>
      <td className="p-4 font-medium text-foreground">
        <button
          onClick={() => onOpenDetails(order)}
          className="hover:text-brand-primary transition-colors text-left flex flex-col cursor-pointer"
        >
          <span className="font-semibold text-xs sm:text-sm">
            #{order.short_id ? order.short_id : order.id.substring(0, 8).toUpperCase()}
          </span>
          <span className="text-[10px] text-muted sm:hidden">{new Date(order.created_at).toLocaleDateString()}</span>
        </button>
      </td>
      <td className="p-4 text-muted hidden sm:table-cell text-xs">
        {new Date(order.created_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </td>
      <td className="p-4">
        <div className="flex flex-col">
          <span className="font-medium text-xs sm:text-sm text-foreground">
            {order.customer?.name || 'Walk-in Customer'}
          </span>
          {order.customer?.phone && (
            <span className="text-[11px] text-muted">{formatGhanaLocalDisplay(order.customer.phone)}</span>
          )}
        </div>
      </td>
      <td className="p-4">{getStatusBadge(order.status)}</td>
      <td className="p-4 font-semibold text-xs sm:text-sm text-foreground">{formatCurrency(order.total_amount)}</td>
      <td className="p-4 text-right">
        <div className="relative inline-block text-left">
          <button
            onClick={() => onToggleMenu(order.id)}
            aria-label="Order actions"
            className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors text-muted hover:text-foreground cursor-pointer"
          >
            <MoreHorizontal size={16} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-separator rounded-xl shadow-lg z-30 py-1 overflow-hidden">
              <button
                onClick={() => onOpenDetails(order)}
                className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-surface-elevated flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Eye size={14} className="text-muted" />
                View Details
              </button>

              {order.status === 'pending_payment' && (
                <button
                  onClick={() => onOpenReconcile(order)}
                  className="w-full px-3 py-2 text-left text-xs text-emerald-500 hover:bg-emerald-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <CircleCheck size={14} />
                  Verify MoMo SMS
                </button>
              )}

              {order.status === 'paid' && (
                <button
                  onClick={() => onStatusChange(order.id, 'dispatched')}
                  className="w-full px-3 py-2 text-left text-xs text-blue-500 hover:bg-blue-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Truck size={14} />
                  Mark Dispatched
                </button>
              )}

              {order.status !== 'cancelled' && (
                <button
                  onClick={() => onOpenCancel(order.id)}
                  className="w-full px-3 py-2 text-left text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <CircleX size={14} />
                  Cancel Order
                </button>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
