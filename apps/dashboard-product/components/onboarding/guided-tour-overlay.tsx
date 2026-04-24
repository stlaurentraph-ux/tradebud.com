'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  X,
  CheckCircle2,
  Sparkles,
  LayoutDashboard,
  Users,
  MapPin,
  Inbox,
  Leaf,
  Send,
  Package,
  ShieldCheck,
  AlertCircle,
  FileText,
  FileCheck,
  Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/lib/onboarding-context';

// ─────────────────────────────────────────────────────────────
// Icon resolver
// ─────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, ReactNode> = {
  Sparkles: <Sparkles className="h-5 w-5" />,
  LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  MapPin: <MapPin className="h-5 w-5" />,
  Inbox: <Inbox className="h-5 w-5" />,
  Leaf: <Leaf className="h-5 w-5" />,
  Send: <Send className="h-5 w-5" />,
  Package: <Package className="h-5 w-5" />,
  ShieldCheck: <ShieldCheck className="h-5 w-5" />,
  AlertCircle: <AlertCircle className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  FileCheck: <FileCheck className="h-5 w-5" />,
  Scale: <Scale className="h-5 w-5" />,
};

// ─────────────────────────────────────────────────────────────
// Spotlight rect types
// ─────────────────────────────────────────────────────────────

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 6;
const TOOLTIP_WIDTH = 416;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function GuidedTourOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    phase,
    config,
    currentStepIndex,
    completedSteps,
    nextStep,
    prevStep,
    completeCurrentStep,
    skipTour,
    startOnboarding,
    progress,
    completedCount,
  } = useOnboarding();

  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const isActive = phase === 'tour';
  const step = config?.steps[currentStepIndex] ?? null;

  // Mount guard (portal needs document)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep page route synchronized with focused onboarding step.
  useEffect(() => {
    if (!isActive || !step?.ctaHref) return;
    if (pathname === step.ctaHref) return;
    setSpotlightRect(null);
    setTooltipPos(null);
    router.push(step.ctaHref);
  }, [isActive, step, pathname, router]);

  // Compute spotlight + tooltip positions
  const computePositions = useCallback(() => {
    if (!step?.targetSelector) {
      setSpotlightRect(null);
      setTooltipPos(null);
      return;
    }
    const target = document.querySelector(step.targetSelector);
    if (!target) {
      setSpotlightRect(null);
      setTooltipPos(null);
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const rect = target.getBoundingClientRect();
    const sr: SpotlightRect = {
      top: rect.top - PADDING,
      left: rect.left - PADDING,
      width: rect.width + PADDING * 2,
      height: rect.height + PADDING * 2,
    };
    setSpotlightRect(sr);

    // Position tooltip below spotlight, centered, clamped to viewport
    const TOOLTIP_OFFSET = 12;
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    let tLeft = sr.left + sr.width / 2 - TOOLTIP_WIDTH / 2;
    let tTop = sr.top + sr.height + TOOLTIP_OFFSET;

    // Clamp horizontal
    tLeft = Math.max(12, Math.min(tLeft, vpW - TOOLTIP_WIDTH - 12));
    // Flip above if not enough space below
    const TOOLTIP_ESTIMATE_H = 200;
    if (tTop + TOOLTIP_ESTIMATE_H > vpH - 20) {
      tTop = sr.top - TOOLTIP_ESTIMATE_H - TOOLTIP_OFFSET;
    }

    setTooltipPos({ top: Math.max(8, tTop), left: tLeft });
  }, [step]);

  useEffect(() => {
    if (!isActive) return;
    if (step?.ctaHref && pathname !== step.ctaHref) return;
    // Small delay so DOM settles after navigation
    const timer = setTimeout(computePositions, 120);
    return () => clearTimeout(timer);
  }, [isActive, currentStepIndex, computePositions, step, pathname]);

  // Re-compute on resize / scroll
  useEffect(() => {
    if (!isActive) return;
    const handleResize = () => computePositions();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isActive, computePositions]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skipTour();
      if (e.key === 'ArrowRight') nextStep();
      if (e.key === 'ArrowLeft') prevStep();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isActive, skipTour, nextStep, prevStep]);

  const totalSteps = config?.steps.length ?? 0;
  const isFirstStep = currentStepIndex === 0;

  const handleBack = useCallback(() => {
    if (isFirstStep) {
      startOnboarding();
      return;
    }
    prevStep();
  }, [isFirstStep, prevStep, startOnboarding]);

  if (!isActive || !step || !mounted) return null;

  const isCompleted = completedSteps[step.key] ?? false;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const contextualActionLabelByStep: Record<string, string> = {
    coop_add_contact: 'Add contact',
    coop_send_requests: 'Start new request',
    imp_network: 'Add contact',
    imp_campaigns: 'Start campaign',
  };
  const contextualActionLabel = contextualActionLabelByStep[step.key];

  // ─────────────────────────────────────────────────────────────
  // SVG cut-out spotlight mask
  // ─────────────────────────────────────────────────────────────

  const vpW = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vpH = typeof window !== 'undefined' ? window.innerHeight : 800;

  const spotlightClipPath = spotlightRect
    ? [
        `M 0 0 H ${vpW} V ${vpH} H 0 Z`,
        `M ${spotlightRect.left + 8} ${spotlightRect.top}`,
        `Q ${spotlightRect.left} ${spotlightRect.top} ${spotlightRect.left} ${spotlightRect.top + 8}`,
        `V ${spotlightRect.top + spotlightRect.height - 8}`,
        `Q ${spotlightRect.left} ${spotlightRect.top + spotlightRect.height} ${spotlightRect.left + 8} ${spotlightRect.top + spotlightRect.height}`,
        `H ${spotlightRect.left + spotlightRect.width - 8}`,
        `Q ${spotlightRect.left + spotlightRect.width} ${spotlightRect.top + spotlightRect.height} ${spotlightRect.left + spotlightRect.width} ${spotlightRect.top + spotlightRect.height - 8}`,
        `V ${spotlightRect.top + 8}`,
        `Q ${spotlightRect.left + spotlightRect.width} ${spotlightRect.top} ${spotlightRect.left + spotlightRect.width - 8} ${spotlightRect.top}`,
        `Z`,
      ].join(' ')
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9000]"
      role="dialog"
      aria-modal="true"
      aria-label={`Onboarding step ${currentStepIndex + 1} of ${totalSteps}: ${step.title}`}
    >
      {/* Overlay backdrop with cut-out */}
      {spotlightClipPath ? (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ fill: 'rgba(0,0,0,0.55)', fillRule: 'evenodd' }}
          aria-hidden="true"
        >
          <path d={spotlightClipPath} />
        </svg>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-black/55" aria-hidden="true" />
      )}

      {/* Spotlight ring */}
      {spotlightRect && (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-primary ring-offset-0 transition-all duration-200"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
          aria-hidden="true"
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className={cn(
          'absolute z-[9001] w-[26rem] max-w-[calc(100vw-24px)] rounded-xl border border-border bg-card shadow-xl',
          'animate-in fade-in slide-in-from-bottom-2 duration-200',
        )}
        style={
          tooltipPos
            ? { top: tooltipPos.top, left: tooltipPos.left }
            : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        }
        role="status"
        aria-live="polite"
      >
        {/* Tooltip header */}
        <div className="flex items-start justify-between gap-2 border-b border-border px-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {ICON_MAP[step.icon] ?? <Sparkles className="h-5 w-5" />}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Step {currentStepIndex + 1} of {totalSteps}
              </div>
              <div className="text-sm font-semibold text-foreground leading-snug">{step.title}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={skipTour}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Skip tour"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedCount} of {totalSteps} steps done</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {/* Action status */}
          {step.requiresAction ? (
            isCompleted ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Action completed — continue to next step
              </div>
            ) : (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                Complete the action on this page, then click &ldquo;Done&rdquo; to proceed.
              </div>
            )
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-1 text-xs"
            aria-label={isFirstStep ? 'Back to welcome' : 'Previous step'}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>

          <div className="flex items-center justify-end gap-2">
            {/* Contextual in-page action (only where requested) */}
            {contextualActionLabel ? (
              <Button variant="outline" size="sm" className="text-xs" onClick={nextStep}>
                {contextualActionLabel}
              </Button>
            ) : null}

            {/* Next / Done */}
            {step.requiresAction && !isCompleted ? (
              <Button size="sm" className="text-xs" onClick={completeCurrentStep}>
                Mark done
              </Button>
            ) : isLastStep ? (
              <Button size="sm" className="gap-1 text-xs" onClick={completeCurrentStep}>
                Finish tour
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" className="gap-1 text-xs" onClick={completeCurrentStep}>
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Skip affordance at bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <button
          type="button"
          onClick={skipTour}
          className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Skip tour — continue later
        </button>
      </div>
    </div>,
    document.body,
  );
}
