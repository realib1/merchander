'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { updateUnifiedBusinessProfile } from '@/app/actions/settings-business';
import { BusinessProfileData } from '@/types/settings';
import { BusinessIdentityCard } from './BusinessIdentityCard';
import { BusinessContactCard } from './BusinessContactCard';
import { IntelligenceGroundingCard } from './IntelligenceGroundingCard';
import { BusinessVerificationCard } from './BusinessVerificationCard';
import { Check, Loader2, Save } from 'lucide-react';

interface BusinessFormProps {
  initialData: BusinessProfileData;
}

export function BusinessForm({ initialData }: BusinessFormProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<BusinessProfileData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(false);

  const updateSection = <K extends keyof BusinessProfileData>(section: K, updater: Partial<BusinessProfileData[K]>) => {
    setProfile((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...updater },
    }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile.identity.businessName.trim()) {
      toast.error('Business name is required');
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateUnifiedBusinessProfile(profile);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success('Business profile updated');
          setIsSaved(true);
          router.refresh();
          setTimeout(() => setIsSaved(false), 3000);
        }
      } catch (err) {
        console.error('Save error:', err);
        toast.error('Failed to save profile');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      {/* 1. Business Identity */}
      <BusinessIdentityCard
        data={profile.identity}
        onChange={(f, v) => updateSection('identity', { [f]: v })}
        disabled={isPending}
      />

      {/* 2. Contact & Location */}
      <BusinessContactCard
        data={profile.contact}
        onChange={(f, v) => updateSection('contact', { [f]: v })}
        disabled={isPending}
      />

      {/* 3. Information Used by Intelligence */}
      <IntelligenceGroundingCard
        data={profile.intelligence}
        onChange={(f, v) => updateSection('intelligence', { [f]: v })}
        disabled={isPending}
      />

      {/* 4. Business Verification */}
      <BusinessVerificationCard
        data={profile.verification}
        onChange={(f, v) => updateSection('verification', { [f]: v })}
        disabled={isPending}
      />

      {/* Bottom Save Bar */}
      <div className="sticky bottom-2 sm:bottom-4 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-surface/95 backdrop-blur-md border border-separator shadow-lg">
        <div className="flex items-center gap-2">
          {isSaved ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
              <Check size={15} />
              <span>All changes saved</span>
            </span>
          ) : (
            <span className="text-[11px] sm:text-xs text-muted">
              Remember to save your changes before leaving this page.
            </span>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={isPending}
          className="w-full sm:w-auto min-w-35 shadow-xs cursor-pointer justify-center"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={15} className="animate-spin" />
              <span>Saving...</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Save size={15} />
              <span>Save Changes</span>
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
