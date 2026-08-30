'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Inbox, Clock, Loader2 } from 'lucide-react';
import { ConversationSettings } from '@/types/settings';
import { updateConversationSettings } from '@/app/actions/settings-social';
import { toast } from 'sonner';

interface ConversationsSettingsFormProps {
  initialSettings: ConversationSettings;
}

export function ConversationsSettingsForm({ initialSettings }: ConversationsSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateConversationSettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Conversation routing settings saved successfully');
      }
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Inbox className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Inbox Routing & Distribution</CardTitle>
              <CardDescription>Rules for assigning new conversations to your team.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Auto-assign to active staff</p>
              <p className="text-xs text-muted max-w-lg">
                Automatically distribute incoming chats to active staff members using round-robin.
              </p>
            </div>
            <Switch
              checked={settings.autoAssignStaff}
              onCheckedChange={(c) => setSettings((s) => ({ ...s, autoAssignStaff: c }))}
              aria-label="Auto-assign chats to staff"
            />
          </div>

          <div className="w-full h-px bg-separator/50" />

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Sticky Agent Routing</p>
              <p className="text-xs text-muted max-w-lg">
                If a customer messages again, assign them to the staff member who served them last.
              </p>
            </div>
            <Switch
              checked={settings.stickyRouting}
              onCheckedChange={(c) => setSettings((s) => ({ ...s, stickyRouting: c }))}
              aria-label="Enable sticky routing for returning customers"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Service Level Agreement (SLA Target)</CardTitle>
              <CardDescription>Track response time benchmarks across your support team.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2 mb-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Enable Response SLA Tracking</p>
            </div>
            <Switch
              checked={settings.enableSlaTracking}
              onCheckedChange={(c) => setSettings((s) => ({ ...s, enableSlaTracking: c }))}
              aria-label="Enable SLA Tracking"
            />
          </div>

          {settings.enableSlaTracking && (
            <div className="space-y-1.5">
              <label htmlFor="target-sla" className="text-xs font-semibold text-foreground">
                Target Response Time Window
              </label>
              <select
                id="target-sla"
                value={settings.targetSlaMinutes}
                onChange={(e) => setSettings((s) => ({ ...s, targetSlaMinutes: parseInt(e.target.value) || 30 }))}
                className="w-full max-w-sm rounded-lg border border-separator bg-surface px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value={5}>5 Minutes (Ultra Fast)</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={120}>2 Hours</option>
              </select>
            </div>
          )}
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={14} className="animate-spin mr-2" />}
            <span>{isPending ? 'Saving...' : 'Save Routing Preferences'}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
