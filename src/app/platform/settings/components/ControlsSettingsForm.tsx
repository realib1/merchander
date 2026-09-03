'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { toast } from 'sonner';
import { updatePlatformSettingsAction } from '@/app/actions/platform-settings';
import { PlatformSettings } from '@/types/platform';
import { Check, Loader2, Save } from 'lucide-react';

interface ControlsSettingsFormProps {
  initialData: PlatformSettings;
}

export function ControlsSettingsForm({ initialData }: ControlsSettingsFormProps) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    maintenance_mode: initialData.maintenance_mode || false,
    disable_new_signups: initialData.disable_new_signups || false,
  });
  
  const [isPending, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const res = await updatePlatformSettingsAction(formData);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success('Master controls updated');
          setIsSaved(true);
          router.refresh();
          setTimeout(() => setIsSaved(false), 3000);
        }
      } catch (err) {
        console.error('Save error:', err);
        toast.error('Failed to save controls');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 animate-fadeIn">
      <div className="bg-surface border border-red-500/30 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-red-500/20 bg-red-500/5">
          <h2 className="font-semibold text-red-600 text-sm">Master Controls</h2>
          <p className="text-xs text-red-600/80 mt-0.5">Critical platform-wide toggles. Handle with care.</p>
        </div>
        
        <div className="p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground">
                Maintenance Mode
              </label>
              <p className="text-xs text-muted mt-1 max-w-lg">
                Displays a maintenance screen to all merchants and suspends background workers. Only Platform Staff can bypass.
              </p>
            </div>
            <Switch
              checked={formData.maintenance_mode}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, maintenance_mode: checked }))}
            />
          </div>

          <div className="h-px bg-separator/50" />

          <div className="flex items-center justify-between gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground">
                Disable New Signups
              </label>
              <p className="text-xs text-muted mt-1 max-w-lg">
                Prevents new merchants from registering. Existing merchants can still log in and operate.
              </p>
            </div>
            <Switch
              checked={formData.disable_new_signups}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, disable_new_signups: checked }))}
            />
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
