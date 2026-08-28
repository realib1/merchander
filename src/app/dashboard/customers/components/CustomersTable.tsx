'use client';

import { useState, useEffect } from 'react';
import { CustomerStats } from '@/app/actions/customers';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { bulkDeleteCustomers } from '@/app/actions/customers';
import { usePathname, useSearchParams } from 'next/navigation';
import { CustomersTableRow } from './CustomersTableRow';
import { CustomersBulkActionBar } from './CustomersBulkActionBar';
import { CustomersDeleteModal } from './CustomersDeleteModal';
import { CustomersPagination } from './CustomersPagination';

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

interface CustomersTableProps {
  initialCustomers: CustomerStats[];
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
}

export function CustomersTable({
  initialCustomers,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
}: CustomersTableProps) {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | 'bulk' | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const customers = initialCustomers.filter((c) => !deletedIds.has(c.id));

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
      setDeletedIds((prev) => new Set([...prev, ...idsToDelete]));
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
    const sortBy = params.get('sortBy') || 'created_at';
    const sortOrder = params.get('sortOrder') || 'desc';

    if (sortBy === column) {
      params.set('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc');
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
            <thead className="bg-surface-elevated border-b border-separator text-xs uppercase tracking-wider">
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
                  <CustomersTableRow
                    key={customer.id}
                    customer={customer}
                    isSelected={selectedIds.has(customer.id)}
                    isMenuOpen={activeMenuId === customer.id}
                    onToggleSelect={(checked) => toggleItem(customer.id, checked)}
                    onToggleMenu={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === customer.id ? null : customer.id);
                    }}
                    onCloseMenu={() => setActiveMenuId(null)}
                    onRequestDelete={() => setCustomerToDelete(customer.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <CustomersPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          createPageUrl={createPageUrl}
        />
      </div>

      <CustomersBulkActionBar
        selectedCount={selectedIds.size}
        isUpdating={isUpdating}
        isBulkDeleting={customerToDelete === 'bulk'}
        onDeselectAll={() => setSelectedIds(new Set())}
        onRequestBulkDelete={() => setCustomerToDelete('bulk')}
      />

      <CustomersDeleteModal
        customerToDelete={customerToDelete}
        selectedCount={selectedIds.size}
        isUpdating={isUpdating}
        onCancel={() => setCustomerToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
