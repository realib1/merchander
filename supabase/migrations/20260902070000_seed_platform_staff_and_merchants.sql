-- Migration: 20260902070000_seed_platform_staff_and_merchants.sql
--
-- SUPERSEDED - intentionally a no-op.
--
-- This migration originally created auth.users rows (with hardcoded passwords and
-- a stale "is_superadmin" JWT claim), linked platform staff, and seeded a demo
-- merchant tenant. Environment data does not belong in a schema migration, and
-- seeding credentials ships a known login everywhere the migration runs (audit
-- findings F-01, F-11).
--
-- Replacements:
--   - platform staff + demo merchant : supabase/seed.sql (local `db reset`)
--                                      or `node scratch/seed-accounts.mjs`
--   - shared environments            : provision via the Supabase dashboard
--
-- Kept as a no-op so local and remote migration history stay aligned.

SELECT 1;
