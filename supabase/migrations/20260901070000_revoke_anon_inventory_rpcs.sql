-- Phase 1.1: Revoke anonymous access to inventory-modifying RPC functions.
-- These must only be callable by authenticated users or service_role.
-- All callers (inventory-actions.ts, orders.ts) use authenticated server context,
-- so revoking anon access has zero impact on existing functionality.

REVOKE ALL ON FUNCTION public.decrement_inventory(uuid, uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.decrement_inventory_batch(jsonb, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.increment_inventory_batch(jsonb, uuid) FROM anon;
