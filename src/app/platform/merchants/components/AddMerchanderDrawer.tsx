'use client';

import React, { useState, useTransition } from 'react';
import { Store, Loader2, AlertTriangle } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { PlatformPlan, PlatformTier, PlatformTenant } from '@/types/platform';
import { createMerchanderAction } from '@/app/actions/platform';
import {
  cleanSlug,
  validateMerchantSlug,
  validateOwnerEmail,
} from '@/utils/merchant-provisioning';
import { Archetype, ArchetypeConfig, CreatedCredentials } from './provisioning/types';
import { BusinessIdentitySection } from './provisioning/BusinessIdentitySection';
import { ArchetypeSection } from './provisioning/ArchetypeSection';
import { OwnerCredentialsSection } from './provisioning/OwnerCredentialsSection';
import { SubscriptionTierSection } from './provisioning/SubscriptionTierSection';
import { ProvisioningSuccessCard } from './provisioning/ProvisioningSuccessCard';

interface AddMerchanderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  plans: PlatformPlan[];
  onMerchantCreated: (newTenant: PlatformTenant) => void;
}

export function AddMerchanderDrawer({
  isOpen,
  onClose,
  plans,
  onMerchantCreated,
}: AddMerchanderDrawerProps) {
  const [isPending, startTransition] = useTransition();

  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugTouched, setIsSlugTouched] = useState(false);
  const [city, setCity] = useState('Accra');
  const [branchName, setBranchName] = useState('');

  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>('general');
  const [modules, setModules] = useState<Record<string, boolean>>({
    inventory: true,
    orders: true,
    pos: true,
    storefront: true,
  });

  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('+233 ');
  const [password, setPassword] = useState('');

  const [selectedTier, setSelectedTier] = useState<PlatformTier>('growth');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const [formError, setFormError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{
    tenantId: string;
    credentials: CreatedCredentials;
  } | null>(null);

  const handleNameChange = (val: string) => {
    setStoreName(val);
    if (!isSlugTouched) {
      setSlug(cleanSlug(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setIsSlugTouched(true);
    setSlug(cleanSlug(val));
  };

  const handleArchetypeSelect = (arch: ArchetypeConfig) => {
    setSelectedArchetype(arch.id);
    setModules(arch.modules);
    if (city === 'Accra' || city === 'Kumasi') {
      setCity(arch.defaultCity);
    }
  };

  const handleResetAndClose = () => {
    setStoreName('');
    setSlug('');
    setIsSlugTouched(false);
    setOwnerName('');
    setOwnerEmail('');
    setOwnerPhone('+233 ');
    setPassword('');
    setCreatedResult(null);
    setFormError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = storeName.trim();
    if (!cleanName) {
      setFormError('Store name is required.');
      return;
    }

    const currentSlug = slug.trim() || cleanSlug(cleanName);
    const slugCheck = validateMerchantSlug(currentSlug);
    if (!slugCheck.isValid) {
      setFormError(slugCheck.error || 'Invalid subdomain slug.');
      return;
    }

    const emailCheck = validateOwnerEmail(ownerEmail);
    if (!emailCheck.isValid) {
      setFormError(emailCheck.error || 'Please enter a valid owner email.');
      return;
    }

    startTransition(async () => {
      const res = await createMerchanderAction({
        name: cleanName,
        slug: currentSlug,
        ownerEmail: ownerEmail.trim().toLowerCase(),
        ownerName: ownerName.trim() || undefined,
        ownerPhone: ownerPhone.trim() || undefined,
        password: password.trim() || undefined,
        tier: selectedTier,
        billingCycle,
        businessType: selectedArchetype,
        enabledModules: modules,
        branchName: branchName.trim() || undefined,
        city: city.trim() || 'Accra',
      });

      if (!res.success || !res.tenantId || !res.credentials) {
        setFormError(res.error || 'Failed to provision merchant.');
        return;
      }

      setCreatedResult({
        tenantId: res.tenantId,
        credentials: res.credentials,
      });

      const newTenant: PlatformTenant = {
        id: res.tenantId,
        name: cleanName,
        slug: res.credentials.slug,
        email: ownerEmail.trim().toLowerCase(),
        phone: ownerPhone.trim(),
        country: 'GH',
        createdAt: new Date().toISOString(),
        status: 'active',
        stores: [
          {
            id: `store_${res.tenantId}`,
            name: branchName.trim() || `${cleanName} - Main Branch`,
            is_primary: true,
            location: city.trim() || 'Accra',
          },
        ],
        subscription: {
          tier: selectedTier,
          billingCycle,
          status: 'active',
          priceMonthly:
            selectedTier === 'enterprise' ? 1800 :
            selectedTier === 'business' ? 750 :
            selectedTier === 'growth' ? 350 :
            selectedTier === 'starter' ? 150 : 0,
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        productCount: 0,
        orderCount: 0,
        totalGmv: 0,
        connectedChannels: ['web_store'],
        lastActivityAt: new Date().toISOString(),
      };

      onMerchantCreated(newTenant);
    });
  };

  const footerActions = createdResult ? null : (
    <div className="flex items-center justify-end gap-2.5">
      <button
        type="button"
        onClick={handleResetAndClose}
        className="px-4 py-2 rounded-xl border border-separator text-muted hover:text-foreground hover:bg-surface transition cursor-pointer text-xs"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={handleSubmit}
        className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold bg-brand text-brand-foreground hover:bg-brand/90 transition shadow-xs disabled:opacity-50 cursor-pointer text-xs"
      >
        {isPending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Provisioning Workspace...</span>
          </>
        ) : (
          <>
            <Store size={14} />
            <span>Provision Merchander</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={createdResult ? 'Workspace Provisioned' : 'Add Merchander'}
      description={
        createdResult
          ? 'Merchant credentials and workspace initialized.'
          : 'Provision a new merchant workspace and owner credentials on demand.'
      }
      icon={
        <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center">
          <Store size={18} />
        </div>
      }
      size="lg"
      footer={footerActions}
    >
      {createdResult ? (
        <ProvisioningSuccessCard
          tenantId={createdResult.tenantId}
          credentials={createdResult.credentials}
          onDone={handleResetAndClose}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2 text-xs">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <BusinessIdentitySection
            storeName={storeName}
            slug={slug}
            city={city}
            branchName={branchName}
            onStoreNameChange={handleNameChange}
            onSlugChange={handleSlugChange}
            onCityChange={setCity}
            onBranchNameChange={setBranchName}
          />

          <ArchetypeSection
            selectedArchetype={selectedArchetype}
            onSelect={handleArchetypeSelect}
          />

          <OwnerCredentialsSection
            ownerName={ownerName}
            ownerEmail={ownerEmail}
            ownerPhone={ownerPhone}
            password={password}
            onOwnerNameChange={setOwnerName}
            onOwnerEmailChange={setOwnerEmail}
            onOwnerPhoneChange={setOwnerPhone}
            onPasswordChange={setPassword}
          />

          <SubscriptionTierSection
            selectedTier={selectedTier}
            billingCycle={billingCycle}
            plans={plans}
            onTierChange={setSelectedTier}
            onCycleChange={setBillingCycle}
          />
        </form>
      )}
    </Drawer>
  );
}
