
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { evaluateAndProcessOutreach } from './outreach';
import * as outreachUtils from '@/utils/outreach';

vi.mock('@/lib/channels/whatsapp/service', () => ({
  sendOutboundWhatsAppMessage: vi.fn().mockResolvedValue({
    messages: [{ id: 'wamid.outbound.123' }],
  }),
}));

describe('evaluateAndProcessOutreach', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('suppresses outreach during Ghana quiet hours when not forced', async () => {
    vi.spyOn(outreachUtils, 'isGhanaQuietHours').mockReturnValue(true);

    const mockSupabase = {} as unknown as SupabaseClient<Database>;
    const res = await evaluateAndProcessOutreach({
      supabase: mockSupabase,
      request: {
        tenantId: 'tenant-123',
        triggerType: 'delivery_update',
        customerPhone: '0241234567',
        orderNumber: 'ORD-100',
        forceBypassQuietHours: false,
      },
    });

    expect(res.status).toBe('suppressed');
    expect(res.reason).toContain('quiet hours');
  });

  it('skips outreach when customer has no WhatsApp channel identity', async () => {
    vi.spyOn(outreachUtils, 'isGhanaQuietHours').mockReturnValue(false);

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'channel_identities') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const res = await evaluateAndProcessOutreach({
      supabase: mockSupabase,
      request: {
        tenantId: 'tenant-123',
        triggerType: 'delivery_update',
        customerPhone: '0241234567',
        forceBypassQuietHours: true,
      },
    });

    expect(res.status).toBe('skipped');
    expect(res.reason).toContain('No active WhatsApp channel identity');
  });

  it('skips outreach if a pending proactive action already exists for the order', async () => {
    vi.spyOn(outreachUtils, 'isGhanaQuietHours').mockReturnValue(false);

    const mockIdentity = {
      id: 'ident-1',
      channel: 'whatsapp',
      channel_handle: '+233241234567',
      customer_id: 'cust-1',
      profile_name: 'Kofi Mensah',
    };

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'channel_identities') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: mockIdentity }),
          };
        }
        if (table === 'ai_action_queue') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            contains: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [{ id: 'existing-action-99' }] }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const res = await evaluateAndProcessOutreach({
      supabase: mockSupabase,
      request: {
        tenantId: 'tenant-123',
        triggerType: 'payment_reminder',
        orderId: 'order-123',
        orderNumber: 'ORD-100',
        customerPhone: '0241234567',
        forceBypassQuietHours: true,
      },
    });

    expect(res.status).toBe('skipped');
    expect(res.reason).toContain('already exists in the queue');
    expect(res.actionId).toBe('existing-action-99');
  });

  it('suppresses outreach when customer has reached daily volume limit', async () => {
    vi.spyOn(outreachUtils, 'isGhanaQuietHours').mockReturnValue(false);

    const mockIdentity = {
      id: 'ident-1',
      channel: 'whatsapp',
      channel_handle: '+233241234567',
      customer_id: 'cust-1',
      profile_name: 'Kofi Mensah',
    };

    const recent5Messages = [
      { created_at: new Date().toISOString() },
      { created_at: new Date().toISOString() },
      { created_at: new Date().toISOString() },
      { created_at: new Date().toISOString() },
      { created_at: new Date().toISOString() },
    ];

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'channel_identities') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: mockIdentity }),
          };
        }
        if (table === 'ai_action_queue') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            contains: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'messages') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: recent5Messages }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const res = await evaluateAndProcessOutreach({
      supabase: mockSupabase,
      request: {
        tenantId: 'tenant-123',
        triggerType: 'delivery_update',
        orderNumber: 'ORD-100',
        customerPhone: '0241234567',
        forceBypassQuietHours: true,
      },
    });

    expect(res.status).toBe('suppressed');
    expect(res.reason).toContain('Daily message frequency cap');
  });

  it('auto-dispatches Green tier routine delivery update directly via WhatsApp', async () => {
    vi.spyOn(outreachUtils, 'isGhanaQuietHours').mockReturnValue(false);

    const mockIdentity = {
      id: 'ident-1',
      channel: 'whatsapp',
      channel_handle: '+233241234567',
      customer_id: 'cust-1',
      profile_name: 'Kofi Mensah',
    };

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'channel_identities') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: mockIdentity }),
          };
        }
        if (table === 'ai_action_queue') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            contains: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'messages') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const res = await evaluateAndProcessOutreach({
      supabase: mockSupabase,
      request: {
        tenantId: 'tenant-123',
        triggerType: 'delivery_update',
        orderNumber: 'ORD-100',
        deliveryStatus: 'out_for_delivery',
        customerPhone: '0241234567',
        forceBypassQuietHours: true,
      },
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('dispatched');
    expect(res.tier).toBe('green');
    expect(res.messageText).toContain('Out for Delivery');
  });

  it('queues Yellow tier batch milestone broadcast in ai_action_queue', async () => {
    vi.spyOn(outreachUtils, 'isGhanaQuietHours').mockReturnValue(false);

    const mockIdentity = {
      id: 'ident-1',
      channel: 'whatsapp',
      channel_handle: '+233241234567',
      customer_id: 'cust-1',
      profile_name: 'Ama Boateng',
    };

    let insertedQueueData: unknown = null;

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'channel_identities') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: mockIdentity }),
          };
        }
        if (table === 'ai_action_queue') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            contains: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [] }),
            insert: vi.fn().mockImplementation((data: unknown) => {
              insertedQueueData = data;
              return {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { id: 'new-yellow-action-1' }, error: null }),
              };
            }),
          };
        }
        if (table === 'messages') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const res = await evaluateAndProcessOutreach({
      supabase: mockSupabase,
      request: {
        tenantId: 'tenant-123',
        triggerType: 'batch_milestone',
        batchId: 'batch-9',
        batchName: 'Batch Sep Handbags',
        milestone: 'IN_TRANSIT',
        customerPhone: '0241234567',
        isBulk: true,
        forceBypassQuietHours: true,
      },
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('queued');
    expect(res.tier).toBe('yellow');
    expect(res.actionId).toBe('new-yellow-action-1');
    expect(insertedQueueData).toMatchObject({
      action_type: 'proactive_outreach',
      tier: 'yellow',
      status: 'pending',
    });
  });

  it('suppresses Red tier outreach when customer has an open dispute', async () => {
    vi.spyOn(outreachUtils, 'isGhanaQuietHours').mockReturnValue(false);

    const mockIdentity = {
      id: 'ident-1',
      channel: 'whatsapp',
      channel_handle: '+233241234567',
      customer_id: 'cust-1',
      profile_name: 'Kofi Mensah',
    };

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'channel_identities') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: mockIdentity }),
          };
        }
        if (table === 'ai_action_queue') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            contains: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        if (table === 'messages') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [] }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const res = await evaluateAndProcessOutreach({
      supabase: mockSupabase,
      request: {
        tenantId: 'tenant-123',
        triggerType: 'payment_reminder',
        orderNumber: 'ORD-100',
        customerPhone: '0241234567',
        hasUnresolvedIssue: true,
        forceBypassQuietHours: true,
      },
    });

    expect(res.status).toBe('suppressed');
    expect(res.tier).toBe('red');
    expect(res.reason).toContain('dispute');
  });
});
