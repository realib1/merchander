'use client';

import { useState } from 'react';
import { updateOrderStatus, processMoMoPayment, OrderStatus } from '@/app/actions/orders';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, ArrowUpDown, ShoppingCart } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { OrderDetailsSheet } from './OrderDetailsSheet';
import { OrdersTableRow, Order } from './OrdersTableRow';
import { OrdersPagination } from './OrdersPagination';
import { OrdersBulkActionBar } from './OrdersBulkActionBar';
import { MoMoReconciliationModal } from './MoMoReconciliationModal';
import { CancelOrderModal } from './CancelOrderModal';

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
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, OrderStatus>>({});
  const orders = initialOrders.map((o) => (optimisticStatus[o.id] ? { ...o, status: optimisticStatus[o.id] } : o));
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reconciliationOrder, setReconciliationOrder] = useState<Order | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [orderToCancel, setOrderToCancel] = useState<string | 'bulk' | null>(null);

  const currentSortBy = searchParams.get('sortBy') || 'created_at';
  const currentSortOrder = searchParams.get('sortOrder') || 'desc';

  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSortBy === column) {
      params.set('sortOrder', currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortBy', column);
      params.set('sortOrder', 'asc');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(true);
    setActiveMenuId(null);
    const res = await updateOrderStatus(orderId, newStatus);
    setIsUpdating(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Order marked as ${newStatus}`);
      setOptimisticStatus((prev) => ({ ...prev, [orderId]: newStatus }));
      router.refresh();
    }
  };

  const handleReconcile = async (smsText: string) => {
    if (!reconciliationOrder) return;
    setIsUpdating(true);
    const res = await processMoMoPayment(reconciliationOrder.id, smsText);
    setIsUpdating(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Payment verified & order marked as Paid!');
      setOptimisticStatus((prev) => ({ ...prev, [reconciliationOrder.id]: 'paid' }));
      setReconciliationOrder(null);
      router.refresh();
    }
  };

  const handleBulkExport = () => {
    const selectedOrders = orders.filter((o) => selectedOrderIds.has(o.id));
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Order ID,Customer,Phone,Status,Amount,Date']
        .concat(
          selectedOrders.map(
            (o) =>
              `"${o.id}","${o.customer?.name || ''}","${o.customer?.phone || ''}","${o.status}","${o.total_amount}","${o.created_at}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedOrders.length} orders`);
  };

  const confirmCancel = async () => {
    if (!orderToCancel) return;
    setIsUpdating(true);

    if (orderToCancel === 'bulk') {
      const ids = Array.from(selectedOrderIds);
      let successCount = 0;
      for (const id of ids) {
        const res = await updateOrderStatus(id, 'cancelled');
        if (!res.error) successCount++;
      }
      toast.success(`Cancelled ${successCount} orders`);
      setOptimisticStatus((prev) => {
        const next = { ...prev };
        ids.forEach((id) => {
          next[id] = 'cancelled';
        });
        return next;
      });
      setSelectedOrderIds(new Set());
      router.refresh();
    } else {
      const res = await updateOrderStatus(orderToCancel, 'cancelled');
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Order cancelled');
        setOptimisticStatus((prev) => ({ ...prev, [orderToCancel]: 'cancelled' }));
        router.refresh();
      }
    }

    setIsUpdating(false);
    setOrderToCancel(null);
  };

  const allSelected = orders.length > 0 && selectedOrderIds.size === orders.length;

  return (
    <>
      <div className="bg-surface border border-separator rounded-2xl overflow-hidden shadow-xs flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-separator bg-surface-elevated/40 text-xs font-semibold text-muted">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrderIds(new Set(orders.map((o) => o.id)));
                      } else {
                        setSelectedOrderIds(new Set());
                      }
                    }}
                    className="rounded border-separator text-brand-primary focus:ring-brand-primary cursor-pointer"
                  />
                </th>
                <th className="p-4 cursor-pointer group" onClick={() => handleSort('id')}>
                  <span>Order ID</span>
                  <SortIcon column="id" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                </th>
                <th className="p-4 cursor-pointer group hidden sm:table-cell" onClick={() => handleSort('created_at')}>
                  <span>Date</span>
                  <SortIcon column="created_at" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                </th>
                <th className="p-4">Customer</th>
                <th className="p-4 cursor-pointer group" onClick={() => handleSort('status')}>
                  <span>Status</span>
                  <SortIcon column="status" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                </th>
                <th className="p-4 cursor-pointer group" onClick={() => handleSort('total_amount')}>
                  <span>Total (GH₵)</span>
                  <SortIcon column="total_amount" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                </th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator/40">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted">
                    <ShoppingCart size={28} className="mx-auto mb-2 opacity-20" />
                    <p className="font-medium text-foreground">No orders found</p>
                    <p className="text-xs text-muted mt-1">Try adjusting search query or status filter.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <OrdersTableRow
                    key={order.id}
                    order={order}
                    isSelected={selectedOrderIds.has(order.id)}
                    isMenuOpen={activeMenuId === order.id}
                    onToggleSelect={(id, checked) => {
                      const next = new Set(selectedOrderIds);
                      if (checked) next.add(id);
                      else next.delete(id);
                      setSelectedOrderIds(next);
                    }}
                    onToggleMenu={(id) => setActiveMenuId(activeMenuId === id ? null : id)}
                    onOpenDetails={(o) => setSelectedOrder(o)}
                    onOpenReconcile={(o) => setReconciliationOrder(o)}
                    onStatusChange={handleStatusChange}
                    onOpenCancel={(id) => setOrderToCancel(id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <OrdersPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={handlePageChange}
        />
      </div>

      <OrderDetailsSheet isOpen={selectedOrder !== null} onClose={() => setSelectedOrder(null)} order={selectedOrder} />

      <OrdersBulkActionBar
        selectedCount={selectedOrderIds.size}
        onDeselect={() => setSelectedOrderIds(new Set())}
        onBulkExport={handleBulkExport}
      />

      <MoMoReconciliationModal
        order={reconciliationOrder}
        isOpen={reconciliationOrder !== null}
        isUpdating={isUpdating}
        onClose={() => setReconciliationOrder(null)}
        onReconcile={handleReconcile}
      />

      <CancelOrderModal
        orderToCancel={orderToCancel}
        selectedCount={selectedOrderIds.size}
        isUpdating={isUpdating}
        onClose={() => setOrderToCancel(null)}
        onConfirm={confirmCancel}
      />
    </>
  );
}
