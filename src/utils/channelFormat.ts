const CHANNEL_DISPLAY_NAMES: Record<string, string> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  instagram: 'Instagram',
  messenger: 'Messenger',
};

/** Maps a raw channel identifier to its display name, defaulting to WhatsApp. */
export function formatChannelName(channel?: string): string {
  if (!channel) return 'WhatsApp';
  return CHANNEL_DISPLAY_NAMES[channel.toLowerCase()] || channel;
}
