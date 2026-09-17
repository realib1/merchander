'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { ChannelSettings } from '@/types/settings';
import { ChannelConnection } from '@/app/actions/channels';
import { updateChannelSettings } from '@/app/actions/settings-social';
import { WhatsAppChannelCard } from './WhatsAppChannelCard';
import { InstagramChannelCard } from './InstagramChannelCard';
import { MessengerChannelCard } from './MessengerChannelCard';
import { TelegramChannelCard } from './TelegramChannelCard';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface ChannelsSettingsFormProps {
  initialSettings: ChannelSettings;
  connections: ChannelConnection[];
}

export function ChannelsSettingsForm({ initialSettings, connections }: ChannelsSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const initialRuntimeSettings: ChannelSettings = {
    ...initialSettings,
    whatsapp: {
      ...initialSettings.whatsapp,
      connected: connections.some((connection) => connection.channel === 'whatsapp_cloud' && connection.status === 'connected'),
    },
    telegram: {
      ...initialSettings.telegram,
      connected: connections.some((connection) => connection.channel === 'telegram' && connection.status === 'connected'),
    },
  };
  const [settings, setSettings] = useState<ChannelSettings>(initialRuntimeSettings);
  const [savedSettings, setSavedSettings] = useState<ChannelSettings>(initialRuntimeSettings);

  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(savedSettings);
  }, [settings, savedSettings]);

  const isConnected = (channel: ChannelConnection['channel']) =>
    connections.some((connection) => connection.channel === channel && connection.status === 'connected');

  const handleReset = () => {
    setSettings(savedSettings);
    toast.info('Changes reverted');
  };

  const handleSave = () => {
    startTransition(async () => {
      // Sync legacy flat fields for backward compatibility
      const payload: ChannelSettings = {
        ...settings,
        whatsappConnected: settings.whatsapp.connected,
        whatsappPhone: settings.whatsapp.phoneNumber,
        instagramConnected: settings.instagram.connected,
        instagramHandle: settings.instagram.handle,
        messengerConnected: settings.messenger.connected,
      };

      const res = await updateChannelSettings(payload);
      if (res.error) {
        toast.error(res.error);
      } else {
        setSavedSettings(settings);
        toast.success('Connected channels saved successfully');
      }
    });
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-8 animate-fadeIn">
      {/* 1. WhatsApp Card */}
      <WhatsAppChannelCard
        config={settings.whatsapp}
        runtimeConnected={isConnected('whatsapp_cloud')}
        webhookUrl={settings.webhookUrl}
        onChange={(updated) => setSettings((s) => ({ ...s, whatsapp: updated }))}
        disabled={isPending}
      />

      {/* 2. Instagram Card */}
      <InstagramChannelCard
        config={settings.instagram}
        onChange={(updated) => setSettings((s) => ({ ...s, instagram: updated }))}
        disabled={isPending}
      />

      {/* 3. Facebook Messenger Card */}
      <MessengerChannelCard
        config={settings.messenger}
        onChange={(updated) => setSettings((s) => ({ ...s, messenger: updated }))}
        disabled={isPending}
      />

      {/* 4. Telegram Bot Card */}
      <TelegramChannelCard
        config={settings.telegram}
        runtimeConnected={isConnected('telegram')}
        onChange={(updated) => setSettings((s) => ({ ...s, telegram: updated }))}
        disabled={isPending}
      />

      {/* Sticky Bottom Save Bar */}
      {isDirty && (
        <div className="fixed sm:sticky bottom-4 left-4 right-4 sm:left-auto sm:right-auto z-40 bg-surface-elevated/95 backdrop-blur-md border border-separator shadow-lg rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-slideUp">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs font-semibold text-foreground">You have unsaved channel changes</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isPending}
              className="cursor-pointer"
            >
              <RotateCcw size={13} className="mr-1" />
              <span>Revert</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="cursor-pointer"
            >
              {isPending ? <Loader2 size={13} className="animate-spin mr-1" /> : <Save size={13} className="mr-1" />}
              <span>{isPending ? 'Saving...' : 'Save Channels'}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
