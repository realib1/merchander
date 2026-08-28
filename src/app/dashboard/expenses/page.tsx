import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ExpensesTopMetrics } from './components/ExpensesTopMetrics';
import { ExpensesToolbar } from './components/ExpensesToolbar';
import { ExpensesTable } from './components/ExpensesTable';
import type { Expense } from '@/types/expenses';

export const metadata = {
  title: 'Expenses | Merchander',
  description: 'Track operational business expenses, freight outlays, and export bookkeeping records.',
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
  const periodFilter = typeof resolvedParams.period === 'string' ? resolvedParams.period : undefined;

  const sortBy = typeof resolvedParams.sortBy === 'string' ? resolvedParams.sortBy : 'expense_date';
  const sortOrder =
    typeof resolvedParams.sortOrder === 'string' &&
    (resolvedParams.sortOrder === 'asc' || resolvedParams.sortOrder === 'desc')
      ? resolvedParams.sortOrder
      : 'desc';

  // Build query
  let queryBuilder = supabase
    .from('expenses')
    .select('*')
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .order('created_at', { ascending: false });

  if (query) {
    queryBuilder = queryBuilder.ilike('description', `%${query}%`);
  }
  if (categoryFilter && categoryFilter !== 'all') {
    queryBuilder = queryBuilder.eq('category', categoryFilter);
  }

  // Calculate Date bounds for Period filter
  const now = new Date();
  if (periodFilter === 'this_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    queryBuilder = queryBuilder.gte('expense_date', firstDay).lte('expense_date', lastDay);
  } else if (periodFilter === 'last_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    queryBuilder = queryBuilder.gte('expense_date', firstDay).lte('expense_date', lastDay);
  } else if (periodFilter === 'this_quarter') {
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
    const firstDay = new Date(now.getFullYear(), quarterMonth, 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), quarterMonth + 3, 0).toISOString().split('T')[0];
    queryBuilder = queryBuilder.gte('expense_date', firstDay).lte('expense_date', lastDay);
  } else if (periodFilter === 'this_year') {
    const firstDay = `${now.getFullYear()}-01-01`;
    const lastDay = `${now.getFullYear()}-12-31`;
    queryBuilder = queryBuilder.gte('expense_date', firstDay).lte('expense_date', lastDay);
  }

  const { data: expenses, error } = await queryBuilder;

  if (error) {
    console.error('Error fetching expenses:', error);
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

  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full animate-fadeIn">
      <h1 className="sr-only">Expenses & Outlays</h1>

      {/* Top Metrics */}
      <ExpensesTopMetrics
        totalAmount={totalAmount}
        topCategory={topCategory}
        expenseCount={fetchedExpenses.length}
        categoryBreakdown={categoryBreakdown}
      />

      {/* Table and Toolbar */}
      <div className="bg-surface border border-separator rounded-2xl flex-1 flex flex-col overflow-hidden shadow-xs min-h-105">
        <ExpensesToolbar expenses={fetchedExpenses} />
        <ExpensesTable expenses={fetchedExpenses} />
      </div>
    </div>
  );
}
