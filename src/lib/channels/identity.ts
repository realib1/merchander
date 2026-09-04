import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

type ChannelType = Database['public']['Enums']['channel_type'];
type ChannelIdentity = Database['public']['Tables']['channel_identities']['Row'];

/**
 * Resolves an omnichannel handle (e.g. WhatsApp number, IG username) to a `channel_identity`.
 * If it doesn't exist, creates an unresolved one without forced merging.
 *
 * @param supabase - The Supabase client (anon or service role, as long as it has access to the tenant)
 * @param tenantId - The UUID of the tenant
 * @param channel - The channel platform (whatsapp, instagram, telegram, etc)
 * @param channelHandle - The unique handle on that channel (e.g., '233241234567')
 * @param profileName - Optional profile name from the channel's message payload
 * @returns The matched or newly created `channel_identity` record
 */
export async function resolveChannelIdentity(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  channel: ChannelType,
  channelHandle: string,
  profileName?: string
): Promise<ChannelIdentity> {
  // Try to find the existing identity
  const { data: existing, error: findError } = await supabase
    .from('channel_identities')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('channel', channel)
    .eq('channel_handle', channelHandle)
    .maybeSingle();

  if (findError) {
    throw new Error(`Failed to query channel identity: ${findError.message}`);
  }

  // If it exists, update the last_seen_at and profile_name if needed
  if (existing) {
    const shouldUpdateProfile = profileName && profileName !== existing.profile_name;
    
    const { data: updated, error: updateError } = await supabase
      .from('channel_identities')
      .update({
        last_seen_at: new Date().toISOString(),
        ...(shouldUpdateProfile ? { profile_name: profileName } : {}),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      console.warn('Failed to update channel_identity last_seen_at', updateError);
    }
    return updated || existing;
  }

  // Create a new unresolved profile. We rely on the UNIQUE constraint (tenant_id, channel, channel_handle).
  const { data: inserted, error: insertError } = await supabase
    .from('channel_identities')
    .insert({
      tenant_id: tenantId,
      channel,
      channel_handle: channelHandle,
      profile_name: profileName || null,
    })
    .select()
    .single();

  if (insertError) {
    // If we hit a unique constraint violation (code 23505), it means a concurrent webhook just created it.
    if (insertError.code === '23505') {
      const { data: retryData, error: retryError } = await supabase
        .from('channel_identities')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('channel', channel)
        .eq('channel_handle', channelHandle)
        .single();

      if (retryError) {
        throw new Error(`Failed to query channel identity after conflict: ${retryError.message}`);
      }
      return retryData;
    }

    throw new Error(`Failed to create channel identity: ${insertError.message}`);
  }

  return inserted;
}
