import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPendingApprovals, approveAction, rejectAction } from './approvals';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/queries', () => ({
  getTenantInfo: vi.fn(),
}));

vi.mock('@/lib/channels/whatsapp/service', () => ({
  sendOutboundWhatsAppMessage: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { sendOutboundWhatsAppMessage } from '@/lib/channels/whatsapp/service';

describe('Approval Queue Server Actions', () => {
  const mockTenantId = 'tenant-uuid-123';
  const mockUserId = 'user-uuid-456';

  const createMockSupabase = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: Record<string, any> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn();
    chain.update = vi.fn().mockReturnValue(chain);

    const mockFrom = vi.fn().mockReturnValue(chain);

    return {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
        }),
      },
      from: mockFrom,
      chain,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getTenantInfo as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      tenantId: mockTenantId,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPendingApprovals', () => {
    it('returns empty array when unauthenticated', async () => {
      const mockClient = createMockSupabase();
      mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);

      const result = await getPendingApprovals();
      expect(result).toEqual([]);
    });

    it('fetches pending actions filtered by tenant and status', async () => {
      const mockRecords = [
        {
          id: 'action-1',
          tenant_id: mockTenantId,
          tier: 'yellow',
          status: 'pending',
          action_type: 'confirm_payment',
        },
      ];

      const mockClient = createMockSupabase();
      // The query chain terminates on limit, so mock resolved data on limit
      mockClient.chain.limit.mockResolvedValueOnce({ data: mockRecords, error: null });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);

      const result = await getPendingApprovals({ tier: 'yellow' });
      expect(result).toEqual(mockRecords);
      expect(mockClient.chain.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
      expect(mockClient.chain.eq).toHaveBeenCalledWith('tier', 'yellow');
      expect(mockClient.chain.eq).toHaveBeenCalledWith('status', 'pending');
    });
  });

  describe('approveAction', () => {
    it('returns unauthorized error when not logged in', async () => {
      const mockClient = createMockSupabase();
      mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);

      const result = await approveAction('action-1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('approves action and sends proposed reply text via WhatsApp', async () => {
      const mockAction = {
        id: 'action-1',
        tenant_id: mockTenantId,
        channel_identity_id: 'channel-id-1',
        action_type: 'confirm_payment',
        tier: 'yellow',
        status: 'pending',
        proposed_payload: {
          reply_text: 'Payment received and verified!',
          customer_phone: '233244123456',
        },
        channel_identity: {
          id: 'channel-id-1',
          channel: 'whatsapp',
          channel_handle: '233244123456',
        },
      };

      const mockClient = createMockSupabase();
      mockClient.chain.single.mockResolvedValueOnce({ data: mockAction, error: null });
      mockClient.chain.update.mockReturnValue(mockClient.chain);
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);

      (sendOutboundWhatsAppMessage as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        messages: [{ id: 'wamid-out-99' }],
      });

      const result = await approveAction('action-1');
      expect(result.success).toBe(true);

      // Verify WhatsApp message dispatch
      expect(sendOutboundWhatsAppMessage).toHaveBeenCalledWith({
        supabase: mockClient,
        tenantId: mockTenantId,
        channelIdentityId: 'channel-id-1',
        to: '233244123456',
        messageType: 'text',
        text: 'Payment received and verified!',
        metadata: expect.objectContaining({
          action_id: 'action-1',
          action_type: 'confirm_payment',
          tier: 'yellow',
          approved_by: mockUserId,
        }),
      });

      // Verify status update to executed
      expect(mockClient.chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'executed',
          reviewed_by: mockUserId,
        })
      );
    });

    it('allows merchant to supply edited reply text on approval', async () => {
      const mockAction = {
        id: 'action-2',
        tenant_id: mockTenantId,
        channel_identity_id: 'channel-id-2',
        action_type: 'reply',
        tier: 'yellow',
        status: 'pending',
        proposed_payload: {
          reply_text: 'Original draft',
        },
        channel_identity: {
          channel: 'whatsapp',
          channel_handle: '233200999888',
        },
      };

      const mockClient = createMockSupabase();
      mockClient.chain.single.mockResolvedValueOnce({ data: mockAction, error: null });
      mockClient.chain.update.mockReturnValue(mockClient.chain);
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);

      const result = await approveAction('action-2', { reply_text: 'Custom merchant response' });
      expect(result.success).toBe(true);

      expect(sendOutboundWhatsAppMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Custom merchant response',
          metadata: expect.objectContaining({
            was_edited: true,
          }),
        })
      );
    });
  });

  describe('rejectAction', () => {
    it('marks action as rejected with merchant reason', async () => {
      const mockAction = {
        id: 'action-3',
        tenant_id: mockTenantId,
        status: 'pending',
      };

      const mockClient = createMockSupabase();
      mockClient.chain.single.mockResolvedValueOnce({ data: mockAction, error: null });
      mockClient.chain.update.mockReturnValue(mockClient.chain);
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);

      const result = await rejectAction('action-3', 'Payment was fraudulent');
      expect(result.success).toBe(true);

      expect(mockClient.chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rejected',
          rejection_reason: 'Payment was fraudulent',
          reviewed_by: mockUserId,
        })
      );
    });
  });
});
