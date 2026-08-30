'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Bot, MessageSquareReply, ShieldAlert, Plus, Trash2, Loader2 } from 'lucide-react';
import { AutomationSettings, KeywordRule } from '@/types/settings';
import { updateAutomationSettings } from '@/app/actions/settings-social';
import { toast } from 'sonner';

interface AutomationSettingsFormProps {
  initialSettings: AutomationSettings;
}

export function AutomationSettingsForm({ initialSettings }: AutomationSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [newRuleName, setNewRuleName] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [newReply, setNewReply] = useState('');

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

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateAutomationSettings(settings);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Automation & bot messages saved successfully');
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Greetings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Welcome & Away Greetings</CardTitle>
                <CardDescription>Automated replies based on your store schedule.</CardDescription>
              </div>
            </div>
            <Switch
              checked={Boolean(settings.welcomeMessageEnabled)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, welcomeMessageEnabled: c }))}
              aria-label="Enable greetings"
            />
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <FormField
            label="Welcome Greeting"
            isTextarea
            rows={2}
            value={settings.welcomeGreeting}
            onChange={(e) => setSettings((s) => ({ ...s, welcomeGreeting: e.target.value }))}
            hint="Sent when a customer starts a new conversation."
          />

          <div className="w-full h-px bg-separator/50" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground">Enable Outside Business Hours (Away) Message</p>
            </div>
            <Switch
              checked={Boolean(settings.awayMessageEnabled)}
              onCheckedChange={(c: boolean) => setSettings((s) => ({ ...s, awayMessageEnabled: c }))}
              aria-label="Enable away message"
            />
          </div>

          {settings.awayMessageEnabled && (
            <FormField
              label="Away Message"
              isTextarea
              rows={2}
              value={settings.awayMessage}
              onChange={(e) => setSettings((s) => ({ ...s, awayMessage: e.target.value }))}
              hint="Sent automatically when customer messages outside your Business Hours."
            />
          )}
        </CardBody>
      </Card>

      {/* Keyword Auto-Replies */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <MessageSquareReply className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Keyword Auto-Replies</CardTitle>
              <CardDescription>Instantly reply to frequently asked questions.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="rounded-xl border border-separator overflow-hidden divide-y divide-separator/60">
            {settings.rules.map((rule) => (
              <div
                key={rule.id}
                className="p-3.5 bg-surface hover:bg-surface-elevated/40 transition-colors flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-foreground">{rule.name}</p>
                    <div className="flex flex-wrap gap-1">
                      {rule.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-1.5 py-0.2 rounded bg-surface-elevated border border-separator text-[10px] text-muted"
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

          {/* Add Rule Sub-card */}
          <div className="p-3.5 rounded-xl bg-surface-elevated border border-separator/80 space-y-3">
            <p className="text-xs font-bold text-foreground">Add Keyword Rule</p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Rule Name (e.g. Account Number)"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                className="w-full text-xs rounded-lg bg-surface border border-separator px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
              <input
                type="text"
                placeholder="Keywords separated by comma (e.g. bank, account number, pay to)"
                value={newKeywords}
                onChange={(e) => setNewKeywords(e.target.value)}
                className="w-full text-xs rounded-lg bg-surface border border-separator px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
              <textarea
                rows={2}
                placeholder="Automated Bot Response Text..."
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                className="w-full text-xs rounded-lg bg-surface border border-separator px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary resize-none"
              />
              <Button variant="outline" size="sm" type="button" onClick={handleAddRule}>
                <Plus size={14} className="mr-1" /> Add Rule
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Anti-Ban Safeguards */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Anti-Ban Safeguards</CardTitle>
              <CardDescription>Built-in protection for high-volume WhatsApp merchant accounts.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="p-4 bg-surface-elevated rounded-xl border border-separator text-xs text-muted leading-relaxed">
            Merchander automatically enforces messaging jitter delays (1.2s – 3.5s per message), human typing
            simulations, and exponential backoff retry algorithms to protect your WhatsApp Business number.
          </div>
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={14} className="animate-spin mr-2" />}
            <span>{isPending ? 'Saving...' : 'Save Automation Settings'}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
