'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { MessageCircle, Camera, MessageSquare, Copy, Check, Loader2 } from 'lucide-react';
import { ChannelSettings } from '@/types/settings';
import { updateChannelSettings } from '@/app/actions/settings-social';
import { toast } from 'sonner';

interface ChannelsSettingsFormProps {
  initialSettings: ChannelSettings;
}

export function ChannelsSettingsForm({ initialSettings }: ChannelsSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [copied, setCopied] = useState(false);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(settings.webhookUrl);
    setCopied(true);
    toast.success('Webhook URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateChannelSettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Connected channels saved successfully');
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* WhatsApp */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>WhatsApp Cloud API & Webhook</CardTitle>
                <CardDescription>Direct two-way customer messaging and automated order capture.</CardDescription>
              </div>
            </div>
            <Switch
              checked={Boolean(settings.whatsappConnected)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, whatsappConnected: c }))}
              aria-label="Connect WhatsApp"
            />
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <FormField
            label="WhatsApp Business Phone Number"
            type="tel"
            placeholder="e.g. +233 24 123 4567"
            value={settings.whatsappPhone}
            onChange={(e) => setSettings((s) => ({ ...s, whatsappPhone: e.target.value }))}
            hint="Customers will message this number on your online store."
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Webhook Endpoint URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={settings.webhookUrl}
                className="w-full text-xs rounded-lg bg-surface-elevated border border-separator px-3 py-2 text-muted font-mono"
              />
              <Button variant="outline" size="sm" type="button" onClick={handleCopyWebhook} className="shrink-0">
                {copied ? <Check size={14} className="text-emerald-500 mr-1" /> : <Copy size={14} className="mr-1" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Instagram */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                <Camera className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Instagram Direct Messages</CardTitle>
                <CardDescription>Sync DMs and story replies into your central unified inbox.</CardDescription>
              </div>
            </div>
            <Switch
              checked={Boolean(settings.instagramConnected)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, instagramConnected: c }))}
              aria-label="Connect Instagram"
            />
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <FormField
            label="Instagram Handle"
            placeholder="e.g. @merchander_gh"
            value={settings.instagramHandle}
            onChange={(e) => setSettings((s) => ({ ...s, instagramHandle: e.target.value }))}
            hint="Your brand's public handle for DM routing."
          />
        </CardBody>
      </Card>

      {/* Facebook Messenger */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <MessageSquare className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Facebook Page Messenger</CardTitle>
                <CardDescription>Capture messages from your Facebook business page.</CardDescription>
              </div>
            </div>
            <Switch
              checked={Boolean(settings.messengerConnected)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, messengerConnected: c }))}
              aria-label="Connect Facebook Messenger"
            />
          </div>
        </CardHeader>
        <CardFooter className="justify-end">
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={14} className="animate-spin mr-2" />}
            <span>{isPending ? 'Saving...' : 'Save Connected Channels'}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
