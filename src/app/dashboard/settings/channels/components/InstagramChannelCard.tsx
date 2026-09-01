'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Switch } from '@/components/ui/Switch';
import { Checkbox } from '@/components/ui/Checkbox';
import { Camera } from 'lucide-react';
import { InstagramChannelConfig } from '@/types/settings';

interface InstagramChannelCardProps {
  config: InstagramChannelConfig;
  onChange: (updated: InstagramChannelConfig) => void;
  disabled?: boolean;
}

export function InstagramChannelCard({ config, onChange, disabled = false }: InstagramChannelCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500 shrink-0">
              <Camera className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold font-display">Instagram Direct</CardTitle>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    config.connected
                      ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
                      : 'bg-surface-elevated text-muted'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${config.connected ? 'bg-pink-500' : 'bg-muted'}`} />
                  {config.connected ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <CardDescription className="text-xs text-muted truncate">
                Sync customer DMs and story replies into your unified inbox.
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={config.connected}
            onCheckedChange={(c) => onChange({ ...config, connected: c })}
            disabled={disabled}
            aria-label="Connect Instagram"
          />
        </div>
      </CardHeader>

      <CardBody className="space-y-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            name="instagramHandle"
            label="Instagram Handle"
            placeholder="e.g. @merchander_gh"
            value={config.handle}
            onChange={(e) => onChange({ ...config, handle: e.target.value })}
            hint="Your public brand handle for DM routing."
            disabled={disabled}
          />
          <FormField
            name="instagramPageId"
            label="Meta Page / Account ID (Optional)"
            placeholder="e.g. 1928374829"
            value={config.pageId || ''}
            onChange={(e) => onChange({ ...config, pageId: e.target.value })}
            hint="Associated Facebook page for Instagram Graph API."
            disabled={disabled}
          />
        </div>

        {/* Sync Preferences */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-semibold text-foreground">Sync Preferences</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              onClick={() => onChange({ ...config, syncDirectMessages: !config.syncDirectMessages })}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                config.syncDirectMessages
                  ? 'border-brand-primary bg-brand-primary/5 text-foreground'
                  : 'border-separator bg-surface text-muted hover:text-foreground'
              }`}
            >
              <Checkbox
                checked={config.syncDirectMessages}
                onCheckedChange={(c) => onChange({ ...config, syncDirectMessages: c })}
                disabled={disabled}
                aria-label="Sync Direct Messages"
              />
              <span>Sync Direct Messages (DMs)</span>
            </div>

            <div
              onClick={() => onChange({ ...config, syncStoryMentions: !config.syncStoryMentions })}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                config.syncStoryMentions
                  ? 'border-brand-primary bg-brand-primary/5 text-foreground'
                  : 'border-separator bg-surface text-muted hover:text-foreground'
              }`}
            >
              <Checkbox
                checked={config.syncStoryMentions}
                onCheckedChange={(c) => onChange({ ...config, syncStoryMentions: c })}
                disabled={disabled}
                aria-label="Sync Story Mentions"
              />
              <span>Sync Story Mentions & Shares</span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
