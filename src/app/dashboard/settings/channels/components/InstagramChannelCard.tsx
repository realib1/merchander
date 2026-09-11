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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Planned / In Development
                </span>
              </div>
              <CardDescription className="text-xs text-muted">
                Public profile handle displayed on storefront. Meta Graph API DM sync is currently in development.
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={false}
            disabled={true}
            aria-label="Connect Instagram (in development)"
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
            hint="Your public brand handle. Displayed in your online store header and footer."
            disabled={disabled}
          />
          <FormField
            name="instagramPageId"
            label="Meta Page / Account ID (Optional)"
            placeholder="e.g. 1928374829"
            value={config.pageId || ''}
            onChange={(e) => onChange({ ...config, pageId: e.target.value })}
            hint="Associated Facebook page for future Meta Graph API synchronization."
            disabled={disabled}
          />
        </div>

        {/* Sync Preferences */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">Sync Preferences</label>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              Scheduled on product roadmap
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 opacity-75">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-separator bg-surface text-muted cursor-not-allowed text-xs font-medium">
              <Checkbox
                checked={false}
                disabled={true}
                aria-label="Sync Direct Messages (in development)"
              />
              <span>Sync Direct Messages (DMs)</span>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-separator bg-surface text-muted cursor-not-allowed text-xs font-medium">
              <Checkbox
                checked={false}
                disabled={true}
                aria-label="Sync Story Mentions (in development)"
              />
              <span>Sync Story Mentions & Shares</span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
