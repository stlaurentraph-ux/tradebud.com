'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  tenantRoleToPersona,
  trackOnboardingEvent,
  ONBOARDING_CONFIGS,
  type OnboardingPersona,
  type OnboardingConfig,
} from '@/lib/onboarding-config';

// ─────────────────────────────────────────────────────────────
// State shape
// ─────────────────────────────────────────────────────────────

export type OnboardingPhase =
  | 'idle'          // Not yet checked
  | 'welcome'       // Showing the welcome modal (role confirmation)
  | 'tour'          // Guided spotlight tour active
  | 'checklist'     // Tour done, persistent checklist visible
  | 'complete';     // All steps done + explicitly finished

export interface CompletedSteps {
  [stepKey: string]: boolean;
}

interface OnboardingContextType {
  phase: OnboardingPhase;
  persona: OnboardingPersona | null;
  config: OnboardingConfig | null;
  currentStepIndex: number;
  completedSteps: CompletedSteps;
  /** Open the welcome modal */
  startOnboarding: () => void;
  /** Close welcome modal without starting tour */
  dismissWelcome: () => void;
  /** Begin the step-by-step guided tour */
  beginTour: () => void;
  /** Advance to next tour step */
  nextStep: () => void;
  /** Go back to previous tour step */
  prevStep: () => void;
  /** Mark the current step as completed (action-validated) */
  completeCurrentStep: () => void;
  /** Skip the entire tour for now (persists in sessionStorage) */
  skipTour: () => void;
  /** Resume tour from current step */
  resumeTour: () => void;
  /** Mark a specific step complete by key */
  markStepComplete: (stepKey: string) => void;
  /** Whether the checklist card should be shown on the dashboard */
  showChecklist: boolean;
  /** Progress 0–100 */
  progress: number;
  /** Number of completed steps */
  completedCount: number;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────

function getPhaseKey(userId: string): string {
  return `tracebud_ob_phase_${userId}`;
}
function getCompletedKey(userId: string): string {
  return `tracebud_ob_completed_${userId}`;
}
function getSkippedKey(userId: string): string {
  return `tracebud_ob_skipped_${userId}`;
}

function loadCompleted(userId: string): CompletedSteps {
  try {
    const raw = sessionStorage.getItem(getCompletedKey(userId));
    return raw ? (JSON.parse(raw) as CompletedSteps) : {};
  } catch {
    return {};
  }
}

function saveCompleted(userId: string, data: CompletedSteps): void {
  sessionStorage.setItem(getCompletedKey(userId), JSON.stringify(data));
}

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const persona = useMemo<OnboardingPersona | null>(() => {
    if (!user) return null;
    return tenantRoleToPersona(user.active_role);
  }, [user]);

  const config = useMemo<OnboardingConfig | null>(() => {
    if (!persona) return null;
    return ONBOARDING_CONFIGS[persona];
  }, [persona]);

  const [phase, setPhase] = useState<OnboardingPhase>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<CompletedSteps>({});

  // Bootstrap phase from storage on mount / user change
  useEffect(() => {
    if (!user) {
      setPhase('idle');
      setCurrentStepIndex(0);
      setCompletedSteps({});
      return;
    }

    const stored = loadCompleted(user.id);
    setCompletedSteps(stored);

    const skipped = sessionStorage.getItem(getSkippedKey(user.id)) === '1';
    const storedPhase = sessionStorage.getItem(getPhaseKey(user.id)) as OnboardingPhase | null;

    if (storedPhase === 'complete') {
      setPhase('complete');
      return;
    }

    if (skipped) {
      // Show checklist but not tour
      setPhase('checklist');
      return;
    }

    if (!storedPhase || storedPhase === 'idle') {
      // First session — show welcome modal
      setPhase('welcome');
      return;
    }

    setPhase(storedPhase);

    // Resume tour at first incomplete step
    if (config && (storedPhase === 'tour' || storedPhase === 'checklist')) {
      const firstIncomplete = config.steps.findIndex((s) => !stored[s.key]);
      setCurrentStepIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const persistPhase = useCallback(
    (next: OnboardingPhase) => {
      if (!user) return;
      setPhase(next);
      sessionStorage.setItem(getPhaseKey(user.id), next);
    },
    [user],
  );

  const startOnboarding = useCallback(() => {
    if (!user || !config) return;
    persistPhase('welcome');
    trackOnboardingEvent({ event: 'onboarding_started', persona: persona! });
  }, [user, config, persona, persistPhase]);

  const dismissWelcome = useCallback(() => {
    if (!user) return;
    persistPhase('checklist');
    sessionStorage.setItem(getSkippedKey(user.id), '1');
    trackOnboardingEvent({ event: 'onboarding_skipped', persona: persona! });
  }, [user, persona, persistPhase]);

  const beginTour = useCallback(() => {
    if (!user || !config) return;
    persistPhase('tour');
    setCurrentStepIndex(0);
    const step = config.steps[0];
    if (step) {
      trackOnboardingEvent({
        event: 'onboarding_step_viewed',
        persona: persona!,
        stepKey: step.key,
        stepIndex: 0,
        totalSteps: config.steps.length,
      });
    }
  }, [user, config, persona, persistPhase]);

  const nextStep = useCallback(() => {
    if (!config) return;
    const next = currentStepIndex + 1;
    if (next >= config.steps.length) {
      persistPhase('checklist');
      return;
    }
    setCurrentStepIndex(next);
    const step = config.steps[next];
    if (step) {
      trackOnboardingEvent({
        event: 'onboarding_step_viewed',
        persona: persona!,
        stepKey: step.key,
        stepIndex: next,
        totalSteps: config.steps.length,
      });
    }
  }, [config, currentStepIndex, persona, persistPhase]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const markStepComplete = useCallback(
    (stepKey: string) => {
      if (!user) return;
      const updated = { ...completedSteps, [stepKey]: true };
      setCompletedSteps(updated);
      saveCompleted(user.id, updated);
      trackOnboardingEvent({ event: 'onboarding_step_completed', persona: persona!, stepKey });

      // Check if all steps done
      if (config && config.steps.every((s) => updated[s.key])) {
        persistPhase('complete');
        trackOnboardingEvent({ event: 'onboarding_completed', persona: persona! });
      }
    },
    [user, completedSteps, config, persona, persistPhase],
  );

  const completeCurrentStep = useCallback(() => {
    if (!config) return;
    const step = config.steps[currentStepIndex];
    if (step) markStepComplete(step.key);
    nextStep();
  }, [config, currentStepIndex, markStepComplete, nextStep]);

  const skipTour = useCallback(() => {
    if (!user) return;
    sessionStorage.setItem(getSkippedKey(user.id), '1');
    persistPhase('checklist');
    trackOnboardingEvent({ event: 'onboarding_skipped', persona: persona! });
  }, [user, persona, persistPhase]);

  const resumeTour = useCallback(() => {
    if (!user || !config) return;
    sessionStorage.removeItem(getSkippedKey(user.id));
    const firstIncomplete = config.steps.findIndex((s) => !completedSteps[s.key]);
    setCurrentStepIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
    persistPhase('tour');
  }, [user, config, completedSteps, persistPhase]);

  const completedCount = useMemo(
    () => (config ? config.steps.filter((s) => completedSteps[s.key]).length : 0),
    [config, completedSteps],
  );

  const progress = useMemo(
    () => (config ? Math.round((completedCount / config.steps.length) * 100) : 0),
    [config, completedCount],
  );

  const showChecklist = phase === 'checklist' || phase === 'tour' || phase === 'complete';

  return (
    <OnboardingContext.Provider
      value={{
        phase,
        persona,
        config,
        currentStepIndex,
        completedSteps,
        startOnboarding,
        dismissWelcome,
        beginTour,
        nextStep,
        prevStep,
        completeCurrentStep,
        skipTour,
        resumeTour,
        markStepComplete,
        showChecklist,
        progress,
        completedCount,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextType {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
