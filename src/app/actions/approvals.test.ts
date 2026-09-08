import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getPendingApprovals,
  approveAction,
  rejectAction,
  getApprovalsQueueMetrics,
  resolveRedException,
} from './approvals';

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

  describe('getApprovalsQueueMetrics', () => {
    it('returns zeroes when unauthenticated', async () => {
      const mockClient = createMockSupabase();
      mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);

      const metrics = await getApprovalsQueueMetrics();
      expect(metrics).toEqual({
        pendingYellowCount: 0,
        urgentRedCount: 0,
        executedTodayCount: 0,
        avgConfidencePct: 0,
      });
    });

    it('aggregates pending yellow, red, executed today, and confidence', async () => {
      const todayIso = new Date().toISOString();
      const mockActions = [
        { tier: 'yellow', status: 'pending', confidence: 0.80, updated_at: todayIso },
        { tier: 'yellow', status: 'pending', confidence: 0.90, updated_at: todayIso },
        { tier: 'red', status: 'pending', confidence: 0.40, updated_at: todayIso },
        { tier: 'yellow', status: 'executed', confidence: 0.85, updated_at: todayIso },
      ];

      const mockClient = createMockSupabase();
      // eq on tenant_id terminates select
      mockClient.chain.eq.mockResolvedValueOnce({ data: mockActions, error: null });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);

      const metrics = await getApprovalsQueueMetrics();
      expect(metrics.pendingYellowCount).toBe(2);
      expect(metrics.urgentRedCount).toBe(1);
      expect(metrics.executedTodayCount).toBe(1);
      // Average confidence across pending: (0.80 + 0.90 + 0.40) / 3 = 0.70 -> 70%
      expect(metrics.avgConfidencePct).toBe(70);
    });
  });

  describe('resolveRedException', () => {
    it('resolves pending red exception with resolution note', async () => {
      const mockAction = {
        id: 'red-action-1',
        tier: 'red',
        status: 'pending',
        proposed_payload: { customer_phone: '233244123456' },
      };

      const mockClient = createMockSupabase();
      mockClient.chain.single.mockResolvedValueOnce({ data: mockAction, error: null });
      mockClient.chain.update.mockReturnValue(mockClient.chain);
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);

      const res = await resolveRedException('red-action-1', 'Called customer directly, complaint settled');
      expect(res.success).toBe(true);

      expect(mockClient.chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'executed',
          reviewed_by: mockUserId,
          proposed_payload: expect.objectContaining({
            customer_phone: '233244123456',
            resolution_note: 'Called customer directly, complaint settled',
            resolved_via_takeover: true,
          }),
        })
      );
    });

    it('rejects resolving if action is already executed', async () => {
      const mockAction = {
        id: 'red-action-2',
        tier: 'red',
        status: 'executed',
      };

      const mockClient = createMockSupabase();
      mockClient.chain.single.mockResolvedValueOnce({ data: mockAction, error: null });
      (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);

      const res = await resolveRedException('red-action-2');
      expect(res.success).toBe(false);
      expect(res.error).toContain('already executed');
    });
  });
});
