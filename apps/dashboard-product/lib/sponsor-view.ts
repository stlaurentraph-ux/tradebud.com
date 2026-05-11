'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type SponsorView = 'country' | 'brand';
const SPONSOR_VIEW_STORAGE_KEY = 'tracebud_sponsor_view';

function normalizeSponsorView(value: string | null): SponsorView {
  return value === 'brand' ? 'brand' : 'country';
}

export function useSponsorView(): SponsorView {
  const searchParams = useSearchParams();
  const queryValue = searchParams.get('sponsorView');

  return useMemo(() => {
    if (queryValue === 'country' || queryValue === 'brand') return queryValue;
    if (typeof window === 'undefined') return 'country';
    return normalizeSponsorView(window.sessionStorage.getItem(SPONSOR_VIEW_STORAGE_KEY));
  }, [queryValue]);
}

export function useSponsorViewControls(): { sponsorView: SponsorView; setSponsorView: (view: SponsorView) => void } {
  const sponsorView = useSponsorView();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSponsorView = useCallback(
    (view: SponsorView) => {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(SPONSOR_VIEW_STORAGE_KEY, view);
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set('sponsorView', view);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return { sponsorView, setSponsorView };
}
