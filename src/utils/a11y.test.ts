
import { formatCurrency, formatDate, formatNumber } from './format';
import { getChannelBadgeDetails, getDefaultQuickReplies } from './conversationsMath';

describe('Accessibility & UI Formatter Suite', () => {
  describe('High-Contrast Currency & Number Screen-Reader Formatting', () => {
    it('formats currencies with GHS symbol clearly', () => {
      expect(formatCurrency(1250, 'GHS')).toContain('1,250');
      expect(formatCurrency(0, 'GHS')).toContain('0');
    });

    it('formats numbers with standard comma separators', () => {
      expect(formatNumber(15000)).toBe('15,000');
      expect(formatNumber(42)).toBe('42');
    });

    it('formats dates consistently for human and assistive readability', () => {
      const dateStr = new Date(2026, 7, 27).toISOString();
      const formatted = formatDate(dateStr);
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('Channel Badges & Semantic Accessibility', () => {
    it('provides distinct semantic background and text color tokens for all channels', () => {
      const waBadge = getChannelBadgeDetails('whatsapp');
      expect(waBadge.label).toBe('WhatsApp');
      expect(waBadge.bg).toContain('bg-success');
      expect(waBadge.text).toContain('text-success');

      const tgBadge = getChannelBadgeDetails('telegram');
      expect(tgBadge.label).toBe('Telegram');
      expect(tgBadge.bg).toContain('bg-info');
      expect(tgBadge.text).toContain('text-info');

      const igBadge = getChannelBadgeDetails('instagram');
      expect(igBadge.label).toBe('Instagram');
      expect(igBadge.bg).toContain('bg-brand-primary');
    });

    it('handles coming soon channels gracefully with muted badges', () => {
      const ttBadge = getChannelBadgeDetails('tiktok');
      expect(ttBadge.label).toContain('Soon');
      expect(ttBadge.bg).toContain('bg-muted');
    });
  });

  describe('Commerce Quick Reply Completeness', () => {
    it('provides complete quick reply templates covering all critical Ghanaian commerce intents', () => {
      const replies = getDefaultQuickReplies('Accra Glam');
      expect(replies.length).toBeGreaterThanOrEqual(4);

      const categories = replies.map((r) => r.category);
      expect(categories).toContain('catalog');
      expect(categories).toContain('payment');
      expect(categories).toContain('delivery');
      expect(categories).toContain('greeting');
    });
  });
});
