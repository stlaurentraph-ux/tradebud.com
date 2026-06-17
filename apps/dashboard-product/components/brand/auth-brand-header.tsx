'use client';

import { useContext } from 'react';
import { LocaleContext } from '@/lib/locale-context';
import { getAppChromeCopy, getAuthCopy } from '@/lib/workflow-terminology-labels';
import { TracebudLogo } from '@/components/brand/tracebud-logo';

/** Shared logo + wordmark block for login, signup, and auth confirm screens. */
export function AuthBrandHeader() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;

  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <TracebudLogo size="xl" priority className="mb-5" alt={getAuthCopy('logo_alt', t)} />
      <h1 className="text-2xl font-bold text-[#064E3B]">{getAppChromeCopy('mobile_brand', t)}</h1>
      <p className="text-sm text-muted-foreground">{getAuthCopy('eudr_platform_tagline', t)}</p>
    </div>
  );
}
