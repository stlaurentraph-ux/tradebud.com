'use client';

import { useEffect, useState } from 'react';

export type OnboardingStep = 'welcome' | 'company_info' | 'location' | 'products' | 'review' | 'complete';

export interface OnboardingState {
  currentStep: OnboardingStep;
  isComplete: boolean;
  isSkipped: boolean;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface CompanyInfo {
  name: string;
  type: 'EXPORTER' | 'IMPORTER' | 'COOPERATIVE' | 'REVIEWER' | 'SPONSOR';
  country: string;
  region?: string;
}

export interface OnboardingContext {
  state: OnboardingState;
  companyInfo: Partial<CompanyInfo>;
  setCurrentStep: (step: OnboardingStep) => void;
  setIsSkipped: (skipped: boolean) => void;
  setCompanyInfo: (info: Partial<CompanyInfo>) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

const INITIAL_STATE: OnboardingState = {
  currentStep: 'welcome',
  isComplete: false,
  isSkipped: false,
  startedAt: null,
  completedAt: null,
};

export function useOnboarding(): OnboardingContext {
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);
  const [companyInfo, setCompanyInfoState] = useState<Partial<CompanyInfo>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('onboarding_state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          ...parsed,
          startedAt: parsed.startedAt ? new Date(parsed.startedAt) : null,
          completedAt: parsed.completedAt ? new Date(parsed.completedAt) : null,
        }));
      } catch {
        // Invalid stored state, reset to initial
      }
    }
    setIsHydrated(true);
  }, []);

  // Persist state to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('onboarding_state', JSON.stringify(state));
    }
  }, [state, isHydrated]);

  const setCurrentStep = (step: OnboardingStep) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
      startedAt: prev.startedAt || new Date(),
    }));
  };

  const setIsSkipped = (skipped: boolean) => {
    setState(prev => ({
      ...prev,
      isSkipped: skipped,
    }));
  };

  const setCompanyInfo = (info: Partial<CompanyInfo>) => {
    setCompanyInfoState(prev => ({
      ...prev,
      ...info,
    }));
  };

  const completeOnboarding = () => {
    setState(prev => ({
      ...prev,
      isComplete: true,
      completedAt: new Date(),
    }));
  };

  const skipOnboarding = () => {
    setState(prev => ({
      ...prev,
      isSkipped: true,
      completedAt: new Date(),
    }));
  };

  const resetOnboarding = () => {
    setState(INITIAL_STATE);
    setCompanyInfoState({});
    localStorage.removeItem('onboarding_state');
  };

  return {
    state,
    companyInfo,
    setCurrentStep,
    setIsSkipped,
    setCompanyInfo,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
}
