-- Create waitlist table
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.waitlist enable row level security;

-- Policies for waitlist
-- Anyone can insert into waitlist (public access)
create policy "Anyone can join waitlist" on public.waitlist
  for insert with check (true);

-- Only superadmins can view the waitlist
create policy "Superadmins can view waitlist" on public.waitlist
  for select using (public.is_superadmin());
