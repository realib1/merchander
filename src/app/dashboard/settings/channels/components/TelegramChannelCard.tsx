'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Switch } from '@/components/ui/Switch';
import { Checkbox } from '@/components/ui/Checkbox';
import { Send } from 'lucide-react';
import { TelegramChannelConfig } from '@/types/settings';

interface TelegramChannelCardProps {
  config: TelegramChannelConfig;
  onChange: (updated: TelegramChannelConfig) => void;
  disabled?: boolean;
}

export function TelegramChannelCard({ config, onChange, disabled = false }: TelegramChannelCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 shrink-0">
              <Send className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold font-display">Telegram Bot & Alerts</CardTitle>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  title="Telegram bot webhook and order intake are in Developer Preview"
                >
                  Developer Preview
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    config.connected ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'bg-surface-elevated text-muted'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${config.connected ? 'bg-sky-500' : 'bg-muted'}`} />
                  {config.connected ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <CardDescription className="text-xs text-muted truncate">
                Instant order notifications, customer bots, and broadcast alerts.
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={config.connected}
            onCheckedChange={(c) => onChange({ ...config, connected: c })}
            disabled={disabled}
            aria-label="Connect Telegram"
          />
        </div>
      </CardHeader>

      <CardBody className="space-y-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            name="telegramBotUsername"
            label="Telegram Bot Username"
            placeholder="e.g. @merchander_order_bot"
            value={config.botUsername || ''}
            onChange={(e) => onChange({ ...config, botUsername: e.target.value })}
            hint="Your Telegram bot handle created via @BotFather."
            disabled={disabled}
          />
          <FormField
            name="telegramChatId"
            label="Staff Channel / Group Chat ID (Optional)"
            placeholder="e.g. -1001928374829"
            value={config.channelChatId || ''}
            onChange={(e) => onChange({ ...config, channelChatId: e.target.value })}
            hint="For forwarding alerts to a private staff Telegram group."
            disabled={disabled}
          />
        </div>

        <div
          onClick={() => onChange({ ...config, orderNotificationAlerts: !config.orderNotificationAlerts })}
          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
            config.orderNotificationAlerts
              ? 'border-brand-primary bg-brand-primary/5 text-foreground'
              : 'border-separator bg-surface text-muted hover:text-foreground'
          }`}
        >
          <Checkbox
            checked={config.orderNotificationAlerts}
            onCheckedChange={(c) => onChange({ ...config, orderNotificationAlerts: c })}
            disabled={disabled}
            aria-label="Send instant Telegram order alerts"
          />
          <span>Send instant Telegram alerts when new orders are placed</span>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-elevated/40 border border-separator text-xs text-muted">
          <p className="text-[11px] leading-relaxed">
            <strong className="text-foreground">Developer Preview Note:</strong> Inbound Telegram messages currently run intent extraction through the intelligence engine. Automated order creation and outbound notification dispatch are staged for an upcoming release.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
