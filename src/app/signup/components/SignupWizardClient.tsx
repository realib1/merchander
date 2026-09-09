'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  CircleAlert,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { selfServiceSignupAction } from '@/app/actions/signup';
import {
  ARCHETYPE_DEFINITIONS,
  MODULE_DEFINITIONS,
  validateStoreSlug,
} from '@/utils/business-modules';
import { BusinessArchetype, BusinessModuleKey } from '@/types/business-modules';

export function SignupWizardClient() {
  const router = useRouter();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [currency, setCurrency] = useState<string>('GHS');
  const [city, setCity] = useState<string>('Accra');
  const [archetype, setArchetype] = useState<BusinessArchetype>('import_resale');
  const [customModules, setCustomModules] = useState<BusinessModuleKey[]>([
    'storefront',
    'profitability',
    'intelligence',
  ]);

  // Handle store name change and auto-slug generation
  const handleStoreNameChange = (val: string) => {
    setStoreName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    setSlug(autoSlug);
  };

  const toggleCustomModule = (modKey: BusinessModuleKey) => {
    if (customModules.includes(modKey)) {
      setCustomModules(customModules.filter((k) => k !== modKey));
    } else {
      setCustomModules([...customModules, modKey]);
    }
  };

  // Step Validation
  const validateCurrentStep = (): boolean => {
    setFormError(null);

    if (currentStep === 1) {
      if (!fullName.trim()) {
        setFormError('Please enter your full name.');
        return false;
      }
      if (!email.trim() || !email.includes('@')) {
        setFormError('Please enter a valid business email.');
        return false;
      }
      if (!phone.trim()) {
        setFormError('Please enter your WhatsApp phone number.');
        return false;
      }
      if (!password || password.length < 8) {
        setFormError('Password must be at least 8 characters long.');
        return false;
      }
      return true;
    }

    if (currentStep === 2) {
      if (!storeName.trim()) {
        setFormError('Please enter your store or business name.');
        return false;
      }
      const slugValidation = validateStoreSlug(slug);
      if (!slugValidation.valid) {
        setFormError(slugValidation.error || 'Invalid store subdomain.');
        return false;
      }
      return true;
    }

    if (currentStep === 3) {
      if (archetype === 'custom' && customModules.length === 0) {
        setFormError('Please select at least one module for your custom setup.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setFormError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleLaunch = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await selfServiceSignupAction({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        storeName: storeName.trim(),
        slug: slug.trim().toLowerCase(),
        currency,
        city,
        archetype,
        customModules: archetype === 'custom' ? customModules : undefined,
      });

      if (!result.success) {
        setFormError(result.error || 'Failed to complete registration.');
        setIsSubmitting(false);
        return;
      }

      toast.success('Workspace created successfully! Redirecting...');
      router.push('/dashboard');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  const activeArchetypeDef = ARCHETYPE_DEFINITIONS[archetype];
  const activeModulesList =
    archetype === 'custom' ? customModules : activeArchetypeDef.defaultModules;

  return (
    <div className="w-full max-w-2xl mx-auto relative z-10">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image
            src="/merchander.png"
            alt="Merchander"
            width={48}
            height={48}
            className="drop-shadow-sm"
          />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">
          Start your merchant workspace
        </h1>
        <p className="mt-2 text-sm text-muted">
          Connect your sales, inventory, and supplier finances in one place.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="mb-8 px-4 sm:px-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-separator -z-0">
            <div
              className="h-full bg-brand-primary transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            />
          </div>

          {[
            { step: 1, label: 'Account' },
            { step: 2, label: 'Business' },
            { step: 3, label: 'Archetype' },
            { step: 4, label: 'Launch' },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center relative z-10 gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  item.step === currentStep
                    ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/30 ring-4 ring-brand-primary/20'
                    : item.step < currentStep
                    ? 'bg-brand-emerald text-white'
                    : 'bg-surface border border-separator text-muted'
                }`}
              >
                {item.step < currentStep ? <Check size={14} /> : item.step}
              </div>
              <span
                className={`text-[11px] font-medium transition-colors ${
                  item.step === currentStep ? 'text-foreground font-semibold' : 'text-muted'
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <div className="bg-surface rounded-2xl border border-separator shadow-xl p-6 sm:p-8">
        {formError && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm font-medium text-destructive flex items-start gap-2.5 animate-in fade-in">
            <CircleAlert size={16} className="mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* STEP 1: Account Credentials */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground">Create your owner account</h2>
              <p className="text-sm text-muted mt-1">
                Enter your details to register as the workspace owner.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ama Frimpong"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-separator bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Business Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ama@glamourhaven.store"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-separator bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                WhatsApp Phone Number
              </label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-2.5 text-sm font-medium text-muted bg-surface-elevated border border-r-0 border-separator rounded-l-xl">
                  +233
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="24 123 4567"
                  className="w-full px-3.5 py-2.5 text-sm rounded-r-xl border border-separator bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
                />
              </div>
              <p className="text-[11px] text-muted mt-1">
                Used for instant order alerts and automatic customer receipts.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-separator bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Business Profile */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground">Tell us about your business</h2>
              <p className="text-sm text-muted mt-1">
                We will set up your workspace and create your custom storefront URL.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Store or Trading Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => handleStoreNameChange(e.target.value)}
                placeholder="e.g. Glamour Haven Gh"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-separator bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Storefront Web Address (Subdomain)
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                  placeholder="glamour-haven"
                  className="w-full px-3.5 py-2.5 text-sm rounded-l-xl border border-r-0 border-separator bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
                />
                <span className="inline-flex items-center px-3 py-2.5 text-xs font-semibold text-muted bg-surface-elevated border border-separator rounded-r-xl whitespace-nowrap">
                  .merchander.store
                </span>
              </div>
              <p className="text-[11px] text-brand-primary font-mono mt-1">
                Preview: https://{slug || '[store]'}.merchander.store
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Primary Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-separator bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
                >
                  <option value="GHS">Ghana Cedi (GH₵ - GHS)</option>
                  <option value="USD">US Dollar ($ - USD)</option>
                  <option value="EUR">Euro (€ - EUR)</option>
                  <option value="GBP">British Pound (£ - GBP)</option>
                  <option value="NGN">Nigerian Naira (₦ - NGN)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Operational City
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-separator bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
                >
                  <option value="Accra">Greater Accra (Accra, Tema)</option>
                  <option value="Kumasi">Ashanti Region (Kumasi)</option>
                  <option value="Takoradi">Western Region (Takoradi)</option>
                  <option value="Tamale">Northern Region (Tamale)</option>
                  <option value="Other">Other / Nationwide</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Business Model Archetype Picker */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground">Select your business model</h2>
              <p className="text-sm text-muted mt-1">
                Choose the model that matches how you sell. We will activate the right tools for you.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(
                Object.keys(ARCHETYPE_DEFINITIONS) as BusinessArchetype[]
              ).map((key) => {
                const def = ARCHETYPE_DEFINITIONS[key];
                const isSelected = archetype === key;

                return (
                  <div
                    key={key}
                    onClick={() => setArchetype(key)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-primary bg-brand-primary/5 shadow-md shadow-brand-primary/10'
                        : 'border-separator bg-surface-elevated/40 hover:border-separator-hover'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{def.icon}</span>
                        {def.badge && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              def.badgeType === 'primary'
                                ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                                : def.badgeType === 'emerald'
                                ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20'
                                : def.badgeType === 'indigo'
                                ? 'bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20'
                                : 'bg-brand-amber/10 text-brand-amber border border-brand-amber/20'
                            }`}
                          >
                            {def.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-foreground">{def.name}</h3>
                      <p className="text-xs text-muted mt-1 leading-relaxed">{def.tagline}</p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-separator/60">
                      <ul className="space-y-1">
                        {def.highlights.slice(0, 2).map((h, i) => (
                          <li
                            key={i}
                            className="text-[11px] text-secondary flex items-center gap-1.5"
                          >
                            <Check size={12} className="text-brand-emerald shrink-0" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Module Checklist if "Custom" selected */}
            {archetype === 'custom' && (
              <div className="mt-4 p-4 rounded-xl bg-surface-elevated/60 border border-separator">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Select Your Custom Modules
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    Object.keys(MODULE_DEFINITIONS) as BusinessModuleKey[]
                  ).map((modKey) => {
                    const mod = MODULE_DEFINITIONS[modKey];
                    const isChecked = customModules.includes(modKey);

                    return (
                      <label
                        key={modKey}
                        className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-separator text-xs cursor-pointer hover:bg-surface-elevated"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCustomModule(modKey)}
                          className="rounded text-brand-primary focus:ring-brand-primary"
                        />
                        <span className="font-medium text-foreground">{mod.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Review & Launch */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Ready to launch your workspace
              </h2>
              <p className="text-sm text-muted mt-1">
                We configured your tools based on your business model. You can adjust modules
                anytime.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-elevated/70 border border-separator flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{activeArchetypeDef.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {activeArchetypeDef.name}
                  </h3>
                  <p className="text-xs text-brand-primary font-mono mt-0.5">
                    https://{slug}.merchander.store
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs font-medium text-muted hover:text-foreground px-2.5 py-1 rounded-lg border border-separator bg-surface"
              >
                Change
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2.5">
                Active Modules for Your Workspace
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(
                  Object.keys(MODULE_DEFINITIONS) as BusinessModuleKey[]
                ).map((modKey) => {
                  const mod = MODULE_DEFINITIONS[modKey];
                  const isEnabled = activeModulesList.includes(modKey);

                  return (
                    <div
                      key={modKey}
                      className={`p-3 rounded-xl border flex items-center gap-3 ${
                        isEnabled
                          ? 'bg-surface border-separator'
                          : 'bg-surface-elevated/30 border-separator/40 opacity-50'
                      }`}
                    >
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isEnabled ? 'bg-brand-emerald' : 'bg-muted'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-semibold text-foreground">{mod.name}</div>
                        <div className="text-[10px] text-muted">
                          {isEnabled ? 'Active in navigation' : 'Dormant (can enable later)'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 text-xs text-brand-emerald flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>
                <strong>14-Day Free Access:</strong> All features are unlocked with zero payment
                details required upfront.
              </span>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 pt-6 border-t border-separator flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-separator transition-all ${
              currentStep === 1
                ? 'invisible'
                : 'text-foreground hover:bg-surface-elevated cursor-pointer'
            }`}
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover shadow-md shadow-brand-primary/20 transition-all cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLaunch}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Setting up your store...</span>
                </>
              ) : (
                <>
                  <span>Launch Workspace</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Footer link to Login */}
      <p className="text-center text-xs text-muted mt-6">
        Already have a merchant workspace?{' '}
        <Link
          href="/login"
          className="font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors"
        >
          Sign in here
        </Link>
      </p>
    </div>
  );
}
