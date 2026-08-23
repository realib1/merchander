export interface Expense {
  id: string;
  tenant_id: string;
  store_id: string | null;
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  expense_date: string;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateExpenseInput = Omit<Expense, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>;
export type UpdateExpenseInput = Partial<CreateExpenseInput>;
