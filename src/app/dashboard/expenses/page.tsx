import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ExpensesTopMetrics } from './components/ExpensesTopMetrics';
import { ExpensesToolbar } from './components/ExpensesToolbar';
import { ExpensesTable } from './components/ExpensesTable';
import type { Expense } from '@/types/expenses';

export const metadata = {
  title: 'Expenses | Merchander',
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const resolvedParams = await searchParams;
  const query = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;
  const categoryFilter = typeof resolvedParams.category === 'string' ? resolvedParams.category : undefined;
  const monthFilter = typeof resolvedParams.month === 'string' ? resolvedParams.month : undefined; // YYYY-MM format

  // Build the query
  let queryBuilder = supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (query) {
    queryBuilder = queryBuilder.ilike('description', `%${query}%`);
  }
  if (categoryFilter && categoryFilter !== 'all') {
    queryBuilder = queryBuilder.eq('category', categoryFilter);
  }

  if (monthFilter) {
    const startDate = `${monthFilter}-01`;
    queryBuilder = queryBuilder.gte('expense_date', startDate).lt('expense_date', `${monthFilter}-31`); // simple approximation
  }

  const { data: expenses, error } = await queryBuilder;

  if (error) {
    console.error('Error fetching expenses:', JSON.stringify(error, null, 2), error);
  }

  const fetchedExpenses = (expenses as Expense[]) || [];

  const totalAmount = fetchedExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  const categoryTotals: Record<string, number> = {};
  fetchedExpenses.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + Number(exp.amount);
  });

  let topCategory = 'None';
  let topCategoryAmount = 0;
  for (const [cat, amt] of Object.entries(categoryTotals)) {
    if (amt > topCategoryAmount) {
      topCategory = cat;
      topCategoryAmount = amt;
    }
  }

  const expenseCount = fetchedExpenses.length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full min-h-full">
      <ExpensesTopMetrics totalAmount={totalAmount} topCategory={topCategory} expenseCount={expenseCount} />
      <div className="bg-surface border border-separator rounded-xl flex-1 flex flex-col overflow-hidden shadow-sm min-h-150">
        <ExpensesToolbar />
        <ExpensesTable expenses={fetchedExpenses} />
      </div>
    </div>
  );
}
