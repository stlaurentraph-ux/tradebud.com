'use client';

import { type ReactNode } from 'react';
import { AlertTriangle, Lock, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  type FeatureFlag,
  isFeatureEnabled,
  getFeatureDescription,
  getFeatureRelease,
} from '@/lib/feature-flags';

interface FeatureGateProps {
  feature: FeatureFlag;
  children: ReactNode;
  fallback?: ReactNode;
  showPlaceholder?: boolean;
}

/**
 * FeatureGate component - conditionally renders children based on feature flag status
 *
 * Usage:
 * <FeatureGate feature="r2_api_direct_submission">
 *   <APIDirectSubmitButton />
 * </FeatureGate>
 *
 * With placeholder:
 * <FeatureGate feature="r2_sponsor_governance" showPlaceholder>
 *   <SponsorDashboard />
 * </FeatureGate>
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  showPlaceholder = false,
}: FeatureGateProps) {
  if (isFeatureEnabled(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showPlaceholder) {
    return <FeaturePlaceholder feature={feature} />;
  }

  return null;
}

interface FeaturePlaceholderProps {
  feature: FeatureFlag;
  className?: string;
}

/**
 * FeaturePlaceholder - shown when a feature is disabled but user navigates to the route
 */
export function FeaturePlaceholder({ feature, className }: FeaturePlaceholderProps) {
  const description = getFeatureDescription(feature);
  const release = getFeatureRelease(feature);

  const releaseLabels: Record<string, { label: string; color: string }> = {
    mvp: { label: 'Release 1 (MVP)', color: 'bg-emerald-500/20 text-emerald-400' },
    r2: { label: 'Release 2', color: 'bg-blue-500/20 text-blue-400' },
    r3: { label: 'Release 3', color: 'bg-purple-500/20 text-purple-400' },
    future: { label: 'Future Release', color: 'bg-gray-500/20 text-gray-400' },
  };

  const releaseInfo = releaseLabels[release] || releaseLabels.future;

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Feature Coming Soon</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
        <Badge className={releaseInfo.color}>
          <Calendar className="mr-1 h-3 w-3" />
          {releaseInfo.label}
        </Badge>
      </CardContent>
    </Card>
  );
}

interface FeatureComingSoonBannerProps {
  feature: FeatureFlag;
  className?: string;
}

/**
 * FeatureComingSoonBanner - inline banner for partially-available features
 */
export function FeatureComingSoonBanner({ feature, className }: FeatureComingSoonBannerProps) {
  const description = getFeatureDescription(feature);
  const release = getFeatureRelease(feature);

  if (isFeatureEnabled(feature)) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 ${className}`}
    >
      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-amber-800">
          <strong>Coming in {release.toUpperCase()}:</strong> {description}
        </p>
      </div>
    </div>
  );
}

/**
 * useFeatureFlag hook - check feature status in components
 */
export function useFeatureFlag(feature: FeatureFlag): boolean {
  return isFeatureEnabled(feature);
}
