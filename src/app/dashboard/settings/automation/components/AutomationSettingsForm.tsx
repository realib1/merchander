'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Bot, MessageSquareReply, ShieldAlert, Plus, Trash2, Loader2, Save, RotateCcw } from 'lucide-react';
import { AutomationSettings, KeywordRule } from '@/types/settings';
import { updateAutomationSettings } from '@/app/actions/settings-social';
import { toast } from 'sonner';

interface AutomationSettingsFormProps {
  initialSettings: AutomationSettings;
}

export function AutomationSettingsForm({ initialSettings }: AutomationSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [savedSettings, setSavedSettings] = useState(initialSettings);
  const [newRuleName, setNewRuleName] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [newReply, setNewReply] = useState('');

  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(savedSettings);
  }, [settings, savedSettings]);

  const handleAddRule = () => {
    if (!newRuleName.trim() || !newKeywords.trim() || !newReply.trim()) {
      toast.error('Please fill in rule name, keywords, and automated reply');
      return;
    }

    const keywordsArray = newKeywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const rule: KeywordRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      keywords: keywordsArray,
      replyText: newReply.trim(),
      isActive: true,
    };

    setSettings((prev) => ({ ...prev, rules: [...prev.rules, rule] }));
    setNewRuleName('');
    setNewKeywords('');
    setNewReply('');
    toast.success('Keyword rule added');
  };

  const handleRemoveRule = (id: string) => {
    setSettings((prev) => ({ ...prev, rules: prev.rules.filter((r) => r.id !== id) }));
  };

  const handleToggleRule = (id: string, isActive: boolean) => {
    setSettings((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === id ? { ...r, isActive } : r)),
    }));
  };

  const handleReset = () => {
    setSettings(savedSettings);
    toast.info('Changes reverted');
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateAutomationSettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        setSavedSettings(settings);
        toast.success('Automation settings saved successfully');
      }
    });
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* 1. Welcome & Away Greetings Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-display">Welcome & Away Greetings</CardTitle>
                <CardDescription className="text-xs text-muted">
                  Automated customer replies based on your store operating schedule.
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={Boolean(settings.welcomeMessageEnabled)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, welcomeMessageEnabled: c }))}
              aria-label="Enable greetings"
            />
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
          <FormField
            label="Welcome Greeting Message"
            isTextarea
            rows={2}
            value={settings.welcomeGreeting}
            onChange={(e) => setSettings((s) => ({ ...s, welcomeGreeting: e.target.value }))}
            hint="Sent automatically when a customer opens a new conversation."
            disabled={isPending || !settings.welcomeMessageEnabled}
          />

          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface-elevated/30">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Outside Business Hours (Away) Message</p>
              <p className="text-[11px] text-muted">
                Sent automatically when a customer messages outside your configured Business Hours.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.awayMessageEnabled)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, awayMessageEnabled: c }))}
              aria-label="Enable away message"
            />
          </div>

          {settings.awayMessageEnabled && (
            <FormField
              label="Away Message Text"
              isTextarea
              rows={2}
              value={settings.awayMessage}
              onChange={(e) => setSettings((s) => ({ ...s, awayMessage: e.target.value }))}
              hint="Let customers know when you'll be back online to serve them."
              disabled={isPending}
            />
          )}
        </CardBody>
      </Card>

      {/* 2. Keyword Auto-Replies Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <MessageSquareReply className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Keyword Auto-Replies</CardTitle>
              <CardDescription className="text-xs text-muted">
                Instantly reply to frequently asked questions when matching words are detected.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
          {settings.rules.length > 0 ? (
            <div className="rounded-xl border border-separator overflow-hidden divide-y">
              {settings.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3.5 bg-surface hover:bg-surface-elevated/40 transition-colors flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-foreground">{rule.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {rule.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="px-1.5 py-0.5 rounded bg-surface-elevated border border-separator text-[10px] text-muted font-mono"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted mt-1 leading-relaxed">{rule.replyText}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={Boolean(rule.isActive)}
                      onCheckedChange={(c: boolean) => handleToggleRule(rule.id, c)}
                      aria-label={`Enable ${rule.name}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(rule.id)}
                      className="p-1 text-muted hover:text-destructive transition-colors cursor-pointer"
                      title="Delete Rule"
                      aria-label={`Delete ${rule.name} rule`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-separator bg-surface-elevated/20 text-center text-xs text-muted">
              No keyword auto-replies configured yet. Use the form below to add your first automated response trigger.
            </div>
          )}

          {/* Add Rule Form */}
          <div className="p-3.5 rounded-xl bg-surface-elevated border border-separator/80 space-y-3">
            <p className="text-xs font-bold text-foreground">Add Keyword Rule</p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Rule Name (e.g. Bank Account Number)"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                className="w-full text-xs rounded-xl bg-surface border border-separator px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
              <input
                type="text"
                placeholder="Keywords separated by comma (e.g. bank, account, momo number, pay to)"
                value={newKeywords}
                onChange={(e) => setNewKeywords(e.target.value)}
                className="w-full text-xs rounded-xl bg-surface border border-separator px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
              <textarea
                rows={2}
                placeholder="Automated reply message text..."
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                className="w-full text-xs rounded-xl bg-surface border border-separator px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary resize-none"
              />
              <Button variant="outline" size="sm" type="button" onClick={handleAddRule} className="cursor-pointer">
                <Plus size={14} className="mr-1" /> Add Rule
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 3. Anti-Ban Safeguards Info Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Anti-Ban Safeguards</CardTitle>
              <CardDescription className="text-xs text-muted">
                Built-in protection for high-volume WhatsApp merchant accounts.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="p-3.5 bg-surface-elevated/40 rounded-xl border border-separator text-xs text-muted leading-relaxed">
            Merchander automatically enforces messaging jitter delays (1.2s – 3.5s per message), human typing
            simulations, and exponential backoff retry algorithms to protect your connected channels from spam flags.
          </div>
        </CardBody>
      </Card>

      {/* Sticky Bottom Save Bar */}
      {isDirty && (
        <div className="fixed sm:sticky bottom-4 left-4 right-4 sm:left-auto sm:right-auto z-40 bg-surface-elevated/95 backdrop-blur-md border border-separator shadow-lg rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-slideUp">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs font-semibold text-foreground">You have unsaved automation settings</span>
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
