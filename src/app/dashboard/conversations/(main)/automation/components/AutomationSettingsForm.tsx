'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import {
  Bot,
  MessageSquareReply,
  ShieldAlert,
  Plus,
  Trash2,
  Loader2,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { AutomationSettings, KeywordRule, AiAgentSettings } from '@/types/settings';
import { updateAutomationSettings } from '@/app/actions/settings-social';
import { toast } from 'sonner';

interface AutomationSettingsFormProps {
  initialSettings: AutomationSettings;
}

const DEFAULT_AI_AGENT: AiAgentSettings = {
  enabled: false,
  mode: 'assisted',
  responseTone: 'friendly',
  groundingEnabled: true,
  safetyTier: 'standard',
};

export function AutomationSettingsForm({ initialSettings }: AutomationSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const normalizedInitial = useMemo(
    () => ({
      ...initialSettings,
      aiAgent: {
        ...DEFAULT_AI_AGENT,
        ...(initialSettings.aiAgent || {}),
      },
    }),
    [initialSettings]
  );

  const [settings, setSettings] = useState<AutomationSettings>(normalizedInitial);
  const [savedSettings, setSavedSettings] = useState<AutomationSettings>(normalizedInitial);
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
      {/* 1. AI Intelligence & Conversational Agent Card */}
      <Card className="shadow-xs border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold font-display">AI Conversational Agent</CardTitle>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Intelligence Engine
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Social replies: under review
                  </span>
                </div>
                <CardDescription className="text-xs text-muted">
                  General intelligence summaries and staff-assisted workflows stay available. Social customer replies
                  are paused for privacy review and beta testing.
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={Boolean(settings.aiAgent?.enabled)}
              onCheckedChange={(c: boolean) =>
                setSettings((s) => ({
                  ...s,
                  aiAgent: {
                    ...(s.aiAgent || DEFAULT_AI_AGENT),
                    enabled: c,
                  },
                }))
              }
              aria-label="Enable AI conversational agent"
            />
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-0">
          {settings.aiAgent?.enabled ? (
            <>
              {/* Agent Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Operational Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        aiAgent: { ...(s.aiAgent || DEFAULT_AI_AGENT), mode: 'assisted' },
                      }))
                    }
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                      settings.aiAgent?.mode === 'assisted'
                        ? 'border-purple-500 bg-purple-500/10 shadow-xs ring-1 ring-purple-500'
                        : 'border-separator bg-surface hover:bg-surface-elevated'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Assisted (Copilot)</span>
                        {settings.aiAgent?.mode === 'assisted' && (
                          <CheckCircle2 size={14} className="text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted mt-1 leading-relaxed">
                        AI generates smart draft replies in staff chat. Human staff reviews and confirms before sending
                        to the customer.
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 mt-2">
                      Recommended for high-touch service
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        aiAgent: { ...(s.aiAgent || DEFAULT_AI_AGENT), mode: 'autonomous' },
                      }))
                    }
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                      settings.aiAgent?.mode === 'autonomous'
                        ? 'border-purple-500 bg-purple-500/10 shadow-xs ring-1 ring-purple-500'
                        : 'border-separator bg-surface hover:bg-surface-elevated'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Autonomous (Autopilot)</span>
                        {settings.aiAgent?.mode === 'autonomous' && (
                          <CheckCircle2 size={14} className="text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted mt-1 leading-relaxed">
                        AI immediately responds to customer product questions, availability inquiries, and order
                        tracking on WhatsApp.
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 mt-2">
                      Hands-off automated commerce
                    </span>
                  </button>
                </div>
              </div>

              {/* Catalog Grounding Toggle */}
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-separator bg-surface">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-foreground">Strict Catalog Grounding</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Hallucination Shield
                    </span>
                  </div>
                  <p className="text-[11px] text-muted">
                    Restricts responses strictly to verified in-stock inventory, prices, and specs in your database.
                  </p>
                </div>
                <Switch
                  checked={Boolean(settings.aiAgent?.groundingEnabled)}
                  onCheckedChange={(c: boolean) =>
                    setSettings((s) => ({
                      ...s,
                      aiAgent: { ...(s.aiAgent || DEFAULT_AI_AGENT), groundingEnabled: c },
                    }))
                  }
                  aria-label="Strict Catalog Grounding"
                />
              </div>

              {/* Tone & Safety Tier Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="ai-tone-select" className="text-xs font-semibold text-foreground">
                    Conversational Tone
                  </label>
                  <select
                    id="ai-tone-select"
                    value={settings.aiAgent?.responseTone || 'friendly'}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        aiAgent: {
                          ...(s.aiAgent || DEFAULT_AI_AGENT),
                          responseTone: e.target.value as 'friendly' | 'professional' | 'concise',
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="friendly">Friendly (Warm, welcoming, emoji-friendly)</option>
                    <option value="professional">Professional (Courteous, direct, business-like)</option>
                    <option value="concise">Concise (Fast, brief, bullet-point answers)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ai-safety-select" className="text-xs font-semibold text-foreground">
                    Human Escalation Safety Tier
                  </label>
                  <select
                    id="ai-safety-select"
                    value={settings.aiAgent?.safetyTier || 'standard'}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        aiAgent: {
                          ...(s.aiAgent || DEFAULT_AI_AGENT),
                          safetyTier: e.target.value as 'standard' | 'strict',
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="standard">Standard (Escalate on customer frustration or dispute)</option>
                    <option value="strict">Strict (Escalate on out-of-stock, discounts, or delivery delays)</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <div className="p-3.5 rounded-xl border border-dashed border-separator bg-surface-elevated/20 flex items-start gap-3 text-xs text-muted">
              <ShieldCheck size={16} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                When enabled, the AI agent connects with the intelligence service to read buyer inquiries, check live
                stock in your catalog, suggest or auto-reply to product questions, and hand off disputes to your human
                team.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 2. Welcome & Away Greetings Card */}
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
