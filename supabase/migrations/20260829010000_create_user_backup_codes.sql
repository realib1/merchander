-- ==============================================================================
-- Migration: User Emergency Backup Recovery Codes for Two-Factor Authentication
-- Description: Stores SHA-256 hashed single-use backup recovery codes.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_backup_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_user_backup_codes_user_unused 
    ON public.user_backup_codes (user_id) 
    WHERE used_at IS NULL;

-- Enable Row Level Security
ALTER TABLE public.user_backup_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own backup code metadata
CREATE POLICY "Users can manage own backup codes"
    ON public.user_backup_codes
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_backup_codes TO authenticated;
GRANT ALL ON public.user_backup_codes TO service_role;
