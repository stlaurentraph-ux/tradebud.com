'use client';

import type { ReactNode } from 'react';

interface DashboardQuickActionsProps {
  visible: boolean;
  children: ReactNode;
  className?: string;
}

/** Shortcut grids duplicated in the sidebar — shown only during early onboarding. */
export function DashboardQuickActions({ visible, children, className }: DashboardQuickActionsProps) {
  if (!visible) return null;
  return <div className={className}>{children}</div>;
}
