'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { updatePlatformSettingsAction } from '@/app/actions/platform-settings';
import { PlatformSettings } from '@/types/platform';
import { Check, Loader2, Save } from 'lucide-react';

interface GeneralSettingsFormProps {
  initialData: PlatformSettings;
}

export function GeneralSettingsForm({ initialData }: GeneralSettingsFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    platform_name: initialData.platform_name || '',
    support_email: initialData.support_email || '',
    default_currency: initialData.default_currency || 'GHS',
  });
  const [isPending, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.platform_name.trim()) {
      toast.error('Platform name is required');
      return;
    }

    startTransition(async () => {
      try {
        const res = await updatePlatformSettingsAction(formData);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success('Platform general settings updated');
          setIsSaved(true);
          router.refresh();
          setTimeout(() => setIsSaved(false), 3000);
        }
      } catch (err) {
        console.error('Save error:', err);
        toast.error('Failed to save settings');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 animate-fadeIn">
      <div className="bg-surface border border-separator/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-separator/80 bg-surface/50">
          <h2 className="font-semibold text-foreground text-sm">Platform Information</h2>
          <p className="text-xs text-muted mt-0.5">Basic details about the platform displayed to merchants.</p>
        </div>
        
        <div className="p-5 sm:p-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="platform_name" className="text-xs font-semibold text-foreground">
              Platform Name
            </label>
            <input
              id="platform_name"
              type="text"
              value={formData.platform_name}
              onChange={(e) => setFormData(prev => ({ ...prev, platform_name: e.target.value }))}
              placeholder="e.g., Merchander"
              className="w-full sm:max-w-md px-3 py-2 text-sm bg-surface border border-separator/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="support_email" className="text-xs font-semibold text-foreground">
              Global Support Email
            </label>
            <input
              id="support_email"
              type="email"
              value={formData.support_email}
              onChange={(e) => setFormData(prev => ({ ...prev, support_email: e.target.value }))}
              placeholder="support@example.com"
              className="w-full sm:max-w-md px-3 py-2 text-sm bg-surface border border-separator/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="default_currency" className="text-xs font-semibold text-foreground">
              Default Currency
            </label>
            <input
              id="default_currency"
              type="text"
              value={formData.default_currency}
              onChange={(e) => setFormData(prev => ({ ...prev, default_currency: e.target.value.toUpperCase() }))}
              maxLength={3}
              placeholder="GHS"
              className="w-24 px-3 py-2 text-sm bg-surface border border-separator/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-foreground"
            />
            <p className="text-[11px] text-muted">Three-letter ISO code (e.g. GHS, USD)</p>
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
