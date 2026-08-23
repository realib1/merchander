-- Grant table-level permissions to the authenticated role for expenses
grant select, insert, update, delete on public.expenses to authenticated;
