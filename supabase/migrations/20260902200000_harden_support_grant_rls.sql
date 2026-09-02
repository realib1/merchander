-- Migration: 20260902200000_harden_support_grant_rls.sql
-- Split the support-access-grant RLS so tenant members can read their grants but
-- only owners/admins can create, modify, or delete them. The app writes grants
-- with the service-role client, which bypasses RLS; this only constrains direct
-- anon-client access (audit finding F-09).

DROP POLICY IF EXISTS "Tenant users manage support grants" ON public.platform_support_access_grants;

CREATE POLICY "Tenant members view support grants" ON public.platform_support_access_grants
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Tenant owners and admins write support grants" ON public.platform_support_access_grants
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- "Platform staff can view support grants" from 20260901120000 is left in place.

NOTIFY pgrst, 'reload schema';
