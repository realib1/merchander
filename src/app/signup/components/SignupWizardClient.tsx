'use client';

import React from 'react';
import Link from 'next/link';
import { CircleAlert } from 'lucide-react';
import { useSignupWizard } from './useSignupWizard';
import { SignupProgressHeader } from './SignupProgressHeader';
import { StepAccountCredentials } from './StepAccountCredentials';
import { StepBusinessProfile } from './StepBusinessProfile';
import { StepArchetypeSelection } from './StepArchetypeSelection';
import { StepReviewLaunch } from './StepReviewLaunch';
import { WizardControls } from './WizardControls';

export function SignupWizardClient() {
  const wizard = useSignupWizard();

  return (
    <div className="w-full max-w-xl mx-auto relative z-10">
      <SignupProgressHeader currentStep={wizard.currentStep} />

      <div className="bg-surface rounded-2xl border border-separator shadow-xl p-5 sm:p-7">
        {wizard.formError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm font-medium text-destructive flex items-start gap-2.5 animate-in fade-in">
            <CircleAlert size={16} className="mt-0.5 shrink-0" />
            <span>{wizard.formError}</span>
          </div>
        )}

        {wizard.currentStep === 1 && (
          <StepAccountCredentials
            fullName={wizard.fullName}
            setFullName={wizard.setFullName}
            email={wizard.email}
            setEmail={wizard.setEmail}
            phone={wizard.phone}
            setPhone={wizard.setPhone}
            password={wizard.password}
            setPassword={wizard.setPassword}
            showPassword={wizard.showPassword}
            setShowPassword={wizard.setShowPassword}
            onContinue={wizard.handleNext}
          />
        )}

        {wizard.currentStep === 2 && (
          <StepBusinessProfile
            storeName={wizard.storeName}
            onStoreNameChange={wizard.handleStoreNameChange}
            slug={wizard.slug}
            setSlug={wizard.setSlug}
            currency={wizard.currency}
            setCurrency={wizard.setCurrency}
            city={wizard.city}
            setCity={wizard.setCity}
          />
        )}

        {wizard.currentStep === 3 && (
          <StepArchetypeSelection
            archetype={wizard.archetype}
            setArchetype={wizard.setArchetype}
            customModules={wizard.customModules}
            onToggleCustomModule={wizard.toggleCustomModule}
          />
        )}

        {wizard.currentStep === 4 && (
          <StepReviewLaunch
            archetype={wizard.archetype}
            slug={wizard.slug}
            customModules={wizard.customModules}
            onChangeArchetype={() => wizard.setCurrentStep(3)}
          />
        )}

        <WizardControls
          currentStep={wizard.currentStep}
          isSubmitting={wizard.isSubmitting}
          onBack={wizard.handleBack}
          onNext={wizard.handleNext}
          onLaunch={wizard.handleLaunch}
        />
      </div>

      {wizard.currentStep > 1 && (
        <p className="text-center text-xs text-muted mt-6">
          Already have a merchant workspace?{' '}
          <Link
            href="/login"
            className="font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors"
          >
            Sign in here
          </Link>
        </p>
      )}
    </div>
  );
}
