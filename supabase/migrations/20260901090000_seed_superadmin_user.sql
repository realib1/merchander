-- Migration: 20260901090000_seed_superadmin_user.sql
--
-- SUPERSEDED - intentionally a no-op.
--
-- This migration originally inserted a platform admin row directly into
-- auth.users with a hardcoded password. Seeding auth users / credentials from a
-- migration ships a known login to every environment the migration is applied
-- to, so that has been removed (audit finding F-01).
--
-- Platform staff are now provisioned out of band:
--   - local / dev : supabase/seed.sql (runs only on `supabase db reset`)
--                   or `node scratch/seed-accounts.mjs`
--   - shared envs : Supabase dashboard invite, then a platform_staff_users row
--
-- The file is kept (not deleted) so local and remote migration history stay
-- aligned. If this migration already ran against an environment, rotate or
-- remove the admin@merchander.com account it created via the dashboard.

SELECT 1;
