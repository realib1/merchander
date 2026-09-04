import { describe, it, expect, vi } from 'vitest';
import { resolveChannelIdentity } from './identity';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Mock SupabaseClient
const createMockSupabase = () => {
  const eq = vi.fn().mockReturnThis();
  const select = vi.fn().mockReturnThis();
  const update = vi.fn().mockReturnThis();
  const insert = vi.fn().mockReturnThis();
  const maybeSingle = vi.fn();
  const single = vi.fn();

  const mockFrom = vi.fn().mockReturnValue({
    select,
    update,
    insert,
    eq,
    maybeSingle,
    single,
  });

  return {
    from: mockFrom,
    mocks: { eq, select, update, insert, maybeSingle, single, from: mockFrom }
  } as unknown as SupabaseClient<Database> & { 
    mocks: {
      eq: ReturnType<typeof vi.fn>;
      select: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      insert: ReturnType<typeof vi.fn>;
      maybeSingle: ReturnType<typeof vi.fn>;
      single: ReturnType<typeof vi.fn>;
      from: ReturnType<typeof vi.fn>;
    }
  };
};

describe('resolveChannelIdentity', () => {
  const tenantId = 'tenant-123';
  const channel = 'whatsapp';
  const channelHandle = '233241234567';

  it('returns existing identity and updates last_seen_at', async () => {
    const supabase = createMockSupabase();
    const existing = { id: 'id-1', tenant_id: tenantId, channel, channel_handle: channelHandle, profile_name: 'Old Name' };
    
    supabase.mocks.maybeSingle.mockResolvedValueOnce({ data: existing, error: null });
    supabase.mocks.single.mockResolvedValueOnce({ data: { ...existing, profile_name: 'New Name' }, error: null });

    const result = await resolveChannelIdentity(supabase, tenantId, channel, channelHandle, 'New Name');
    
    expect(result.profile_name).toBe('New Name');
    expect(supabase.mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      profile_name: 'New Name',
      last_seen_at: expect.any(String)
    }));
  });

  it('creates a new identity when none exists', async () => {
    const supabase = createMockSupabase();
    
    supabase.mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    supabase.mocks.single.mockResolvedValueOnce({ 
      data: { id: 'id-2', tenant_id: tenantId, channel, channel_handle: channelHandle, profile_name: 'Test' }, 
      error: null 
    });

    const result = await resolveChannelIdentity(supabase, tenantId, channel, channelHandle, 'Test');
    
    expect(result.id).toBe('id-2');
    expect(supabase.mocks.insert).toHaveBeenCalledWith({
      tenant_id: tenantId,
      channel,
      channel_handle: channelHandle,
      profile_name: 'Test'
    });
  });

  it('handles unique constraint violation (concurrent creation) gracefully', async () => {
    const supabase = createMockSupabase();
    
    supabase.mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    
    // Simulate insert failure due to concurrent unique constraint violation
    supabase.mocks.single.mockResolvedValueOnce({ 
      data: null, 
      error: { code: '23505', message: 'Unique constraint violation' } 
    });

    // Simulate the fallback select finding the concurrently created row
    const existing = { id: 'id-concurrent', tenant_id: tenantId, channel, channel_handle: channelHandle, profile_name: 'Test' };
    supabase.mocks.single.mockResolvedValueOnce({ data: existing, error: null });

    const result = await resolveChannelIdentity(supabase, tenantId, channel, channelHandle, 'Test');
    
    expect(result.id).toBe('id-concurrent');
  });
});
