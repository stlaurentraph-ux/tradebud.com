import type { ReactNode } from 'react';
import { FounderOsShell } from '@/components/layout/founder-os-shell';

export default function FounderOsLayout({ children }: { children: ReactNode }) {
  return <FounderOsShell>{children}</FounderOsShell>;
}
