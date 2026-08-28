'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createExpense, updateExpense } from '@/app/actions/expenses';
import { toast } from 'sonner';
import { PAYMENT_METHODS } from '../constants';
import type { Expense } from '@/types/expenses';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense | null;
  categories: string[];
}

export function ExpenseFormModal({ isOpen, onClose, expense, categories }: ExpenseFormModalProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Logistics & Freight');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expense) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(expense.amount.toString());
      setCategory(expense.category || categories[0]);
      setPaymentMethod(expense.payment_method || PAYMENT_METHODS[0]);
      setDescription(expense.description || '');
      setExpenseDate(expense.expense_date.split('T')[0]); // Ensure YYYY-MM-DD
      setReceiptUrl(expense.receipt_url || '');
    } else {
      setAmount('');
      setCategory(categories[0] || 'Logistics & Freight');
      setPaymentMethod(PAYMENT_METHODS[0]);
      setDescription('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setReceiptUrl('');
    }
  }, [expense, isOpen, categories]);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
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
      currency: 'GHS',
      category,
      payment_method: paymentMethod || 'Cash',
      description: description.trim() || null,
      expense_date: expenseDate,
      store_id: null,
      receipt_url: receiptUrl.trim() || null,
    };

    try {
      if (expense) {
        await updateExpense(expense.id, payload);
        toast.success('Expense updated successfully');
      } else {
        await createExpense(payload);
        toast.success('Expense recorded successfully');
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
      title={expense ? 'Edit Expense' : 'Record Business Expense'}
      description={
        expense
          ? 'Update the details for this operational expense record.'
          : 'Record a business outlay (freight, ads, wages, utilities, packaging).'
      }
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="expense-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : expense ? 'Update Expense' : 'Record Expense'}
          </Button>
        </>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="amount" className="text-xs font-semibold text-foreground">
              Amount (GHS) *
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition-all font-semibold"
              placeholder="e.g. 450.00"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="category" className="text-xs font-semibold text-foreground">
              Expense Category *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition-all"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="payment_method" className="text-xs font-semibold text-foreground">
              Payment Method
            </label>
            <select
              id="payment_method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition-all"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="expense_date" className="text-xs font-semibold text-foreground">
              Expense Date *
            </label>
            <input
              id="expense_date"
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition-all"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="description" className="text-xs font-semibold text-foreground">
              Description <span className="text-muted font-normal">(Optional)</span>
            </label>
            <textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition-all resize-none"
              placeholder="e.g. Speedaf customs clearance & handling fee for Tema container"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="receipt_url" className="text-xs font-semibold text-foreground">
              Receipt Reference / Link <span className="text-muted font-normal">(Optional)</span>
            </label>
            <input
              id="receipt_url"
              type="text"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-separator rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition-all"
              placeholder="e.g. Receipt #REC-9812 or receipt image link"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
