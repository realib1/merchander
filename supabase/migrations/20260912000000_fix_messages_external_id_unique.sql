-- Migration: Replace plain non-unique external_id index with unique index on public.messages
-- Finding: F-03

-- Drop the old plain index
DROP INDEX IF EXISTS public.idx_messages_external_id;

-- Create unique index to guarantee message idempotency on Meta webhook retries
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_external_id_unique 
ON public.messages(tenant_id, external_id) 
WHERE external_id IS NOT NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
