import { describe, it, expect } from 'vitest';
import { formatChannelName } from './channelFormat';

describe('formatChannelName', () => {
  it('returns WhatsApp as default when channel is undefined or empty', () => {
    expect(formatChannelName()).toBe('WhatsApp');
    expect(formatChannelName('')).toBe('WhatsApp');
  });

  it('normalizes recognized channel identifiers to human-readable names', () => {
    expect(formatChannelName('whatsapp')).toBe('WhatsApp');
    expect(formatChannelName('WHATSAPP')).toBe('WhatsApp');
    expect(formatChannelName('telegram')).toBe('Telegram');
    expect(formatChannelName('instagram')).toBe('Instagram');
    expect(formatChannelName('messenger')).toBe('Messenger');
  });

  it('preserves unknown custom channels cleanly', () => {
    expect(formatChannelName('Signal')).toBe('Signal');
    expect(formatChannelName('SMS Gateway')).toBe('SMS Gateway');
  });
});
