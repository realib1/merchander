'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Inbox, Clock, Loader2, Save, RotateCcw } from 'lucide-react';
import { ConversationSettings } from '@/types/settings';
import { updateConversationSettings } from '@/app/actions/settings-social';
import { toast } from 'sonner';

interface ConversationsSettingsFormProps {
  initialSettings: ConversationSettings;
}

export function ConversationsSettingsForm({ initialSettings }: ConversationsSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [savedSettings, setSavedSettings] = useState(initialSettings);

  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(savedSettings);
  }, [settings, savedSettings]);

  const handleReset = () => {
    setSettings(savedSettings);
    toast.info('Changes reverted');
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateConversationSettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        setSavedSettings(settings);
        toast.success('Conversation routing settings saved successfully');
      }
    });
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* 1. Inbox Routing Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Inbox className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Inbox Routing & Distribution</CardTitle>
              <CardDescription className="text-xs text-muted">
                Rules for assigning incoming social chats to available staff members.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Auto-assign to Active Staff</p>
              <p className="text-[11px] text-muted">
                Automatically distribute incoming chats to active staff members using round-robin.
              </p>
            </div>
            <Switch
              checked={settings.autoAssignStaff}
              onCheckedChange={(c) => setSettings((s) => ({ ...s, autoAssignStaff: c }))}
              aria-label="Auto-assign chats to staff"
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Sticky Agent Routing</p>
              <p className="text-[11px] text-muted">
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

      {/* 2. SLA Tracking Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Response SLA Target</CardTitle>
              <CardDescription className="text-xs text-muted">
                Track response time benchmarks across your support and sales team.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Enable Response SLA Tracking</p>
              <p className="text-[11px] text-muted">
                Highlights unanswered customer conversations that exceed the target threshold.
              </p>
            </div>
            <Switch
              checked={settings.enableSlaTracking}
              onCheckedChange={(c) => setSettings((s) => ({ ...s, enableSlaTracking: c }))}
              aria-label="Enable SLA Tracking"
            />
          </div>

          {settings.enableSlaTracking && (
            <div className="p-3.5 rounded-xl border border-separator bg-surface-elevated/20 space-y-1.5">
              <label htmlFor="target-sla" className="text-xs font-semibold text-foreground">
                Target Response Time Window
              </label>
              <select
                id="target-sla"
                value={settings.targetSlaMinutes}
                onChange={(e) => setSettings((s) => ({ ...s, targetSlaMinutes: parseInt(e.target.value) || 30 }))}
                className="w-full max-w-sm rounded-xl border border-separator bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
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
      </Card>

      {/* Sticky Bottom Save Bar */}
      {isDirty && (
        <div className="fixed sm:sticky bottom-4 left-4 right-4 sm:left-auto sm:right-auto z-40 bg-surface-elevated/95 backdrop-blur-md border border-separator shadow-lg rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-slideUp">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs font-semibold text-foreground">You have unsaved conversation settings</span>
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
              <span>{isPending ? 'Saving...' : 'Save Preferences'}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
