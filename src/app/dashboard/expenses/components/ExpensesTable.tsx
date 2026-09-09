'use client';

import { useState } from 'react';
import {
  Pencil,
  Trash2,
  Calendar,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Receipt,
  CreditCard,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { deleteExpense } from '@/app/actions/expenses';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ExpenseFormModal } from './ExpenseFormModal';
import { EXPENSE_CATEGORIES } from '../constants';
import type { Expense } from '@/types/expenses';

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

interface ExpensesTableProps {
  expenses: Expense[];
}

export function ExpensesTable({ expenses }: ExpensesTableProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (id: string) => {
    setExpenseToDelete(id);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    setIsDeleting(true);
    try {
      await deleteExpense(expenseToDelete);
      toast.success('Expense deleted successfully');
      setExpenseToDelete(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete expense');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createSortUrl = (column: string) => {
    const params = new URLSearchParams(searchParams);
    const currentSortBy = params.get('sortBy') || 'expense_date';
    const currentSortOrder = params.get('sortOrder') || 'desc';

    if (currentSortBy === column) {
      params.set('sortOrder', currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortBy', column);
      params.set('sortOrder', 'asc');
    }

    return `${pathname}?${params.toString()}`;
  };

  const currentSortBy = searchParams.get('sortBy') || 'expense_date';
  const currentSortOrder = searchParams.get('sortOrder') || 'desc';

  return (
    <>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left whitespace-nowrap min-w-200">
          <thead>
            <tr className="text-xs font-semibold bg-surface-elevated/30 border-b border-separator">
              <th className="px-6 py-4">
                <Link href={createSortUrl('expense_date')} className="flex items-center group cursor-pointer">
                  ID / Date{' '}
                  <SortIcon column="expense_date" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                </Link>
              </th>
              <th className="px-6 py-4">
                <Link href={createSortUrl('category')} className="flex items-center group cursor-pointer">
                  Category{' '}
                  <SortIcon column="category" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                </Link>
              </th>
              <th className="px-6 py-4">Payment Method</th>
              <th className="px-6 py-4">
                <Link href={createSortUrl('description')} className="flex items-center group cursor-pointer">
                  Description / Ref{' '}
                  <SortIcon column="description" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                </Link>
              </th>
              <th className="px-6 py-4 text-right">
                <Link href={createSortUrl('amount')} className="flex items-center justify-end group cursor-pointer">
                  Amount <SortIcon column="amount" currentSortBy={currentSortBy} currentSortOrder={currentSortOrder} />
                </Link>
              </th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {expenses.length > 0 ? (
              expenses.map((expense) => {
                return (
                  <tr key={expense.id} className="hover:bg-surface-elevated/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground">
                            #{expense.short_id || expense.id.slice(0, 8)}
                          </div>
                          <div className="font-medium text-muted text-xs">{formatDate(expense.expense_date)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-elevated border border-separator text-foreground">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted font-medium">
                        <CreditCard size={13} />
                        {expense.payment_method || 'Cash'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm truncate max-w-60">
                      <div>
                        <div className="text-foreground text-sm truncate">
                          {expense.description || <span className="text-muted italic">No description</span>}
                        </div>
                        {expense.receipt_url && (
                          <div className="text-xs text-brand-primary flex items-center gap-1 mt-0.5">
                            <Receipt size={11} /> {expense.receipt_url}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-bold text-foreground">
                        {expense.currency || 'GHS'}{' '}
                        {Number(expense.amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingExpense(expense)}
                          className="p-1.5 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                          aria-label="Edit expense"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1.5 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                          aria-label="Delete expense"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center text-muted">
                      <DollarSign size={24} />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No expenses found</p>
                    <p className="text-xs text-muted max-w-sm">Track your spending by creating an expense entry.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ExpenseFormModal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense}
        categories={EXPENSE_CATEGORIES}
      />

      <ConfirmDialog
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Expense Record"
        description="Are you sure you want to delete this expense record? This action cannot be undone."
        confirmText="Delete Expense"
        isDestructive
        isLoading={isDeleting}
      />
    </>
  );
}
