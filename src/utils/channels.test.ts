import { describe, it, expect } from 'vitest';
import { ChannelSettings } from '@/types/settings';

describe('ChannelSettings Contract', () => {
  it('should support structured WhatsApp, Instagram, Messenger, and Telegram configurations', () => {
    const settings: ChannelSettings = {
      whatsapp: {
        connected: true,
        phoneNumber: '+233241234567',
        enableFloatingStorefrontWidget: true,
        widgetGreeting: 'Hello, need help?',
        connectionType: 'direct_link',
      },
      instagram: {
        connected: true,
        handle: '@mybrand_gh',
        syncDirectMessages: true,
        syncStoryMentions: true,
      },
      messenger: {
        connected: false,
        pageId: '1029384756',
        syncMessages: true,
      },
      telegram: {
        connected: true,
        botUsername: '@mybrand_order_bot',
        orderNotificationAlerts: true,
      },
      webhookUrl: 'https://api.merchander.com/api/webhooks/whatsapp',
    };

    expect(settings.whatsapp.connected).toBe(true);
    expect(settings.whatsapp.enableFloatingStorefrontWidget).toBe(true);
    expect(settings.instagram.handle).toBe('@mybrand_gh');
    expect(settings.telegram.orderNotificationAlerts).toBe(true);
  });
});
