'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { updatePlatformSettingsAction } from '@/app/actions/platform-settings';
import { PlatformSettings } from '@/types/platform';
import { Check, Loader2, Save } from 'lucide-react';

interface IntegrationsSettingsFormProps {
  initialData: PlatformSettings;
}

export function IntegrationsSettingsForm({ initialData }: IntegrationsSettingsFormProps) {
  const router = useRouter();
  
  // Start with whatever is in the JSONB, or defaults
  const [integrations, setIntegrations] = useState<Record<string, string>>(
    (initialData.integrations as Record<string, string>) || {}
  );
  
  const [isPending, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(false);

  const updateIntegration = (key: string, value: string) => {
    setIntegrations(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const res = await updatePlatformSettingsAction({ integrations });
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success('Integrations updated');
          setIsSaved(true);
          router.refresh();
          setTimeout(() => setIsSaved(false), 3000);
        }
      } catch (err) {
        console.error('Save error:', err);
        toast.error('Failed to save integrations');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 animate-fadeIn">
      <div className="bg-surface border border-separator/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-separator/80 bg-surface/50">
          <h2 className="font-semibold text-foreground text-sm">Platform Integrations</h2>
          <p className="text-xs text-muted mt-0.5">Manage API keys and webhooks for global platform services.</p>
        </div>
        
        <div className="p-5 sm:p-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="openai_api_key" className="text-xs font-semibold text-foreground">
              OpenAI API Key
            </label>
            <input
              id="openai_api_key"
              type="password"
              value={integrations.openai_api_key || ''}
              onChange={(e) => updateIntegration('openai_api_key', e.target.value)}
              placeholder="sk-..."
              className="w-full sm:max-w-md px-3 py-2 text-sm bg-surface border border-separator/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-foreground"
            />
            <p className="text-[11px] text-muted">Used by Merchander Intelligence for text reasoning.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="slack_webhook_url" className="text-xs font-semibold text-foreground">
              Internal Slack Webhook URL
            </label>
            <input
              id="slack_webhook_url"
              type="password"
              value={integrations.slack_webhook_url || ''}
              onChange={(e) => updateIntegration('slack_webhook_url', e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full sm:max-w-md px-3 py-2 text-sm bg-surface border border-separator/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-foreground"
            />
            <p className="text-[11px] text-muted">Used for critical system alerts and new signups.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          type="submit" 
          disabled={isPending}
          className="min-w-[120px] transition-all"
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : isSaved ? (
            <Check size={16} className="mr-2" />
          ) : (
            <Save size={16} className="mr-2" />
          )}
          {isPending ? 'Saving...' : isSaved ? 'Saved' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
