import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createExpense, updateExpense } from '@/app/actions/expenses';
import { toast } from 'sonner';
import type { Expense } from '@/types/expenses';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense | null;
  categories: string[];
}

export function ExpenseFormModal({
  isOpen,
  onClose,
  expense,
  categories,
}: ExpenseFormModalProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expense) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(expense.amount.toString());
      setCategory(expense.category || categories[0]);
      setDescription(expense.description || '');
      setExpenseDate(expense.expense_date.split('T')[0]); // Ensure YYYY-MM-DD
    } else {
      setAmount('');
      setCategory(categories[0]);
      setDescription('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
    }
  }, [expense, isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      amount: parsedAmount,
      currency: 'GHS', // Fixed for MVP
      category,
      description: description || null,
      expense_date: expenseDate,
      store_id: null,
      receipt_url: null,
    };

    try {
      if (expense) {
        await updateExpense(expense.id, payload);
        toast.success('Expense updated successfully');
      } else {
        await createExpense(payload);
        toast.success('Expense created successfully');
      }
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expense ? 'Edit Expense' : 'Add Expense'}
      description={expense ? 'Update the details for this expense record.' : 'Record a new business expense.'}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Expense'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="amount" className="text-body-sm font-semibold text-primary">
            Amount (GHS)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
            placeholder="e.g. 150.00"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="text-body-sm font-semibold text-primary">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="expense_date" className="text-body-sm font-semibold text-primary">
            Date
          </label>
          <input
            id="expense_date"
            type="date"
            required
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="description" className="text-body-sm font-semibold text-primary">
            Description <span className="text-muted font-normal">(Optional)</span>
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
            placeholder="What was this expense for?"
          />
        </div>
      </form>
    </Modal>
  );
}
