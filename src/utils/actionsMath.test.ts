
import {
  sanitizePhoneForWhatsApp,
  buildWhatsAppTakeoverUrl,
  formatActionTypeLabel,
  formatTierBadge,
  filterActionQueue,
} from './actionsMath';
import { AIActionRecord } from '@/types/actions';

describe('Actions Math & Queue Utils', () => {
  describe('sanitizePhoneForWhatsApp', () => {
    it('normalizes local 10-digit Ghana numbers starting with 0 to 233 format', () => {
      expect(sanitizePhoneForWhatsApp('0244123456')).toBe('233244123456');
      expect(sanitizePhoneForWhatsApp('055 987 6543')).toBe('233559876543');
    });

    it('preserves already prefixed 233 numbers and removes non-digit characters', () => {
      expect(sanitizePhoneForWhatsApp('+233244123456')).toBe('233244123456');
      expect(sanitizePhoneForWhatsApp('+1 (555) 234-5678')).toBe('15552345678');
    });

    it('returns empty string for empty input', () => {
      expect(sanitizePhoneForWhatsApp('')).toBe('');
    });
  });

  describe('buildWhatsAppTakeoverUrl', () => {
    it('generates valid wa.me URL with customer name and greeting', () => {
      const url = buildWhatsAppTakeoverUrl('0244123456', 'Ama Serwaa', 'Payment issue');
      expect(url).toContain('https://wa.me/233244123456?text=');
      expect(url).toContain(encodeURIComponent('Hello Ama Serwaa, this is Merchander customer support.'));
    });

    it('handles null or missing customer name gracefully', () => {
      const url = buildWhatsAppTakeoverUrl('0244123456', null);
      expect(url).toContain('https://wa.me/233244123456?text=');
      expect(url).toContain(encodeURIComponent('Hello this is Merchander customer support.'));
    });

    it('returns base URL if phone is empty', () => {
      const url = buildWhatsAppTakeoverUrl('');
      expect(url).toBe('https://wa.me/');
    });
  });

  describe('formatActionTypeLabel', () => {
    it('maps action types to human-readable operational labels', () => {
      expect(formatActionTypeLabel('confirm_payment')).toBe('Verify Payment');
      expect(formatActionTypeLabel('draft_order')).toBe('Draft Order');
      expect(formatActionTypeLabel('human_handoff')).toBe('Human Handoff');
      expect(formatActionTypeLabel('reply')).toBe('Review Reply');
    });
  });

  describe('formatTierBadge', () => {
    it('returns appropriate badge styling for red, yellow, and green tiers', () => {
      const red = formatTierBadge('red');
      expect(red.label).toBe('Red Exception');
      expect(red.badgeClass).toContain('rose');

      const yellow = formatTierBadge('yellow');
      expect(yellow.label).toBe('Yellow Approval');
      expect(yellow.badgeClass).toContain('amber');

      const green = formatTierBadge('green');
      expect(green.label).toBe('Green Auto');
      expect(green.badgeClass).toContain('emerald');
    });
  });

  describe('filterActionQueue', () => {
    const mockActions: AIActionRecord[] = [
      {
        id: 'act-1',
        tenant_id: 'tenant-1',
        channel_identity_id: 'chan-1',
        customer_id: 'cust-1',
        action_type: 'confirm_payment',
        tier: 'yellow',
        status: 'pending',
        proposed_payload: { reply_text: 'Thank you for your payment' },
        grounded_facts: ['MoMo ref 123456'],
        confidence: 0.90,
        escalation_reason: 'Payment needs review',
        customer_notice_sent: 'Verifying payment',
        reviewed_by: null,
        reviewed_at: null,
        rejection_reason: null,
        created_at: '2026-09-07T10:00:00Z',
        updated_at: '2026-09-07T10:00:00Z',
        customer: { id: 'cust-1', name: 'Ama Serwaa', phone: '0244123456' },
      },
      {
        id: 'act-2',
        tenant_id: 'tenant-1',
        channel_identity_id: 'chan-2',
        customer_id: 'cust-2',
        action_type: 'human_handoff',
        tier: 'red',
        status: 'pending',
        proposed_payload: { reply_text: 'Connecting to human' },
        grounded_facts: [],
        confidence: 0.40,
        escalation_reason: 'Customer requested human agent',
        customer_notice_sent: 'Notifying store team',
        reviewed_by: null,
        reviewed_at: null,
        rejection_reason: null,
        created_at: '2026-09-07T09:00:00Z',
        updated_at: '2026-09-07T09:00:00Z',
        customer: { id: 'cust-2', name: 'Kwame Mensah', phone: '0559876543' },
      },
      {
        id: 'act-3',
        tenant_id: 'tenant-1',
        channel_identity_id: 'chan-3',
        customer_id: 'cust-3',
        action_type: 'reply',
        tier: 'yellow',
        status: 'executed',
        proposed_payload: { reply_text: 'Order dispatched' },
        grounded_facts: [],
        confidence: 0.95,
        escalation_reason: null,
        customer_notice_sent: null,
        reviewed_by: 'user-1',
        reviewed_at: '2026-09-07T11:00:00Z',
        rejection_reason: null,
        created_at: '2026-09-07T08:00:00Z',
        updated_at: '2026-09-07T11:00:00Z',
        customer: { id: 'cust-3', name: 'Kofi Mensah', phone: '0201112233' },
      },
    ];

    it('filters by yellow tab and pending status', () => {
      const result = filterActionQueue(mockActions, '', 'yellow');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('act-1');
    });

    it('filters by red tab and pending status', () => {
      const result = filterActionQueue(mockActions, '', 'red');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('act-2');
    });

    it('filters by history tab (executed or rejected)', () => {
      const result = filterActionQueue(mockActions, '', 'history');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('act-3');
    });

    it('prioritizes Red urgent exceptions first in all pending tab', () => {
      const result = filterActionQueue(mockActions, '', 'all');
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('act-2'); // Red first
      expect(result[1].id).toBe('act-1'); // Yellow second
    });

    it('filters by search query matching customer name or reason', () => {
      const nameMatch = filterActionQueue(mockActions, 'Ama', 'all');
      expect(nameMatch.length).toBe(1);
      expect(nameMatch[0].customer?.name).toBe('Ama Serwaa');

      const reasonMatch = filterActionQueue(mockActions, 'human agent', 'all');
      expect(reasonMatch.length).toBe(1);
      expect(reasonMatch[0].id).toBe('act-2');
    });
  });
});
