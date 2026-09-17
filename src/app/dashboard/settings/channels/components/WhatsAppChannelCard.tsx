'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Switch } from '@/components/ui/Switch';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { MessageCircle, Copy, Check } from 'lucide-react';
import { WhatsAppChannelConfig } from '@/types/settings';
import { toast } from 'sonner';

interface WhatsAppChannelCardProps {
  config: WhatsAppChannelConfig;
  webhookUrl: string;
  runtimeConnected?: boolean;
  onChange: (updated: WhatsAppChannelConfig) => void;
  disabled?: boolean;
}

export function WhatsAppChannelCard({
  config,
  webhookUrl,
  runtimeConnected,
  onChange,
  disabled = false,
}: WhatsAppChannelCardProps) {
  const [copied, setCopied] = useState(false);
  const isConnected = runtimeConnected ?? config.connected;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success('Webhook URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold font-display">WhatsApp Business</CardTitle>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    isConnected
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-surface-elevated text-muted'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-muted'}`} />
                  {isConnected ? 'Runtime connected' : 'Not connected'}
                </span>
              </div>
              <CardDescription className="text-xs text-muted truncate">
                Direct customer messaging, floating store chat, and automated order sync.
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={config.connected}
            onCheckedChange={(c) => onChange({ ...config, connected: c })}
            disabled={disabled}
            aria-label="Activate WhatsApp"
          />
        </div>
      </CardHeader>

      <CardBody className="space-y-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            name="whatsappPhone"
            label="WhatsApp Business Phone Number"
            type="tel"
            placeholder="e.g. +233 24 123 4567"
            value={config.phoneNumber}
            onChange={(e) => onChange({ ...config, phoneNumber: e.target.value })}
            hint="Include country code (e.g. +233 for Ghana)."
            disabled={disabled}
          />

          <div className="space-y-1.5">
            <label htmlFor="waConnectionType" className="text-xs font-semibold text-foreground">
              Integration Mode
            </label>
            <select
              id="waConnectionType"
              value={config.connectionType || 'direct_link'}
              onChange={(e) =>
                onChange({
                  ...config,
                  connectionType: e.target.value as 'cloud_api' | 'direct_link',
                })
              }
              disabled={disabled}
              className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 cursor-pointer"
            >
              <option value="direct_link">Direct Storefront Link (Instant Setup)</option>
              <option value="cloud_api">Meta WhatsApp Cloud API (Two-Way Sync)</option>
            </select>
            <p className="text-[11px] text-muted">Choose your preferred WhatsApp integration approach.</p>
          </div>
        </div>

        {config.connectionType === 'cloud_api' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-separator bg-surface-elevated/40 animate-fadeIn">
            <FormField
              name="waPhoneId"
              label="Phone Number ID"
              placeholder="e.g. 104928374928174"
              value={config.phoneNumberId || ''}
              onChange={(e) => onChange({ ...config, phoneNumberId: e.target.value })}
              disabled={disabled}
            />
            <FormField
              name="waAccessToken"
              label="Cloud API Access Token"
              type="password"
              placeholder="Token from Meta Business settings"
              value={config.apiKeyOrToken || ''}
              onChange={(e) => onChange({ ...config, apiKeyOrToken: e.target.value })}
              disabled={disabled}
            />
            <FormField
              name="waVerifyToken"
              label="Webhook Verification Token"
              placeholder="e.g. merchander_wa_secret"
              value={config.webhookVerifyToken || ''}
              onChange={(e) => onChange({ ...config, webhookVerifyToken: e.target.value })}
              disabled={disabled}
            />
          </div>
        )}

        {/* Storefront Floating Button Settings */}
        <div className="p-3.5 rounded-xl border border-separator bg-surface-elevated/40 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-foreground">Storefront Floating Chat Button</p>
              <p className="text-[11px] text-muted">Show a quick WhatsApp chat button on your online storefront.</p>
            </div>
            <Checkbox
              checked={config.enableFloatingStorefrontWidget}
              onCheckedChange={(c) => onChange({ ...config, enableFloatingStorefrontWidget: c })}
              disabled={disabled}
              aria-label="Toggle floating WhatsApp button"
            />
          </div>

          {config.enableFloatingStorefrontWidget && (
            <FormField
              name="waGreeting"
              label="Pre-filled Customer Greeting"
              placeholder="e.g. Hello! I would like to make an inquiry."
              value={config.widgetGreeting || ''}
              onChange={(e) => onChange({ ...config, widgetGreeting: e.target.value })}
              disabled={disabled}
            />
          )}
        </div>

        {/* Webhook URL Endpoint */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Webhook Endpoint URL</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="w-full text-xs rounded-xl bg-surface-elevated border border-separator px-3 py-2 text-muted font-mono"
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleCopyWebhook}
              className="shrink-0 cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-500 mr-1" /> : <Copy size={14} className="mr-1" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
