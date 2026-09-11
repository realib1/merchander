'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Switch } from '@/components/ui/Switch';
import { Checkbox } from '@/components/ui/Checkbox';
import { MessageSquare } from 'lucide-react';
import { MessengerChannelConfig } from '@/types/settings';

interface MessengerChannelCardProps {
  config: MessengerChannelConfig;
  onChange: (updated: MessengerChannelConfig) => void;
  disabled?: boolean;
}

export function MessengerChannelCard({ config, onChange, disabled = false }: MessengerChannelCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
              <MessageSquare className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold font-display">Facebook Messenger</CardTitle>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Planned / In Development
                </span>
              </div>
              <CardDescription className="text-xs text-muted">
                Facebook Messenger webhook and inbox synchronization is currently in development.
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={false}
            disabled={true}
            aria-label="Connect Facebook Messenger (in development)"
          />
        </div>
      </CardHeader>

      <CardBody className="space-y-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            name="messengerPageId"
            label="Facebook Page ID"
            placeholder="e.g. 1092837461928"
            value={config.pageId}
            onChange={(e) => onChange({ ...config, pageId: e.target.value })}
            hint="Your Facebook Business Page numeric ID (saved for future Meta sync)."
            disabled={disabled}
          />
          <FormField
            name="messengerPageName"
            label="Page Display Name (Optional)"
            placeholder="e.g. Merchander Official"
            value={config.pageName || ''}
            onChange={(e) => onChange({ ...config, pageName: e.target.value })}
            hint="Display name for staff agent routing."
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-separator bg-surface text-muted opacity-75 cursor-not-allowed text-xs font-medium">
            <Checkbox
              checked={false}
              disabled={true}
              aria-label="Sync Messenger Conversations (in development)"
            />
            <span>Sync Messenger chats into unified inbox</span>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            Meta webhook integration is scheduled for an upcoming release.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
