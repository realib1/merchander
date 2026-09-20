'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { selfServiceSignupAction } from '@/app/actions/signup';
import { validateStoreSlug } from '@/utils/business-modules';
import { validateCredentialsStep } from '@/utils/signup-validation';
import { BusinessArchetype, BusinessModuleKey } from '@/types/business-modules';

const INITIAL_CUSTOM_MODULES: BusinessModuleKey[] = ['storefront', 'profitability', 'intelligence', 'cashflow'];

export function useSignupWizard() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [storeName, setStoreName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [currency, setCurrency] = useState<string>('GHS');
  const [city, setCity] = useState<string>('Accra');
  const [archetype, setArchetype] = useState<BusinessArchetype>('import_resale');
  const [customModules, setCustomModules] = useState<BusinessModuleKey[]>(INITIAL_CUSTOM_MODULES);

  const handleStoreNameChange = (val: string) => {
    setStoreName(val);
    setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40));
  };

  const toggleCustomModule = (modKey: BusinessModuleKey) => {
    setCustomModules((prev) => (prev.includes(modKey) ? prev.filter((k) => k !== modKey) : [...prev, modKey]));
  };

  const validateCurrentStep = (): boolean => {
    setFormError(null);
    if (currentStep === 1) {
      const v = validateCredentialsStep({ fullName, email, phone, password, confirmPassword, termsAccepted });
      if (!v.isValid) return (setFormError(v.error || 'Please complete all required fields.'), false);
    }
    if (currentStep === 2) {
      if (!storeName.trim()) return (setFormError('Please enter your store or business name.'), false);
      const slugV = validateStoreSlug(slug);
      if (!slugV.valid) return (setFormError(slugV.error || 'Invalid store subdomain.'), false);
    }
    if (currentStep === 3 && archetype === 'custom' && customModules.length === 0) {
      return (setFormError('Please select at least one module for your custom setup.'), false);
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setFormError(null);
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
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

  return {
    currentStep,
    setCurrentStep,
    isSubmitting,
    showPassword,
    setShowPassword,
    formError,
    fullName,
    setFullName,
    email,
    setEmail,
    phone,
    setPhone,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    termsAccepted,
    setTermsAccepted,
    storeName,
    handleStoreNameChange,
    slug,
    setSlug,
    currency,
    setCurrency,
    city,
    setCity,
    archetype,
    setArchetype,
    customModules,
    toggleCustomModule,
    handleNext,
    handleBack,
    handleLaunch,
  };
}
