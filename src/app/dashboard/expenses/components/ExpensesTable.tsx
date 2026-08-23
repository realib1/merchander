'use client';

import { useState } from 'react';
import { DollarSign, Edit3, Trash2, Calendar } from 'lucide-react';
import { deleteExpense } from '@/app/actions/expenses';
import { toast } from 'sonner';
import { ExpenseFormModal } from './ExpenseFormModal';
import { EXPENSE_CATEGORIES } from '../constants';
import type { Expense } from '@/types/expenses';

interface ExpensesTableProps {
  expenses: Expense[];
}

export function ExpensesTable({ expenses }: ExpensesTableProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await deleteExpense(id);
      toast.success('Expense deleted successfully');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete expense');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left whitespace-nowrap min-w-200">
          <thead>
            <tr className="text-xs font-semibold text-secondary bg-surface-elevated/30 border-b border-separator">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-right">Amount</th>
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
                        <div className="h-10 w-10 rounded-xl bg-surface-elevated text-secondary flex items-center justify-center shrink-0">
                          <Calendar size={18} />
                        </div>
                        <div className="font-medium text-primary text-sm">
                          {formatDate(expense.expense_date)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-caption font-semibold bg-surface-elevated text-secondary border border-separator">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary truncate max-w-[250px]">
                      {expense.description || <span className="text-muted italic">No description</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-bold text-primary">
                        {expense.currency} {Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingExpense(expense)}
                          className="p-2 text-secondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                          title="Edit"
                          aria-label="Edit expense"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 text-secondary hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Delete"
                          aria-label="Delete expense"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-secondary">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center text-muted">
                      <DollarSign size={24} />
                    </div>
                    <p className="text-body font-medium">No expenses found</p>
                    <p className="text-sm text-muted">Track your spending by creating an expense.</p>
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
    </>
  );
}
