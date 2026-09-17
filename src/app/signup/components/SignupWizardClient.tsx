'use client';

import React from 'react';
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

      {wizard.formError && (
        <div className="mb-5 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm font-medium text-destructive flex items-start gap-2.5 animate-in fade-in">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <span>{wizard.formError}</span>
        </div>
      )}

      <div>
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
            confirmPassword={wizard.confirmPassword}
            setConfirmPassword={wizard.setConfirmPassword}
            termsAccepted={wizard.termsAccepted}
            setTermsAccepted={wizard.setTermsAccepted}
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

    </div>
  );
}
